import React,{useCallback,useState} from 'react';
import {Text,View,StyleSheet} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import api from '../../api/axiosClient';
import FormScreen from '../../components/common/FormScreen';
import PrimaryButton from '../../components/common/PrimaryButton';
import {useAuthStore} from '../../store/useAuthStore';
import {colors,spacing,borderRadius} from '../../utils/theme';

export default function IndustryDashboardScreen({navigation}) {
  const user=useAuthStore(state=>state.user);
  const [data,setData]=useState(null),[error,setError]=useState('');
  useFocusEffect(useCallback(()=>{
    let active=true;
    Promise.all([api.get('/vacancies/mine'),api.get('/applications/industry')]).then(([vacancies,applications])=>{
      if(active){setData({vacancies:vacancies.data.summary,applications:applications.data.summary});setError('');}
    }).catch(failure=>{if(active)setError(failure.message);});
    return()=>{active=false;};
  },[]));
  return <FormScreen title={user?.nama||'Dashboard industri'} subtitle="Buka kesempatan magang dan kelola proses seleksi siswa berdasarkan bukti keterampilan.">
    {error?<Text style={styles.error}>{error}</Text>:null}
    <View style={styles.metrics}>{[
      ['Lowongan aktif',data?.vacancies.active],
      ['Lamaran masuk',data?.applications.total],
      ['Menunggu seleksi',data?.applications.pending],
      ['Diterima',data?.applications.accepted],
    ].map(([label,value])=><View key={label} style={styles.metric}><Text style={styles.value}>{value??'…'}</Text><Text style={styles.body}>{label}</Text></View>)}</View>
    <View style={styles.card}><Text style={styles.heading}>Temukan calon peserta magang</Text><Text style={styles.body}>Tetapkan keterampilan wajib, nilai minimum, dan bobot yang sesuai pekerjaan. Siswa melamar setelah memenuhi syarat.</Text><PrimaryButton title="+ Terbitkan lowongan" onPress={()=>navigation.navigate('VacancyForm')}/><PrimaryButton title="Kelola lowongan" variant="secondary" onPress={()=>navigation.navigate('Lowongan')}/></View>
    <View style={styles.card}><Text style={styles.heading}>Periksa lamaran dan karya</Text><Text style={styles.body}>Profil dan bukti relevan tersedia setelah siswa menyetujui berbagi data saat melamar. Catat hasil seleksi agar siswa dan sekolah dapat memantaunya.</Text><PrimaryButton title="Lihat pelamar" variant="secondary" onPress={()=>navigation.navigate('Pelamar')}/></View>
  </FormScreen>;
}
const styles=StyleSheet.create({metrics:{flexDirection:'row',flexWrap:'wrap',gap:spacing.sm},metric:{flexGrow:1,flexBasis:'45%',padding:spacing.md,backgroundColor:colors.white,borderRadius:borderRadius.lg,gap:spacing.sm},value:{fontSize:28,fontWeight:'700',color:colors.primary},card:{padding:spacing.md,gap:spacing.md,backgroundColor:colors.white,borderRadius:borderRadius.lg},heading:{fontSize:18,fontWeight:'600',color:colors.textPrimary},body:{color:colors.textSecondary,lineHeight:22},error:{color:colors.error}});
