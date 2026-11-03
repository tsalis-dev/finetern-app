const path = require('node:path');
const fs = require('node:fs/promises');
const { randomUUID } = require('node:crypto');
const { pool } = require('../config/db');
const { getIdentity } = require('./identityService');
const v = require('../utils/validation');
const files = require('../utils/evidenceFiles');

const privateDir = path.resolve(process.env.PORTFOLIO_UPLOAD_DIR || path.join(__dirname, '../../private-portfolios'));
const statuses = ['pending', 'approved', 'revision', 'rejected'];
const select = `SELECT p.*,s.user_id AS student_user_id,s.sekolah_id,s.nama_lengkap,s.jurusan,s.kelas,
  k.nama_skill,k.kategori,u.email AS reviewer_email FROM portfolios p
  JOIN students s ON s.id=p.siswa_id JOIN skills k ON k.id=p.skill_id
  LEFT JOIN users u ON u.id=p.reviewed_by`;

function requireAccess(user, role) {
  if (!user?.is_active || !user.canUseApp || (role ? user.role !== role : !['siswa', 'sekolah'].includes(user.role))) {
    throw v.problem(403, 'Akun dan sekolah harus terverifikasi serta aktif untuk mengakses portofolio.');
  }
}
function page(query) {
  const offset = Number(query.offset || 0);
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > 100000) throw v.problem(400, 'Halaman portofolio tidak valid.');
  return offset;
}
function projectUrl(value) {
  const raw = v.text(value, 'Tautan proyek', 255, false);
  if (!raw) return null;
  let url;
  try { url = new URL(raw); } catch { throw v.problem(400, 'Tautan proyek harus berupa URL HTTP atau HTTPS.'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw v.problem(400, 'Tautan proyek harus berupa URL HTTP atau HTTPS tanpa kredensial.');
  return raw;
}
function dto(row) {
  const { evidence_path, image_path, student_user_id, ...result } = row;
  let safeUrl = null;
  try { safeUrl = projectUrl(row.project_url); } catch { /* Data legacy boleh diperbaiki tanpa membuka tautan berbahaya. */ }
  return { ...result, project_url: safeUrl, has_evidence: Boolean(evidence_path),
    evidence_type: evidence_path?.split('.').pop() || null, legacy: row.revision_number === 0 };
}
async function getPortfolio(id, db = pool, lock = false) {
  const [[row]] = await db.execute(select + ' WHERE p.id=?' + (lock ? ' FOR UPDATE' : ''), [id]);
  if (!row) throw v.problem(404, 'Portofolio tidak ditemukan.');
  return row;
}
async function checkReader(user, row, db = pool) {
  requireAccess(user);
  if (user.role === 'siswa') {
    if (row.student_user_id !== user.id) throw v.problem(403, 'Portofolio bukan milik Anda.');
  } else {
    if (row.sekolah_id !== user.profile.sekolah_id || user.id === row.student_user_id) throw v.problem(403, 'Portofolio bukan kewenangan sekolah Anda.');
    const student = await getIdentity(row.student_user_id, db);
    requireAccess(student, 'siswa');
  }
}
async function skills(user) {
  requireAccess(user);
  const [rows] = await pool.query('SELECT id,nama_skill,kategori FROM skills ORDER BY kategori,nama_skill');
  return rows;
}
// Matching harus memakai bukti penilaian ini, bukan flag seed/kuis pada student_skills.
async function studentSkills(user, db = pool) {
  requireAccess(user, 'siswa');
  const [rows] = await db.execute(`SELECT k.id,k.nama_skill,k.kategori,MAX(p.assessed_proficiency) AS proficiency,
    COUNT(p.id) AS evidence_count,MAX(p.reviewed_at) AS validated_at
    FROM skills k JOIN portfolios p ON p.skill_id=k.id AND p.siswa_id=?
      AND p.status_verifikasi='approved' AND p.revision_number>0 AND p.reviewed_by IS NOT NULL
    GROUP BY k.id,k.nama_skill,k.kategori ORDER BY k.nama_skill`, [user.profileId]);
  return rows.map(row => ({ ...row, is_validated: true }));
}
async function mine(user, query) {
  requireAccess(user, 'siswa');
  const offset = page(query);
  const [rows] = await pool.execute(select + ` WHERE p.siswa_id=? ORDER BY p.created_at DESC,p.id DESC LIMIT 30 OFFSET ${offset}`, [user.profileId]);
  const [[summary]] = await pool.execute(`SELECT COUNT(*) AS total,
    COALESCE(SUM(status_verifikasi='pending' AND revision_number>0),0) AS pending,
    COALESCE(SUM(status_verifikasi='revision' AND revision_number>0),0) AS revision,
    COALESCE(SUM(status_verifikasi='approved' AND revision_number>0 AND reviewed_by IS NOT NULL),0) AS approved
    FROM portfolios WHERE siswa_id=?`, [user.profileId]);
  return { items: rows.map(dto), summary, skills: await studentSkills(user) };
}
async function queue(user, query) {
  requireAccess(user, 'sekolah');
  const status = query.status || 'pending';
  if (!statuses.includes(status)) throw v.problem(400, 'Status portofolio tidak valid.');
  const offset = page(query);
  const [rows] = await pool.execute(select + ` JOIN users owner ON owner.id=s.user_id
    JOIN verification_requests vr ON vr.siswa_id=s.id
    WHERE s.sekolah_id=? AND owner.is_active=1 AND vr.status='approved'
      AND p.status_verifikasi=? AND p.revision_number>0
    ORDER BY p.updated_at,p.id LIMIT 30 OFFSET ${offset}`, [user.profile.sekolah_id, status]);
  return rows.map(dto);
}
async function detail(user, id) {
  const row = await getPortfolio(id);
  await checkReader(user, row);
  const [history] = await pool.execute(`SELECT e.id,e.revision_number,e.action,e.note,e.submission_snapshot,e.created_at,
    u.email AS actor_email FROM portfolio_events e JOIN users u ON u.id=e.actor_user_id
    WHERE e.portfolio_id=? ORDER BY e.id`, [id]);
  return { ...dto(row), can_review: user.role === 'sekolah' && row.revision_number>0 && row.status_verifikasi === 'pending',
    history: history.map(event => {
      const { evidence_path, image_path, ...snapshot } = event.submission_snapshot || {};
      return { ...event, submission_snapshot: snapshot, has_evidence: Boolean(evidence_path), evidence_type: evidence_path?.split('.').pop() || null };
    }) };
}
async function submit(userId, id, body, file) {
  const title = v.text(body.title, 'Judul karya');
  const deskripsi = v.text(body.deskripsi, 'Penjelasan karya dan peran Anda', 5000);
  const skillId = v.id(body.skillId);
  const url = projectUrl(body.projectUrl);
  const ext = file && files.extension(file.buffer);
  if (file && !ext) throw v.problem(400, 'Bukti harus berupa PDF, JPG, atau PNG yang valid.');
  let written, saved = false;
  try {
    return await v.transaction(pool, async db => {
      const [[owner]] = await db.execute('SELECT id FROM students WHERE user_id=? FOR UPDATE', [userId]);
      const user = await getIdentity(userId, db);
      requireAccess(user, 'siswa');
      if (!owner) throw v.problem(403, 'Profil siswa tidak ditemukan.');
      const existing = id ? await getPortfolio(id, db, true) : null;
      if (existing) {
        await checkReader(user, existing, db);
        if (!/^(0|[1-9]\d*)$/.test(String(body.version)) || !Number.isSafeInteger(Number(body.version))) throw v.problem(400, 'Versi pengajuan wajib diisi.');
        if (existing.revision_number !== Number(body.version)) throw v.problem(409, 'Versi karya berubah. Muat ulang sebelum mengajukan perbaikan.');
        if (existing.revision_number>0 && !['pending', 'revision'].includes(existing.status_verifikasi)) throw v.problem(409, 'Karya sudah diputuskan. Buat karya baru untuk bukti berikutnya.');
      }
      const [[skill]] = await db.execute('SELECT id FROM skills WHERE id=?', [skillId]);
      if (!skill) throw v.problem(400, 'Pilih keterampilan dari kamus yang tersedia.');
      let evidence = existing?.evidence_path || null;
      if (file) {
        written = randomUUID() + '.' + ext;
        await fs.mkdir(privateDir, { recursive: true });
        await fs.writeFile(path.join(privateDir, written), file.buffer, { flag: 'wx' });
        saved = true;
        evidence = written;
      }
      if (!evidence && !url) throw v.problem(400, 'Sertakan foto/PDF bukti karya atau tautan proyek.');
      const version = (existing?.revision_number || 0) + 1;
      let portfolioId = id;
      if (existing) {
        await db.execute(`UPDATE portfolios SET title=?,deskripsi=?,skill_id=?,project_url=?,evidence_path=?,revision_number=?,
          status_verifikasi='pending',catatan_guru=NULL,assessed_proficiency=NULL,reviewed_by=NULL,reviewed_at=NULL WHERE id=?`, [title, deskripsi, skillId, url, evidence, version, id]);
      } else {
        const [result] = await db.execute(`INSERT INTO portfolios (siswa_id,skill_id,title,deskripsi,project_url,evidence_path,revision_number)
          VALUES (?,?,?,?,?,?,?)`, [owner.id, skillId, title, deskripsi, url, evidence, version]);
        portfolioId = result.insertId;
      }
      const snapshot = { title, deskripsi, skill_id: skillId, project_url: url, evidence_path: evidence };
      await db.execute(`INSERT INTO portfolio_events (portfolio_id,revision_number,actor_user_id,action,submission_snapshot)
        VALUES (?,?,?,?,?)`, [portfolioId, version, userId, existing ? 'resubmitted' : 'submitted', JSON.stringify(snapshot)]);
      return { id: portfolioId, revision_number: version, status_verifikasi: 'pending' };
    });
  } catch (error) {
    if (saved) await fs.unlink(path.join(privateDir, written)).catch(() => {});
    throw error;
  }
}
async function review(userId, id, body) {
  if (!['approved', 'revision', 'rejected'].includes(body.status)) throw v.problem(400, 'Keputusan portofolio tidak valid.');
  const note = v.text(body.note, 'Catatan pemeriksaan', 2000);
  const version = v.id(body.version);
  const score = body.proficiency;
  if (body.status === 'approved' && (!Number.isInteger(score) || score<1 || score>100)) throw v.problem(400, 'Nilai keterampilan dari guru harus bilangan bulat 1–100.');
  const target = await getPortfolio(id);
  return v.transaction(pool, async db => {
    // Satu kunci siswa menserialkan keputusan untuk beberapa karya/skill milik siswa yang sama.
    await db.execute('SELECT id FROM students WHERE id=? FOR UPDATE', [target.siswa_id]);
    const user = await getIdentity(userId, db);
    requireAccess(user, 'sekolah');
    const row = await getPortfolio(id, db, true);
    await checkReader(user, row, db);
    if (row.revision_number !== version || row.status_verifikasi !== 'pending') throw v.problem(409, 'Karya sudah diperbarui atau diputuskan. Muat ulang sebelum memeriksa.');
    const assessed = body.status === 'approved' ? score : null;
    await db.execute(`UPDATE portfolios SET status_verifikasi=?,catatan_guru=?,assessed_proficiency=?,reviewed_by=?,reviewed_at=CURRENT_TIMESTAMP WHERE id=?`, [body.status, note, assessed, userId, id]);
    await db.execute(`INSERT INTO portfolio_events (portfolio_id,revision_number,actor_user_id,action,note,submission_snapshot)
      VALUES (?,?,?,?,?,?)`, [id, version, userId, body.status, note, JSON.stringify({ proficiency: assessed })]);
    if (assessed !== null) {
      const [[best]] = await db.execute(`SELECT MAX(assessed_proficiency) AS score FROM portfolios
        WHERE siswa_id=? AND skill_id=? AND status_verifikasi='approved' AND revision_number>0 AND reviewed_by IS NOT NULL`, [row.siswa_id, row.skill_id]);
      await db.execute(`INSERT INTO student_skills (siswa_id,skill_id,proficiency,is_validated,validated_at) VALUES (?,?,?,TRUE,CURRENT_TIMESTAMP)
        ON DUPLICATE KEY UPDATE proficiency=?,is_validated=TRUE,validated_at=CURRENT_TIMESTAMP`, [row.siswa_id, row.skill_id, best.score, best.score]);
    }
    return { id, status_verifikasi: body.status, assessed_proficiency: assessed };
  });
}
async function evidence(user, id, eventId) {
  const row = await getPortfolio(id);
  await checkReader(user, row);
  let file = row.evidence_path;
  if (eventId) {
    const [[event]] = await pool.execute('SELECT submission_snapshot FROM portfolio_events WHERE portfolio_id=? AND id=?', [id, v.id(eventId)]);
    file = event?.submission_snapshot?.evidence_path;
  }
  if (!file || !files.fileNamePattern.test(file)) throw v.problem(404, 'Bukti karya tidak ditemukan.');
  return { path: path.join(privateDir, file), extension: file.split('.').pop() };
}

module.exports = { requireAccess, skills, studentSkills, mine, queue, detail, submit, review, evidence };
