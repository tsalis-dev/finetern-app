import React,{useCallback,useRef,useState} from 'react';
import {Text,View,FlatList,ScrollView,Pressable,StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import api from '../../api/axiosClient';
import ScreenHeader from './ScreenHeader';
import PrimaryButton from './PrimaryButton';
import AppIcon from './AppIcon';
import {applicationStatuses} from '../../utils/recruitment';
import {colors,spacing} from '../../utils/theme';

export default function ApplicationListScreen({navigation,route,mode='student',back=false,embedded=false}) {
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
  return <SafeAreaView style={styles.safe} edges={embedded?[]:['top','left','right']}>
    {!embedded?<ScreenHeader title={mode==='industry'?'Pelamar':mode==='school'?'Lamaran siswa':'Lamaran saya'} subtitle="Pantau status dan catatan seleksi." onBack={back?()=>navigation.goBack():undefined}/>:null}
    <FlatList data={data.items} keyExtractor={item=>String(item.id)} contentContainerStyle={styles.content} refreshing={busy} onRefresh={()=>load()}
      ListHeaderComponent={<View style={styles.header}>
        <Text style={styles.body}>Total {data.summary.total||0} · Menunggu {data.summary.pending||0} · Diterima {data.summary.accepted||0}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>{[['','Semua'],...Object.entries(applicationStatuses)].map(([key,label])=><Pressable key={key} accessibilityRole="tab" accessibilityState={{selected:status===key}} style={[styles.filter,status===key&&styles.selected]} onPress={()=>setStatus(key)}><Text style={[styles.filterLabel,status===key&&styles.activeLabel]}>{label}</Text></Pressable>)}</ScrollView>
        {error?<><Text style={styles.error}>{error}</Text><PrimaryButton title="Coba lagi" variant="secondary" onPress={()=>load()} disabled={busy}/></>:null}
      </View>}
      ListEmptyComponent={<Text style={styles.body}>{busy?'Memuat lamaran…':error?'':'Belum ada lamaran pada status ini.'}</Text>}
      renderItem={({item})=><Pressable accessibilityRole="button" style={({pressed})=>[styles.row,pressed&&styles.pressed]} onPress={()=>navigation.navigate('ApplicationDetail',{id:item.id})}>
        <View style={styles.mark}><AppIcon name="briefcase" size={21}/></View>
        <View style={styles.copy}>
          <Text style={styles.status}>{applicationStatuses[item.status_lamaran]}{item.legacy?' · Data lama':''}</Text>
          <Text numberOfLines={2} style={styles.title}>{item.vacancy.title}</Text><Text style={styles.body}>{item.vacancy.nama_industri}</Text>
          {mode!=='student'?<Text style={styles.body}>{item.profile?item.profile.nama_lengkap+' · '+item.profile.kelas:'Profil pelamar tidak tersedia melalui lamaran ini.'}</Text>:null}
          <Text style={styles.caption}>Dilamar {new Date(item.applied_at).toLocaleDateString('id-ID')} · Skor {item.match_rate.toFixed(2)}%</Text>
          {item.selection_note?<Text style={styles.caption}>Catatan seleksi tersedia di detail</Text>:null}
        </View><AppIcon name="next" size={18} color={colors.textMuted}/>
      </Pressable>}
      ListFooterComponent={hasMore?<PrimaryButton title="Muat berikutnya" onPress={()=>load(data.items.length)} loading={busy}/>:null}/>
  </SafeAreaView>;
}
const styles=StyleSheet.create({
  safe:{flex:1,backgroundColor:colors.background},
  content:{paddingHorizontal:spacing.lg,paddingTop:spacing.md,paddingBottom:spacing.xl},
  header:{gap:12,paddingBottom:8},
  filters:{flexDirection:'row',gap:20,borderBottomWidth:StyleSheet.hairlineWidth,borderColor:colors.border},
  filter:{minHeight:46,paddingVertical:12,justifyContent:'center',borderBottomWidth:2,borderColor:'transparent'},
  selected:{borderColor:colors.primary},
  filterLabel:{fontSize:13,color:colors.textSecondary},
  activeLabel:{color:colors.primary,fontWeight:'700'},
  row:{flexDirection:'row',alignItems:'flex-start',paddingVertical:18,gap:12,borderBottomWidth:StyleSheet.hairlineWidth,borderColor:colors.border},
  mark:{width:38,height:38,borderRadius:10,backgroundColor:colors.primaryLight,alignItems:'center',justifyContent:'center'},
  copy:{flex:1,gap:6},
  title:{fontSize:16,lineHeight:23,fontWeight:'600',color:colors.textPrimary},
  body:{fontSize:13,color:colors.textSecondary,lineHeight:21},
  caption:{fontSize:12,color:colors.textMuted,lineHeight:19},
  status:{fontSize:12,lineHeight:19,color:colors.primary,fontWeight:'600'},
  error:{color:colors.error,lineHeight:22},
  pressed:{opacity:0.65},
});
