const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../src/utils/learning.js'),'utf8').replace(/^export /gm,'');
const context={exports:{}};
vm.runInNewContext(source+'\nmodule.exports={learningRequest,quizRequest};',{module:context});
const {learningRequest,quizRequest}=context.exports;

test('learning requests bind the skill to a current vacancy version',()=>{
  assert.equal(JSON.stringify(learningRequest(12,3,2)),JSON.stringify({vacancyId:12,skillId:3,version:2}));
  for(const invalid of [0,-1,1.5,'1',null,undefined,NaN,Number.MAX_SAFE_INTEGER+1]){
    assert.throws(()=>learningRequest(invalid,3,2));
    assert.throws(()=>learningRequest(12,invalid,2));
    assert.throws(()=>learningRequest(12,3,invalid));
  }
});
test('quiz requires every answer including sparse choices and sends no client score',()=>{
  const key='quiz-0123456789abcdef';
  const sparse=[];sparse[2]=1;
  for(const answers of [[],[0],[0,1],sparse,[undefined,1,2],[0,1,4],[0,1,-1],[0,1,1.5],['0',1,2],[0,1,2,3]])assert.throws(()=>quizRequest(answers,3,key),/ketiga/);
  assert.throws(()=>quizRequest([0,1,2],4,key));
  for(const badKey of ['short','contains spaces in key','x'.repeat(65)])assert.throws(()=>quizRequest([0,1,2],3,badKey),/Penanda/);
  const answers=[0,1,2],body=quizRequest(answers,3,key);
  assert.equal(JSON.stringify(Object.keys(body)),JSON.stringify(['answers','attemptKey']));
  assert.equal(JSON.stringify(body.answers),JSON.stringify(answers));
  answers[0]=3;assert.equal(body.answers[0],0);
});
