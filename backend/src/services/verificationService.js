const { pool } = require('../config/db');
const { getIdentity } = require('./identityService');
const v = require('../utils/validation');

const caseQuery = `SELECT r.*, s.nama_sekolah, s.submitted_by AS school_owner, s.npsn, s.alamat AS school_address,
  s.is_active AS institution_active, i.nama_industri, i.nomor_registrasi, i.sektor_industri, i.kota_domisili,
  st.nama_lengkap AS student_name, st.sekolah_id AS student_school,
  st.jurusan AS student_major, st.kelas AS student_class, st.nisn AS student_nisn,
  related_school.nama_sekolah AS related_school,
  t.nama_lengkap AS teacher_name, m.sekolah_id AS teacher_school, m.posisi,
  m.teacher_id, u.email AS applicant_email, i.is_active AS industry_active
  FROM verification_requests r
  JOIN users u ON u.id=r.applicant_user_id
  LEFT JOIN schools s ON s.id=r.sekolah_id
  LEFT JOIN industries i ON i.id=r.industri_id
  LEFT JOIN students st ON st.id=r.siswa_id
  LEFT JOIN school_memberships m ON m.id=r.membership_id
  LEFT JOIN teachers t ON t.id=m.teacher_id
  LEFT JOIN schools related_school ON related_school.id=COALESCE(st.sekolah_id,m.sekolah_id)`;

async function getCase(requestId, db = pool) {
  const [[request]] = await db.execute(caseQuery + ' WHERE r.id=?', [requestId]);
  if (!request) throw v.problem(404, 'Pengajuan tidak ditemukan.');
  request.kind = request.sekolah_id ? 'school' : request.industri_id ? 'industry' : request.membership_id ? 'teacher' : 'student';
  request.title = request.nama_sekolah || request.nama_industri || request.teacher_name || request.student_name || 'Profil belum lengkap';
  return request;
}

function canReview(user, request) {
  if (!user?.is_active || user.id === request.applicant_user_id) return false;
  if (user.role === 'admin') return ['school', 'industry'].includes(request.kind);
  if (user.role !== 'sekolah' || !user.canUseApp) return false;
  const schoolId = user.profile.sekolah_id;
  return request.kind === 'student' ? request.student_school === schoolId
    : request.kind === 'teacher' && request.teacher_school === schoolId && user.posisi === 'koordinator' && request.posisi === 'guru';
}

async function detail(user, requestId) {
  const request = await getCase(requestId);
  if (user.id !== request.applicant_user_id && !canReview(user, request)) throw v.problem(403, 'Pengajuan ini bukan kewenangan Anda.');
  const [history] = await pool.execute(`SELECT e.id,e.action,e.note,e.submission_snapshot,e.created_at,
    u.email AS actor_email FROM verification_events e JOIN users u ON u.id=e.actor_user_id
    WHERE e.request_id=? ORDER BY e.id`, [requestId]);
  const { evidence_path, ...data } = request;
  return { ...data, has_evidence: Boolean(evidence_path), can_review: canReview(user, request), history };
}

async function queue(user, status, offset = 0) {
  if (!['pending', 'approved', 'needs_revision', 'rejected'].includes(status)) throw v.problem(400, 'Status antrean tidak valid.');
  let where, params;
  if (user.role === 'admin') {
    where = '(r.sekolah_id IS NOT NULL OR r.industri_id IS NOT NULL)';
    params = [status, user.id];
  } else if (user.role === 'sekolah' && user.canUseApp) {
    where = user.posisi === 'koordinator' ? '(st.sekolah_id=? OR (m.sekolah_id=? AND m.posisi=\'guru\'))' : 'st.sekolah_id=?';
    params = user.posisi === 'koordinator' ? [status, user.id, user.profile.sekolah_id, user.profile.sekolah_id] : [status, user.id, user.profile.sekolah_id];
  } else throw v.problem(403, 'Anda tidak memiliki akses antrean pemeriksaan.');
  // LIMIT menggunakan bilangan yang telah divalidasi, tidak berasal dari string SQL pengguna.
  const [rows] = await pool.execute(caseQuery + ` WHERE r.status=? AND r.applicant_user_id<>? AND ${where}
    ORDER BY r.submitted_at,r.id LIMIT 30 OFFSET ${offset}`, params);
  return rows.map(({ evidence_path, ...r }) => ({ id: r.id, status: r.status,
    title: r.nama_sekolah || r.nama_industri || r.teacher_name || r.student_name || 'Profil belum lengkap',
    kind: r.sekolah_id ? 'school' : r.industri_id ? 'industry' : r.membership_id ? 'teacher' : 'student',
    applicant_email: r.applicant_email, has_evidence: Boolean(evidence_path) }));
}

async function review(userId, requestId, body) {
  if (!['approved', 'needs_revision', 'rejected'].includes(body.status)) throw v.problem(400, 'Keputusan tidak valid.');
  const note = v.text(body.note, 'Catatan pemeriksaan', 2000);
  return v.transaction(pool, async db => {
    await db.execute('SELECT id FROM verification_requests WHERE id=? FOR UPDATE', [requestId]);
    const user = await getIdentity(userId, db);
    const request = await getCase(requestId, db);
    if (!canReview(user, request)) throw v.problem(403, 'Pengajuan ini bukan kewenangan Anda.');
    if (request.status !== 'pending') throw v.problem(409, 'Pengajuan sudah diproses atau belum diajukan ulang.');
    if (body.status === 'approved' && ['school', 'industry'].includes(request.kind) && !request.evidence_path) {
      throw v.problem(400, 'Periksa bukti institusi dan kewenangan perwakilan sebelum menyetujui.');
    }
    if (body.status === 'approved' && ['school', 'industry'].includes(request.kind)) {
      const [[submission]] = await db.execute(`SELECT submission_snapshot FROM verification_events
        WHERE request_id=? AND JSON_CONTAINS_PATH(submission_snapshot,'one','$.nama') ORDER BY id DESC LIMIT 1`, [requestId]);
      if (!submission?.submission_snapshot?.nama || !submission.submission_snapshot.contactPhone
        || (request.kind === 'school' ? !/^\d{8}$/.test(request.npsn || '') || !request.school_address
          : !request.nomor_registrasi || !request.sektor_industri || !request.kota_domisili)) {
        throw v.problem(400, 'Pengaju harus melengkapi identitas institusi, nama dan telepon perwakilan sebelum disetujui.');
      }
    }
    let membership;
    if (request.kind === 'school' && body.status === 'approved') {
      [[membership]] = await db.execute(`SELECT m.id,t.nama_lengkap,r.id AS request_id,r.status
        FROM school_memberships m JOIN teachers t ON t.id=m.teacher_id
        JOIN verification_requests r ON r.membership_id=m.id
        WHERE m.sekolah_id=? AND t.user_id=? FOR UPDATE`, [request.sekolah_id, request.applicant_user_id]);
      if (!membership?.nama_lengkap || membership.status !== 'pending') {
        throw v.problem(400, 'Perwakilan awal harus melengkapi nama dan pengajuan keanggotaan yang masih pending.');
      }
    }
    await db.execute('UPDATE verification_requests SET status=? WHERE id=?', [body.status, requestId]);
    await db.execute('INSERT INTO verification_events (request_id,actor_user_id,action,note) VALUES (?,?,?,?)', [requestId, userId, body.status, note]);
    if (membership) {
      await db.execute("UPDATE school_memberships SET posisi='koordinator' WHERE id=?", [membership.id]);
      await db.execute("UPDATE verification_requests SET status='approved' WHERE id=?", [membership.request_id]);
      await db.execute(`INSERT INTO verification_events (request_id,actor_user_id,action,note)
        VALUES (?,?,'approved',?)`, [membership.request_id, userId, 'Perwakilan awal disetujui sebagai koordinator. ' + note]);
    }
    return { id: requestId, status: body.status };
  });
}

async function resubmit(userId, requestId, body) {
  return v.transaction(pool, async db => {
    await db.execute('SELECT id FROM verification_requests WHERE id=? FOR UPDATE', [requestId]);
    const request = await getCase(requestId, db);
    if (request.applicant_user_id !== userId) throw v.problem(403, 'Pengajuan bukan milik Anda.');
    if (!['needs_revision', 'pending'].includes(request.status)) throw v.problem(409, 'Hanya pengajuan pending atau perlu revisi yang dapat diperbaiki. Penolakan final harus dikonsultasikan ke pengelola.');
    const nama = v.text(body.nama, 'Nama lengkap');
    const snapshot = { nama };
    if (request.kind === 'student') {
      snapshot.jurusan = v.text(body.jurusan, 'Jurusan', 100);
      snapshot.kelas = v.text(body.kelas, 'Kelas', 20);
      snapshot.nisn = v.text(body.nisn, 'NISN', 25, false);
      await db.execute('UPDATE students SET nama_lengkap=?,jurusan=?,kelas=?,nisn=? WHERE id=?', [nama, snapshot.jurusan, snapshot.kelas, snapshot.nisn, request.siswa_id]);
    } else if (request.kind === 'teacher') {
      await db.execute('UPDATE teachers SET nama_lengkap=? WHERE id=?', [nama, request.teacher_id]);
    } else {
      snapshot.contactPhone = v.text(body.contactPhone, 'Telepon perwakilan', 30);
      if (request.kind === 'school') {
        snapshot.schoolName = v.text(body.schoolName, 'Nama sekolah');
        snapshot.npsn = v.text(body.npsn, 'NPSN', 20);
        if (!/^\d{8}$/.test(snapshot.npsn)) throw v.problem(400, 'NPSN harus berisi 8 angka.');
        snapshot.alamat = v.text(body.alamat, 'Alamat sekolah', 1000);
        await db.execute('UPDATE schools SET nama_sekolah=?,npsn=?,alamat=? WHERE id=?', [snapshot.schoolName, snapshot.npsn, snapshot.alamat, request.sekolah_id]);
        await db.execute('UPDATE teachers SET nama_lengkap=? WHERE user_id=?', [nama, userId]);
      } else {
        snapshot.companyName = v.text(body.companyName, 'Nama industri');
        snapshot.sektor = v.text(body.sektor, 'Sektor', 100);
        snapshot.kota = v.text(body.kota, 'Kota', 100);
        snapshot.nomorRegistrasi = v.text(body.nomorRegistrasi, 'Nomor registrasi', 64).toUpperCase();
        await db.execute('UPDATE industries SET nama_industri=?,sektor_industri=?,kota_domisili=?,nomor_registrasi=? WHERE id=?', [snapshot.companyName, snapshot.sektor, snapshot.kota, snapshot.nomorRegistrasi, request.industri_id]);
      }
      if (!request.evidence_path) throw v.problem(400, 'Unggah bukti institusi terlebih dahulu.');
    }
    await db.execute("UPDATE verification_requests SET status='pending',submitted_at=CURRENT_TIMESTAMP WHERE id=?", [requestId]);
    await db.execute(`INSERT INTO verification_events (request_id,actor_user_id,action,submission_snapshot)
      VALUES (?,?,'resubmitted',?)`, [requestId, userId, JSON.stringify(snapshot)]);
    return { id: requestId, status: 'pending' };
  });
}

async function setActivity(userId, requestId, body) {
  if (typeof body.active !== 'boolean') throw v.problem(400, 'Status aktif harus boolean.');
  const note = v.text(body.note, 'Alasan perubahan akses', 2000);
  return v.transaction(pool, async db => {
    const user = await getIdentity(userId, db);
    if (user?.role !== 'admin' || !user.is_active) throw v.problem(403, 'Hanya admin dapat mengubah akses institusi.');
    await db.execute('SELECT id FROM verification_requests WHERE id=? FOR UPDATE', [requestId]);
    const request = await getCase(requestId, db);
    if (!['school', 'industry'].includes(request.kind) || request.status !== 'approved') throw v.problem(400, 'Pengajuan institusi harus sudah disetujui.');
    const table = request.kind === 'school' ? 'schools' : 'industries';
    const targetId = request.sekolah_id || request.industri_id;
    await db.execute(`UPDATE ${table} SET is_active=? WHERE id=?`, [body.active, targetId]);
    await db.execute('INSERT INTO verification_events (request_id,actor_user_id,action,note) VALUES (?,?,?,?)', [requestId, userId, body.active ? 'reactivated' : 'suspended', note]);
    return { id: requestId, active: body.active };
  });
}

module.exports = { getCase, canReview, detail, queue, review, resubmit, setActivity };
