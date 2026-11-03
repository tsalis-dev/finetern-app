const path = require('node:path');
const { pool } = require('../config/db');
const { getIdentity } = require('./identityService');
const portfolios = require('./portfolioService');
const vacancies = require('./vacancyService');
const { calculateMatch } = require('../utils/matching');
const { fileNamePattern } = require('../utils/evidenceFiles');
const v = require('../utils/validation');

const CONSENT_VERSION = 'recruitment-v1';
const statuses = ['pending','reviewed','accepted','rejected','withdrawn'];
const activeStatuses = ['pending','reviewed','accepted'];
const select = `SELECT a.*,v.industri_id,v.title AS current_title,i.nama_industri AS current_company,
  s.user_id AS student_user_id,s.sekolah_id,
  (su.is_active=1 AND su.role='siswa' AND sr.status='approved' AND sc.is_active=1 AND scr.status='approved') AS candidate_active
  FROM applications a JOIN internship_vacancies v ON v.id=a.lowongan_id JOIN industries i ON i.id=v.industri_id
  JOIN students s ON s.id=a.siswa_id JOIN users su ON su.id=s.user_id JOIN schools sc ON sc.id=s.sekolah_id
  LEFT JOIN verification_requests sr ON sr.siswa_id=s.id LEFT JOIN verification_requests scr ON scr.sekolah_id=sc.id`;

async function getApplication(id,db=pool,lock=false) {
  if (lock) await db.execute('SELECT id FROM applications WHERE id=? FOR UPDATE',[id]);
  const [[row]] = await db.execute(select+' WHERE a.id=?',[id]);
  if (!row) throw v.problem(404,'Lamaran tidak ditemukan.');
  return row;
}
function checkReader(user,row) {
  vacancies.requireAccess(user);
  const allowed = user.role === 'siswa' ? row.student_user_id === user.id
    : user.role === 'industri' ? row.industri_id === user.profileId
      : user.role === 'sekolah' && row.sekolah_id === user.profile.sekolah_id && row.candidate_active;
  if (!allowed) throw v.problem(403,'Lamaran bukan kewenangan Anda.');
}
function grantAvailable(row) {
  return Boolean(row.revision_number>0 && row.consented_at && !row.consent_revoked_at && row.candidate_active && activeStatuses.includes(row.status_lamaran));
}
function dto(user,row) {
  const own = user.role === 'siswa';
  const shared = own || (user.role === 'industri' && grantAvailable(row));
  const snapshot = row.submission_snapshot || {};
  return { id:row.id,lowongan_id:row.lowongan_id,status_lamaran:row.status_lamaran,revision_number:row.revision_number,
    match_rate:Number(row.match_rate),applied_at:row.applied_at,selection_note:row.selection_note,
    legacy:row.revision_number === 0,consented_at:row.consented_at,consent_revoked_at:row.consent_revoked_at,
    vacancy:snapshot.vacancy || { id:row.lowongan_id,title:row.current_title,nama_industri:row.current_company },
    profile:shared ? snapshot.profile || null : user.role === 'sekolah' && snapshot.profile ? { nama_lengkap:snapshot.profile.nama_lengkap,jurusan:snapshot.profile.jurusan,kelas:snapshot.profile.kelas,sekolah:snapshot.profile.sekolah } : null,
    matching:shared || user.role === 'sekolah' ? snapshot.matching || null : null,consent_version:snapshot.consent_version || null,
    can_view_evidence:shared && row.revision_number>0,
    can_review:user.role === 'industri' && row.revision_number>0 && ['pending','reviewed'].includes(row.status_lamaran),
    can_withdraw:own && row.revision_number>0 && activeStatuses.includes(row.status_lamaran) };
}
async function list(user,query,mode) {
  const role = mode === 'industry' ? 'industri' : mode === 'school' ? 'sekolah' : 'siswa';
  vacancies.requireAccess(user,role);
  const offset = vacancies.page(query);
  if (query.status && !statuses.includes(query.status)) throw v.problem(400,'Status lamaran tidak valid.');
  const scope = role === 'industri' ? 'v.industri_id=?' : role === 'sekolah' ? "s.sekolah_id=? AND su.is_active=1 AND sr.status='approved'" : 'a.siswa_id=?';
  const params = [role === 'sekolah' ? user.profile.sekolah_id : user.profileId];
  let filter = '';
  if (query.status) { filter += ' AND a.status_lamaran=?'; params.push(query.status); }
  if (query.vacancyId) { filter += ' AND a.lowongan_id=?'; params.push(v.id(query.vacancyId)); }
  const [rows] = await pool.execute(select+` WHERE ${scope}${filter} ORDER BY a.applied_at DESC,a.id DESC LIMIT 20 OFFSET ${offset}`,params);
  const summaryParams=[params[0]];
  if(query.vacancyId) summaryParams.push(v.id(query.vacancyId));
  const [[summary]] = await pool.execute(`SELECT COUNT(*) AS total,
    COALESCE(SUM(a.status_lamaran='pending'),0) AS pending,COALESCE(SUM(a.status_lamaran='reviewed'),0) AS reviewed,
    COALESCE(SUM(a.status_lamaran='accepted'),0) AS accepted
    FROM applications a JOIN internship_vacancies v ON v.id=a.lowongan_id JOIN students s ON s.id=a.siswa_id
    JOIN users su ON su.id=s.user_id LEFT JOIN verification_requests sr ON sr.siswa_id=s.id
    WHERE ${scope}${query.vacancyId ? ' AND a.lowongan_id=?' : ''}`,summaryParams);
  return { items:rows.map(row=>dto(user,row)),summary:Object.fromEntries(Object.entries(summary).map(([key,value])=>[key,Number(value)])) };
}
async function detail(user,id) {
  const row = await getApplication(id); checkReader(user,row);
  const data = dto(user,row);
  const [history] = await pool.execute('SELECT id,action,note,created_at FROM application_events WHERE application_id=? ORDER BY id',[id]);
  let shared = [];
  if (data.can_view_evidence) {
    const [rows] = await pool.execute(`SELECT ap.id,ap.portfolio_id,ap.revision_number,ap.portfolio_snapshot FROM application_portfolios ap
      JOIN portfolios p ON p.id=ap.portfolio_id WHERE ap.application_id=? AND p.status_verifikasi='approved'
      AND p.revision_number=ap.revision_number AND p.reviewed_by IS NOT NULL`,[id]);
    shared = rows.map(item => {
      const { evidence_path,...snapshot } = item.portfolio_snapshot;
      return { ...snapshot,id:item.id,portfolio_id:item.portfolio_id,revision_number:item.revision_number,has_evidence:Boolean(evidence_path),evidence_type:evidence_path?.split('.').pop() || null };
    });
  }
  return { ...data,history,shared_portfolios:shared };
}
async function apply(userId,vacancyId,body) {
  if (body.shareConsent !== true) throw v.problem(400,'Setujui pembagian profil dasar dan bukti karya terkait kepada industri tujuan sebelum melamar.');
  const expected = vacancies.version(body.version);
  try {
    return await v.transaction(pool,async db => {
      // Urutan sama dengan penilaian proyek: kunci siswa sebelum lowongan agar snapshot nilai konsisten.
      await db.execute('SELECT id FROM students WHERE user_id=? FOR UPDATE',[userId]);
      const vacancy = await vacancies.getVacancy(vacancyId,db,true);
      const user = await getIdentity(userId,db); vacancies.requireAccess(user,'siswa');
      if (vacancy.revision_number !== expected) throw v.problem(409,'Lowongan sudah berubah. Muat ulang dan periksa syaratnya sebelum melamar.');
      const [[previous]] = await db.execute('SELECT id FROM applications WHERE siswa_id=? AND lowongan_id=?',[user.profileId,vacancyId]);
      const requirements = await vacancies.requirements(vacancyId,db);
      const match = calculateMatch(requirements,await portfolios.studentSkills(user,db));
      const eligibility = vacancies.eligibility(vacancy,match,previous?.id);
      if (!eligibility.can_apply) throw v.problem(409,eligibility.reason);
      const snapshot = { vacancy:vacancies.dto(vacancy),profile:{ nama_lengkap:user.nama,sekolah:user.sekolah,jurusan:user.jurusan,kelas:user.kelas,email:user.email },matching:match,consent_version:CONSENT_VERSION };
      const [result] = await db.execute(`INSERT INTO applications(siswa_id,lowongan_id,match_rate,revision_number,submission_snapshot,consented_at)
        VALUES(?,?,?,1,?,CURRENT_TIMESTAMP)`,[user.profileId,vacancyId,match.match_rate,JSON.stringify(snapshot)]);
      const applicationId = result.insertId;
      // Satu karya dengan nilai terbaik per syarat; tidak membagikan seluruh portofolio atau unggahan mendatang.
      const [proofs] = await db.execute(`SELECT * FROM (
        SELECT p.id,p.skill_id,p.title,p.deskripsi,p.project_url,p.evidence_path,p.revision_number,p.assessed_proficiency,p.reviewed_at,k.nama_skill,
          ROW_NUMBER() OVER(PARTITION BY p.skill_id ORDER BY p.assessed_proficiency DESC,p.reviewed_at DESC,p.id DESC) AS rank_number
        FROM portfolios p JOIN skills k ON k.id=p.skill_id WHERE p.siswa_id=? AND p.status_verifikasi='approved'
          AND p.revision_number>0 AND p.reviewed_by IS NOT NULL AND p.skill_id IN (${requirements.map(()=>'?').join(',')})
      ) ranked WHERE rank_number=1`,[user.profileId,...requirements.map(item=>item.skill_id)]);
      for (const proof of proofs) {
        const { id,revision_number,rank_number,...proofSnapshot } = proof;
        await db.execute('INSERT INTO application_portfolios(application_id,portfolio_id,revision_number,portfolio_snapshot) VALUES(?,?,?,?)',[applicationId,id,revision_number,JSON.stringify(proofSnapshot)]);
      }
      await db.execute("INSERT INTO application_events(application_id,actor_user_id,action,note) VALUES(?,?,'submitted',?)",[applicationId,userId,'Siswa menyetujui pembagian profil dasar dan karya relevan ('+CONSENT_VERSION+').']);
      return { id:applicationId,status_lamaran:'pending',revision_number:1,match_rate:match.match_rate };
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') throw v.problem(409,'Kamu sudah melamar lowongan ini.');
    throw error;
  }
}
async function review(userId,id,body) {
  if (!['reviewed','accepted','rejected'].includes(body.status)) throw v.problem(400,'Keputusan seleksi tidak valid.');
  const note = v.text(body.note,'Catatan untuk siswa',2000), expected = vacancies.version(body.version);
  const target = await getApplication(id);
  return v.transaction(pool,async db => {
    const vacancy = await vacancies.getVacancy(target.lowongan_id,db,true);
    const row = await getApplication(id,db,true), user = await getIdentity(userId,db);
    vacancies.requireAccess(user,'industri'); checkReader(user,row);
    if (!row.revision_number || row.revision_number !== expected || !['pending','reviewed'].includes(row.status_lamaran)) throw v.problem(409,'Lamaran sudah berubah atau sudah diputuskan. Muat ulang.');
    if (row.status_lamaran === 'reviewed' && body.status === 'reviewed') throw v.problem(409,'Lamaran sudah berada dalam proses seleksi.');
    if (body.status !== 'rejected') {
      const student = await getIdentity(row.student_user_id,db); vacancies.requireAccess(student,'siswa');
      if (row.consent_revoked_at || !row.consented_at) throw v.problem(409,'Persetujuan berbagi data sudah tidak aktif.');
    }
    if (body.status === 'accepted' && vacancy.accepted_count>=vacancy.kuota) throw v.problem(409,'Kuota penerimaan lowongan sudah penuh.');
    await db.execute(`UPDATE applications SET status_lamaran=?,selection_note=?,revision_number=revision_number+1,
      consent_revoked_at=CASE WHEN ?='rejected' THEN CURRENT_TIMESTAMP ELSE consent_revoked_at END WHERE id=?`,[body.status,note,body.status,id]);
    await db.execute('INSERT INTO application_events(application_id,actor_user_id,action,note) VALUES(?,?,?,?)',[id,userId,body.status,note]);
    return { id,status_lamaran:body.status,revision_number:row.revision_number+1 };
  });
}
async function withdraw(userId,id,body) {
  const expected = vacancies.version(body.version), target = await getApplication(id);
  return v.transaction(pool,async db => {
    await db.execute('SELECT id FROM students WHERE user_id=? FOR UPDATE',[userId]);
    await vacancies.getVacancy(target.lowongan_id,db,true);
    const row = await getApplication(id,db,true), user = await getIdentity(userId,db);
    vacancies.requireAccess(user,'siswa'); checkReader(user,row);
    if (!row.revision_number || row.revision_number !== expected || !activeStatuses.includes(row.status_lamaran)) throw v.problem(409,'Lamaran sudah berubah atau sudah berakhir. Muat ulang.');
    const note = 'Lamaran ditarik oleh siswa; akses industri ke profil dan bukti melalui lamaran ini dihentikan.';
    await db.execute("UPDATE applications SET status_lamaran='withdrawn',selection_note=?,consent_revoked_at=CURRENT_TIMESTAMP,revision_number=revision_number+1 WHERE id=?",[note,id]);
    await db.execute("INSERT INTO application_events(application_id,actor_user_id,action,note) VALUES(?,?,'withdrawn',?)",[id,userId,note]);
    return { id,status_lamaran:'withdrawn',revision_number:row.revision_number+1 };
  });
}
async function evidence(user,id,proofId) {
  const row = await getApplication(id); checkReader(user,row);
  if (user.role === 'sekolah' || (user.role === 'industri' && !grantAvailable(row))) throw v.problem(403,'Akses bukti melalui lamaran ini tidak aktif.');
  const [[proof]] = await pool.execute(`SELECT ap.portfolio_snapshot FROM application_portfolios ap JOIN portfolios p ON p.id=ap.portfolio_id
    WHERE ap.application_id=? AND ap.id=? AND p.status_verifikasi='approved' AND p.revision_number=ap.revision_number AND p.reviewed_by IS NOT NULL`,[id,proofId]);
  const file = proof?.portfolio_snapshot?.evidence_path;
  if (!file || !fileNamePattern.test(file)) throw v.problem(404,'Bukti lamaran tidak ditemukan.');
  return { path:path.join(portfolios.privateDir,file),extension:file.split('.').pop() };
}

module.exports = { CONSENT_VERSION,list,detail,apply,review,withdraw,evidence };
