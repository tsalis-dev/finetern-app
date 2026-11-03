import React,{useCallback,useState} from 'react';
import {Text,View,Pressable,Alert,StyleSheet} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import api from '../../api/axiosClient';
import {useAuthStore} from '../../store/useAuthStore';
import FormScreen from '../../components/common/FormScreen';
import PrimaryButton from '../../components/common/PrimaryButton';
import {applicationPayload,formatAllowance,formatDeadline,workModes} from '../../utils/recruitment';
import {colors,spacing,borderRadius} from '../../utils/theme';

export default function VacancyDetailScreen({route,navigation}) {
  const id=route.params.id,role=useAuthStore(state=>state.role);
  const [data,setData]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[consent,setConsent]=useState(false);
  const load=useCallback(async()=>{const result=await api.get('/vacancies/'+id);setData(result.data);setConsent(false);},[id]);
  useFocusEffect(useCallback(()=>{let active=true;api.get('/vacancies/'+id).then(result=>{if(active){setData(result.data);setConsent(false);setError('');}}).catch(failure=>{if(active)setError(failure.message);});return()=>{active=false;};},[id]));
  const run=async task=>{setBusy(true);setError('');try{await task();}catch(failure){setError(failure.message);}finally{setBusy(false);}};
  const apply=()=>{
    let body;try{body=applicationPayload(data.revision_number,consent);}catch(failure){setError(failure.message);return;}
    Alert.alert('Kirim lamaran?', 'Profil dasar dan karya terbaik yang relevan akan dibagikan hanya kepada industri tujuan.',[{text:'Batal',style:'cancel'},{text:'Kirim lamaran',onPress:()=>run(async()=>{const result=await api.post('/vacancies/'+id+'/apply',body);navigation.replace('ApplicationDetail',{id:result.data.id});})}]);
  };
  const toggle=()=>Alert.alert(data.status_aktif?'Tutup lowongan?':'Buka lowongan?', 'Status ini mengatur penerimaan lamaran baru. Lamaran yang sudah masuk tetap dapat diproses.',[{text:'Batal',style:'cancel'},{text:'Simpan',onPress:()=>run(async()=>{await api.patch('/vacancies/'+id+'/activity',{active:!data.status_aktif,version:data.revision_number});await load();})}]);
  return <FormScreen title={data?.title||'Rincian lowongan'} subtitle={data?.nama_industri||'Memuat posisi magang…'}>
    {error?<Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text>:null}
    {data?<>
      <View style={styles.card}><Text style={styles.heading}>{data.lokasi||data.kota_domisili} · {workModes[data.tipe_kerja]||'Sistem kerja belum diisi'}</Text><Text style={styles.body}>{formatAllowance(data.uang_saku)}</Text><Text style={styles.body}>Batas lamaran: {formatDeadline(data.tenggat_waktu)} (WIB)</Text><Text style={styles.body}>Sisa kuota {data.remaining_quota} dari {data.kuota} · {data.status_aktif?'Dibuka':'Ditutup'}</Text><Text style={styles.body}>{data.deskripsi}</Text></View>
      {data.legacy?<Text style={styles.body}>Lowongan ini berasal dari data lama dan belum tampil di katalog. Lengkapi identitas posisi dan persyaratannya, atau buat lowongan baru jika sudah ada riwayat lamaran.</Text>:null}
      {data.matching?<View style={styles.card}><Text style={styles.score}>{data.matching.match_rate.toFixed(2)}% cocok</Text><Text style={styles.body}>{data.matching.reason}</Text><Text style={styles.body}>Dihitung dari karya yang sudah dinilai guru. Skor minimal 80% dan seluruh keterampilan wajib harus memenuhi nilai minimum.</Text></View>:null}
      <Text style={styles.heading}>Keterampilan yang dibutuhkan</Text>
      {(data.matching?.requirements||data.requirements).map(item=><View key={item.skill_id} style={styles.card}>
        <Text style={styles.heading}>{item.nama_skill}</Text><Text style={styles.body}>{item.importance==='wajib'?'Wajib':'Nilai tambah'} · Nilai minimum {item.min_proficiency}/100 · Bobot {item.weight}</Text>
        {data.matching?<Text style={item.meets_requirement?styles.met:styles.body}>Nilai tervalidasimu {item.current_proficiency}/100{item.meets_requirement?' · Memenuhi':` · Kurang ${item.missing_points} poin`}</Text>:null}
      </View>)}
      {role==='industri'?<>
        {data.can_edit?<PrimaryButton title="Edit isi dan persyaratan" variant="secondary" disabled={busy} onPress={()=>navigation.navigate('VacancyForm',{id})}/>:<Text style={styles.body}>Persyaratan terkunci karena sudah ada lamaran. Buat lowongan baru untuk kebutuhan berbeda.</Text>}
        <PrimaryButton title={data.status_aktif?'Tutup lowongan':'Buka lowongan'} variant="outline" onPress={toggle} disabled={busy}/>
        <PrimaryButton title="Lihat pelamar lowongan ini" onPress={()=>navigation.navigate('VacancyApplications',{vacancyId:id})} disabled={busy}/>
      </>:data.matching?.application_id?<PrimaryButton title="Lihat lamaranmu" onPress={()=>navigation.navigate('ApplicationDetail',{id:data.matching.application_id})}/>:data.matching?.can_apply?<>
        <Pressable accessibilityRole="checkbox" accessibilityState={{checked:consent}} style={[styles.consent,consent&&styles.checked]} onPress={()=>setConsent(value=>!value)} disabled={busy}>
          <Text style={styles.heading}>{consent?'✓ Disetujui':'○ Persetujuan berbagi data'}</Text><Text style={styles.body}>Saya mengizinkan industri ini melihat nama, email, sekolah, jurusan, kelas, nilai keterampilan saat melamar, dan karya terbaik yang relevan dengan syarat lowongan. Akses rincian profil dan bukti berhenti jika lamaran ditarik atau ditolak. Status, catatan, dan skor total tetap tercatat sebagai riwayat. Salinan yang sudah disimpan penerima berada di luar kendali aplikasi.</Text>
        </Pressable>
        <PrimaryButton title="Kirim lamaran" onPress={apply} disabled={!consent||busy}/>
      </>:null}
    </>:null}
    <PrimaryButton title="Muat ulang lowongan" variant="secondary" onPress={()=>run(load)} loading={busy}/>
    <PrimaryButton title="Kembali" variant="outline" onPress={()=>navigation.goBack()} disabled={busy}/>
  </FormScreen>;
}
const styles=StyleSheet.create({card:{padding:spacing.md,gap:spacing.sm,backgroundColor:colors.white,borderRadius:borderRadius.lg},heading:{fontSize:17,fontWeight:'600',color:colors.textPrimary},body:{color:colors.textSecondary,lineHeight:22},score:{fontSize:28,fontWeight:'700',color:colors.primary},met:{color:colors.primary,lineHeight:22},error:{color:colors.error,lineHeight:22},consent:{padding:spacing.md,gap:spacing.sm,borderWidth:1,borderColor:colors.border,borderRadius:borderRadius.lg,backgroundColor:colors.white},checked:{borderColor:colors.primary,backgroundColor:colors.primaryLight}});
