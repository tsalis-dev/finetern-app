const assert = require('node:assert/strict');
const { test } = require('node:test');
const { randomBytes,randomUUID } = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const mysql = require('mysql2/promise');
require('dotenv').config({ path:path.join(__dirname,'../.env'),quiet:true });

test('recruitment migration, matching, consent, selection and quota concurrency',async t => {
  const database = 'finetern_recruitment_test_'+randomBytes(6).toString('hex');
  const dir = await fs.mkdtemp(path.join(os.tmpdir(),'finetern-recruitment-'));
  const host = process.env.TEST_DB_HOST || process.env.DB_HOST || 'localhost';
  assert.ok(['localhost','127.0.0.1','::1'].includes(host));
  const config = { host,port:Number(process.env.TEST_DB_PORT || process.env.DB_PORT)||3306,
    user:process.env.TEST_DB_USER || process.env.DB_USER || 'root',password:process.env.TEST_DB_PASS ?? process.env.DB_PASS ?? '',multipleStatements:true };
  const db = await mysql.createConnection(config);
  let created=false,server,pool;
  try {
    assert.match(database,/^finetern_recruitment_test_[a-f0-9]{12}$/);
    await db.query(`CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`); created=true;
    await db.query(`USE \`${database}\``);
    const schema = (await fs.readFile(path.join(__dirname,'fixtures/schema-v3.sql'),'utf8'))
      .replace(/^CREATE DATABASE IF NOT EXISTS finetern_db[^;]*;\s*/m,'').replace(/^USE finetern_db;\s*/m,'');
    await db.query(schema);
    const account = async role => {
      const [result] = await db.execute('INSERT INTO users(email,password,role) VALUES(?,?,?)',[randomBytes(6).toString('hex')+'@example.invalid','fixture-no-login',role]);
      return result.insertId;
    };
    const request = async (user,column,id,status='approved') => db.execute(`INSERT INTO verification_requests(applicant_user_id,${column},status) VALUES(?,?,?)`,[user,id,status]);
    const school = async name => {
      const founder = await account('sekolah');
      const [result] = await db.execute('INSERT INTO schools(submitted_by,nama_sekolah) VALUES(?,?)',[founder,name]);
      await request(founder,'sekolah_id',result.insertId); return result.insertId;
    };
    const teacher = async schoolId => {
      const user=await account('sekolah');
      const [profile]=await db.execute('INSERT INTO teachers(user_id,nama_lengkap) VALUES(?,?)',[user,'Guru Bukti']);
      const [membership]=await db.execute('INSERT INTO school_memberships(teacher_id,sekolah_id) VALUES(?,?)',[profile.insertId,schoolId]);
      await request(user,'membership_id',membership.insertId); return user;
    };
    const student = async (schoolId,status='approved') => {
      const user=await account('siswa');
      const [profile]=await db.execute("INSERT INTO students(user_id,sekolah_id,nama_lengkap,jurusan,kelas) VALUES(?,?,'Pelamar Uji','RPL','XII')",[user,schoolId]);
      await request(user,'siswa_id',profile.insertId,status); return { user,id:profile.insertId };
    };
    const company = async (name,status='approved') => {
      const user=await account('industri');
      const [profile]=await db.execute("INSERT INTO industries(user_id,nama_industri,sektor_industri,kota_domisili) VALUES(?,?,'TI','Bandung')",[user,name]);
      await request(user,'industri_id',profile.insertId,status); return { user,id:profile.insertId };
    };
    const schoolA=await school('Sekolah A'),schoolB=await school('Sekolah B');
    const teacherA=await teacher(schoolA),teacherB=await teacher(schoolB);
    const studentA=await student(schoolA),studentB=await student(schoolB),weak=await student(schoolA),low=await student(schoolA),cached=await student(schoolA),pending=await student(schoolA,'pending');
    const companyA=await company('Industri A'),companyB=await company('Industri B'),pendingCompany=await company('Industri Pending','pending');
    const admin=await account('admin');
    await db.query("INSERT INTO skills(id,nama_skill,kategori) VALUES(1,'Integrasi API','Mobile'),(2,'UI Design','Desain'),(3,'Skill Rahasia Tidak Relevan','Lainnya')");
    const proof = async (owner,skill,score,reviewer=teacherA) => {
      const file=randomUUID()+'.pdf'; await fs.writeFile(path.join(dir,file),'%PDF-1.4\nproof-'+skill+'-'+score+'\n%%EOF');
      const [result]=await db.execute(`INSERT INTO portfolios(siswa_id,skill_id,title,deskripsi,evidence_path,status_verifikasi,revision_number,assessed_proficiency,reviewed_by,reviewed_at)
        VALUES(?,?,?,? ,?,'approved',1,?,?,CURRENT_TIMESTAMP)`,[owner.id,skill,'Karya '+skill,'Bukti kemampuan siswa',file,score,reviewer]);
      return result.insertId;
    };
    await proof(studentA,1,75); const bestProof=await proof(studentA,1,85); await proof(studentA,2,40); await proof(studentA,3,100);
    await proof(studentB,1,90,teacherB); await proof(studentB,2,90,teacherB);
    await proof(weak,1,69); await proof(weak,2,100); await proof(low,1,70); await proof(low,2,39);
    await db.execute('INSERT INTO student_skills(siswa_id,skill_id,proficiency,is_validated) VALUES(?,1,100,TRUE),(?,2,100,TRUE),(?,1,100,TRUE)',[studentA.id,studentA.id,cached.id]);
    await db.execute("INSERT INTO portfolios(siswa_id,skill_id,title,status_verifikasi) VALUES(?,1,'Legacy approved','approved')",[cached.id]);
    const future=new Date(Date.now()+30*86400000).toISOString().slice(0,10);
    await db.execute("INSERT INTO internship_vacancies(id,industri_id,title,deskripsi,kuota,tenggat_waktu) VALUES(1,?,'Lowongan Legacy','Tidak otomatis diterbitkan ulang',2,?)",[companyA.id,future]);
    await db.execute("INSERT INTO applications(id,siswa_id,lowongan_id,match_rate,status_lamaran) VALUES(1,?,1,95,'accepted')",[cached.id]);
    const [[oldJob]]=await db.query('SELECT * FROM internship_vacancies WHERE id=1');
    const [[oldApplication]]=await db.query('SELECT * FROM applications WHERE id=1');
    const migration=await fs.readFile(path.join(__dirname,'../../database/migrations/003_recruitment_matching.sql'),'utf8');
    await t.test('v3 migration preserves records and never invents data-sharing consent',async()=>{
      await db.query(migration);
      const [[job]]=await db.query('SELECT * FROM internship_vacancies WHERE id=1');
      const [[application]]=await db.query('SELECT * FROM applications WHERE id=1');
      for (const key of Object.keys(oldJob)) assert.deepEqual(job[key],oldJob[key],key);
      for (const key of Object.keys(oldApplication)) assert.deepEqual(application[key],oldApplication[key],key);
      assert.equal(application.consented_at,null); assert.equal(application.submission_snapshot,null);
      assert.equal(job.revision_number,0); assert.equal(application.revision_number,0);
      await assert.rejects(db.query(migration),{ code:'ER_DUP_ENTRY' });
    });
    Object.assign(process.env,{ DB_NAME:database,DB_HOST:host,DB_PORT:String(config.port),DB_USER:config.user,DB_PASS:config.password,
      JWT_SECRET:randomBytes(48).toString('hex'),PORTFOLIO_UPLOAD_DIR:dir });
    pool=require('../src/config/db').pool;
    const token=id=>require('../src/services/authService').issueToken({ id });
    const tokens={ a:token(studentA.user),b:token(studentB.user),weak:token(weak.user),low:token(low.user),cached:token(cached.user),pending:token(pending.user),company:token(companyA.user),outsider:token(companyB.user),pendingCompany:token(pendingCompany.user),teacher:token(teacherA),otherTeacher:token(teacherB),admin:token(admin) };
    server=await new Promise(resolve=>{ const s=require('../src/app').listen(0,'127.0.0.1',()=>resolve(s)); });
    const base='http://127.0.0.1:'+server.address().port+'/api';
    const call=async(url,method='GET',body,credential=tokens.a)=>{
      const response=await fetch(base+url,{ method,headers:{ ...(body?{'Content-Type':'application/json'}:{}),...(credential?{Authorization:'Bearer '+credential}:{}) },body:body?JSON.stringify(body):undefined });
      return { status:response.status,...await response.json() };
    };
    const data={ title:'Magang Mobile',deskripsi:'Implementasi antarmuka dan API di bawah bimbingan tim.',location:'Bandung',workMode:'hybrid',allowance:1500000,quota:1,deadline:future,
      requirements:[{skillId:1,importance:'wajib',weight:60,minProficiency:70},{skillId:2,importance:'nilai_tambah',weight:40,minProficiency:80}] };
    let job,jobVersion,applicationA,applicationB;
    const getJob=(credential=tokens.company)=>call('/vacancies/'+job,'GET',null,credential);
    const apply=(credential=tokens.a,extra={})=>call('/vacancies/'+job+'/apply','POST',{version:jobVersion,shareConsent:true,...extra},credential);
    const review=(id,version,status='accepted',credential=tokens.company)=>call('/applications/'+id+'/review','POST',{ version,status,note:'Hasil seleksi sudah dicatat untuk pelamar.' },credential);
    await t.test('only verified publishers create complete vacancies; other tenants cannot mutate them',async()=>{
      assert.equal((await call('/vacancies','POST',data,null)).status,401);
      for(const credential of [tokens.a,tokens.pendingCompany,tokens.admin]) assert.equal((await call('/vacancies','POST',data,credential)).status,403);
      assert.equal((await call('/vacancies','POST',{...data,requirements:[]},tokens.company)).status,400);
      assert.equal((await call('/vacancies','POST',{...data,deadline:'2027-02-30'},tokens.company)).status,400);
      assert.equal((await call('/vacancies','POST',{...data,requirements:[data.requirements[0],data.requirements[0]]},tokens.company)).status,400);
      assert.equal((await call('/vacancies','POST',{...data,requirements:[{...data.requirements[0],minProficiency:0}]},tokens.company)).status,400);
      const created=await call('/vacancies','POST',data,tokens.company); assert.equal(created.status,201); job=created.data.id; jobVersion=1;
      assert.equal((await call('/vacancies/'+job,'PATCH',{...data,version:1},tokens.outsider)).status,403);
      assert.equal((await call('/vacancies/'+job+'/activity','PATCH',{active:false,version:1},tokens.outsider)).status,403);
      assert.equal((await call('/vacancies/'+job,'PATCH',{...data,title:'Magang Mobile Diperbarui',version:1},tokens.company)).status,200); jobVersion=2;
      assert.equal((await call('/vacancies/'+job,'PATCH',{...data,version:1},tokens.company)).status,409);
      const catalog=await call('/vacancies'); assert.equal(catalog.data.items.length,1); assert.equal(catalog.data.items[0].id,job);
      const legacy=(await call('/applications/1','GET',null,tokens.company)).data;
      assert.equal(legacy.legacy,true); assert.equal(legacy.profile,null); assert.equal(legacy.shared_portfolios.length,0);
      assert.equal((await review(1,0)).status,409);
    });
    await t.test('matching uses project proof, mandatory minima and the exact 80 percent threshold',async()=>{
      const good=(await getJob(tokens.a)).data; assert.equal(good.matching.match_rate,80); assert.equal(good.matching.can_apply,true);
      const mandatory=(await getJob(tokens.weak)).data; assert.ok(mandatory.matching.match_rate>80); assert.equal(mandatory.matching.can_apply,false); assert.equal(mandatory.matching.mandatory_met,false);
      assert.equal((await getJob(tokens.low)).data.matching.match_rate,79.5);
      assert.equal((await getJob(tokens.cached)).data.matching.match_rate,0);
      for(const credential of [tokens.weak,tokens.low,tokens.cached]) assert.equal((await apply(credential,{match_rate:100})).status,409);
      assert.equal((await apply(tokens.pending)).status,403);
      assert.equal((await apply(tokens.a,{shareConsent:false})).status,400);
      assert.equal((await apply(tokens.a,{shareConsent:'true'})).status,400);
      assert.equal((await apply(tokens.a,{version:1})).status,409);
    });
    await t.test('application is atomic and shares only best relevant approved projects after consent',async()=>{
      const responses=await Promise.all([apply(tokens.a,{match_rate:100,siswa_id:studentB.id}),apply()]);
      assert.deepEqual(responses.map(item=>item.status).sort(),[201,409]);
      applicationA=responses.find(item=>item.status===201).data.id;
      const detail=(await call('/applications/'+applicationA,'GET',null,tokens.company)).data;
      assert.equal(detail.match_rate,80); assert.equal(detail.profile.nama_lengkap,'Pelamar Uji'); assert.ok(detail.profile.email);
      assert.equal(detail.shared_portfolios.length,2); assert.ok(detail.shared_portfolios.some(item=>item.portfolio_id===bestProof));
      assert.equal(detail.shared_portfolios.some(item=>item.skill_id===3),false);
      assert.equal(JSON.stringify(detail).includes('evidence_path'),false);
      assert.equal((await call('/applications/'+applicationA,'GET',null,tokens.outsider)).status,403);
      assert.equal((await call('/applications/'+applicationA,'GET',null,tokens.b)).status,403);
      assert.equal((await call('/portfolios/'+bestProof,'GET',null,tokens.company)).status,403);
      const shared=detail.shared_portfolios[0].id;
      const download=await fetch(`${base}/applications/${applicationA}/evidence/${shared}`,{headers:{Authorization:'Bearer '+tokens.company}});
      assert.equal(download.status,200); assert.match(await download.text(),/^%PDF-/);
      assert.equal((await fetch(`${base}/applications/${applicationA}/evidence/${shared}`,{headers:{Authorization:'Bearer '+tokens.outsider}})).status,403);
      assert.equal((await call('/applications/'+applicationA,'GET',null,tokens.otherTeacher)).status,403);
      assert.equal((await call('/applications/'+applicationA,'GET',null,tokens.teacher)).data.profile.email,undefined);
      assert.equal((await fetch(`${base}/applications/${applicationA}/evidence/${shared}`,{headers:{Authorization:'Bearer '+tokens.teacher}})).status,403);
      assert.equal((await call('/vacancies/'+job,'PATCH',{...data,version:jobVersion},tokens.company)).status,409);
      await proof(studentA,2,95);
      assert.equal((await getJob(tokens.a)).data.matching.match_rate,100);
      assert.equal((await call('/applications/'+applicationA)).data.match_rate,80);
    });
    await t.test('closed and expired vacancies block new applications while existing selection continues',async()=>{
      const second=await apply(tokens.b); assert.equal(second.status,201); applicationB=second.data.id;
      const closed=await call('/vacancies/'+job+'/activity','PATCH',{active:false,version:jobVersion},tokens.company); assert.equal(closed.status,200); jobVersion=closed.data.revision_number;
      assert.equal((await apply(tokens.a)).status,409);
      assert.equal((await call('/vacancies')).data.items.length,0);
      assert.equal((await getJob(tokens.a)).data.matching.can_apply,false);
      const newJob=await call('/vacancies','POST',data,tokens.company);
      await db.execute("UPDATE internship_vacancies SET tenggat_waktu='2000-01-01' WHERE id=?",[newJob.data.id]);
      assert.equal((await call('/vacancies/'+newJob.data.id+'/apply','POST',{version:1,shareConsent:true})).status,409);
    });
    await t.test('acceptance cannot oversubscribe quota and withdrawal immediately revokes proof access',async()=>{
      const decisions=await Promise.all([review(applicationA,1),review(applicationB,1)]);
      assert.deepEqual(decisions.map(item=>item.status).sort(),[200,409]);
      const winner=decisions.find(item=>item.status===200).data.id;
      const winnerToken=winner===applicationA ? tokens.a : tokens.b;
      const loser=winner===applicationA ? applicationB : applicationA;
      const before=(await call('/applications/'+winner,'GET',null,tokens.company)).data;
      const shared=before.shared_portfolios[0].id;
      assert.equal((await getJob()).data.accepted_count,1);
      assert.equal((await call('/applications/'+winner+'/withdraw','POST',{version:1},winnerToken)).status,409);
      assert.equal((await call('/applications/'+winner+'/withdraw','POST',{version:2},winnerToken)).status,200);
      const after=(await call('/applications/'+winner,'GET',null,tokens.company)).data;
      assert.equal(after.profile,null); assert.equal(after.shared_portfolios.length,0); assert.ok(after.consent_revoked_at);
      assert.equal(after.matching,null);
      assert.equal((await fetch(`${base}/applications/${winner}/evidence/${shared}`,{headers:{Authorization:'Bearer '+tokens.company}})).status,403);
      assert.equal((await getJob()).data.accepted_count,0);
      assert.equal((await review(winner,3)).status,409);
      assert.equal((await review(loser,1)).status,200);
      assert.equal((await getJob()).data.accepted_count,1);
    });
    let rejectedId,liveId;
    await t.test('selection notes and final decisions have history; evidence never crosses applications',async()=>{
      const next=await call('/vacancies','POST',{...data,quota:2},tokens.company);
      const applied=await call('/vacancies/'+next.data.id+'/apply','POST',{version:1,shareConsent:true}); rejectedId=applied.data.id;
      assert.equal((await review(rejectedId,1,'reviewed')).status,200);
      assert.equal((await review(rejectedId,1,'rejected')).status,409);
      assert.equal((await review(rejectedId,2,'rejected')).status,200);
      const rejected=(await call('/applications/'+rejectedId,'GET',null,tokens.company)).data;
      assert.equal(rejected.profile,null); assert.equal(rejected.history.length,3);
      assert.equal(rejected.matching,null);
      assert.equal((await review(rejectedId,3)).status,409);
      const other=await call('/vacancies/'+next.data.id+'/apply','POST',{version:1,shareConsent:true},tokens.b); liveId=other.data.id;
      const filtered=await call('/applications/industry?vacancyId='+next.data.id,'GET',null,tokens.company);
      assert.equal(filtered.data.summary.total,2);
      assert.ok(filtered.data.items.every(item=>item.lowongan_id===next.data.id));
      const proofId=(await call('/applications/'+liveId,'GET',null,tokens.company)).data.shared_portfolios[0].id;
      assert.equal((await fetch(`${base}/applications/${rejectedId}/evidence/${proofId}`,{headers:{Authorization:'Bearer '+tokens.company}})).status,403);
      const owned=(await call('/applications/'+rejectedId)).data;
      assert.equal(owned.match_rate,100); assert.ok(owned.selection_note);
      assert.equal((await call('/applications/school','GET',null,tokens.teacher)).status,200);
    });
    await t.test('deactivated institutions, publishers and schools cannot use old JWTs or sharing grants',async()=>{
      await db.execute('UPDATE users SET is_active=0 WHERE id=?',[companyA.user]);
      assert.equal((await call('/applications/industry','GET',null,tokens.company)).status,401);
      assert.equal((await call('/vacancies')).data.items.length,0);
      await db.execute('UPDATE users SET is_active=1 WHERE id=?',[companyA.user]);
      await db.execute('UPDATE industries SET is_active=0 WHERE id=?',[companyA.id]);
      assert.equal((await call('/applications/'+liveId,'GET',null,tokens.company)).status,403);
      await db.execute('UPDATE industries SET is_active=1 WHERE id=?',[companyA.id]);
      await db.execute('UPDATE schools SET is_active=0 WHERE id=?',[schoolB]);
      const unavailable=(await call('/applications/'+liveId,'GET',null,tokens.company)).data;
      assert.equal(unavailable.profile,null); assert.equal(unavailable.shared_portfolios.length,0);
      assert.equal((await call('/applications/mine','GET',null,tokens.b)).status,403);
      assert.equal((await review(liveId,1)).status,403);
      assert.equal((await review(liveId,1,'rejected')).status,200);
    });
  } finally {
    if(server) await new Promise(resolve=>server.close(resolve));
    if(pool) await pool.end();
    if(created) { assert.match(database,/^finetern_recruitment_test_[a-f0-9]{12}$/); await db.query(`DROP DATABASE \`${database}\``); }
    await db.end();
    const resolved=path.resolve(dir);
    assert.ok(resolved.startsWith(path.resolve(os.tmpdir())+path.sep) && path.basename(resolved).startsWith('finetern-recruitment-'));
    await fs.rm(resolved,{recursive:true});
  }
});
