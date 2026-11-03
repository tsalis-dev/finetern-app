import React,{useCallback,useRef,useState} from 'react';
import {Text,View,Pressable,StyleSheet} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import api from '../../api/axiosClient';
import FormScreen from '../../components/common/FormScreen';
import PrimaryButton from '../../components/common/PrimaryButton';
import {learningStatuses,quizRequest} from '../../utils/learning';
import {colors,spacing,borderRadius} from '../../utils/theme';

export default function LearningModuleScreen({route,navigation}){
  const id=route.params.id;
  const [data,setData]=useState(null),[answers,setAnswers]=useState([]),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
  const attemptKey=useRef(null);
  const load=useCallback(async()=>{const result=await api.get('/ai/modules/'+id);setData(result.data);},[id]);
  useFocusEffect(useCallback(()=>{let active=true;api.get('/ai/modules/'+id).then(result=>{if(active){setData(result.data);setError('');}}).catch(failure=>{if(active)setError(failure.message);});return()=>{active=false;};},[id]));
  const submit=async()=>{
    setError('');setMessage('');
    if(!attemptKey.current)attemptKey.current='quiz-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,12);
    let body;try{body=quizRequest(answers,data.quiz.length,attemptKey.current);}catch(failure){setError(failure.message);return;}
    setBusy(true);
    try{await api.post('/ai/modules/'+id+'/assessments',body);attemptKey.current=null;setMessage('Hasil latihan tercatat. Nilai keterampilan tervalidasi tidak berubah dari hasil kuis.');await load();}
    catch(failure){setError(failure.message);}finally{setBusy(false);}
  };
  const content=data?.content;
  return <FormScreen title={data?.title||'Modul belajar'} subtitle={data?data.nama_skill+' · '+learningStatuses[data.generation_status]:'Memuat materi…'}>
    {error?<Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text>:null}
    {message?<Text accessibilityLiveRegion="polite" style={styles.notice}>{message}</Text>:null}
    {data?.source_context?<Text style={styles.body}>Untuk {data.source_context.vacancy.title}. Kebutuhan saat modul dibuat: {data.source_context.skill.current_proficiency} → {data.source_context.skill.target_proficiency}/100.</Text>:null}
    {data?.generation_status==='generating'?<Text style={styles.body}>Gemini masih menyiapkan materi. Muat ulang beberapa saat lagi; tidak perlu membuat permintaan baru.</Text>:null}
    {data?.generation_status==='failed'?<Text style={styles.body}>Materi ini belum berhasil disiapkan. Kembali ke kebutuhan lowongan untuk mencoba lagi jika masih diperlukan.</Text>:null}
    {data?.legacy?<Text selectable style={styles.body}>{data.legacy_content||'Modul lama belum memakai format belajar dan kuis terbaru.'}</Text>:null}
    {content?<>
      <Text style={styles.body}>Materi dibuat dengan Gemini · Estimasi {data.estimated_minutes} menit. Telaah materi dan diskusikan dengan guru bila ada bagian yang meragukan.</Text>
      <View style={styles.card}><Text style={styles.heading}>Tujuan belajar</Text>{content.objectives.map((objective,index)=><Text key={index} style={styles.body}>• {objective}</Text>)}</View>
      {content.sections.map((section,index)=><View key={index} style={styles.card}><Text style={styles.heading}>{section.title}</Text><Text selectable style={styles.body}>{section.body}</Text></View>)}
      <View style={styles.card}><Text style={styles.heading}>Mini proyek: {content.miniProject.title}</Text><Text selectable style={styles.body}>{content.miniProject.instructions}</Text>{content.miniProject.criteria.map((criterion,index)=><Text key={index} style={styles.body}>• {criterion}</Text>)}<PrimaryButton title="Ajukan bukti hasil mini proyek" variant="secondary" disabled={busy} onPress={()=>navigation.navigate('PortfolioForm',{skillId:data.skill_id,suggestedTitle:content.miniProject.title})}/></View>
      <Text style={styles.heading}>Kuis latihan</Text><Text style={styles.body}>Jawab tiga soal. Nilai lulus minimal 80; pada latihan tiga soal ini semua jawaban perlu benar. Latihan dapat diulang untuk belajar dan tidak memvalidasi keterampilan secara otomatis.</Text>
      {data.quiz.map((question,index)=><View key={question.id} style={styles.card}><Text style={styles.heading}>{index+1}. {question.question}</Text>{question.options.map((option,optionIndex)=><Pressable key={optionIndex} accessibilityRole="radio" accessibilityState={{checked:answers[index]===optionIndex}} disabled={busy} style={[styles.option,answers[index]===optionIndex&&styles.selected]} onPress={()=>{setAnswers(current=>{const next=[...current];next[index]=optionIndex;return next;});attemptKey.current=null;}}><Text style={styles.body}>{String.fromCharCode(65+optionIndex)}. {option}</Text></Pressable>)}</View>)}
      <PrimaryButton title="Periksa jawaban latihan" onPress={submit} loading={busy}/>
      {data.last_attempt?<View style={styles.card}><Text style={styles.heading}>Hasil terakhir: {data.last_attempt.score}/100</Text><Text style={styles.body}>{data.last_attempt.passed?'Latihan selesai dengan nilai lulus.':'Pelajari kembali bagian yang perlu ditingkatkan, lalu coba latihan lagi.'} Nilai terbaik {data.progress.best_score}/100 dari {data.progress.attempt_count} latihan.</Text>{data.last_attempt.feedback.map((item,index)=><View key={item.questionId} style={styles.feedback}><Text style={styles.heading}>Soal {index+1}: {item.isCorrect?'Benar':'Perlu dipelajari lagi'}</Text><Text style={styles.body}>Jawaban yang tepat: {String.fromCharCode(65+item.correctIndex)}. {data.quiz[index].options[item.correctIndex]}</Text><Text style={styles.body}>{item.explanation}</Text></View>)}</View>:null}
    </>:null}
    <PrimaryButton title="Muat ulang modul" variant="secondary" disabled={busy} onPress={async()=>{setError('');try{await load();}catch(failure){setError(failure.message);}}}/>
    <PrimaryButton title="Kembali" variant="outline" disabled={busy} onPress={()=>navigation.goBack()}/>
  </FormScreen>;
}
const styles=StyleSheet.create({card:{padding:spacing.md,gap:spacing.md,backgroundColor:colors.white,borderRadius:borderRadius.lg},heading:{fontSize:17,fontWeight:'600',color:colors.textPrimary},body:{color:colors.textSecondary,lineHeight:22},option:{minHeight:48,padding:spacing.md,justifyContent:'center',borderWidth:1,borderColor:colors.border,borderRadius:borderRadius.md},selected:{backgroundColor:colors.primaryLight,borderColor:colors.primary},feedback:{gap:spacing.sm,paddingTop:spacing.sm},notice:{color:colors.primary,lineHeight:22},error:{color:colors.error,lineHeight:22}});
