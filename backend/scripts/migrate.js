const fs = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const { spawnSync } = require('node:child_process');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });

async function migrate() {
  const config = { host: process.env.DB_HOST || 'localhost', port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root', password: process.env.DB_PASS || '', database: process.env.DB_NAME || 'finetern_db', multipleStatements: true };
  const connection = await mysql.createConnection(config);
  let clone;
  let cloneCreated = false;
  try {
    const versions = ['001_identity_verification', '002_portfolio_evidence', '003_recruitment_matching', '004_adaptive_learning'];
    let applied = [];
    const [markers] = await connection.execute("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=? AND TABLE_NAME='schema_migrations'", [config.database]);
    if (markers.length) {
      const [rows] = await connection.query('SELECT version,status FROM schema_migrations');
      if (rows.some(row => row.status !== 'applied') || !rows.some(row => row.version === versions[0])) throw new Error('Penanda migrasi tidak lengkap. Periksa/pulihkan database sebelum melanjutkan.');
      applied = rows.map(row => row.version);
    }
    const pending = versions.filter(version => !applied.includes(version));
    if (!pending.length) { console.log('Schema v5 sudah diterapkan.'); return; }
    const cliDir = process.env.MYSQL_BIN_DIR || 'C:/laragon/bin/mysql/mysql-8.4.3-winx64/bin';
    const binary = name => path.join(cliDir, process.platform === 'win32' ? name + '.exe' : name);
    if (!fs.existsSync(binary('mysqldump')) || !fs.existsSync(binary('mysql'))) throw new Error('Atur MYSQL_BIN_DIR ke folder mysql dan mysqldump.');
    const [tables] = await connection.query('SHOW TABLES');
    const names = tables.map(row => Object.values(row)[0]).filter(name => name !== 'schema_migrations');
    if (!names.includes('schools') || names.includes('teachers') !== applied.includes(versions[0])) throw new Error('Schema sumber bukan versi yang didukung.');
    const snapshot = async () => {
      const result = {};
      for (const table of names) {
        if (!/^[a-z_]+$/.test(table)) throw new Error('Nama tabel tidak didukung.');
        const [rows] = await connection.query(`SELECT * FROM \`${table}\` ORDER BY id`);
        result[table] = JSON.parse(JSON.stringify(rows));
      }
      return result;
    };
    const before = await snapshot();
    const backupDir = path.join(__dirname, '../../database/backups'); fs.mkdirSync(backupDir, { recursive: true });
    const backup = path.join(backupDir, `before-v5-${Date.now()}.sql`);
    const args = [`--host=${config.host}`, `--port=${config.port}`, `--user=${config.user}`];
    const env = { ...process.env, MYSQL_PWD: config.password };
    const dumpFd = fs.openSync(backup, 'wx');
    let dump;
    try { dump = spawnSync(binary('mysqldump'), [...args, '--single-transaction', '--set-gtid-purged=OFF', '--column-statistics=0', config.database], { env, stdio: ['ignore', dumpFd, 'pipe'], windowsHide: true }); }
    finally { fs.closeSync(dumpFd); }
    if (dump.error || dump.status !== 0 || fs.statSync(backup).size === 0) throw new Error('Backup gagal. Migrasi tidak dijalankan.');
    console.log('Backup tersimpan:', backup);
    clone = `finetern_restore_test_${randomBytes(6).toString('hex')}`;
    if (!/^finetern_restore_test_[a-f0-9]{12}$/.test(clone)) throw new Error('Nama database uji tidak aman.');
    await connection.query(`CREATE DATABASE \`${clone}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`); cloneCreated = true;
    const backupFd = fs.openSync(backup, 'r');
    let restore;
    try { restore = spawnSync(binary('mysql'), [...args, clone], { env, stdio: [backupFd, 'ignore', 'pipe'], windowsHide: true }); }
    finally { fs.closeSync(backupFd); }
    if (restore.error || restore.status !== 0) throw new Error('Uji pemulihan backup gagal. Database aplikasi tidak dimigrasi.');
    const migration = pending.map(version => fs.readFileSync(path.join(__dirname, '../../database/migrations', version + '.sql'), 'utf8')).join('\n');
    const check = async () => {
      for (const [table, oldRows] of Object.entries(before)) {
        const [rows] = await connection.query(`SELECT * FROM \`${table}\` ORDER BY id`);
        const selected = JSON.parse(JSON.stringify(rows)).map(row => Object.fromEntries(Object.keys(oldRows[0] || {}).map(key => [key, row[table === 'schools' && key === 'user_id' && !applied.includes(versions[0]) ? 'submitted_by' : key]])));
        if (JSON.stringify(selected) !== JSON.stringify(oldRows)) throw new Error(`Validasi pelestarian data gagal: ${table}.`);
      }
    };
    await connection.changeUser({ database: clone });
    await connection.query(migration); await check();
    console.log('Backup berhasil dipulihkan dan migrasi pada salinannya lolos pemeriksaan.');
    await connection.changeUser({ database: config.database });
    if (JSON.stringify(await snapshot()) !== JSON.stringify(before)) throw new Error('Data berubah selama persiapan. Hentikan penulisan aplikasi dan ulangi persiapan.');
    await connection.query(migration); await check();
    console.log('Migrasi database aplikasi selesai; record lama tetap utuh.');
  } finally {
    if (cloneCreated) {
      if (!/^finetern_restore_test_[a-f0-9]{12}$/.test(clone)) throw new Error('Cleanup hanya untuk database uji yang dibuat run ini.');
      await connection.query(`DROP DATABASE \`${clone}\``);
    }
    await connection.end();
  }
}

migrate().catch(error => { console.error(error.message); process.exitCode = 1; });
