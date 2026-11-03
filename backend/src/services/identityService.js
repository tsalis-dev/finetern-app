const { pool } = require('../config/db');

async function getIdentity(userId, db = pool) {
  const [[account]] = await db.execute('SELECT id, email, role, is_active FROM users WHERE id=?', [userId]);
  if (!account) return null;
  const user = { ...account, is_active: Boolean(account.is_active), profileId: null, profile: {}, verification: [], canUseApp: false };
  if (account.role === 'admin') {
    user.nama = 'Admin Finetern';
    user.canUseApp = user.is_active;
    return user;
  }
  let rows;
  if (account.role === 'siswa') {
    [rows] = await db.execute(`SELECT st.*, s.nama_sekolah AS sekolah, s.is_active AS school_active,
      sr.status AS school_status FROM students st JOIN schools s ON s.id=st.sekolah_id
      LEFT JOIN verification_requests sr ON sr.sekolah_id=s.id WHERE st.user_id=?`, [userId]);
  } else if (account.role === 'sekolah') {
    [rows] = await db.execute(`SELECT t.id, t.nama_lengkap, m.id AS membership_id, m.sekolah_id, m.posisi,
      m.is_active AS membership_active, s.nama_sekolah AS sekolah, s.akreditasi, s.alamat,
      s.is_active AS school_active, sr.status AS school_status
      FROM teachers t LEFT JOIN school_memberships m ON m.teacher_id=t.id
      LEFT JOIN schools s ON s.id=m.sekolah_id
      LEFT JOIN verification_requests sr ON sr.sekolah_id=s.id WHERE t.user_id=?`, [userId]);
  } else {
    [rows] = await db.execute('SELECT * FROM industries WHERE user_id=?', [userId]);
  }
  const profile = rows[0];
  if (!profile) return user;
  user.profileId = profile.id;
  user.profile = profile;
  user.nama = profile.nama_lengkap || profile.nama_industri || 'Lengkapi profil';
  user.sekolah = profile.sekolah;
  user.jurusan = profile.jurusan;
  user.kelas = profile.kelas;
  user.posisi = profile.posisi;
  const [requests] = await db.execute(`SELECT r.id, r.sekolah_id, r.industri_id, r.membership_id, r.siswa_id,
    r.status, (r.evidence_path IS NOT NULL) AS has_evidence, r.updated_at,
    (SELECT e.note FROM verification_events e WHERE e.request_id=r.id AND e.action IN ('approved','needs_revision','rejected')
      ORDER BY e.id DESC LIMIT 1) AS note
    FROM verification_requests r WHERE r.applicant_user_id=? ORDER BY r.id`, [userId]);
  user.verification = requests;
  const target = requests.find(r => account.role === 'siswa' ? r.siswa_id === profile.id
    : account.role === 'sekolah' ? r.membership_id === profile.membership_id : r.industri_id === profile.id);
  const activeProfile = account.role === 'siswa' ? profile.school_active && profile.school_status === 'approved'
    : account.role === 'sekolah' ? profile.school_active && profile.school_status === 'approved' && profile.membership_active && profile.nama_lengkap
      : profile.is_active;
  user.canUseApp = Boolean(user.is_active && activeProfile && target?.status === 'approved');
  user.accessMessage = user.canUseApp ? 'Akun sudah terverifikasi.'
    : account.role !== 'industri' && !profile.school_active ? 'Sekolah tidak aktif. Hubungi pengelola.'
      : account.role !== 'industri' && profile.school_status !== 'approved' ? 'Menunggu verifikasi institusi sekolah oleh admin Finetern.'
        : account.role === 'sekolah' && !profile.membership_active ? 'Keanggotaan sekolah dinonaktifkan.'
          : account.role === 'industri' && !profile.is_active ? 'Akses industri dinonaktifkan. Hubungi pengelola.'
            : 'Ikuti status dan catatan pengajuan di bawah untuk menyelesaikan verifikasi.';
  return user;
}

module.exports = { getIdentity };
