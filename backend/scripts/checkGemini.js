const gemini=require('../src/config/gemini');
async function main(){
  const result=await gemini.generateLesson({nama_skill:'RESTful API Integration',kategori:'Frontend Mobile',current_proficiency:40,target_proficiency:70});
  console.log('Koneksi Gemini dan validasi materi berhasil.');
  console.log('Model:',result.model,'| Bagian:',result.lesson.sections.length,'| Soal:',result.lesson.quiz.length);
}
main().catch(error=>{console.error(error.publicMessage||'Pemeriksaan Gemini gagal.');console.error('Kode:',error.code||'AI_CHECK_FAILED');process.exitCode=1;});
