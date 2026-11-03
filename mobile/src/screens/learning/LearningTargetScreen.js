import React,{useCallback,useState} from 'react';
import {Text,View,StyleSheet} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import api from '../../api/axiosClient';
import FormScreen from '../../components/common/FormScreen';
import PrimaryButton from '../../components/common/PrimaryButton';
import {learningRequest} from '../../utils/learning';
import {colors,spacing,borderRadius} from '../../utils/theme';

export default function LearningTargetScreen({route,navigation}){
  const {vacancyId,skillId}=route.params;
  const [data,setData]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const load=useCallback(async()=>{const result=await api.get('/ai/gaps/'+vacancyId);setData(result.data);},[vacancyId]);
  useFocusEffect(useCallback(()=>{let active=true;api.get('/ai/gaps/'+vacancyId).then(result=>{if(active){setData(result.data);setError('');}}).catch(failure=>{if(active)setError(failure.message);});return()=>{active=false;};},[vacancyId]));
  const gap=data?.gaps.find(item=>item.id===skillId);
  const start=async()=>{
    if(gap.module_id){navigation.navigate('LearningModule',{id:gap.module_id});return;}
    setBusy(true);setError('');
    try{
      const body=learningRequest(vacancyId,skillId,data.vacancy.revision_number);
      const result=await api.post('/ai/generate-sprint',body,{timeout:65000});
      navigation.replace('LearningModule',{id:result.data.id});
    }catch(failure){setError(failure.message);}finally{setBusy(false);}
  };
  return <FormScreen title={gap?.nama_skill||'Siapkan langkah belajarmu'} subtitle={data?data.vacancy.title+' · '+data.vacancy.nama_industri:'Memuat kebutuhan keterampilan…'}>
    {error?<Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text>:null}
    {gap?<>
      <View style={styles.card}><Text style={styles.heading}>Nilai tervalidasi {gap.current_proficiency}/100</Text><Text style={styles.body}>Target lowongan {gap.target_proficiency}/100 · Masih kurang {gap.missing_points} poin</Text><Text style={styles.body}>{gap.importance==='wajib'?'Keterampilan ini wajib memenuhi nilai minimum.':'Keterampilan ini menjadi nilai tambah pada kecocokan total.'}</Text></View>
      <View style={styles.card}><Text style={styles.heading}>Materi singkat dan latihan proyek</Text><Text style={styles.body}>Gemini menyusun penjelasan, contoh, satu mini proyek, dan tiga soal latihan. Estimasi belajar 15 menit. Materi AI perlu dipahami dan ditelaah; diskusikan dengan guru jika ada bagian yang meragukan.</Text><Text style={styles.body}>Topik keterampilan dan tingkat kebutuhan digunakan untuk membuat materi. Nama, email, berkas, dan jawaban kuismu tidak dikirim ke Gemini.</Text></View>
      <Text style={styles.body}>Kuis mencatat progres belajar. Untuk meningkatkan nilai tervalidasi dan kecocokan, kerjakan mini proyek lalu ajukan bukti kepada guru.</Text>
      {gap.module_id?<Text style={styles.body}>Modul untuk kebutuhan ini sudah tersedia atau sedang disiapkan; tidak perlu membuat permintaan baru.</Text>:<Text style={styles.body}>Sisa pembuatan baru {data.remaining_requests}/{data.daily_limit} dalam 24 jam. Modul yang sudah dibuat akan digunakan kembali.</Text>}
      {!data.configuration.configured&&!gap.module_id?<Text style={styles.body}>Pembuatan materi baru belum tersedia. Pengelola perlu menyiapkan layanan Gemini.</Text>:null}
      <PrimaryButton title={gap.module_id?'Buka modul yang tersimpan':'Buat materi belajar dengan Gemini'} onPress={start} loading={busy} disabled={!gap.module_id&&(!data.configuration.configured||data.remaining_requests===0)}/>
      {busy?<Text accessibilityLiveRegion="polite" style={styles.body}>Materi sedang disiapkan. Proses dapat memerlukan beberapa saat.</Text>:null}
    </>:data?<Text style={styles.body}>Keterampilan ini sudah memenuhi kebutuhan, atau tidak menjadi kekurangan pada lowongan tersebut. Pilih kekurangan lain dari rincian lowongan.</Text>:null}
    <PrimaryButton title="Periksa kebutuhan terbaru" variant="secondary" disabled={busy} onPress={async()=>{setError('');try{await load();}catch(failure){setError(failure.message);}}}/>
    <PrimaryButton title="Kembali" variant="outline" disabled={busy} onPress={()=>navigation.goBack()}/>
  </FormScreen>;
}
const styles=StyleSheet.create({card:{padding:spacing.md,gap:spacing.sm,backgroundColor:colors.white,borderRadius:borderRadius.lg},heading:{fontSize:18,fontWeight:'600',color:colors.textPrimary},body:{color:colors.textSecondary,lineHeight:22},error:{color:colors.error,lineHeight:22}});
