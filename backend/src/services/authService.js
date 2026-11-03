const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { authConfig } = require('../config/auth');
const v = require('../utils/validation');
const { getIdentity } = require('./identityService');

function issueToken(user) {
  const config = authConfig();
  return jwt.sign({}, config.secret, { subject: String(user.id), algorithm: 'HS256', expiresIn: config.expiresIn,
    issuer: config.issuer, audience: config.audience });
}

async function login(body) {
  authConfig();
  const email = v.email(body.email);
  const password = body.password;
  if (typeof password !== 'string' || !password.length || Buffer.byteLength(password) > 72) throw v.problem(400, 'Kata sandi tidak valid.');
  const [[account]] = await pool.execute('SELECT id, password, is_active FROM users WHERE email=?', [email]);
  const dummy = '$2b$10$3JtrpvLRzAi2F7AhhQ/O3.LwfwAEpIpn8JWLGY5LlM45iPLg7yqAW';
  const matches = await bcrypt.compare(password, account?.password || dummy);
  if (!account || !matches) throw v.problem(401, 'Email atau kata sandi salah.');
  if (!account.is_active) throw v.problem(401, 'Akun dinonaktifkan. Hubungi pengelola Finetern.');
  const user = await getIdentity(account.id);
  return { token: issueToken(user), user };
}

async function register(body) {
  authConfig();
  if (!['siswa', 'sekolah', 'industri'].includes(body.role)) throw v.problem(400, 'Peran pendaftaran tidak valid.');
  if (body.newSchool != null && typeof body.newSchool !== 'boolean') throw v.problem(400, 'Pilihan sekolah baru tidak valid.');
  if (['posisi', 'is_active', 'status', 'approved', 'canUseApp'].some(key => Object.hasOwn(body, key))) {
    throw v.problem(400, 'Kewenangan dan status ditetapkan oleh pemeriksa.');
  }
  const email = v.email(body.email);
  const password = v.password(body.password);
  if (body.passwordConfirmation !== password) throw v.problem(400, 'Konfirmasi kata sandi tidak sesuai.');
  const nama = v.text(body.nama, 'Nama lengkap');
  const hash = await bcrypt.hash(password, 10);
  let userId;
  try {
    userId = await v.transaction(pool, async db => {
      const [account] = await db.execute('INSERT INTO users (email,password,role) VALUES (?,?,?)', [email, hash, body.role]);
      const uid = account.insertId;
      const addRequest = async (column, subjectId, snapshot) => {
        const [result] = await db.execute(`INSERT INTO verification_requests (applicant_user_id, ${column}) VALUES (?,?)`, [uid, subjectId]);
        await db.execute(`INSERT INTO verification_events (request_id,actor_user_id,action,submission_snapshot)
          VALUES (?,?,'submitted',?)`, [result.insertId, uid, JSON.stringify(snapshot)]);
      };
      const schoolId = body.schoolId ? v.id(body.schoolId) : null;
      if (body.role === 'siswa' || (body.role === 'sekolah' && !body.newSchool)) {
        if (!schoolId) throw v.problem(400, 'Pilih sekolah terverifikasi.');
        const [[school]] = await db.execute(`SELECT s.id FROM schools s JOIN verification_requests r ON r.sekolah_id=s.id
          WHERE s.id=? AND s.is_active=1 AND r.status='approved' FOR SHARE`, [schoolId]);
        if (!school) throw v.problem(400, 'Sekolah belum terverifikasi atau tidak aktif.');
      }
      if (body.role === 'siswa') {
        const nisn = v.text(body.nisn, 'NISN', 25, false);
        const jurusan = v.text(body.jurusan, 'Jurusan', 100);
        const kelas = v.text(body.kelas, 'Kelas', 20);
        const [student] = await db.execute(`INSERT INTO students (user_id,sekolah_id,nisn,nama_lengkap,jurusan,kelas)
          VALUES (?,?,?,?,?,?)`, [uid, schoolId, nisn, nama, jurusan, kelas]);
        await addRequest('siswa_id', student.insertId, { nama, nisn, jurusan, kelas, schoolId });
      } else if (body.role === 'sekolah') {
        const [teacher] = await db.execute('INSERT INTO teachers (user_id,nama_lengkap) VALUES (?,?)', [uid, nama]);
        let institutionId = schoolId;
        if (body.newSchool === true) {
          const schoolName = v.text(body.schoolName, 'Nama sekolah');
          const npsn = v.text(body.npsn, 'NPSN', 20);
          if (!/^\d{8}$/.test(npsn)) throw v.problem(400, 'NPSN harus berisi 8 angka.');
          const alamat = v.text(body.alamat, 'Alamat sekolah', 1000);
          const contactPhone = v.text(body.contactPhone, 'Telepon perwakilan', 30);
          const [school] = await db.execute('INSERT INTO schools (submitted_by,npsn,nama_sekolah,alamat) VALUES (?,?,?,?)', [uid, npsn, schoolName, alamat]);
          institutionId = school.insertId;
          await addRequest('sekolah_id', institutionId, { nama, email, schoolName, npsn, alamat, contactPhone });
        }
        const [membership] = await db.execute('INSERT INTO school_memberships (teacher_id,sekolah_id) VALUES (?,?)', [teacher.insertId, institutionId]);
        await addRequest('membership_id', membership.insertId, { nama, schoolId: institutionId });
      } else {
        const company = v.text(body.companyName, 'Nama industri');
        const sector = v.text(body.sektor, 'Sektor industri', 100);
        const city = v.text(body.kota, 'Kota', 100);
        const registration = v.text(body.nomorRegistrasi, 'Nomor registrasi', 64).toUpperCase();
        const contactPhone = v.text(body.contactPhone, 'Telepon perwakilan', 30);
        const [industry] = await db.execute(`INSERT INTO industries (user_id,nama_industri,sektor_industri,kota_domisili,nomor_registrasi)
          VALUES (?,?,?,?,?)`, [uid, company, sector, city, registration]);
        await addRequest('industri_id', industry.insertId, { nama, email, companyName: company, sektor: sector, kota: city, nomorRegistrasi: registration, contactPhone });
      }
      return uid;
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') throw v.problem(409, 'Email, NISN, atau identitas institusi sudah terdaftar.');
    throw error;
  }
  const user = await getIdentity(userId);
  return { token: issueToken(user), user };
}

module.exports = { login, register, issueToken };
