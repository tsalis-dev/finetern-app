const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../src/utils/recruitment.js'),'utf8').replace(/^export /gm,'');
const moduleContext={exports:{}};
vm.runInNewContext(source+'\nmodule.exports={vacancyPayload,applicationPayload,selectionPayload,formatAllowance,firstSkillGap,vacancyStatus};',{module:moduleContext,URL,Intl});
const {vacancyPayload,applicationPayload,selectionPayload,formatAllowance}=moduleContext.exports;
const {firstSkillGap}=moduleContext.exports;
const {vacancyStatus}=moduleContext.exports;
const values={title:' Mobile Intern ',deskripsi:' Belajar implementasi antarmuka dan API ',location:' Bandung ',workMode:'hybrid',allowance:'1500000',quota:'2',deadline:'2027-01-31'};
const requirements=[{skillId:1,importance:'wajib',weight:'10',minProficiency:'70'}];

test('vacancy cards follow server eligibility even with a high match score and retain application status',()=>{
  const blocked={match_rate:91.42,can_apply:false,application_id:null};
  assert.equal(vacancyStatus(blocked).label,'Syarat belum terpenuhi');
  assert.equal(vacancyStatus({...blocked,match_rate:100}).tone,'warning');
  assert.equal(vacancyStatus({...blocked,can_apply:true}).label,'Bisa dilamar');
  for(const can_apply of [true,false])assert.equal(vacancyStatus({...blocked,can_apply,application_id:7}).label,'Sudah dilamar');
  assert.equal(blocked.can_apply,false);
});

test('learning guidance prioritizes an unmet mandatory skill without changing requirement order',()=>{
  const extra={skill_id:1,importance:'nilai_tambah',missing_points:20};
  const mandatory={skill_id:2,importance:'wajib',missing_points:15};
  const met={skill_id:3,importance:'wajib',missing_points:0};
  const items=[extra,met,mandatory];
  assert.equal(firstSkillGap(items),mandatory);
  assert.equal(items[0],extra);
  assert.equal(firstSkillGap([met,extra]),extra);
  assert.equal(firstSkillGap([met]),null);
  assert.equal(firstSkillGap([]),null);
});

test('vacancy form sends complete numeric requirements and preserves legacy edit version zero',()=>{
  const body=vacancyPayload(values,requirements,0);
  assert.equal(body.title,'Mobile Intern');assert.equal(body.location,'Bandung');assert.equal(body.allowance,1500000);
  assert.equal(body.requirements[0].minProficiency,70);assert.equal(body.requirements[0].weight,10);assert.equal(body.version,0);
  assert.equal(vacancyPayload({...values,allowance:''},requirements).allowance,null);
  assert.equal(vacancyPayload({...values,allowance:'0'},requirements).allowance,0);
});
test('incomplete, ambiguous or invalid vacancy requirements are rejected before submission',()=>{
  assert.throws(()=>vacancyPayload(values,[]),/1–20/);
  assert.throws(()=>vacancyPayload(values,[...requirements,...requirements]),/berulang/);
  assert.throws(()=>vacancyPayload({...values,deadline:'2027-02-30'},requirements),/tanggal/);
  assert.throws(()=>vacancyPayload({...values,title:' '},requirements),/judul/);
  for(const weight of ['','0','101','1.5','1e2'])assert.throws(()=>vacancyPayload(values,[{...requirements[0],weight}]),/Bobot/);
  assert.throws(()=>vacancyPayload(values,[{...requirements[0],minProficiency:'0'}]),/Nilai minimum/);
  assert.throws(()=>vacancyPayload({...values,quota:'0'},requirements),/Kuota/);
});
test('application requires explicit consent and a current non-legacy version',()=>{
  for(const consent of [false,undefined,'true',1])assert.throws(()=>applicationPayload(2,consent),/Setujui/);
  assert.throws(()=>applicationPayload(0,true),/Versi/);
  const body=applicationPayload(2,true);
  assert.equal(body.shareConsent,true);assert.equal(body.version,2);assert.equal(Object.hasOwn(body,'match_rate'),false);
});
test('selection decisions bind a note to the version that was inspected',()=>{
  assert.throws(()=>selectionPayload('accepted',' ',2),/catatan/);
  assert.throws(()=>selectionPayload('pending','Ubah',2),/keputusan/);
  const body=selectionPayload('reviewed',' Jadwal seleksi akan dijelaskan di catatan ',2);
  assert.equal(body.status,'reviewed');assert.equal(body.version,2);assert.equal(body.note,'Jadwal seleksi akan dijelaskan di catatan');
  assert.equal(formatAllowance(null),'Uang saku belum dicantumkan');
});
