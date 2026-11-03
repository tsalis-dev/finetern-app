import React,{useEffect,useState} from 'react';
import {Text,View,Modal,FlatList,Pressable,StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import api from '../../api/axiosClient';
import FormScreen from '../../components/common/FormScreen';
import CustomInput from '../../components/common/CustomInput';
import PrimaryButton from '../../components/common/PrimaryButton';
import {vacancyPayload,workModes} from '../../utils/recruitment';
import {colors,spacing,borderRadius} from '../../utils/theme';

export default function VacancyFormScreen({route,navigation}) {
  const id=route.params?.id;
  const [values,setValues]=useState({title:'',deskripsi:'',location:'',workMode:'onsite',allowance:'',quota:'1',deadline:new Date(Date.now()+30*86400000+7*3600000).toISOString().slice(0,10)});
  const [requirements,setRequirements]=useState([]),[skills,setSkills]=useState([]),[original,setOriginal]=useState(null);
  const [picker,setPicker]=useState(false),[query,setQuery]=useState(''),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const load=async()=>{
    setReady(false);setError('');
    try {
      const [dictionary,existing]=await Promise.all([api.get('/vacancies/skills'),id?api.get('/vacancies/'+id):Promise.resolve(null)]);
      setSkills(dictionary.data);
      if(existing){const row=existing.data;setOriginal(row);setValues({title:row.title,deskripsi:row.deskripsi,location:row.lokasi||'',workMode:row.tipe_kerja||'onsite',allowance:row.uang_saku==null?'':String(row.uang_saku),quota:String(row.kuota||1),deadline:row.tenggat_waktu||''});setRequirements(row.requirements.map(item=>({skillId:item.skill_id,importance:item.importance,weight:String(item.weight),minProficiency:String(item.min_proficiency)})));}
      setReady(true);
    } catch(failure){setError(failure.message);}
  };
  useEffect(()=>{load();},[id]);
  const change=(key,value)=>setValues(current=>({...current,[key]:value}));
  const updateRequirement=(skillId,key,value)=>setRequirements(current=>current.map(item=>item.skillId===skillId?{...item,[key]:value}:item));
  const submit=async()=>{
    setError('');let body;
    try{body=vacancyPayload(values,requirements,id?original.revision_number:null);}catch(failure){setError(failure.message);return;}
    setBusy(true);
    try {
      const result=id?await api.patch('/vacancies/'+id,body):await api.post('/vacancies',body);
      if(id)navigation.goBack();else navigation.replace('VacancyDetail',{id:result.data.id});
    } catch(failure){setError(failure.message);}finally{setBusy(false);}
  };
  return <FormScreen onBack={() => navigation.goBack()} backDisabled={busy} title={id?'Perbarui lowongan magang':'Buka kesempatan bertumbuh'} subtitle="Tuliskan pekerjaan yang akan dipelajari siswa dan keterampilan yang perlu dibuktikan sebelum melamar.">
    {error?<Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text>:null}
    {!ready?<PrimaryButton title="Muat formulir" variant="secondary" onPress={load}/>:<>
      {original?.can_edit===false?<Text style={styles.body}>Lowongan sudah menerima lamaran. Persyaratan terkunci; kamu masih dapat membuka atau menutupnya dari halaman rincian.</Text>:<>
        <CustomInput label="Judul posisi magang" value={values.title} onChangeText={value=>change('title',value)} maxLength={150} editable={!busy}/>
        <CustomInput label="Deskripsi pekerjaan dan bimbingan yang diberikan" value={values.deskripsi} onChangeText={value=>change('deskripsi',value)} multiline maxLength={5000} editable={!busy}/>
        <CustomInput label="Lokasi magang" value={values.location} onChangeText={value=>change('location',value)} maxLength={150} editable={!busy}/>
        <View style={styles.choices}>{Object.entries(workModes).map(([key,label])=><Pressable key={key} accessibilityRole="radio" accessibilityState={{checked:values.workMode===key}} disabled={busy} onPress={()=>change('workMode',key)} style={[styles.choice,values.workMode===key&&styles.selected]}><Text style={styles.link}>{label}</Text></Pressable>)}</View>
        <CustomInput label="Uang saku per bulan dalam rupiah (opsional)" helperText="Isi angka tanpa titik. Kosong berarti belum dicantumkan; 0 berarti tanpa uang saku." value={values.allowance} onChangeText={value=>change('allowance',value)} keyboardType="number-pad" maxLength={9} editable={!busy}/>
        <CustomInput label="Kuota penerimaan" value={values.quota} onChangeText={value=>change('quota',value)} keyboardType="number-pad" maxLength={4} editable={!busy}/>
        <CustomInput label="Batas lamaran (YYYY-MM-DD, sampai akhir hari WIB)" value={values.deadline} onChangeText={value=>change('deadline',value)} maxLength={10} editable={!busy}/>
        <Text style={styles.heading}>Syarat keterampilan</Text><Text style={styles.body}>Siswa perlu skor kecocokan minimal 80% dan memenuhi nilai minimum seluruh syarat wajib. Bobot lebih besar berarti keterampilan itu lebih berpengaruh pada skor total.</Text>
        {requirements.map(item=><View key={item.skillId} style={styles.card}>
          <Text style={styles.heading}>{skills.find(skill=>skill.id===item.skillId)?.nama_skill||'Keterampilan'}</Text>
          <View style={styles.choices}>{[['wajib','Wajib'],['nilai_tambah','Nilai tambah']].map(([key,label])=><Pressable key={key} accessibilityRole="radio" accessibilityState={{checked:item.importance===key}} disabled={busy} onPress={()=>updateRequirement(item.skillId,'importance',key)} style={[styles.choice,item.importance===key&&styles.selected]}><Text style={styles.link}>{label}</Text></Pressable>)}</View>
          <CustomInput label="Nilai minimum (1–100)" value={item.minProficiency} onChangeText={value=>updateRequirement(item.skillId,'minProficiency',value)} keyboardType="number-pad" maxLength={3} editable={!busy}/>
          <CustomInput label="Bobot (1–100)" value={item.weight} onChangeText={value=>updateRequirement(item.skillId,'weight',value)} keyboardType="number-pad" maxLength={3} editable={!busy}/>
          <PrimaryButton title="Hapus syarat ini" variant="outline" disabled={busy} onPress={()=>setRequirements(current=>current.filter(row=>row.skillId!==item.skillId))}/>
        </View>)}
        <PrimaryButton title="+ Tambahkan keterampilan" variant="secondary" disabled={busy||requirements.length>=20} onPress={()=>setPicker(true)}/>
        <Text style={styles.body}>Setelah ada lamaran masuk, isi dan persyaratan lowongan dikunci. Buat lowongan baru jika kebutuhan berubah.</Text>
        <PrimaryButton title={id?'Simpan perubahan':'Terbitkan lowongan'} onPress={submit} loading={busy}/>
      </>}
    </>}
    <Modal visible={picker} animationType="slide" onRequestClose={()=>setPicker(false)}><SafeAreaView style={styles.modal}>
      <Text style={styles.heading}>Tambahkan keterampilan</Text><CustomInput label="Cari keterampilan" value={query} onChangeText={setQuery}/>
      <FlatList data={skills.filter(skill=>!requirements.some(item=>item.skillId===skill.id)&&(skill.nama_skill+' '+skill.kategori).toLowerCase().includes(query.toLowerCase()))} keyExtractor={item=>String(item.id)} keyboardShouldPersistTaps="handled" ListEmptyComponent={<Text style={styles.body}>Tidak ada keterampilan lain pada pencarian ini.</Text>}
        renderItem={({item})=><Pressable accessibilityRole="button" style={styles.card} onPress={()=>{setRequirements(current=>[...current,{skillId:item.id,importance:'wajib',weight:'10',minProficiency:'70'}]);setPicker(false);}}><Text style={styles.heading}>{item.nama_skill}</Text><Text style={styles.body}>{item.kategori}</Text></Pressable>}/>
      <PrimaryButton title="Tutup" variant="secondary" onPress={()=>setPicker(false)}/>
    </SafeAreaView></Modal>
  </FormScreen>;
}
const styles=StyleSheet.create({body:{color:colors.textSecondary,lineHeight:22},heading:{fontSize:17,fontWeight:'600',color:colors.textPrimary},error:{color:colors.error,lineHeight:22},choices:{flexDirection:'row',flexWrap:'wrap',gap:spacing.sm},choice:{minHeight:44,padding:spacing.sm,justifyContent:'center',borderWidth:1,borderColor:colors.border,borderRadius:borderRadius.sm},selected:{backgroundColor:colors.primaryLight,borderColor:colors.primary},link:{color:colors.primary},card:{padding:spacing.md,gap:spacing.sm,backgroundColor:colors.white,borderRadius:borderRadius.lg,marginBottom:spacing.sm},modal:{flex:1,padding:spacing.lg,gap:spacing.md,backgroundColor:colors.background}});
