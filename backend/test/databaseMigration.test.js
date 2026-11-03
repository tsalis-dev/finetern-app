const assert = require('node:assert/strict');
const { test } = require('node:test');
const { randomBytes } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const mysql = require('mysql2/promise');

require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });

const databaseDir = path.join(__dirname, '../../database');
const read = (file) => fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
const schema = read(path.join(databaseDir, 'schema.sql'));
const seed = read(path.join(databaseDir, 'seed.sql'));
const migration = read(path.join(databaseDir, 'migrations/001_identity_verification.sql'));

// File SQL harus berjalan hanya pada koneksi database uji yang dipilih di bawah.
function isolated(sql) {
  const result = sql
    .replace(/^CREATE DATABASE IF NOT EXISTS finetern_db[^;]*;\s*/m, '')
    .replace(/^USE finetern_db;\s*/m, '');
  assert.doesNotMatch(result, /\b(?:CREATE|DROP)\s+DATABASE\b|^\s*USE\s+/im);
  return result;
}

async function fingerprint(connection, database) {
  const [columns] = await connection.execute(`
    SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA
    FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=?
    ORDER BY TABLE_NAME, COLUMN_NAME`, [database]);
  const [relations] = await connection.execute(`
    SELECT k.TABLE_NAME, k.COLUMN_NAME, k.REFERENCED_TABLE_NAME, k.REFERENCED_COLUMN_NAME, r.DELETE_RULE
    FROM information_schema.KEY_COLUMN_USAGE k
    JOIN information_schema.REFERENTIAL_CONSTRAINTS r
      ON r.CONSTRAINT_SCHEMA=k.CONSTRAINT_SCHEMA AND r.CONSTRAINT_NAME=k.CONSTRAINT_NAME
    WHERE k.TABLE_SCHEMA=? AND k.REFERENCED_TABLE_NAME IS NOT NULL
    ORDER BY k.TABLE_NAME, k.COLUMN_NAME`, [database]);
  const [indexes] = await connection.execute(`
    SELECT TABLE_NAME, NON_UNIQUE, GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS columns_in_index
    FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=?
    GROUP BY TABLE_NAME, INDEX_NAME, NON_UNIQUE ORDER BY TABLE_NAME, columns_in_index`, [database]);
  return JSON.parse(JSON.stringify({ columns, relations, indexes }));
}

test('schema v3 and non-destructive v1/v2 migrations on isolated MySQL databases', async (t) => {
  const host = process.env.TEST_DB_HOST || process.env.DB_HOST || 'localhost';
  assert.ok(['localhost', '127.0.0.1', '::1'].includes(host), 'Database tests require local MySQL.');
  const connection = await mysql.createConnection({
    host,
    port: Number(process.env.TEST_DB_PORT || process.env.DB_PORT) || 3306,
    user: process.env.TEST_DB_USER || process.env.DB_USER || 'root',
    password: process.env.TEST_DB_PASS ?? process.env.DB_PASS ?? '',
    multipleStatements: true,
    connectTimeout: 5000,
  });
  const prefix = `finetern_test_${randomBytes(6).toString('hex')}`;
  const fresh = `${prefix}_fresh`;
  const migrated = `${prefix}_migration`;
  const partial = `${prefix}_partial`;
  const created = [];
  try {
    for (const database of [fresh, migrated, partial]) {
      assert.match(database, /^finetern_test_[a-f0-9]{12}_(fresh|migration|partial)$/);
      await connection.query(`CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      created.push(database);
    }

    await t.test('fresh installation supports personal teachers and pending requests', async () => {
      await connection.query(`USE \`${fresh}\``);
      await connection.query(isolated(schema));
      await connection.query(isolated(seed));
      const [[counts]] = await connection.query(`SELECT
        (SELECT COUNT(*) FROM users) AS users,
        (SELECT COUNT(*) FROM teachers) AS teachers,
        (SELECT COUNT(*) FROM school_memberships WHERE sekolah_id=1) AS memberships,
        (SELECT COUNT(*) FROM verification_requests WHERE status='pending') AS pending,
        (SELECT COUNT(*) FROM verification_events) AS events`);
      assert.deepEqual({ ...counts }, { users: 7, teachers: 2, memberships: 2, pending: 8, events: 8 });
      const [[marker]] = await connection.query('SELECT status FROM schema_migrations');
      assert.equal(marker.status, 'applied');
    });

    await t.test('seed re-run preserves a review decision and does not duplicate history', async () => {
      const [[request]] = await connection.query('SELECT id FROM verification_requests WHERE siswa_id=1');
      await connection.execute('UPDATE verification_requests SET status=? WHERE id=?', ['needs_revision', request.id]);
      await connection.execute(
        'INSERT INTO verification_events (request_id, actor_user_id, action, note) VALUES (?, ?, ?, ?)',
        [request.id, 1, 'needs_revision', 'Periksa kembali data sekolah.'],
      );
      await connection.query("UPDATE portfolios SET title='Judul karya yang sudah diperiksa' WHERE id=1");
      await connection.query('UPDATE student_skills SET proficiency=92 WHERE siswa_id=1 AND skill_id=1');
      await connection.query(isolated(seed));
      const [[state]] = await connection.execute('SELECT status FROM verification_requests WHERE id=?', [request.id]);
      const [[count]] = await connection.query('SELECT COUNT(*) AS total FROM verification_events');
      assert.equal(state.status, 'needs_revision');
      assert.equal(count.total, 9);
      const [[portfolio]] = await connection.query('SELECT title FROM portfolios WHERE id=1');
      const [[skill]] = await connection.query('SELECT proficiency FROM student_skills WHERE siswa_id=1 AND skill_id=1');
      assert.equal(portfolio.title, 'Judul karya yang sudah diperiksa');
      assert.equal(skill.proficiency, 92);
    });

    await t.test('constraints reject ambiguous requests, duplicate membership and orphan references', async () => {
      await assert.rejects(connection.query('INSERT INTO verification_requests (applicant_user_id) VALUES (1)'), { code: 'ER_CHECK_CONSTRAINT_VIOLATED' });
      await connection.query("INSERT INTO schools (id, submitted_by, nama_sekolah) VALUES (1000, 1, 'Sekolah uji')");
      await connection.query("INSERT INTO users (id, email, password, role) VALUES (1000, 'industry-test@example.invalid', 'test-only', 'industri')");
      await connection.query("INSERT INTO industries (id, user_id, nama_industri, sektor_industri, kota_domisili) VALUES (1000, 1000, 'Industri uji', 'TI', 'Bandung')");
      await assert.rejects(connection.query('INSERT INTO verification_requests (applicant_user_id, sekolah_id, industri_id) VALUES (1, 1000, 1000)'), { code: 'ER_CHECK_CONSTRAINT_VIOLATED' });
      await assert.rejects(connection.query('INSERT INTO school_memberships (teacher_id, sekolah_id) VALUES (1, 1000)'), { code: 'ER_DUP_ENTRY' });
      await assert.rejects(connection.query('INSERT INTO school_memberships (teacher_id, sekolah_id) VALUES (9999, 1)'), { code: 'ER_NO_REFERENCED_ROW_2' });
      await assert.rejects(connection.query('INSERT INTO verification_requests (applicant_user_id, sekolah_id) VALUES (1, 1)'), { code: 'ER_DUP_ENTRY' });
      await assert.rejects(connection.query("UPDATE schools SET npsn='' WHERE id=1000"), { code: 'ER_CHECK_CONSTRAINT_VIOLATED' });
      await connection.query("UPDATE schools SET npsn='TEST-SCHOOL-1' WHERE id=1");
      await assert.rejects(connection.query("UPDATE schools SET npsn='TEST-SCHOOL-1' WHERE id=1000"), { code: 'ER_DUP_ENTRY' });
      await connection.query("UPDATE industries SET nomor_registrasi='TEST-INDUSTRY-1' WHERE id=1");
      await assert.rejects(connection.query("UPDATE industries SET nomor_registrasi='TEST-INDUSTRY-1' WHERE id=1000"), { code: 'ER_DUP_ENTRY' });
      await assert.rejects(connection.query('DELETE FROM verification_requests WHERE sekolah_id=1'), { code: 'ER_ROW_IS_REFERENCED_2' });
    });

    await connection.query(`USE \`${migrated}\``);
    await connection.query(isolated(read(path.join(__dirname, 'fixtures/schema-v1.sql'))));
    await connection.query(isolated(read(path.join(__dirname, 'fixtures/seed-v1.sql'))));
    const [tableRows] = await connection.query('SHOW TABLES');
    const before = {};
    for (const row of tableRows) {
      const name = Object.values(row)[0];
      assert.match(name, /^[a-z_]+$/);
      const [rows] = await connection.query(`SELECT * FROM \`${name}\` ORDER BY id`);
      before[name] = JSON.parse(JSON.stringify(rows));
    }

    await t.test('migration preserves every legacy record and starts verification pending', async () => {
      await connection.query(migration);
      for (const [table, expected] of Object.entries(before)) {
        const [rows] = await connection.query(`SELECT * FROM \`${table}\` ORDER BY id`);
        const actual = JSON.parse(JSON.stringify(rows)).map((row) => Object.fromEntries(
          Object.keys(expected[0]).map((key) => [key, row[table === 'schools' && key === 'user_id' ? 'submitted_by' : key]]),
        ));
        assert.deepEqual(actual, expected, `${table}: legacy data changed`);
      }
      const [[teacher]] = await connection.query('SELECT * FROM teachers WHERE user_id=1');
      assert.equal(teacher.nama_lengkap, null);
      const [[membership]] = await connection.query('SELECT * FROM school_memberships WHERE teacher_id=?', [teacher.id]);
      assert.equal(membership.posisi, 'guru');
      const [[counts]] = await connection.query(`SELECT
        (SELECT COUNT(*) FROM verification_requests WHERE status='pending') AS pending,
        (SELECT COUNT(*) FROM verification_events WHERE action='submitted') AS submitted,
        (SELECT COUNT(*) FROM users WHERE role='admin') AS admins`);
      assert.deepEqual({ ...counts }, { pending: 7, submitted: 7, admins: 0 });
    });

    await t.test('migrated schema has the same columns, relations and unique indexes as fresh schema', async () => {
      await connection.query(read(path.join(databaseDir, 'migrations/002_portfolio_evidence.sql')));
      assert.deepEqual(await fingerprint(connection, migrated), await fingerprint(connection, fresh));
    });

    await t.test('repeat migration stops before reapplying and leaves data intact', async () => {
      await assert.rejects(connection.query(migration), { code: 'ER_DUP_ENTRY' });
      const [[teachers]] = await connection.query('SELECT COUNT(*) AS total FROM teachers');
      const [[marker]] = await connection.query('SELECT status FROM schema_migrations');
      assert.equal(teachers.total, 1);
      assert.equal(marker.status, 'applied');
    });

    await t.test('a partial DDL failure remains marked applying and cannot be blindly repeated', async () => {
      await connection.query(`USE \`${partial}\``);
      await connection.query(isolated(read(path.join(__dirname, 'fixtures/schema-v1.sql'))));
      await connection.query(isolated(read(path.join(__dirname, 'fixtures/seed-v1.sql'))));
      await connection.query(`ALTER TABLE schools DROP FOREIGN KEY schools_ibfk_1,
        ADD CONSTRAINT customized_school_owner FOREIGN KEY (user_id) REFERENCES users(id)`);
      await assert.rejects(connection.query(migration), { code: 'ER_CANT_DROP_FIELD_OR_KEY' });
      const [[marker]] = await connection.query('SELECT status FROM schema_migrations');
      assert.equal(marker.status, 'applying');
      await assert.rejects(connection.query(migration), { code: 'ER_DUP_ENTRY' });
      const [[counts]] = await connection.query('SELECT COUNT(*) AS total FROM users');
      assert.equal(counts.total, 6);
    });
  } finally {
    try {
      for (const database of created) {
        // Hanya nama acak yang berhasil dibuat oleh run ini yang boleh dihapus.
        assert.match(database, /^finetern_test_[a-f0-9]{12}_(fresh|migration|partial)$/);
        await connection.query(`DROP DATABASE \`${database}\``);
      }
    } finally {
      await connection.end();
    }
  }
});
