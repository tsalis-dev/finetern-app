import React,{useCallback,useState} from 'react';
import {Text,View,Alert,Linking,StyleSheet} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import api from '../../api/axiosClient';
import FormScreen from '../../components/common/FormScreen';
import CustomInput from '../../components/common/CustomInput';
import PrimaryButton from '../../components/common/PrimaryButton';
import {useAuthStore} from '../../store/useAuthStore';
import {applicationStatuses,selectionPayload} from '../../utils/recruitment';
import {openApplicationEvidence} from '../../utils/portfolioEvidence';
import {colors,spacing,borderRadius} from '../../utils/theme';

const actions={submitted:'Lamaran diajukan',legacy_imported:'Data lamaran lama',...applicationStatuses};
export default function ApplicationDetailScreen({route,navigation}) {
  const id=route.params.id,role=useAuthStore(state=>state.role);
  const [data,setData]=useState(null),[note,setNote]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
  const load=useCallback(async()=>{const result=await api.get('/applications/'+id);setData(result.data);},[id]);
  useFocusEffect(useCallback(()=>{let active=true;api.get('/applications/'+id).then(result=>{if(active){setData(result.data);setError('');}}).catch(failure=>{if(active)setError(failure.message);});return()=>{active=false;};},[id]));
  const run=async task=>{setBusy(true);setError('');setMessage('');try{await task();}catch(failure){setError(failure.message);}finally{setBusy(false);}};
  const decide=status=>{
    let body;try{body=selectionPayload(status,note,data.revision_number);}catch(failure){setError(failure.message);return;}
    Alert.alert('Simpan hasil seleksi?',applicationStatuses[status]+'. Catatan ini dapat dibaca siswa dan sekolahnya.',[{text:'Batal',style:'cancel'},{text:'Simpan',onPress:()=>run(async()=>{await api.post('/applications/'+id+'/review',body);setMessage('Hasil seleksi tercatat.');setNote('');await load();})}]);
  };
  const withdraw=()=>{
    const version=data.revision_number;
    Alert.alert('Tarik lamaran?', 'Akses industri ke profil dan bukti melalui lamaran ini akan dihentikan. Jika sudah diterima, kuotanya dilepas. Kamu tidak dapat melamar ulang pada lowongan yang sama.',[{text:'Batal',style:'cancel'},{text:'Tarik lamaran',style:'destructive',onPress:()=>run(async()=>{await api.post('/applications/'+id+'/withdraw',{version});setMessage('Lamaran ditarik dan akses berbagi melalui lamaran ini dihentikan.');await load();})}]);
  };
  const openProject=async url=>{
    const parsed=new URL(url);
    if(!['http:','https:'].includes(parsed.protocol)||parsed.username||parsed.password)throw new Error('Tautan proyek tidak dapat dibuka.');
    await Linking.openURL(url);
  };
  return <FormScreen title={data?.vacancy.title||'Rincian lamaran'} subtitle={data?applicationStatuses[data.status_lamaran]:'Memuat lamaran…'}>
    {error?<Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text>:null}
    {message?<Text accessibilityLiveRegion="polite" style={styles.notice}>{message}</Text>:null}
    {data?<>
      <View style={styles.card}><Text style={styles.heading}>{data.vacancy.nama_industri}</Text><Text style={styles.body}>Diajukan {new Date(data.applied_at).toLocaleString('id-ID')}</Text><Text style={styles.score}>{data.match_rate.toFixed(2)}% cocok saat melamar</Text><Text style={styles.body}>Skor dan persyaratan ini disimpan saat lamaran dibuat. Penilaian karya yang ditambahkan setelahnya tidak mengubah riwayat lamaran.</Text></View>
      {data.legacy?<Text style={styles.body}>Lamaran lama ini belum memiliki persetujuan berbagi profil dan bukti. Riwayatnya dipertahankan; seleksi melalui alur baru tidak tersedia untuk record ini.</Text>:null}
      {data.profile?<View style={styles.card}><Text style={styles.heading}>{data.profile.nama_lengkap}</Text><Text style={styles.body}>{data.profile.sekolah} · {data.profile.jurusan} · {data.profile.kelas}</Text>{data.profile.email?<Text selectable style={styles.body}>{data.profile.email}</Text>:null}</View>:role==='industri'?<Text style={styles.body}>Profil dan bukti tidak tersedia melalui lamaran ini. Akses memerlukan persetujuan berbagi yang aktif serta akun dan sekolah siswa yang aktif.</Text>:null}
      {data.selection_note?<View style={styles.card}><Text style={styles.heading}>Catatan seleksi</Text><Text style={styles.body}>{data.selection_note}</Text></View>:null}
      {data.matching?<><Text style={styles.heading}>Kecocokan saat pengajuan</Text>{data.matching.requirements.map(item=><View key={item.skill_id} style={styles.card}><Text style={styles.heading}>{item.nama_skill}</Text><Text style={styles.body}>{item.importance==='wajib'?'Wajib':'Nilai tambah'} · Nilai siswa {item.current_proficiency}/100 · Minimum {item.min_proficiency}/100</Text></View>)}</>:null}
      {data.shared_portfolios.length?<Text style={styles.heading}>Bukti karya yang dibagikan</Text>:null}
      {data.shared_portfolios.map(item=><View key={item.id} style={styles.card}>
        <Text style={styles.heading}>{item.title}</Text><Text style={styles.body}>{item.nama_skill} · Nilai guru {item.assessed_proficiency}/100</Text><Text style={styles.body}>{item.deskripsi}</Text>
        {item.project_url?<PrimaryButton title="Buka tautan proyek" variant="secondary" disabled={busy} onPress={()=>run(()=>openProject(item.project_url))}/>:null}
        {item.has_evidence?<PrimaryButton title="Buka bukti berkas" variant="secondary" disabled={busy} onPress={()=>run(()=>openApplicationEvidence(id,item.id,item.evidence_type))}/>:null}
      </View>)}
      {data.can_review?<View style={styles.card}><Text style={styles.heading}>Catat hasil seleksi</Text>
        <CustomInput label="Catatan untuk siswa (wajib)" value={note} onChangeText={setNote} multiline maxLength={2000} editable={!busy}/>
        {data.can_view_evidence?<>
          {data.status_lamaran==='pending'?<PrimaryButton title="Tandai dalam proses seleksi" variant="secondary" disabled={busy} onPress={()=>decide('reviewed')}/>:null}
          <PrimaryButton title="Terima pelamar" disabled={busy} onPress={()=>decide('accepted')}/>
        </>:null}
        <PrimaryButton title="Tolak lamaran" variant="outline" disabled={busy} onPress={()=>decide('rejected')}/>
      </View>:null}
      {data.can_withdraw?<PrimaryButton title="Tarik lamaran dan hentikan berbagi bukti" variant="outline" disabled={busy} onPress={withdraw}/>:null}
      {role==='siswa'&&data.consent_revoked_at?<Text style={styles.body}>Akses industri ke profil dan bukti melalui lamaran ini sudah dihentikan. Salinan yang sebelumnya disimpan penerima berada di luar kendali aplikasi.</Text>:null}
      <Text style={styles.heading}>Riwayat lamaran</Text>{data.history.map(event=><View key={event.id} style={styles.card}><Text style={styles.heading}>{actions[event.action]||event.action}</Text><Text style={styles.body}>{new Date(event.created_at).toLocaleString('id-ID')}</Text>{event.note?<Text style={styles.body}>{event.note}</Text>:null}</View>)}
    </>:null}
    <PrimaryButton title="Muat ulang lamaran" variant="secondary" onPress={()=>run(load)} loading={busy}/>
    <PrimaryButton title="Kembali" variant="outline" onPress={()=>navigation.goBack()} disabled={busy}/>
  </FormScreen>;
}
const styles=StyleSheet.create({card:{padding:spacing.md,gap:spacing.sm,backgroundColor:colors.white,borderRadius:borderRadius.lg},heading:{fontSize:17,fontWeight:'600',color:colors.textPrimary},body:{color:colors.textSecondary,lineHeight:22},score:{fontSize:22,fontWeight:'700',color:colors.primary},notice:{color:colors.primary,lineHeight:22},error:{color:colors.error,lineHeight:22}});
