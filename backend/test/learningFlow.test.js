const assert=require('node:assert/strict');
const {test}=require('node:test');
const {randomBytes}=require('node:crypto');
const fs=require('node:fs/promises');
const path=require('node:path');
const mysql=require('mysql2/promise');
const lesson=require('./fixtures/learningLesson');
require('dotenv').config({path:path.join(__dirname,'../.env'),quiet:true});

test('adaptive learning migration, cached generation, private quizzes and isolated progress',async t=>{
  const database='finetern_learning_test_'+randomBytes(6).toString('hex');
  const host=process.env.TEST_DB_HOST||process.env.DB_HOST||'localhost';assert.ok(['localhost','127.0.0.1','::1'].includes(host));
  const config={host,port:Number(process.env.TEST_DB_PORT||process.env.DB_PORT)||3306,user:process.env.TEST_DB_USER||process.env.DB_USER||'root',password:process.env.TEST_DB_PASS??process.env.DB_PASS??'',multipleStatements:true};
  const db=await mysql.createConnection(config);let created=false,server,pool;
  try{
    assert.match(database,/^finetern_learning_test_[a-f0-9]{12}$/);
    await db.query(`CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);created=true;await db.query(`USE \`${database}\``);
    const schema=(await fs.readFile(path.join(__dirname,'fixtures/schema-v4.sql'),'utf8')).replace(/^CREATE DATABASE IF NOT EXISTS finetern_db[^;]*;\s*/m,'').replace(/^USE finetern_db;\s*/m,'');await db.query(schema);
    const account=async role=>{const [r]=await db.execute('INSERT INTO users(email,password,role) VALUES(?,?,?)',[randomBytes(6).toString('hex')+'@example.invalid','fixture-hash',role]);return r.insertId;};
    const request=async(user,column,id,status='approved')=>db.execute(`INSERT INTO verification_requests(applicant_user_id,${column},status) VALUES(?,?,?)`,[user,id,status]);
    const teacher=await account('sekolah');
    const [school]=await db.execute("INSERT INTO schools(submitted_by,nama_sekolah) VALUES(?,'Sekolah Belajar')",[teacher]);await request(teacher,'sekolah_id',school.insertId);
    const [teacherProfile]=await db.execute("INSERT INTO teachers(user_id,nama_lengkap) VALUES(?,'Guru Belajar')",[teacher]);
    const [membership]=await db.execute('INSERT INTO school_memberships(teacher_id,sekolah_id) VALUES(?,?)',[teacherProfile.insertId,school.insertId]);await request(teacher,'membership_id',membership.insertId);
    const student=async(status='approved')=>{const user=await account('siswa');const [profile]=await db.execute("INSERT INTO students(user_id,sekolah_id,nama_lengkap,jurusan,kelas) VALUES(?,?,'Siswa Belajar','RPL','XII')",[user,school.insertId]);await request(user,'siswa_id',profile.insertId,status);return {user,id:profile.insertId};};
    const owner=await student(),other=await student(),pending=await student('pending'),companyUser=await account('industri'),admin=await account('admin');
    const [company]=await db.execute("INSERT INTO industries(user_id,nama_industri,sektor_industri,kota_domisili) VALUES(?,'Industri Belajar','TI','Bandung')",[companyUser]);await request(companyUser,'industri_id',company.insertId);
    await db.query("INSERT INTO skills(id,nama_skill,kategori) VALUES(1,'Integrasi API','Mobile'),(2,'UI Design','Desain')");
    await db.execute("INSERT INTO portfolios(siswa_id,skill_id,title,status_verifikasi,revision_number,assessed_proficiency,reviewed_by) VALUES(?,1,'Bukti awal','approved',1,40,?),(?,2,'Bukti desain','approved',1,90,?)",[owner.id,teacher,owner.id,teacher]);
    await db.execute('INSERT INTO student_skills(siswa_id,skill_id,proficiency,is_validated) VALUES(?,1,100,TRUE)',[owner.id]);
    const future=new Date(Date.now()+30*86400000).toISOString().slice(0,10);
    const job=async title=>{const [r]=await db.execute("INSERT INTO internship_vacancies(industri_id,title,deskripsi,kuota,tenggat_waktu,lokasi,tipe_kerja,revision_number) VALUES(?,?,?,1,?,'Bandung','onsite',1)",[company.insertId,title,'Belajar implementasi',future]);await db.execute("INSERT INTO vacancy_skills(lowongan_id,skill_id,importance,weight,min_proficiency) VALUES(?,1,'wajib',10,70),(?,2,'nilai_tambah',5,70)",[r.insertId,r.insertId]);return r.insertId;};
    const jobs=[];for(let i=0;i<7;i++)jobs.push(await job('Posisi Belajar '+i));
    await db.execute("INSERT INTO learning_modules(id,siswa_id,skill_id,judul_modul,konten_materi,quiz_json) VALUES(1,?,1,'Modul Lama','Materi lama tidak dihapus','[]')",[owner.id]);
    await db.execute('INSERT INTO assessment_records(id,siswa_id,skill_id,skor_kuis) VALUES(1,?,1,95)',[owner.id]);
    const [[beforeModule]]=await db.query('SELECT * FROM learning_modules WHERE id=1'),[[beforeAssessment]]=await db.query('SELECT * FROM assessment_records WHERE id=1');
    await t.test('v4 upgrade keeps old modules and scores without attaching a new quiz or provider',async()=>{
      const migration=await fs.readFile(path.join(__dirname,'../../database/migrations/004_adaptive_learning.sql'),'utf8');await db.query(migration);
      const [[module]]=await db.query('SELECT * FROM learning_modules WHERE id=1'),[[assessment]]=await db.query('SELECT * FROM assessment_records WHERE id=1');
      for(const key of Object.keys(beforeModule))assert.deepEqual(module[key],beforeModule[key],key);
      for(const key of Object.keys(beforeAssessment))assert.deepEqual(assessment[key],beforeAssessment[key],key);
      assert.equal(module.generation_status,'legacy');assert.equal(module.provider_model,null);assert.equal(assessment.module_id,null);
      await assert.rejects(db.query(migration),{code:'ER_DUP_ENTRY'});
    });
    Object.assign(process.env,{DB_NAME:database,DB_HOST:host,DB_PORT:String(config.port),DB_USER:config.user,DB_PASS:config.password,JWT_SECRET:randomBytes(48).toString('hex'),GEMINI_API_KEY:'test-only-private-key',GEMINI_MODEL:'gemini-3.5-flash-lite'});
    pool=require('../src/config/db').pool;
    const gemini=require('../src/config/gemini'),{aiProblem}=require('../src/utils/learningContent');let calls=0;
    const provider=t.mock.method(gemini,'generateLesson',async context=>{calls++;assert.equal(context.current_proficiency,40);return {lesson:structuredClone(lesson),model:'gemini-3.5-flash-lite'};});
    const token=id=>require('../src/services/authService').issueToken({id});
    const tokens={owner:token(owner.user),other:token(other.user),pending:token(pending.user),teacher:token(teacher),company:token(companyUser),admin:token(admin)};
    server=await new Promise(resolve=>{const s=require('../src/app').listen(0,'127.0.0.1',()=>resolve(s));});const base='http://127.0.0.1:'+server.address().port+'/api';
    const call=async(url,method='GET',body,credential=tokens.owner)=>{const response=await fetch(base+url,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(credential?{Authorization:'Bearer '+credential}:{})},body:body?JSON.stringify(body):undefined});return {status:response.status,...await response.json()};};
    const generate=(jobId=jobs[0],extra={})=>call('/ai/generate-sprint','POST',{vacancyId:jobId,skillId:1,version:1,...extra});
    let moduleId;
    await t.test('learning requires a verified learner and a real unmet requirement',async()=>{
      assert.equal((await call('/ai/modules','GET',null,null)).status,401);
      for(const key of ['pending','teacher','company','admin'])assert.equal((await call('/ai/modules','GET',null,tokens[key])).status,403);
      assert.equal((await call('/ai/modules/1','GET',null,tokens.other)).status,403);
      const gaps=(await call('/ai/gaps/'+jobs[0])).data;assert.equal(gaps.gaps.length,1);assert.equal(gaps.gaps[0].current_proficiency,40);assert.equal(gaps.gaps[0].missing_points,30);
      assert.equal((await generate(jobs[0],{version:99})).status,409);assert.equal((await generate(jobs[0],{skillId:2})).status,409);
      process.env.GEMINI_API_KEY='';assert.equal((await generate()).status,503);assert.equal(calls,0);process.env.GEMINI_API_KEY='test-only-private-key';
    });
    await t.test('concurrent generation reuses one in-flight request and stores a redacted quiz',async()=>{
      let release,entered;const waiting=new Promise(resolve=>{entered=resolve;});const barrier=new Promise(resolve=>{release=resolve;});
      provider.mock.mockImplementation(async context=>{calls++;assert.equal(context.current_proficiency,40);entered();await barrier;return {lesson:structuredClone(lesson),model:'gemini-3.5-flash-lite'};});
      const first=generate();await waiting;
      try{
        const second=await generate();assert.equal(second.status,202);assert.equal(second.data.reused,true);moduleId=second.data.id;
        assert.equal((await generate(jobs[1])).status,409);
        const loading=(await call('/ai/modules/'+moduleId)).data;assert.equal(loading.content,null);assert.equal(loading.quiz.length,0);
      }finally{release();}
      assert.equal((await first).status,201);assert.equal(calls,1);
      const stored=(await call('/ai/modules/'+moduleId)).data;assert.equal(stored.generation_status,'ready');assert.equal(stored.quiz.length,3);assert.equal(stored.last_attempt,null);
      assert.equal(JSON.stringify(stored).includes('correctIndex'),false);assert.equal(JSON.stringify(stored).includes(process.env.GEMINI_API_KEY),false);
      assert.equal((await call('/ai/modules/'+moduleId,'GET',null,tokens.other)).status,403);
      process.env.GEMINI_API_KEY='';const cached=await generate();assert.equal(cached.status,200);assert.equal(cached.data.id,moduleId);assert.equal(calls,1);process.env.GEMINI_API_KEY='test-only-private-key';
      provider.mock.mockImplementation(async()=>{calls++;return {lesson:structuredClone(lesson),model:'gemini-3.5-flash-lite'};});
    });
    await t.test('quiz grades come from server answers and retries are idempotent without changing validated skills',async()=>{
      const endpoint='/ai/modules/'+moduleId+'/assessments';
      const attempt={answers:[3,3,3],attemptKey:'quiz-attempt-000001',score:100,passed:true,proficiency:100};
      assert.equal((await call(endpoint,'POST',{...attempt,answers:[0,1]})).status,400);
      assert.equal((await call(endpoint,'POST',attempt,tokens.other)).status,403);
      const first=await call(endpoint,'POST',attempt);assert.equal(first.data.score,0);assert.equal(first.data.passed,false);
      const repeated=await call(endpoint,'POST',attempt);assert.equal(repeated.data.id,first.data.id);
      assert.equal((await call(endpoint,'POST',{...attempt,answers:[0,1,2]})).status,409);
      const passed=await call(endpoint,'POST',{answers:[0,1,2],attemptKey:'quiz-attempt-000002'});assert.equal(passed.data.score,100);assert.equal(passed.data.passed,true);
      const detail=(await call('/ai/modules/'+moduleId)).data;assert.equal(detail.progress.best_score,100);assert.equal(detail.progress.attempt_count,2);assert.equal(detail.last_attempt.feedback[0].correctIndex,0);
      const gaps=(await call('/ai/gaps/'+jobs[0])).data;assert.equal(gaps.gaps[0].current_proficiency,40);
      const [[cache]]=await db.execute('SELECT proficiency,is_validated FROM student_skills WHERE siswa_id=? AND skill_id=1',[owner.id]);assert.equal(cache.proficiency,100);assert.equal(cache.is_validated,1);
      const [[proof]]=await db.execute('SELECT assessed_proficiency FROM portfolios WHERE siswa_id=? AND skill_id=1',[owner.id]);assert.equal(proof.assessed_proficiency,40);
    });
    await t.test('failed provider calls remain failed and count toward the rolling daily budget',async()=>{
      provider.mock.mockImplementation(async()=>{calls++;throw aiProblem(503,'AI_QUOTA','Gemini membatasi permintaan.');});
      const failed=await generate(jobs[1]);assert.equal(failed.status,503);assert.equal(failed.data.code,'AI_QUOTA');
      const [[state]]=await db.execute('SELECT generation_status,source_key FROM learning_modules WHERE lowongan_id=? ORDER BY id DESC LIMIT 1',[jobs[1]]);assert.equal(state.generation_status,'failed');assert.equal(state.source_key,null);
      provider.mock.mockImplementation(async()=>{calls++;return {lesson:structuredClone(lesson),model:'gemini-3.5-flash-lite'};});
      assert.equal((await generate(jobs[1])).status,201);assert.equal((await generate(jobs[2])).status,201);assert.equal((await generate(jobs[3])).status,201);
      const count=calls;const limited=await generate(jobs[4]);assert.equal(limited.status,429);assert.equal(limited.data.code,'AI_DAILY_LIMIT');assert.equal(calls,count);
      assert.equal((await generate()).status,200);
    });
    await t.test('stale requests can be retried without reusing or exposing partial material',async()=>{
      await db.execute("UPDATE learning_modules SET created_at=CURRENT_TIMESTAMP-INTERVAL 2 DAY WHERE generation_status<>'legacy'");
      const [[stale]]=await db.execute('SELECT id FROM learning_modules WHERE lowongan_id=? AND generation_status=\'ready\'',[jobs[2]]);
      await db.execute("UPDATE learning_modules SET generation_status='generating',created_at=CURRENT_TIMESTAMP-INTERVAL 3 MINUTE WHERE id=?",[stale.id]);
      const view=(await call('/ai/modules/'+stale.id)).data;assert.equal(view.generation_status,'failed');assert.equal(view.content,null);assert.equal(view.quiz.length,0);
      const retry=await generate(jobs[2]);assert.equal(retry.status,201);assert.notEqual(retry.data.id,stale.id);
    });
    await t.test('revocation while Gemini is running prevents a ready module from being persisted',async()=>{
      let release,entered;const waiting=new Promise(resolve=>{entered=resolve;});const barrier=new Promise(resolve=>{release=resolve;});
      provider.mock.mockImplementation(async()=>{calls++;entered();await barrier;return {lesson:structuredClone(lesson),model:'gemini-3.5-flash-lite'};});
      const response=generate(jobs[5]);await waiting;await db.execute('UPDATE users SET is_active=0 WHERE id=?',[owner.user]);release();
      assert.equal((await response).status,403);
      const [[row]]=await db.execute('SELECT generation_status FROM learning_modules WHERE lowongan_id=? ORDER BY id DESC LIMIT 1',[jobs[5]]);assert.equal(row.generation_status,'failed');
      await db.execute('UPDATE users SET is_active=1 WHERE id=?',[owner.user]);
      await db.execute('UPDATE industries SET is_active=0 WHERE id=?',[company.insertId]);
      assert.equal((await call('/ai/gaps/'+jobs[0])).status,409);assert.equal((await call('/ai/modules/'+moduleId)).status,200);
      await db.execute('UPDATE schools SET is_active=0 WHERE id=?',[school.insertId]);assert.equal((await call('/ai/modules')).status,403);
    });
  }finally{
    if(server)await new Promise(resolve=>server.close(resolve));if(pool)await pool.end();
    if(created){assert.match(database,/^finetern_learning_test_[a-f0-9]{12}$/);await db.query(`DROP DATABASE \`${database}\``);}await db.end();
  }
});
