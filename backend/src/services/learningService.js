const {createHash}=require('node:crypto');
const {pool}=require('../config/db');
const {getIdentity}=require('./identityService');
const jobs=require('./vacancyService');
const portfolios=require('./portfolioService');
const gemini=require('../config/gemini');
const {calculateMatch}=require('../utils/matching');
const {PROMPT_VERSION,aiProblem,gradeQuiz}=require('../utils/learningContent');
const v=require('../utils/validation');
const DAILY_LIMIT=5;

function access(user){jobs.requireAccess(user,'siswa');}
function sourceKey(user,context){return createHash('sha256').update(JSON.stringify([user.profileId,context.vacancy.id,context.vacancy.revision_number,context.skill.id,context.skill.current_proficiency,context.skill.target_proficiency,context.provider_model,PROMPT_VERSION])).digest('hex');}
async function targetContext(user,vacancyId,db=pool,row){
  access(user);
  const vacancy=row||await jobs.getVacancy(vacancyId,db);
  if(!vacancy.revision_number||!vacancy.status_aktif||!vacancy.deadline||vacancy.deadline<jobs.todayJakarta()||!vacancy.company_active||!vacancy.publisher_active||vacancy.company_status!=='approved')throw v.problem(409,'Pilih lowongan aktif dari industri terverifikasi untuk membuat materi baru. Modul tersimpan tetap bisa dipelajari.');
  const requirements=await jobs.requirements(vacancyId,db),match=calculateMatch(requirements,await portfolios.studentSkills(user,db));
  if(!match.valid)throw v.problem(409,'Persyaratan lowongan belum lengkap.');
  return {vacancy:{id:vacancy.id,title:vacancy.title,nama_industri:vacancy.nama_industri,revision_number:vacancy.revision_number},gaps:match.requirements.filter(item=>item.missing_points>0).map(item=>({id:item.skill_id,nama_skill:item.nama_skill,kategori:requirements.find(req=>req.skill_id===item.skill_id).kategori,importance:item.importance,current_proficiency:item.current_proficiency,target_proficiency:item.min_proficiency,missing_points:item.missing_points})),provider_model:gemini.configuration().model,prompt_version:PROMPT_VERSION};
}
async function usedGenerations(studentId,db=pool){
  const [[row]]=await db.execute("SELECT COUNT(*) AS total FROM learning_modules WHERE siswa_id=? AND generation_status<>'legacy' AND created_at>=CURRENT_TIMESTAMP-INTERVAL 1 DAY",[studentId]);
  return row.total;
}
async function gaps(user,vacancyId){
  const context=await targetContext(user,vacancyId);
  const keys=context.gaps.map(skill=>sourceKey(user,{...context,skill}));
  let cached=[];
  if(keys.length)[cached]=await pool.execute(`SELECT id,source_key,generation_status FROM learning_modules WHERE siswa_id=? AND source_key IN (${keys.map(()=>'?').join(',')}) AND (generation_status='ready' OR (generation_status='generating' AND created_at>=CURRENT_TIMESTAMP-INTERVAL 2 MINUTE))`,[user.profileId,...keys]);
  return {vacancy:context.vacancy,gaps:context.gaps.map((skill,index)=>{const module=cached.find(item=>item.source_key===keys[index]);return {...skill,module_id:module?.id||null,module_status:module?.generation_status||null};}),configuration:gemini.configuration(),remaining_requests:Math.max(0,DAILY_LIMIT-await usedGenerations(user.profileId)),daily_limit:DAILY_LIMIT};
}
async function generate(userId,body){
  const vacancyId=v.id(body.vacancyId),skillId=v.id(body.skillId),expected=v.id(body.version);
  const prepared=await v.transaction(pool,async db=>{
    await db.execute('SELECT id FROM students WHERE user_id=? FOR UPDATE',[userId]);
    const vacancy=await jobs.getVacancy(vacancyId,db,true),user=await getIdentity(userId,db);access(user);
    if(vacancy.revision_number!==expected)throw v.problem(409,'Lowongan berubah. Muat ulang kekurangan keterampilan sebelum membuat materi.');
    const target=await targetContext(user,vacancyId,db,vacancy),skill=target.gaps.find(item=>item.id===skillId);
    if(!skill)throw v.problem(409,'Keterampilan ini tidak memiliki kekurangan nilai pada lowongan tersebut.');
    const context={vacancy:target.vacancy,skill,provider_model:target.provider_model,prompt_version:PROMPT_VERSION},key=sourceKey(user,context);
    await db.execute("UPDATE learning_modules SET generation_status='failed',source_key=NULL,last_error_code='AI_TIMEOUT' WHERE siswa_id=? AND generation_status='generating' AND created_at<CURRENT_TIMESTAMP-INTERVAL 2 MINUTE",[user.profileId]);
    const [[existing]]=await db.execute('SELECT id,generation_status FROM learning_modules WHERE source_key=? AND siswa_id=? FOR UPDATE',[key,user.profileId]);
    if(existing)return {id:existing.id,generation_status:existing.generation_status,reused:true};
    if(!gemini.configuration().configured)throw aiProblem(503,'AI_NOT_CONFIGURED','Pembuatan materi Gemini belum tersedia. Hubungi pengelola; modul tersimpan tetap dapat dipelajari.');
    const [[pending]]=await db.execute("SELECT COUNT(*) AS total FROM learning_modules WHERE siswa_id=? AND generation_status='generating'",[user.profileId]);
    if(pending.total)throw v.problem(409,'Masih ada materi lain yang sedang dibuat. Periksa riwayat belajar terlebih dahulu.');
    if(await usedGenerations(user.profileId,db)>=DAILY_LIMIT)throw aiProblem(429,'AI_DAILY_LIMIT','Batas 5 pembuatan materi dalam 24 jam sudah tercapai. Pelajari modul tersimpan dan coba lagi nanti.');
    const [result]=await db.execute(`INSERT INTO learning_modules(siswa_id,skill_id,judul_modul,konten_materi,quiz_json,estimasi_menit,lowongan_id,source_key,source_context,provider_model,prompt_version,generation_status)
      VALUES(?,?,?,'','[]',15,?,?,?,?,?,'generating')`,[user.profileId,skillId,'Menyiapkan materi '+skill.nama_skill,vacancyId,key,JSON.stringify(context),target.provider_model,PROMPT_VERSION]);
    return {id:result.insertId,context,studentId:user.profileId};
  });
  if(prepared.reused)return prepared;
  try{
    // Panggilan jaringan dilakukan setelah transaksi persiapan selesai agar tidak menahan koneksi/lock selama menunggu Gemini.
    const result=await gemini.generateLesson(prepared.context.skill);
    await v.transaction(pool,async db=>{
      await db.execute('SELECT id FROM students WHERE id=? FOR UPDATE',[prepared.studentId]);
      await db.execute('SELECT id FROM learning_modules WHERE id=? FOR UPDATE',[prepared.id]);
      access(await getIdentity(userId,db));
      const {quiz,...content}=result.lesson;
      const [saved]=await db.execute(`UPDATE learning_modules SET judul_modul=?,konten_materi=?,quiz_json=?,provider_model=?,generation_status='ready',last_error_code=NULL
        WHERE id=? AND siswa_id=? AND generation_status='generating'`,[content.title,JSON.stringify(content),JSON.stringify(quiz),result.model,prepared.id,prepared.studentId]);
      if(!saved.affectedRows)throw v.problem(409,'Permintaan pembuatan materi ini sudah berakhir. Muat ulang riwayat belajar.');
    });
    return {id:prepared.id,generation_status:'ready',reused:false};
  }catch(error){
    const code=/^AI_[A-Z_]+$/.test(error.code||'')?error.code:'AI_GENERATION_FAILED';
    await pool.execute("UPDATE learning_modules SET generation_status='failed',source_key=NULL,last_error_code=? WHERE id=? AND generation_status='generating'",[code,prepared.id]);
    throw error;
  }
}
const moduleSelect=`SELECT m.*,k.nama_skill,k.kategori,
  (m.generation_status='generating' AND m.created_at<CURRENT_TIMESTAMP-INTERVAL 2 MINUTE) AS stale_generation,
  (SELECT MAX(a.skor_kuis) FROM assessment_records a WHERE a.module_id=m.id) AS best_score,
  (SELECT COUNT(*) FROM assessment_records a WHERE a.module_id=m.id) AS attempt_count
  FROM learning_modules m JOIN skills k ON k.id=m.skill_id`;
function moduleDto(row){return {id:row.id,title:row.judul_modul,skill_id:row.skill_id,nama_skill:row.nama_skill,kategori:row.kategori,estimated_minutes:row.estimasi_menit,
  generation_status:row.stale_generation?'failed':row.generation_status,legacy:row.generation_status==='legacy',source_context:row.source_context,provider_model:row.provider_model,created_at:row.created_at,
  progress:{best_score:row.best_score==null?null:Number(row.best_score),passed:Number(row.best_score)>=80,attempt_count:row.attempt_count}};}
async function moduleRow(user,id,db=pool,lock=false){
  access(user);
  if(lock)await db.execute('SELECT id FROM learning_modules WHERE id=? FOR UPDATE',[id]);
  const [[row]]=await db.execute(moduleSelect+' WHERE m.id=?',[id]);
  if(!row)throw v.problem(404,'Modul belajar tidak ditemukan.');
  if(row.siswa_id!==user.profileId)throw v.problem(403,'Modul belajar bukan milik Anda.');
  return row;
}
async function list(user,query){
  access(user);const offset=jobs.page(query);
  const [rows]=await pool.execute(moduleSelect+` WHERE m.siswa_id=? ORDER BY m.created_at DESC,m.id DESC LIMIT 20 OFFSET ${offset}`,[user.profileId]);
  return {items:rows.map(moduleDto),configuration:gemini.configuration(),remaining_requests:Math.max(0,DAILY_LIMIT-await usedGenerations(user.profileId)),daily_limit:DAILY_LIMIT};
}
function attemptDto(row,quiz,bestScore){return {id:row.id,answers:row.answers_json,...gradeQuiz(quiz,row.answers_json),best_score:bestScore,submitted_at:row.tanggal_evaluasi};}
async function detail(user,id){
  const row=await moduleRow(user,id),data=moduleDto(row);
  if(data.generation_status!=='ready')return {...data,legacy_content:data.legacy?row.konten_materi:null,content:null,quiz:[],last_attempt:null};
  const [[latest]]=await pool.execute('SELECT * FROM assessment_records WHERE module_id=? AND siswa_id=? ORDER BY id DESC LIMIT 1',[id,user.profileId]);
  return {...data,content:JSON.parse(row.konten_materi),quiz:row.quiz_json.map((item,index)=>({id:index,question:item.question,options:item.options})),last_attempt:latest?attemptDto(latest,row.quiz_json,data.progress.best_score):null};
}
async function submitQuiz(userId,moduleId,body){
  const attemptKey=v.text(body.attemptKey,'Penanda pengiriman kuis',64);
  if(!/^[a-zA-Z0-9_-]{12,64}$/.test(attemptKey))throw v.problem(400,'Penanda pengiriman kuis tidak valid.');
  return v.transaction(pool,async db=>{
    await db.execute('SELECT id FROM students WHERE user_id=? FOR UPDATE',[userId]);
    await db.execute('SELECT id FROM learning_modules WHERE id=? FOR UPDATE',[moduleId]);
    const user=await getIdentity(userId,db);access(user);
    const module=await moduleRow(user,moduleId,db);
    if(module.generation_status!=='ready')throw v.problem(409,'Kuis hanya tersedia pada modul baru yang sudah selesai dibuat.');
    const grade=gradeQuiz(module.quiz_json,body.answers);
    const [[previous]]=await db.execute('SELECT * FROM assessment_records WHERE module_id=? AND attempt_key=?',[moduleId,attemptKey]);
    if(previous){
      if(JSON.stringify(previous.answers_json)!==JSON.stringify(body.answers))throw v.problem(409,'Penanda pengiriman ini sudah digunakan untuk jawaban berbeda. Coba kirim sebagai latihan baru.');
      return attemptDto(previous,module.quiz_json,module.best_score);
    }
    const [result]=await db.execute('INSERT INTO assessment_records(siswa_id,skill_id,skor_kuis,module_id,answers_json,correct_count,attempt_key) VALUES(?,?,?,?,?,?,?)',[user.profileId,module.skill_id,grade.score,moduleId,JSON.stringify(body.answers),grade.correct_count,attemptKey]);
    const [[row]]=await db.execute('SELECT * FROM assessment_records WHERE id=?',[result.insertId]);
    return attemptDto(row,module.quiz_json,Math.max(module.best_score||0,grade.score));
  });
}
module.exports={DAILY_LIMIT,gaps,generate,list,detail,submitQuiz};
