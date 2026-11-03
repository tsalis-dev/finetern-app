const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });

async function prepareDemo({ database = 'finetern_demo_class', withAI = false } = {}) {
  if (!/^finetern_demo_[a-z0-9_]{1,40}$/.test(database) || database === process.env.DB_NAME || process.env.NODE_ENV === 'production') {
    throw new Error('Demo hanya boleh dibuat pada database lokal baru bernama finetern_demo_*.');
  }
  const host = process.env.DB_HOST || 'localhost';
  if (!['localhost', '127.0.0.1', '::1'].includes(host)) throw new Error('Demo hanya untuk MySQL lokal.');
  const root = path.resolve(__dirname, '../.local', database);
  const config = { host, port: Number(process.env.DB_PORT) || 3306, user: process.env.DB_USER || 'root', password: process.env.DB_PASS || '', multipleStatements: true };
  const db = await mysql.createConnection(config);
  let server, pool;
  try {
    const [existing] = await db.execute('SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME=?', [database]);
    if (existing.length) throw new Error('Database demo sudah ada; tidak direset atau ditimpa. Gunakan npm run demo:start.');
    await fs.mkdir(path.dirname(root), { recursive: true });
    await fs.mkdir(root);
    await db.query('CREATE DATABASE `' + database + '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    await db.query('USE `' + database + '`');
    const schema = (await fs.readFile(path.join(__dirname, '../../database/schema.sql'), 'utf8'))
      .replace(/^CREATE DATABASE IF NOT EXISTS finetern_db[^;]*;\s*/m, '').replace(/^USE finetern_db;\s*/m, '');
    await db.query(schema);
    const password = 'Demo-' + randomBytes(9).toString('hex');
    const accounts = { admin: 'admin@demo.finetern.test', coordinator: 'koordinator@demo.finetern.test', teacher: 'guru@demo.finetern.test', student: 'siswa@demo.finetern.test', pendingStudent: 'pending@demo.finetern.test', industry: 'industri@demo.finetern.test' };
    const env = { DB_NAME: database, DB_HOST: host, DB_PORT: String(config.port), DB_USER: config.user, DB_PASS: config.password,
      PORT: '5001', NODE_ENV: 'development', JWT_SECRET: randomBytes(48).toString('hex'),
      VERIFICATION_UPLOAD_DIR: path.join(root, 'verifications'), PORTFOLIO_UPLOAD_DIR: path.join(root, 'portfolios') };
    await fs.writeFile(path.join(root, 'demo.env'), Object.entries(env).map(([key, value]) => key + '=' + JSON.stringify(value)).join('\n') + '\n', { flag: 'wx' });
    await fs.writeFile(path.join(root, 'credentials.json'), JSON.stringify({ password, accounts }, null, 2), { flag: 'wx' });
    Object.assign(process.env, env);
    pool = require('../src/config/db').pool;
    server = await new Promise(resolve => { const s = require('../src/app').listen(0, '127.0.0.1', () => resolve(s)); });
    const base = 'http://127.0.0.1:' + server.address().port + '/api';
    const call = async (url, method = 'GET', body, token, expected = 200) => {
      const response = await fetch(base + url, { method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined });
      const result = await response.json();
      assert.equal(response.status, expected, 'Persiapan demo gagal pada ' + url + ' (HTTP ' + response.status + ').');
      return result.data;
    };
    const signup = (email, extra) => call('/auth/register', 'POST', { email, password, passwordConfirmation: password, ...extra }, null, 201);
    const approve = (id, token) => call('/verification/' + id + '/review', 'POST', { status: 'approved', note: 'SIMULASI KELAS: institusi, identitas, dan persetujuan ini adalah data fiktif untuk demonstrasi.' }, token);
    const illustration = await fs.readFile(path.join(__dirname, '../../mobile/assets/icon.png'));
    const upload = async (requestId, token) => {
      const body = new FormData(); body.append('file', new Blob([illustration], { type: 'image/png' }), 'ilustrasi-demo-bukan-dokumen-resmi.png');
      const response = await fetch(base + '/verification/' + requestId + '/evidence', { method: 'POST', headers: { Authorization: 'Bearer ' + token }, body });
      assert.equal(response.status, 201, 'Unggah ilustrasi demo gagal.');
    };
    await db.execute('INSERT INTO users(email,password,role) VALUES(?,?,?)', [accounts.admin, await bcrypt.hash(password, 10), 'admin']);
    const admin = await call('/auth/login', 'POST', { email: accounts.admin, password });
    const coordinator = await signup(accounts.coordinator, { nama: 'Bu Ratna (Demo)', role: 'sekolah', newSchool: true, schoolName: 'SMK Finetern (Demo)', npsn: '99990001', alamat: 'Alamat fiktif untuk simulasi kelas', contactPhone: '0800000000' });
    const schoolRequest = coordinator.user.verification.find(item => item.sekolah_id).id;
    await upload(schoolRequest, coordinator.token); await approve(schoolRequest, admin.token);
    const schoolId = coordinator.user.profile.sekolah_id;
    const teacher = await signup(accounts.teacher, { nama: 'Pak Bima (Demo)', role: 'sekolah', schoolId });
    await approve(teacher.user.verification[0].id, coordinator.token);
    const student = await signup(accounts.student, { nama: 'Alya Pratama (Demo)', role: 'siswa', schoolId, jurusan: 'Rekayasa Perangkat Lunak', kelas: 'XII RPL 1', nisn: '9999000001' });
    await approve(student.user.verification[0].id, teacher.token);
    const pending = await signup(accounts.pendingStudent, { nama: 'Raka (Demo Pending)', role: 'siswa', schoolId, jurusan: 'Rekayasa Perangkat Lunak', kelas: 'XII RPL 1', nisn: '9999000002' });
    const industry = await signup(accounts.industry, { nama: 'Nadia (Demo)', role: 'industri', companyName: 'Studio Karya Digital (Demo)', sektor: 'Pengembangan aplikasi', kota: 'Bandung', nomorRegistrasi: 'DEMO-CLASS-001', contactPhone: '0800000001' });
    const industryRequest = industry.user.verification[0].id;
    await upload(industryRequest, industry.token); await approve(industryRequest, admin.token);
    await db.query("INSERT INTO skills(id,nama_skill,kategori) VALUES(1,'React Native UI Slicing','Frontend Mobile'),(2,'RESTful API Integration','Frontend Mobile'),(3,'Git Workflow & Collaboration','Developer Tools')");
    const project = (title, skillId) => call('/portfolios', 'POST', { title, skillId, deskripsi: 'SIMULASI: contoh bukti karya dan peran siswa untuk demonstrasi kelas, bukan klaim proyek atau dokumen nyata.', projectUrl: 'https://example.com/finetern-demo' }, student.token, 201);
    for (const [title, skillId, proficiency] of [['Katalog Produk (Demo)', 1, 85], ['Integrasi API Dasar (Demo)', 2, 55], ['Kolaborasi Git (Demo)', 3, 75]]) {
      const proof = await project(title, skillId);
      await call('/portfolios/' + proof.id + '/review', 'POST', { version: proof.revision_number, status: 'approved', proficiency, note: 'Nilai simulasi untuk demonstrasi; bukan asesmen siswa nyata.' }, teacher.token);
    }
    const pendingProof = await project('Perbaikan Integrasi API (Demo — nilai guru saat presentasi)', 2);
    const deadline = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    const vacancy = (title, requirements) => call('/vacancies', 'POST', { title, deskripsi: 'SIMULASI KELAS: lowongan fiktif untuk menjelaskan kecocokan dan alur magang.', location: 'Bandung', workMode: 'hybrid', allowance: 1000000, quota: 3, deadline, requirements }, industry.token, 201);
    const ui = { skillId: 1, importance: 'wajib', weight: 10, minProficiency: 70 };
    const git = { skillId: 3, importance: 'nilai_tambah', weight: 5, minProficiency: 60 };
    const target = await vacancy('Mobile Developer Intern (Demo — perlu belajar API)', [ui, { skillId: 2, importance: 'wajib', weight: 10, minProficiency: 70 }, git]);
    const ready = await vacancy('UI Mobile Intern (Demo — siap melamar)', [ui, git]);
    const selection = await vacancy('Frontend Intern (Demo — contoh seleksi)', [ui, git]);
    const application = await call('/vacancies/' + selection.id + '/apply', 'POST', { version: selection.revision_number, shareConsent: true }, student.token, 201);
    await call('/applications/' + application.id + '/review', 'POST', { version: application.revision_number, status: 'reviewed', note: 'SIMULASI: karya awal sesuai, silakan lanjutkan ke wawancara.' }, industry.token);
    const targetView = await call('/vacancies/' + target.id, 'GET', null, student.token);
    const readyView = await call('/vacancies/' + ready.id, 'GET', null, student.token);
    assert.ok(targetView.matching.match_rate >= 80 && !targetView.matching.can_apply);
    assert.equal(readyView.matching.can_apply, true);
    assert.equal((await call('/profile/me', 'GET', null, pending.token)).canUseApp, false);
    let moduleId = null;
    if (withAI) {
      const module = await call('/ai/generate-sprint', 'POST', { vacancyId: target.id, skillId: 2, version: target.revision_number }, student.token, 201);
      moduleId = module.id;
      const detail = await call('/ai/modules/' + moduleId, 'GET', null, student.token);
      assert.equal(detail.quiz.length, 3); assert.equal(detail.generation_status, 'ready');
      assert.equal(JSON.stringify(detail).includes('correctIndex'), false);
    }
    const manifest = { database, port: 5001, accounts, schoolId, pendingStudentRequestId: pending.user.verification[0].id,
      pendingPortfolioId: pendingProof.id, targetVacancyId: target.id, readyVacancyId: ready.id, selectionVacancyId: selection.id,
      applicationId: application.id, moduleId, aiMaterial: moduleId ? 'Gemini nyata, tersimpan' : 'Belum dibuat; membutuhkan koneksi Gemini',
      targetMatch: targetView.matching.match_rate, readyMatch: readyView.matching.match_rate };
    await fs.writeFile(path.join(root, 'manifest.json'), JSON.stringify(manifest, null, 2), { flag: 'wx' });
    return { root, manifest };
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    if (pool) await pool.end();
    await db.end();
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== '--with-ai')) { console.error('Pilihan: npm run demo:prepare [-- --with-ai]'); process.exitCode = 1; }
  else prepareDemo({ withAI: args.includes('--with-ai') }).then(({ root, manifest }) => {
    console.log('Data demo terpisah siap pada ' + manifest.database + '.');
    console.log('Akun/password lokal: ' + path.join(root, 'credentials.json'));
    console.log('Skenario: ' + path.join(root, 'manifest.json'));
    console.log('Materi: ' + manifest.aiMaterial + '. Jalankan npm run demo:start.');
  }).catch(() => { console.error('Persiapan demo berhenti. Database utama tidak dipilih. Jika demo sudah pernah dibuat, gunakan npm run demo:start; persiapan tidak menimpa data demo lama.'); process.exitCode = 1; });
}
module.exports = { prepareDemo };
