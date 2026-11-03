const { pool } = require('../config/db');
const { getIdentity } = require('./identityService');
const { studentSkills } = require('./portfolioService');
const { calculateMatch } = require('../utils/matching');
const v = require('../utils/validation');

const fields = `v.*,DATE_FORMAT(v.tenggat_waktu,'%Y-%m-%d') AS deadline,
  i.nama_industri,i.sektor_industri,i.kota_domisili,i.user_id AS publisher_id,i.is_active AS company_active,
  u.is_active AS publisher_active,iv.status AS company_status,
  (SELECT COUNT(*) FROM applications a WHERE a.lowongan_id=v.id AND a.status_lamaran='accepted') AS accepted_count`;
const joins = `FROM internship_vacancies v JOIN industries i ON i.id=v.industri_id
  JOIN users u ON u.id=i.user_id LEFT JOIN verification_requests iv ON iv.industri_id=i.id`;
const todayJakarta = () => new Date(Date.now()+7*60*60*1000).toISOString().slice(0,10);
function requireAccess(user, role) {
  if (!user?.is_active || !user.canUseApp || (role ? user.role !== role : !['siswa','industri','sekolah'].includes(user.role))) throw v.problem(403, 'Akun dan institusi harus aktif serta terverifikasi untuk mengakses rekrutmen.');
}
function page(query) {
  const offset = Number(query.offset || 0);
  if (!Number.isSafeInteger(offset) || offset<0 || offset>100000) throw v.problem(400, 'Halaman tidak valid.');
  return offset;
}
function whole(value, label, min, max) {
  if (!Number.isSafeInteger(value) || value<min || value>max) throw v.problem(400, `${label} harus bilangan bulat ${min}–${max}.`);
  return value;
}
function version(value) { return whole(value, 'Versi data', 0, 2147483647); }
function deadline(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw v.problem(400, 'Tanggal batas lamaran harus YYYY-MM-DD.');
  const parsed = new Date(value+'T00:00:00Z');
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0,10) !== value || value<todayJakarta()) throw v.problem(400, 'Batas lamaran harus berupa tanggal valid hari ini atau setelahnya (WIB).');
  return value;
}
function companyAvailable(row) { return Boolean(row.company_active && row.publisher_active && row.company_status === 'approved'); }
function dto(row) {
  return { id: row.id, industri_id: row.industri_id, title: row.title, deskripsi: row.deskripsi,
    nama_industri: row.nama_industri, sektor_industri: row.sektor_industri, kota_domisili: row.kota_domisili,
    lokasi: row.lokasi, tipe_kerja: row.tipe_kerja, uang_saku: row.uang_saku, kuota: row.kuota,
    accepted_count: row.accepted_count, remaining_quota: Math.max(0,row.kuota-row.accepted_count),
    status_aktif: Boolean(row.status_aktif), tenggat_waktu: row.deadline, revision_number: row.revision_number,
    legacy: row.revision_number === 0, created_at: row.created_at, updated_at: row.updated_at };
}
function eligibility(row, match, applicationId) {
  const reason = applicationId ? 'Kamu sudah melamar lowongan ini.' : row.revision_number === 0 ? 'Lowongan lama belum dilengkapi.'
    : !companyAvailable(row) ? 'Akun industri atau institusinya tidak aktif.' : !row.status_aktif ? 'Lowongan sudah ditutup.'
      : !row.deadline || row.deadline<todayJakarta() ? 'Batas lamaran sudah lewat.' : row.accepted_count>=row.kuota ? 'Kuota penerimaan sudah penuh.'
        : !match.valid ? 'Syarat keterampilan lowongan belum lengkap.' : !match.mandatory_met ? 'Masih ada keterampilan wajib yang belum memenuhi nilai minimum.'
          : !match.eligible ? 'Skor kecocokan belum mencapai 80%.' : null;
  return { ...match, can_apply: !reason, reason: reason || 'Seluruh syarat lamaran terpenuhi.', application_id: applicationId || null };
}
async function getVacancy(id, db = pool, lock = false) {
  if (lock) await db.execute('SELECT id FROM internship_vacancies WHERE id=? FOR UPDATE', [id]);
  const [[row]] = await db.execute(`SELECT ${fields} ${joins} WHERE v.id=?`, [id]);
  if (!row) throw v.problem(404, 'Lowongan tidak ditemukan.');
  return row;
}
async function requirements(id, db = pool) {
  const [rows] = await db.execute(`SELECT r.skill_id,k.nama_skill,k.kategori,r.importance,r.weight,r.min_proficiency
    FROM vacancy_skills r JOIN skills k ON k.id=r.skill_id WHERE r.lowongan_id=? ORDER BY r.id`, [id]);
  return rows;
}
async function attachRequirements(rows) {
  if (!rows.length) return [];
  const [all] = await pool.execute(`SELECT r.lowongan_id,r.skill_id,k.nama_skill,k.kategori,r.importance,r.weight,r.min_proficiency
    FROM vacancy_skills r JOIN skills k ON k.id=r.skill_id WHERE r.lowongan_id IN (${rows.map(()=>'?').join(',')}) ORDER BY r.id`, rows.map(row=>row.id));
  return rows.map(row => ({ row, requirements: all.filter(item=>item.lowongan_id === row.id).map(({ lowongan_id, ...item })=>item) }));
}
async function skills(user) {
  requireAccess(user);
  const [rows] = await pool.query('SELECT id,nama_skill,kategori FROM skills ORDER BY kategori,nama_skill');
  return rows;
}
async function catalog(user, query) {
  requireAccess(user,'siswa');
  const offset = page(query), search = v.text(query.q || '', 'Pencarian', 100, false) || '';
  const [rows] = await pool.execute(`SELECT ${fields},(SELECT a.id FROM applications a WHERE a.siswa_id=? AND a.lowongan_id=v.id LIMIT 1) AS application_id
    ${joins} WHERE v.revision_number>0 AND v.status_aktif=1 AND v.tenggat_waktu>=?
      AND i.is_active=1 AND u.is_active=1 AND iv.status='approved'
      AND (v.title LIKE ? OR v.lokasi LIKE ? OR i.nama_industri LIKE ?)
    ORDER BY v.created_at DESC,v.id DESC LIMIT 20 OFFSET ${offset}`, [user.profileId,todayJakarta(),`%${search}%`,`%${search}%`,`%${search}%`]);
  const scores = await studentSkills(user);
  const items = (await attachRequirements(rows)).map(({ row, requirements: req }) => ({ ...dto(row), requirements: req, matching: eligibility(row,calculateMatch(req,scores),row.application_id) }));
  return { items };
}
async function mine(user, query) {
  requireAccess(user,'industri');
  const offset = page(query);
  const [rows] = await pool.execute(`SELECT ${fields} ${joins} WHERE v.industri_id=? ORDER BY v.created_at DESC,v.id DESC LIMIT 20 OFFSET ${offset}`, [user.profileId]);
  const [[summary]] = await pool.execute(`SELECT COUNT(*) AS total,COALESCE(SUM(status_aktif=1 AND revision_number>0 AND tenggat_waktu>=?),0) AS active
    FROM internship_vacancies WHERE industri_id=?`, [todayJakarta(),user.profileId]);
  return { items: (await attachRequirements(rows)).map(({ row, requirements: req })=>({ ...dto(row), requirements: req })), summary: { total:Number(summary.total), active:Number(summary.active) } };
}
async function detail(user, id) {
  requireAccess(user);
  const row = await getVacancy(id), req = await requirements(id);
  if (user.role === 'industri') {
    if (row.industri_id !== user.profileId) throw v.problem(403,'Lowongan bukan milik industri Anda.');
    const [[count]] = await pool.execute('SELECT COUNT(*) AS total FROM applications WHERE lowongan_id=?',[id]);
    return { ...dto(row), requirements:req, can_edit: count.total === 0 };
  }
  requireAccess(user,'siswa');
  if (row.revision_number === 0 || !companyAvailable(row)) throw v.problem(404,'Lowongan tidak tersedia.');
  const [[application]] = await pool.execute('SELECT id FROM applications WHERE lowongan_id=? AND siswa_id=?',[id,user.profileId]);
  return { ...dto(row), requirements:req, matching:eligibility(row,calculateMatch(req,await studentSkills(user)),application?.id) };
}
async function save(userId, id, body) {
  const title = v.text(body.title,'Judul lowongan'), description = v.text(body.deskripsi,'Deskripsi lowongan',5000);
  const location = v.text(body.location,'Lokasi magang');
  if (!['onsite','hybrid','remote'].includes(body.workMode)) throw v.problem(400,'Pilih sistem kerja onsite, hybrid, atau remote.');
  const allowance = body.allowance == null ? null : whole(body.allowance,'Uang saku per bulan',0,100000000);
  const quota = whole(body.quota,'Kuota',1,1000), end = deadline(body.deadline);
  if (!Array.isArray(body.requirements) || !body.requirements.length || body.requirements.length>20) throw v.problem(400,'Isi 1–20 syarat keterampilan.');
  const req = body.requirements.map(item => {
    if (!item || !['wajib','nilai_tambah'].includes(item.importance)) throw v.problem(400,'Jenis syarat keterampilan tidak valid.');
    return { skillId:v.id(item.skillId), importance:item.importance, weight:whole(item.weight,'Bobot',1,100), min:whole(item.minProficiency,'Nilai minimum',1,100) };
  });
  if (new Set(req.map(item=>item.skillId)).size !== req.length) throw v.problem(400,'Keterampilan pada satu lowongan tidak boleh berulang.');
  return v.transaction(pool,async db => {
    const row = id ? await getVacancy(id,db,true) : null;
    const user = await getIdentity(userId,db); requireAccess(user,'industri');
    if (row) {
      if (row.industri_id !== user.profileId) throw v.problem(403,'Lowongan bukan milik industri Anda.');
      if (row.revision_number !== version(body.version)) throw v.problem(409,'Lowongan sudah berubah. Muat ulang sebelum menyimpan.');
      const [[count]] = await db.execute('SELECT COUNT(*) AS total FROM applications WHERE lowongan_id=?',[id]);
      if (count.total) throw v.problem(409,'Lowongan yang sudah menerima lamaran hanya dapat dibuka atau ditutup. Buat lowongan baru untuk syarat berbeda.');
    }
    const [dictionary] = await db.execute(`SELECT id FROM skills WHERE id IN (${req.map(()=>'?').join(',')})`,req.map(item=>item.skillId));
    if (dictionary.length !== req.length) throw v.problem(400,'Pilih keterampilan dari kamus yang tersedia.');
    const next = (row?.revision_number || 0)+1;
    let vacancyId = id;
    if (row) {
      await db.execute(`UPDATE internship_vacancies SET title=?,deskripsi=?,lokasi=?,tipe_kerja=?,uang_saku=?,kuota=?,tenggat_waktu=?,revision_number=? WHERE id=?`,[title,description,location,body.workMode,allowance,quota,end,next,id]);
      await db.execute('DELETE FROM vacancy_skills WHERE lowongan_id=?',[id]);
    } else {
      const [result] = await db.execute(`INSERT INTO internship_vacancies(industri_id,title,deskripsi,lokasi,tipe_kerja,uang_saku,kuota,tenggat_waktu,revision_number)
        VALUES(?,?,?,?,?,?,?,?,1)`,[user.profileId,title,description,location,body.workMode,allowance,quota,end]);
      vacancyId = result.insertId;
    }
    for (const item of req) await db.execute('INSERT INTO vacancy_skills(lowongan_id,skill_id,importance,weight,min_proficiency) VALUES(?,?,?,?,?)',[vacancyId,item.skillId,item.importance,item.weight,item.min]);
    return { id:vacancyId, revision_number:next };
  });
}
async function activity(userId,id,body) {
  if (typeof body.active !== 'boolean') throw v.problem(400,'Status aktif harus boolean.');
  return v.transaction(pool,async db => {
    const row = await getVacancy(id,db,true), user = await getIdentity(userId,db); requireAccess(user,'industri');
    if (row.industri_id !== user.profileId) throw v.problem(403,'Lowongan bukan milik industri Anda.');
    if (row.revision_number !== version(body.version)) throw v.problem(409,'Lowongan sudah berubah. Muat ulang.');
    if (body.active && (row.revision_number === 0 || !row.deadline || row.deadline<todayJakarta() || !calculateMatch(await requirements(id,db),[]).valid)) throw v.problem(409,'Lengkapi lowongan dengan tenggat dan syarat yang valid sebelum membukanya.');
    const next = row.revision_number ? row.revision_number+1 : 0;
    await db.execute('UPDATE internship_vacancies SET status_aktif=?,revision_number=? WHERE id=?',[body.active,next,id]);
    return { id,status_aktif:body.active,revision_number:next };
  });
}

module.exports = { requireAccess,page,version,todayJakarta,getVacancy,requirements,dto,eligibility,skills,catalog,mine,detail,save,activity };
