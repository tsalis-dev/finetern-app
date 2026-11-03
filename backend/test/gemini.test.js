const {test}=require('node:test');
const assert=require('node:assert/strict');
const lesson=require('./fixtures/learningLesson');
const {parseLesson,gradeQuiz}=require('../src/utils/learningContent');
const gemini=require('../src/config/gemini');

test('structured lesson validation rejects malformed and ambiguous quizzes',()=>{
  assert.equal(parseLesson(JSON.stringify(lesson)).quiz.length,3);
  for(const raw of ['not JSON','[]','{"title":"Incomplete"}',JSON.stringify({...lesson,quiz:lesson.quiz.slice(0,2)}),JSON.stringify({...lesson,quiz:lesson.quiz.map((item,index)=>index?item:{...item,options:['Same','Same','Other','Another']})}),JSON.stringify({...lesson,sections:[{title:'Too long',body:'x'.repeat(2500)},lesson.sections[1]]})])assert.throws(()=>parseLesson(raw),error=>error.code==='AI_BAD_RESPONSE');
  assert.equal(gradeQuiz(lesson.quiz,[3,3,3]).score,0);
  assert.equal(gradeQuiz(lesson.quiz,[0,1,3]).score,67);
  assert.equal(gradeQuiz(lesson.quiz,[0,1,2]).passed,true);
  assert.throws(()=>gradeQuiz(lesson.quiz,['0',1,2]),error=>error.statusCode===400);
});
test('Gemini uses bounded structured output and sends no learner identifiers',async t=>{
  const previousKey=process.env.GEMINI_API_KEY,previousModel=process.env.GEMINI_MODEL;
  process.env.GEMINI_API_KEY='test-only-private-key';process.env.GEMINI_MODEL='gemini-3.5-flash-lite';
  try{
    const client=gemini.getGeminiClient();
    const mock=t.mock.method(client.models,'generateContent',async params=>{
      assert.equal(params.model,'gemini-3.5-flash-lite');assert.equal(params.config.responseMimeType,'application/json');
      assert.ok(params.config.responseJsonSchema);assert.ok(params.config.maxOutputTokens<=4500);assert.ok(params.config.abortSignal);
      const input=JSON.parse(params.contents);
      assert.deepEqual(Object.keys(input).sort(),['category','currentProficiency','skillName','targetProficiency'].sort());
      assert.equal(JSON.stringify(params).includes('student-private@example.invalid'),false);
      assert.equal(JSON.stringify(params).includes(process.env.GEMINI_API_KEY),false);
      return {candidates:[{finishReason:'STOP'}],text:JSON.stringify(lesson)};
    });
    const result=await gemini.generateLesson({nama_skill:'Integrasi API',kategori:'Mobile',current_proficiency:40,target_proficiency:70,email:'student-private@example.invalid'});
    assert.equal(result.lesson.title,lesson.title);
    for(const [status,code] of [[429,'AI_QUOTA'],[403,'AI_CONFIGURATION'],[504,'AI_TIMEOUT']]){
      mock.mock.mockImplementation(async()=>{throw Object.assign(new Error('private-provider-detail'),{status});});
      await assert.rejects(gemini.generateLesson({}),error=>error.code===code&&!error.publicMessage.includes('private-provider-detail'));
    }
    mock.mock.mockImplementation(async()=>({candidates:[{finishReason:'STOP'}],text:'invalid'}));
    await assert.rejects(gemini.generateLesson({}),error=>error.code==='AI_BAD_RESPONSE');
    mock.mock.mockImplementation(async()=>({candidates:[{finishReason:'MAX_TOKENS'}],text:JSON.stringify(lesson)}));
    await assert.rejects(gemini.generateLesson({}),error=>error.code==='AI_BAD_RESPONSE');
    process.env.GEMINI_API_KEY='your_gemini_api_key_here';
    assert.equal(gemini.configuration().configured,false);
    assert.throws(()=>gemini.getGeminiClient(),error=>error.code==='AI_NOT_CONFIGURED');
  }finally{
    if(previousKey===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=previousKey;
    if(previousModel===undefined)delete process.env.GEMINI_MODEL;else process.env.GEMINI_MODEL=previousModel;
  }
});
