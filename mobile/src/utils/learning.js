export const learningStatuses={legacy:'Materi lama',generating:'Sedang disiapkan',ready:'Siap dipelajari',failed:'Pembuatan belum berhasil'};
export function learningRequest(vacancyId,skillId,version){
  for(const value of [vacancyId,skillId,version])if(!Number.isSafeInteger(value)||value<1)throw new Error('Muat ulang lowongan dan pilih keterampilan yang masih perlu ditingkatkan.');
  return {vacancyId,skillId,version};
}
export function quizRequest(answers,count,attemptKey){
  if(count!==3||answers.length!==count||Array.from({length:count},(_,index)=>answers[index]).some(value=>!Number.isInteger(value)||value<0||value>3))throw new Error('Jawab ketiga soal sebelum mengirim hasil latihan.');
  if(!/^[a-zA-Z0-9_-]{12,64}$/.test(attemptKey))throw new Error('Penanda pengiriman tidak valid. Muat ulang latihan.');
  return {answers:[...answers],attemptKey};
}
