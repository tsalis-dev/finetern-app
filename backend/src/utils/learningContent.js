const PROMPT_VERSION='finetern-learning-v1';
function aiProblem(status,code,message) { return Object.assign(new Error(message),{statusCode:status,code,publicMessage:message}); }
const badResponse=()=>aiProblem(502,'AI_BAD_RESPONSE','Materi dari Gemini belum dapat digunakan. Coba buat ulang setelah beberapa saat.');
const string={type:'string'};
const strings=(min,max)=>({type:'array',minItems:min,maxItems:max,items:string});
const object=(properties)=>({type:'object',properties,required:Object.keys(properties),additionalProperties:false});
const lessonSchema=object({
  title:string,objectives:strings(1,4),
  sections:{type:'array',minItems:2,maxItems:4,items:object({title:string,body:string})},
  miniProject:object({title:string,instructions:string,criteria:strings(1,5)}),
  quiz:{type:'array',minItems:3,maxItems:3,items:object({question:string,options:strings(4,4),correctIndex:{type:'integer',minimum:0,maximum:3},explanation:string})},
});
function text(value,max) {
  if(typeof value!=='string'||!value.trim()||value.trim().length>max)throw badResponse();
  return value.trim();
}
function list(value,min,max,convert) {
  if(!Array.isArray(value)||value.length<min||value.length>max)throw badResponse();
  return value.map(convert);
}
function validateLesson(value) {
  if(!value||typeof value!=='object'||Array.isArray(value))throw badResponse();
  const mini=value.miniProject;
  if(!mini||typeof mini!=='object')throw badResponse();
  return {
    title:text(value.title,200),objectives:list(value.objectives,1,4,item=>text(item,250)),
    sections:list(value.sections,2,4,item=>{if(!item)throw badResponse();return {title:text(item.title,120),body:text(item.body,2000)};}),
    miniProject:{title:text(mini.title,150),instructions:text(mini.instructions,1500),criteria:list(mini.criteria,1,5,item=>text(item,250))},
    quiz:list(value.quiz,3,3,item=>{
      if(!item||!Number.isInteger(item.correctIndex)||item.correctIndex<0||item.correctIndex>3)throw badResponse();
      const options=list(item.options,4,4,option=>text(option,300));
      if(new Set(options.map(option=>option.toLowerCase())).size!==4)throw badResponse();
      return {question:text(item.question,500),options,correctIndex:item.correctIndex,explanation:text(item.explanation,800)};
    }),
  };
}
function parseLesson(raw) {
  if(typeof raw!=='string'||Buffer.byteLength(raw)>40000)throw badResponse();
  let value;try{value=JSON.parse(raw);}catch{throw badResponse();}
  return validateLesson(value);
}
function gradeQuiz(quiz,answers) {
  if(!Array.isArray(answers)||answers.length!==3||answers.some(value=>!Number.isInteger(value)||value<0||value>3))throw Object.assign(new Error('Jawab ketiga soal dengan satu pilihan yang valid.'),{statusCode:400});
  const correctCount=answers.reduce((count,answer,index)=>count+Number(answer===quiz[index].correctIndex),0);
  const score=Math.round(correctCount/3*100);
  return {score,correct_count:correctCount,passed:score>=80,feedback:quiz.map((item,index)=>({questionId:index,selectedIndex:answers[index],correctIndex:item.correctIndex,isCorrect:answers[index]===item.correctIndex,explanation:item.explanation}))};
}
module.exports={PROMPT_VERSION,lessonSchema,aiProblem,parseLesson,validateLesson,gradeQuiz};
