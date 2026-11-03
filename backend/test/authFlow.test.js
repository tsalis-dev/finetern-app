const assert = require('node:assert/strict');
const { test } = require('node:test');
const { randomBytes } = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });

test('HTTP registration, authentication and school verification hierarchy', async t => {
  const database = `finetern_auth_test_${randomBytes(6).toString('hex')}`;
  const evidenceDir = await fs.mkdtemp(path.join(os.tmpdir(), 'finetern-evidence-'));
  const host = process.env.TEST_DB_HOST || process.env.DB_HOST || 'localhost';
  assert.ok(['localhost', '127.0.0.1', '::1'].includes(host));
  const connection = await mysql.createConnection({ host, port: Number(process.env.TEST_DB_PORT || process.env.DB_PORT) || 3306,
    user: process.env.TEST_DB_USER || process.env.DB_USER || 'root', password: process.env.TEST_DB_PASS ?? process.env.DB_PASS ?? '', multipleStatements: true });
  let server, pool, created = false;
  try {
    assert.match(database, /^finetern_auth_test_[a-f0-9]{12}$/);
    await connection.query(`CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`); created = true;
    await connection.query(`USE \`${database}\``);
    const schema = (await fs.readFile(path.join(__dirname, '../../database/schema.sql'), 'utf8'))
      .replace(/^CREATE DATABASE IF NOT EXISTS finetern_db[^;]*;\s*/m, '').replace(/^USE finetern_db;\s*/m, '');
    await connection.query(schema);
    process.env.DB_NAME = database;
    process.env.DB_HOST = host;
    process.env.DB_PORT = String(process.env.TEST_DB_PORT || process.env.DB_PORT || 3306);
    process.env.DB_USER = process.env.TEST_DB_USER || process.env.DB_USER || 'root';
    process.env.DB_PASS = process.env.TEST_DB_PASS ?? process.env.DB_PASS ?? '';
    process.env.JWT_SECRET = randomBytes(48).toString('hex');
    process.env.JWT_EXPIRES_IN = '1h';
    process.env.VERIFICATION_UPLOAD_DIR = evidenceDir;
    pool = require('../src/config/db').pool;
    const app = require('../src/app');
    server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
    const base = `http://127.0.0.1:${server.address().port}/api`;
    const call = async (url, method = 'GET', body, token) => {
      const response = await fetch(base + url, { method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
      return { status: response.status, ...(await response.json()) };
    };
    const password = '  test-password-123  ';
    await connection.execute('INSERT INTO users (email,password,role) VALUES (?,?,?)', ['admin@example.invalid', await bcrypt.hash(password, 10), 'admin']);
    let admin, founder, teacher, student, outsider, industry, schoolRequest, teacherRequest, studentRequest, industryRequest;
    const signup = (email, extra) => call('/auth/register', 'POST', { email, password, passwordConfirmation: password, nama: 'Nama Pengujian', ...extra });
    const me = token => call('/profile/me', 'GET', null, token);
    const upload = async (id, token, bytes = '%PDF-1.4\nfixture\n%%EOF') => {
      const form = new FormData(); form.append('file', new Blob([bytes], { type: 'application/pdf' }), 'bukti.pdf');
      const response = await fetch(`${base}/verification/${id}/evidence`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
      return { status: response.status, ...(await response.json()) };
    };
    const decide = (id, token, status = 'approved') => call(`/verification/${id}/review`, 'POST', { status, note: 'Pemeriksaan fixture selesai.' }, token);

    await t.test('login preserves password whitespace and rejects invalid credentials and privilege fields', async () => {
      admin = (await call('/auth/login', 'POST', { email: 'ADMIN@example.invalid', password })).data;
      assert.equal(admin.user.role, 'admin');
      assert.equal((await call('/auth/login', 'POST', { email: 'admin@example.invalid', password: 'wrong-password' })).status, 401);
      assert.equal((await signup('hacker@example.invalid', { role: 'admin' })).status, 400);
      assert.equal((await signup('hacker@example.invalid', { role: 'sekolah', posisi: 'koordinator' })).status, 400);
      assert.equal((await signup('hacker@example.invalid', { role: 'sekolah', newSchool: 'true' })).status, 400);
      assert.equal((await call('/profile/me')).status, 401);
      assert.equal(JSON.stringify(admin.user).includes('password'), false);
    });

    await t.test('school registration is atomic, pending and cannot grant its founder coordinator access', async () => {
      const response = await signup('founder@example.invalid', { role: 'sekolah', newSchool: true, schoolName: 'Sekolah Uji A', npsn: '99990001', alamat: 'Alamat sekolah A', contactPhone: '08123456789' });
      assert.equal(response.status, 201); founder = response.data;
      assert.equal(founder.user.canUseApp, false); assert.equal(founder.user.posisi, 'guru');
      schoolRequest = founder.user.verification.find(r => r.sekolah_id).id;
      assert.equal((await call('/verification/queue', 'GET', null, founder.token)).status, 403);
      assert.equal((await decide(schoolRequest, founder.token)).status, 403);
      assert.equal((await decide(schoolRequest, admin.token)).status, 400);
      assert.equal((await signup('too-early@example.invalid', { role: 'siswa', schoolId: founder.user.profile.sekolah_id, jurusan: 'RPL', kelas: 'XII' })).status, 400);
      const [[orphan]] = await connection.query("SELECT COUNT(*) AS total FROM users WHERE email='too-early@example.invalid'");
      assert.equal(orphan.total, 0);
      assert.equal((await signup('duplicate@example.invalid', { role: 'sekolah', newSchool: true, schoolName: 'Duplikat', npsn: '99990001', alamat: 'Alamat', contactPhone: '0812' })).status, 409);
      const [[duplicate]] = await connection.query("SELECT COUNT(*) AS total FROM users WHERE email='duplicate@example.invalid'");
      assert.equal(duplicate.total, 0);
    });

    await t.test('private proof is checked and institution approval appoints the initial coordinator', async () => {
      assert.equal((await upload(schoolRequest, founder.token, '<script>not pdf</script>')).status, 400);
      assert.equal((await upload(schoolRequest, founder.token)).status, 201);
      const proofHistory = (await call(`/verification/${schoolRequest}`, 'GET', null, founder.token)).data.history;
      const proofEvent = proofHistory.find(event => event.submission_snapshot?.evidence);
      assert.equal((await upload(schoolRequest, founder.token, '%PDF-1.4\nreplacement\n%%EOF')).status, 201);
      const oldProof = await fetch(`${base}/verification/${schoolRequest}/evidence?eventId=${proofEvent.id}`, { headers: { Authorization: `Bearer ${admin.token}` } });
      assert.equal(oldProof.status, 200); assert.match(await oldProof.text(), /fixture/);
      assert.equal((await fetch(`${base}/verification/${schoolRequest}/evidence?eventId=9999999`, { headers: { Authorization: `Bearer ${admin.token}` } })).status, 404);
      assert.equal((await fetch(`${base}/verification/${schoolRequest}/evidence`)).status, 401);
      await connection.execute('UPDATE schools SET npsn=NULL WHERE id=?', [founder.user.profile.sekolah_id]);
      assert.equal((await decide(schoolRequest, admin.token)).status, 400);
      await connection.execute('UPDATE schools SET npsn=? WHERE id=?', ['99990001', founder.user.profile.sekolah_id]);
      assert.equal((await decide(schoolRequest, admin.token)).status, 200);
      const current = (await me(founder.token)).data;
      assert.equal(current.canUseApp, true); assert.equal(current.posisi, 'koordinator');
      const download = await fetch(`${base}/verification/${schoolRequest}/evidence`, { headers: { Authorization: `Bearer ${admin.token}` } });
      assert.equal(download.status, 200); assert.match(download.headers.get('content-disposition'), /attachment/);
      assert.match(await download.text(), /^%PDF-/);
      assert.equal((await decide(schoolRequest, admin.token)).status, 409);
      assert.equal((await upload(schoolRequest, founder.token)).status, 409);
      assert.equal((await call('/schools?q=Sekolah%20Uji%20A')).data.length, 1);
    });

    await t.test('coordinator approves a personal teacher, then teacher approves their school student', async () => {
      teacher = (await signup('teacher@example.invalid', { role: 'sekolah', schoolId: founder.user.profile.sekolah_id })).data;
      teacherRequest = teacher.user.verification[0].id;
      assert.equal((await call('/verification/queue', 'GET', null, teacher.token)).status, 403);
      assert.equal((await decide(teacherRequest, admin.token)).status, 403);
      assert.equal((await decide(teacherRequest, founder.token)).status, 200);
      assert.equal((await me(teacher.token)).data.canUseApp, true);
      student = (await signup('student@example.invalid', { role: 'siswa', schoolId: founder.user.profile.sekolah_id, jurusan: 'RPL', kelas: 'XII', nisn: '1234567890' })).data;
      studentRequest = student.user.verification[0].id;
      assert.equal(student.user.canUseApp, false);
      assert.equal((await decide(studentRequest, student.token)).status, 403);
      const outcomes = await Promise.all([decide(studentRequest, teacher.token), decide(studentRequest, founder.token)]);
      assert.deepEqual(outcomes.map(o => o.status).sort(), [200, 409]);
      assert.equal((await me(student.token)).data.canUseApp, true);
      const [[history]] = await connection.execute("SELECT COUNT(*) AS total FROM verification_events WHERE request_id=? AND action='approved'", [studentRequest]);
      assert.equal(history.total, 1);
    });

    await t.test('school boundaries and proof visibility cannot be bypassed', async () => {
      outsider = (await signup('outsider@example.invalid', { role: 'sekolah', newSchool: true, schoolName: 'Sekolah Uji B', npsn: '99990002', alamat: 'Alamat sekolah B', contactPhone: '0812' })).data;
      const request = outsider.user.verification.find(r => r.sekolah_id).id;
      await upload(request, outsider.token); await decide(request, admin.token);
      assert.equal((await decide(studentRequest, outsider.token)).status, 403);
      assert.equal((await call(`/verification/${studentRequest}`, 'GET', null, outsider.token)).status, 403);
      assert.equal((await fetch(`${base}/verification/${schoolRequest}/evidence`, { headers: { Authorization: `Bearer ${outsider.token}` } })).status, 403);
      const queue = await call('/verification/queue?status=approved', 'GET', null, outsider.token);
      assert.equal(queue.data.some(r => r.id === studentRequest), false);
    });

    await t.test('revision preserves history and does not accept public role escalation', async () => {
      const pending = (await signup('revision@example.invalid', { role: 'siswa', schoolId: founder.user.profile.sekolah_id, jurusan: 'RPL', kelas: 'XII' })).data;
      const request = pending.user.verification[0].id;
      assert.equal((await decide(request, teacher.token, 'needs_revision')).status, 200);
      assert.equal((await call(`/verification/${request}/resubmit`, 'PATCH', { nama: 'Nama Perbaikan', jurusan: 'RPL', kelas: 'XII', posisi: 'koordinator' }, pending.token)).status, 200);
      const detail = await call(`/verification/${request}`, 'GET', null, pending.token);
      assert.deepEqual(detail.data.history.map(e => e.action), ['submitted', 'needs_revision', 'resubmitted']);
      assert.equal((await me(pending.token)).data.role, 'siswa');
      assert.equal((await decide(request, teacher.token, 'rejected')).status, 200);
      assert.equal((await call(`/verification/${request}/resubmit`, 'PATCH', { nama: 'Ulang', jurusan: 'RPL', kelas: 'XII' }, pending.token)).status, 409);
    });

    await t.test('JWT claims cannot override database role and inactive access takes effect immediately', async () => {
      const forgedRole = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { subject: String(student.user.id), algorithm: 'HS256', audience: 'finetern-app', issuer: 'finetern-api', expiresIn: '1h' });
      assert.equal((await call('/verification/queue', 'GET', null, forgedRole)).status, 403);
      const expired = jwt.sign({}, process.env.JWT_SECRET, { subject: String(student.user.id), algorithm: 'HS256', audience: 'finetern-app', issuer: 'finetern-api', expiresIn: -1 });
      assert.equal((await me(expired)).status, 401);
      assert.equal((await call(`/admin/accounts/${teacher.user.id}/activity`, 'PATCH', { active: false, note: 'Uji penghentian akses' }, admin.token)).status, 200);
      assert.equal((await me(teacher.token)).status, 401);
      await call(`/admin/accounts/${teacher.user.id}/activity`, 'PATCH', { active: true, note: 'Uji pemulihan' }, admin.token);
      await call(`/verification/${schoolRequest}/activity`, 'PATCH', { active: false, note: 'Uji sekolah tidak aktif' }, admin.token);
      assert.equal((await me(student.token)).data.canUseApp, false);
      assert.equal((await call('/verification/queue', 'GET', null, teacher.token)).status, 403);
      await call(`/verification/${schoolRequest}/activity`, 'PATCH', { active: true, note: 'Uji sekolah aktif' }, admin.token);
    });

    await t.test('industry cannot recruit before admin approval and can be suspended', async () => {
      industry = (await signup('industry@example.invalid', { role: 'industri', companyName: 'Industri Uji', sektor: 'TI', kota: 'Bandung', nomorRegistrasi: 'TEST-REG-1', contactPhone: '0812' })).data;
      industryRequest = industry.user.verification[0].id;
      assert.equal(industry.user.canUseApp, false);
      await upload(industryRequest, industry.token);
      assert.equal((await decide(industryRequest, founder.token)).status, 403);
      assert.equal((await decide(industryRequest, admin.token)).status, 200);
      assert.equal((await me(industry.token)).data.canUseApp, true);
      await call(`/verification/${industryRequest}/activity`, 'PATCH', { active: false, note: 'Uji penghentian industri' }, admin.token);
      assert.equal((await me(industry.token)).data.canUseApp, false);
    });

    await t.test('admin console is served with CSP, and login throttling returns the API envelope', async () => {
      const consoleResponse = await fetch(base.replace('/api', '/admin/'));
      assert.equal(consoleResponse.status, 200); assert.match(consoleResponse.headers.get('content-security-policy'), /frame-ancestors 'none'/);
      let last;
      for (let i = 0; i < 51; i++) { last = await call('/auth/login', 'POST', { email: 'invalid', password: 'invalid' }); if (last.status === 429) break; }
      assert.equal(last.status, 429); assert.equal(last.success, false);
    });
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    if (pool) await pool.end();
    if (created) { assert.match(database, /^finetern_auth_test_[a-f0-9]{12}$/); await connection.query(`DROP DATABASE \`${database}\``); }
    await connection.end();
    const resolved = path.resolve(evidenceDir);
    assert.ok(resolved.startsWith(path.resolve(os.tmpdir()) + path.sep) && path.basename(resolved).startsWith('finetern-evidence-'));
    await fs.rm(resolved, { recursive: true });
  }
});
