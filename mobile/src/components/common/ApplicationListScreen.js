import React,{useCallback,useRef,useState} from 'react';
import {Text,View,FlatList,Pressable,StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import api from '../../api/axiosClient';
import ScreenHeader from './ScreenHeader';
import PrimaryButton from './PrimaryButton';
import {applicationStatuses} from '../../utils/recruitment';
import {colors,spacing,borderRadius} from '../../utils/theme';

export default function ApplicationListScreen({navigation,route,mode='student',back=false}) {
  const [status,setStatus]=useState(''),[data,setData]=useState({items:[],summary:{}}),[busy,setBusy]=useState(false),[error,setError]=useState(''),[hasMore,setHasMore]=useState(false);
  const generation=useRef(0),vacancyId=route.params?.vacancyId;
  const load=useCallback(async(offset=0)=>{
    const current=++generation.current;setBusy(true);setError('');if(!offset)setData(previous=>({...previous,items:[]}));
    try {
      const response=await api.get('/applications/'+(mode==='industry'?'industry':mode==='school'?'school':'mine'),{params:{offset,status:status||undefined,vacancyId}});
      if(current!==generation.current)return;
      setData(previous=>({...response.data,items:offset?[...previous.items,...response.data.items]:response.data.items}));setHasMore(response.data.items.length===20);
    } catch(failure){if(current===generation.current)setError(failure.message);}
    finally{if(current===generation.current)setBusy(false);}
  },[mode,status,vacancyId]);
  useFocusEffect(useCallback(()=>{load();return()=>{generation.current++;};},[load]));
  return <SafeAreaView style={styles.safe}>
    <ScreenHeader title={mode==='industry'?'Pelamar magang':mode==='school'?'Lamaran siswa sekolah':'Perjalanan lamaranmu'} subtitle={mode==='industry'?'Periksa lamaran dan bukti yang dibagikan siswa, lalu catat hasil seleksi.':'Pantau status dan catatan seleksi yang tercatat di Finetern.'}/>
    <FlatList data={data.items} keyExtractor={item=>String(item.id)} contentContainerStyle={styles.content} refreshing={busy} onRefresh={()=>load()}
      ListHeaderComponent={<View style={styles.header}>
        {back?<PrimaryButton title="Kembali" variant="outline" onPress={()=>navigation.goBack()}/>:null}
        <Text style={styles.body}>Total {data.summary.total||0} · Menunggu {data.summary.pending||0} · Diterima {data.summary.accepted||0}</Text>
        <View style={styles.filters}>{[['','Semua'],...Object.entries(applicationStatuses)].map(([key,label])=><Pressable key={key} accessibilityRole="tab" accessibilityState={{selected:status===key}} style={[styles.filter,status===key&&styles.selected]} onPress={()=>setStatus(key)}><Text style={styles.link}>{label}</Text></Pressable>)}</View>
        {error?<><Text style={styles.error}>{error}</Text><PrimaryButton title="Coba lagi" variant="secondary" onPress={()=>load()} disabled={busy}/></>:null}
      </View>}
      ListEmptyComponent={<Text style={styles.body}>{busy?'Memuat lamaran…':error?'':'Belum ada lamaran pada status ini.'}</Text>}
      renderItem={({item})=><Pressable accessibilityRole="button" style={styles.card} onPress={()=>navigation.navigate('ApplicationDetail',{id:item.id})}>
        <Text style={styles.status}>{applicationStatuses[item.status_lamaran]}{item.legacy?' · Data lama':''}</Text>
        <Text style={styles.title}>{item.vacancy.title}</Text><Text style={styles.body}>{item.vacancy.nama_industri}</Text>
        {mode!=='student'?<Text style={styles.body}>{item.profile?item.profile.nama_lengkap+' · '+item.profile.kelas:'Profil pelamar tidak tersedia melalui lamaran ini.'}</Text>:null}
        <Text style={styles.body}>Skor saat melamar: {item.match_rate.toFixed(2)}% · {new Date(item.applied_at).toLocaleDateString('id-ID')}</Text>
        {item.selection_note?<Text style={styles.body}>Catatan: {item.selection_note}</Text>:null}<Text style={styles.link}>Lihat status dan riwayat →</Text>
      </Pressable>}
      ListFooterComponent={hasMore?<PrimaryButton title="Muat berikutnya" onPress={()=>load(data.items.length)} loading={busy}/>:null}/>
  </SafeAreaView>;
}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:colors.background},content:{padding:spacing.md,gap:spacing.md},header:{gap:spacing.md},filters:{flexDirection:'row',flexWrap:'wrap',gap:spacing.sm},filter:{minHeight:44,padding:spacing.sm,justifyContent:'center',borderWidth:1,borderColor:colors.border,borderRadius:borderRadius.sm},selected:{backgroundColor:colors.primaryLight,borderColor:colors.primary},card:{padding:spacing.md,gap:spacing.sm,backgroundColor:colors.white,borderRadius:borderRadius.lg},title:{fontSize:17,fontWeight:'600',color:colors.textPrimary},body:{color:colors.textSecondary,lineHeight:22},status:{color:colors.primary,fontWeight:'600'},link:{color:colors.primary},error:{color:colors.error,lineHeight:22}});
