import React,{useCallback,useRef,useState} from 'react';
import {Text,View,FlatList,Pressable,StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import api from '../../api/axiosClient';
import ScreenHeader from './ScreenHeader';
import CustomInput from './CustomInput';
import PrimaryButton from './PrimaryButton';
import {formatAllowance,formatDeadline,workModes} from '../../utils/recruitment';
import {colors,spacing,borderRadius} from '../../utils/theme';

export default function VacancyListScreen({navigation,own=false,embedded=false}) {
  const [input,setInput]=useState(''),[query,setQuery]=useState('');
  const [items,setItems]=useState([]),[busy,setBusy]=useState(false),[error,setError]=useState(''),[hasMore,setHasMore]=useState(false);
  const generation=useRef(0);
  const load=useCallback(async(offset=0)=>{
    const current=++generation.current;setBusy(true);setError('');if(!offset)setItems([]);
    try {
      const response=await api.get(own?'/vacancies/mine':'/vacancies',{params:{offset,q:query}});
      if(current!==generation.current)return;
      setItems(previous=>offset?[...previous,...response.data.items]:response.data.items);setHasMore(response.data.items.length===20);
    } catch(failure){if(current===generation.current)setError(failure.message);}
    finally{if(current===generation.current)setBusy(false);}
  },[own,query]);
  useFocusEffect(useCallback(()=>{load();return()=>{generation.current++;};},[load]));
  return <SafeAreaView style={styles.safe} edges={embedded?[]:['top','left','right']}>
    {!embedded?<ScreenHeader title={own?'Lowongan':'Temukan tempat bertumbuh'} subtitle={own?'Kelola kesempatan magang di industrimu.':'Temukan posisi yang sesuai dengan keterampilanmu.'}/>:null}
    <FlatList data={items} keyExtractor={item=>String(item.id)} refreshing={busy} onRefresh={()=>load()} contentContainerStyle={styles.content}
      ListHeaderComponent={<View style={styles.header}>
        {own?<PrimaryButton title="+ Terbitkan lowongan" onPress={()=>navigation.navigate('VacancyForm')}/>:<>
          <CustomInput label="Cari posisi, industri, atau lokasi" placeholder="Misalnya Mobile Developer" icon="search" value={input} onChangeText={setInput} maxLength={100}/>
          <PrimaryButton title="Cari lowongan" onPress={()=>{if(query===input.trim())load();else setQuery(input.trim());}} loading={busy}/>
        </>}
        {error?<><Text style={styles.error}>{error}</Text><PrimaryButton title="Coba lagi" variant="secondary" onPress={()=>load()} disabled={busy}/></>:null}
      </View>}
      ListEmptyComponent={<Text style={styles.body}>{busy?'Memuat lowongan…':error?'':own?'Belum ada lowongan. Terbitkan posisi magang pertamamu.':'Belum ada lowongan aktif yang cocok dengan pencarianmu.'}</Text>}
      renderItem={({item})=><Pressable accessibilityRole="button" style={styles.card} onPress={()=>navigation.navigate('VacancyDetail',{id:item.id})}>
        <Text style={styles.label}>{own?(item.legacy?'Data lama · perlu dilengkapi':item.status_aktif?'Dibuka':'Ditutup'):item.matching.application_id?'Sudah dilamar':item.matching.can_apply?'Bisa dilamar':'Syarat belum terpenuhi'}</Text>
        <Text style={styles.title}>{item.title}</Text><Text style={styles.body}>{item.nama_industri}</Text>
        <Text style={styles.body}>{item.lokasi || item.kota_domisili} · {workModes[item.tipe_kerja] || 'Sistem kerja belum diisi'}</Text>
        <Text style={styles.body}>{formatAllowance(item.uang_saku)}</Text>
        {own?<Text style={styles.body}>Sisa kuota {item.remaining_quota}/{item.kuota}</Text>:null}
        {!own?<Text style={styles.body}>Kecocokan {item.matching.match_rate.toFixed(2)}%</Text>:null}
        <Text style={styles.link}>Lihat lowongan · Batas {formatDeadline(item.tenggat_waktu)}</Text>
      </Pressable>}
      ListFooterComponent={hasMore?<PrimaryButton title="Muat berikutnya" onPress={()=>load(items.length)} loading={busy}/>:null}/>
  </SafeAreaView>;
}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:colors.background},content:{padding:spacing.md,gap:spacing.md},header:{gap:spacing.sm},card:{padding:spacing.md,backgroundColor:colors.white,borderRadius:borderRadius.lg,gap:spacing.sm},title:{fontSize:18,fontWeight:'600',color:colors.textPrimary},body:{color:colors.textSecondary,lineHeight:22},score:{fontSize:20,fontWeight:'700',color:colors.primary},label:{color:colors.primary,lineHeight:20},link:{color:colors.primary,fontWeight:'600'},error:{color:colors.error,lineHeight:22}});
