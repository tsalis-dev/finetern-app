const assert = require('node:assert/strict');
const { test } = require('node:test');
const { randomBytes } = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });

test('portfolio migration, evidence, school review and validated skills', async t => {
  const database = 'finetern_portfolio_test_' + randomBytes(6).toString('hex');
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'finetern-portfolios-'));
  const host = process.env.TEST_DB_HOST || process.env.DB_HOST || 'localhost';
  assert.ok(['localhost', '127.0.0.1', '::1'].includes(host));
  const config = { host, port: Number(process.env.TEST_DB_PORT || process.env.DB_PORT) || 3306,
    user: process.env.TEST_DB_USER || process.env.DB_USER || 'root', password: process.env.TEST_DB_PASS ?? process.env.DB_PASS ?? '', multipleStatements: true };
  const db = await mysql.createConnection(config);
  let created = false, server, pool;
  try {
    assert.match(database, /^finetern_portfolio_test_[a-f0-9]{12}$/);
    await db.query(`CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`); created = true;
    await db.query(`USE \`${database}\``);
    const v2 = (await fs.readFile(path.join(__dirname, 'fixtures/schema-v2.sql'), 'utf8'))
      .replace(/^CREATE DATABASE IF NOT EXISTS finetern_db[^;]*;\s*/m, '').replace(/^USE finetern_db;\s*/m, '');
    await db.query(v2);
    const account = async role => {
      const [result] = await db.execute('INSERT INTO users(email,password,role) VALUES(?,?,?)', [randomBytes(6).toString('hex') + '@example.invalid', 'fixture-hash-not-used-for-login', role]);
      return result.insertId;
    };
    const request = async (owner, column, subject, status = 'approved') => db.execute(`INSERT INTO verification_requests(applicant_user_id,${column},status) VALUES(?,?,?)`, [owner, subject, status]);
    const school = async title => {
      const founder = await account('sekolah');
      const [result] = await db.execute('INSERT INTO schools(submitted_by,nama_sekolah) VALUES(?,?)', [founder, title]);
      await request(founder, 'sekolah_id', result.insertId);
      return result.insertId;
    };
    const teacher = async (schoolId, status = 'approved') => {
      const id = await account('sekolah');
      const [profile] = await db.execute('INSERT INTO teachers(user_id,nama_lengkap) VALUES(?,?)', [id, 'Guru Uji']);
      const [membership] = await db.execute('INSERT INTO school_memberships(teacher_id,sekolah_id) VALUES(?,?)', [profile.insertId, schoolId]);
      await request(id, 'membership_id', membership.insertId, status);
      return id;
    };
    const student = async (schoolId, status = 'approved') => {
      const id = await account('siswa');
      const [profile] = await db.execute("INSERT INTO students(user_id,sekolah_id,nama_lengkap,jurusan,kelas) VALUES(?,?,'Siswa Uji','RPL','XII')", [id, schoolId]);
      await request(id, 'siswa_id', profile.insertId, status);
      return { userId: id, id: profile.insertId };
    };
    const schoolA = await school('Sekolah A'), schoolB = await school('Sekolah B');
    const teacherA = await teacher(schoolA), teacherB = await teacher(schoolB), pendingTeacher = await teacher(schoolA, 'pending');
    const owner = await student(schoolA), peer = await student(schoolA), pendingStudent = await student(schoolA, 'pending');
    const industry = await account('industri'), admin = await account('admin');
    await db.query("INSERT INTO skills(id,nama_skill,kategori) VALUES(1,'API Integration','Mobile'),(2,'Design System','Desain')");
    await db.execute("INSERT INTO portfolios(id,siswa_id,skill_id,title,deskripsi,project_url,image_path,status_verifikasi,catatan_guru) VALUES(1,?,1,'Karya Lama','Deskripsi lama','https://example.com/old','legacy.jpg','approved','Catatan lama')", [owner.id]);
    await db.execute('INSERT INTO student_skills(siswa_id,skill_id,proficiency,is_validated) VALUES(?,1,99,TRUE)', [owner.id]);
    const [[legacyBefore]] = await db.query('SELECT * FROM portfolios WHERE id=1');
    const migration = await fs.readFile(path.join(__dirname, '../../database/migrations/002_portfolio_evidence.sql'), 'utf8');
    await t.test('v2 upgrade preserves legacy records and history without inventing assessed scores', async () => {
      await db.query(migration);
      const [[row]] = await db.query('SELECT * FROM portfolios WHERE id=1');
      for (const key of Object.keys(legacyBefore)) assert.deepEqual(row[key], legacyBefore[key], key);
      assert.equal(row.revision_number, 0); assert.equal(row.assessed_proficiency, null);
      const [[event]] = await db.query('SELECT * FROM portfolio_events WHERE portfolio_id=1');
      assert.equal(event.action, 'legacy_imported'); assert.equal(event.submission_snapshot.catatan_guru, 'Catatan lama');
      await assert.rejects(db.query(migration), { code: 'ER_DUP_ENTRY' });
    });
    Object.assign(process.env, { DB_NAME: database, DB_HOST: host, DB_PORT: String(config.port), DB_USER: config.user,
      DB_PASS: config.password, JWT_SECRET: randomBytes(48).toString('hex'), PORTFOLIO_UPLOAD_DIR: dir });
    pool = require('../src/config/db').pool;
    const token = id => require('../src/services/authService').issueToken({ id });
    const tokens = { owner: token(owner.userId), peer: token(peer.userId), teacher: token(teacherA), outsider: token(teacherB), pending: token(pendingStudent.userId), pendingTeacher: token(pendingTeacher), industry: token(industry), admin: token(admin) };
    server = await new Promise(resolve => { const s = require('../src/app').listen(0, '127.0.0.1', () => resolve(s)); });
    const base = 'http://127.0.0.1:' + server.address().port + '/api/portfolios';
    const call = async (url, method = 'GET', body, credential = tokens.owner) => {
      const response = await fetch(base + url, { method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(credential ? { Authorization: 'Bearer ' + credential } : {}) }, body: body ? JSON.stringify(body) : undefined });
      return { status: response.status, ...(await response.json()) };
    };
    const submit = async ({ id, version, file = '%PDF-1.4\noriginal\n%%EOF', url = '', title = 'Integrasi API Proyek', skillId = 1, credential = tokens.owner, extra = {} } = {}) => {
      const form = new FormData();
      for (const [key, value] of Object.entries({ title, deskripsi: 'Implementasi autentikasi dan penanganan respons API pada proyek siswa.', skillId, projectUrl: url, ...(version == null ? {} : { version }), ...extra })) form.append(key, String(value));
      if (file != null) form.append('file', new Blob([file], { type: 'application/pdf' }), 'bukti.pdf');
      const response = await fetch(base + (id ? '/' + id : ''), { method: id ? 'PATCH' : 'POST', headers: { Authorization: 'Bearer ' + credential }, body: form });
      return { status: response.status, ...(await response.json()) };
    };
    const decide = (id, version, status = 'approved', score = 80, credential = tokens.teacher) => call('/' + id + '/review', 'POST', { version, status, proficiency: score, note: 'Bukti implementasi dan peran siswa telah diperiksa.' }, credential);
    let first;
    await t.test('pending accounts, unrelated roles and untrusted evidence cannot enter the workflow', async () => {
      assert.equal((await call('/mine', 'GET', null, null)).status, 401);
      for (const key of ['pending', 'pendingTeacher', 'industry', 'admin']) assert.equal((await call('/skills', 'GET', null, tokens[key])).status, 403);
      assert.equal((await submit({ file: '<script>spoofed</script>' })).status, 400);
      assert.equal((await submit({ file: '%PDF-' + 'x'.repeat(5*1024*1024) })).status, 400);
      assert.equal((await submit({ file: null })).status, 400);
      assert.equal((await submit({ file: null, url: 'javascript:alert(1)' })).status, 400);
      assert.equal((await submit({ file: null, url: 'https://user:secret@example.com' })).status, 400);
      assert.equal((await submit({ skillId: 9999 })).status, 400);
      assert.equal((await submit({ credential: tokens.teacher })).status, 403);
      assert.equal((await fs.readdir(dir)).length, 0);
      assert.equal((await call('/student-skills')).data.length, 0);
    });
    await t.test('submission stays pending and private without trusting client validation flags', async () => {
      const response = await submit({ extra: { status_verifikasi: 'approved', assessed_proficiency: 100 } }); assert.equal(response.status, 201); first = response.data.id;
      const data = (await call('/' + first)).data;
      assert.equal(data.status_verifikasi, 'pending'); assert.equal(data.assessed_proficiency, null); assert.equal(data.has_evidence, true);
      assert.equal(JSON.stringify(data).includes('evidence_path'), false);
      assert.equal((await call('/student-skills')).data.length, 0);
      for (const credential of [tokens.peer, tokens.outsider]) {
        assert.equal((await call('/' + first, 'GET', null, credential)).status, 403);
        assert.equal((await fetch(base + '/' + first + '/evidence', { headers: { Authorization: 'Bearer ' + credential } })).status, 403);
      }
      const download = await fetch(base + '/' + first + '/evidence', { headers: { Authorization: 'Bearer ' + tokens.teacher } });
      assert.equal(download.status, 200); assert.match(download.headers.get('content-disposition'), /attachment/);
      assert.equal((await call('/queue', 'GET', null, tokens.teacher)).data.length, 1);
      assert.equal((await call('/queue', 'GET', null, tokens.outsider)).data.length, 0);
      assert.equal((await decide(first, 1, 'approved', 85, tokens.owner)).status, 403);
      assert.equal((await decide(first, 1, 'approved', 85, tokens.outsider)).status, 403);
    });
    await t.test('revision keeps evidence versions and rejects decisions on unseen updates', async () => {
      assert.equal((await decide(first, 1, 'revision')).status, 200);
      assert.equal((await call('/student-skills')).data.length, 0);
      const before = (await call('/' + first)).data;
      const evidenceEvent = before.history.find(event => event.has_evidence);
      assert.equal((await submit({ id: first, version: 1, file: '%PDF-1.4\nupdated\n%%EOF' })).status, 200);
      assert.equal((await decide(first, 1)).status, 409);
      assert.equal((await submit({ id: first, version: 1 })).status, 409);
      const oldProof = await fetch(base + '/' + first + '/evidence?eventId=' + evidenceEvent.id, { headers: { Authorization: 'Bearer ' + tokens.teacher } });
      assert.match(await oldProof.text(), /original/);
      assert.equal((await fetch(base + '/' + first + '/evidence?eventId=99999', { headers: { Authorization: 'Bearer ' + tokens.teacher } })).status, 404);
      assert.equal((await decide(first, 2, 'approved', 101)).status, 400);
      const decisions = await Promise.all([decide(first, 2, 'approved', 83), decide(first, 2, 'approved', 83)]);
      assert.deepEqual(decisions.map(row => row.status).sort(), [200, 409]);
      const skills = (await call('/student-skills')).data;
      assert.equal(skills[0].proficiency, 83); assert.equal(skills[0].evidence_count, 1);
      const [[cached]] = await db.execute('SELECT proficiency FROM student_skills WHERE siswa_id=? AND skill_id=1', [owner.id]);
      assert.equal(cached.proficiency, 83);
      assert.equal((await submit({ id: first, version: 2 })).status, 409);
    });
    await t.test('multiple projects do not stack scores, rejection does not revoke existing proof', async () => {
      const second = (await submit({ file: null, url: 'https://example.com/project' })).data.id;
      assert.equal((await decide(second, 1, 'approved', 70)).status, 200);
      const third = (await submit()).data.id;
      assert.equal((await decide(third, 1, 'rejected')).status, 200);
      assert.equal((await submit({ id: third, version: 1 })).status, 409);
      const skills = (await call('/student-skills')).data;
      assert.equal(skills[0].proficiency, 83); assert.equal(skills[0].evidence_count, 2);
      const otherEvent = (await call('/' + third)).data.history.find(event => event.has_evidence);
      assert.equal((await fetch(base + '/' + first + '/evidence?eventId=' + otherEvent.id, { headers: { Authorization: 'Bearer ' + tokens.teacher } })).status, 404);
    });
    await t.test('parallel assessments of different projects retain the best skill score', async () => {
      const fourth = (await submit()).data.id;
      const fifth = (await submit()).data.id;
      const results = await Promise.all([decide(fourth, 1, 'approved', 87), decide(fifth, 1, 'approved', 91)]);
      assert.deepEqual(results.map(row => row.status), [200, 200]);
      const [[cached]] = await db.execute('SELECT proficiency FROM student_skills WHERE siswa_id=? AND skill_id=1', [owner.id]);
      assert.equal(cached.proficiency, 91);
      assert.equal((await call('/student-skills')).data[0].proficiency, 91);
    });
    await t.test('legacy projects require resubmission and cannot grant themselves approval or score', async () => {
      const data = (await call('/1')).data; assert.equal(data.legacy, true);
      assert.equal(JSON.stringify(data).includes('legacy.jpg'), false);
      assert.equal((await decide(1, 1)).status, 409);
      const result = await submit({ id: 1, version: 0, file: null, url: 'https://example.com/reworked' });
      assert.equal(result.status, 200); assert.equal(result.data.revision_number, 1);
      assert.equal((await decide(1, 1, 'approved', 95)).status, 200);
      assert.equal((await call('/student-skills')).data[0].proficiency, 95);
    });
    await t.test('account, membership and school suspension block old JWTs and proof access', async () => {
      await db.execute('UPDATE school_memberships m JOIN teachers t ON t.id=m.teacher_id SET m.is_active=0 WHERE t.user_id=?', [teacherA]);
      assert.equal((await decide(first, 2)).status, 403);
      assert.equal((await fetch(base + '/' + first + '/evidence', { headers: { Authorization: 'Bearer ' + tokens.teacher } })).status, 403);
      await db.execute('UPDATE schools SET is_active=0 WHERE id=?', [schoolA]);
      assert.equal((await call('/mine')).status, 403);
      await db.execute('UPDATE schools SET is_active=1 WHERE id=?', [schoolA]);
      await db.execute('UPDATE users SET is_active=0 WHERE id=?', [owner.userId]);
      assert.equal((await call('/mine')).status, 401);
    });
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    if (pool) await pool.end();
    if (created) { assert.match(database, /^finetern_portfolio_test_[a-f0-9]{12}$/); await db.query(`DROP DATABASE \`${database}\``); }
    await db.end();
    const resolved = path.resolve(dir);
    assert.ok(resolved.startsWith(path.resolve(os.tmpdir()) + path.sep) && path.basename(resolved).startsWith('finetern-portfolios-'));
    await fs.rm(resolved, { recursive: true });
  }
});
