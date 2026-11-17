import React,{useState} from 'react';
import {Text,View,Pressable,Alert,Linking,StyleSheet} from 'react-native';
import FormScreen from '../../components/common/FormScreen';
import CustomInput from '../../components/common/CustomInput';
import PrimaryButton from '../../components/common/PrimaryButton';
import AppIcon from '../../components/common/AppIcon';
import {useAuthStore} from '../../store/useAuthStore';
import useApplicationDetail from '../../hooks/useApplicationDetail';
import {applicationStatuses,selectionPayload} from '../../utils/recruitment';
import {openApplicationEvidence} from '../../utils/portfolioEvidence';
import {colors,spacing,borderRadius} from '../../utils/theme';

const actions={submitted:'Lamaran diajukan',legacy_imported:'Data lamaran lama',...applicationStatuses};
const guidance={
  pending:'Lamaran sudah terkirim. Tunggu catatan seleksi dari industri di halaman ini.',
  reviewed:'Industri sedang memproses lamaranmu. Baca catatan seleksi untuk informasi berikutnya.',
  accepted:'Selamat, lamaranmu diterima. Periksa catatan seleksi dari industri untuk langkah berikutnya.',
  rejected:'Seleksi untuk lamaran ini sudah berakhir. Kamu bisa mencari lowongan lain di tab Magang.',
  withdrawn:'Kamu sudah menarik lamaran ini dan tidak dapat melamar ulang pada lowongan yang sama.',
};

function DetailSection({title,summary,initiallyOpen=false,children}) {
  const [open,setOpen]=useState(initiallyOpen);
  return <View style={styles.section}>
    <Pressable accessibilityRole="button" accessibilityState={{expanded:open}}
      accessibilityLabel={title} accessibilityHint={open?'Ketuk untuk menutup rincian':'Ketuk untuk membuka rincian'}
      onPress={()=>setOpen(value=>!value)} style={({pressed})=>[styles.sectionToggle,pressed&&styles.pressed]}>
      <View style={styles.flex}><Text style={styles.heading}>{title}</Text><Text style={styles.caption}>{summary}</Text></View>
      <View style={{transform:[{rotate:open?'90deg':'0deg'}]}}><AppIcon name="next" size={20}/></View>
    </Pressable>
    {open?<View style={styles.sectionBody}>{children}</View>:null}
  </View>;
}

export default function ApplicationDetailScreen({route,navigation}) {
  const id=route.params.id,role=useAuthStore(state=>state.role),own=role==='siswa';
  const {data,receipt,busy,error,message,run,mutate,refresh}=useApplicationDetail(id);
  const [note,setNote]=useState('');
  const current=data||receipt;
  const decide=status=>{
    let body;try{body=selectionPayload(status,note,data.revision_number);}catch(failure){Alert.alert('Periksa catatan seleksi',failure.message);return;}
    Alert.alert('Simpan hasil seleksi?',applicationStatuses[status]+'. Catatan ini dapat dibaca siswa dan sekolahnya.',[
      {text:'Batal',style:'cancel'},
      {text:'Simpan',onPress:async()=>{if(await mutate('review',body,'Hasil seleksi tercatat.'))setNote('');}},
    ]);
  };
  const withdraw=()=>{
    if(!data?.can_withdraw||busy)return;
    const version=data.revision_number;
    Alert.alert('Tarik lamaran?',
      'Kamu tidak dapat melamar ulang pada lowongan yang sama. Akses industri ke profil dan bukti melalui lamaran ini akan dihentikan. Jika sudah diterima, kuotanya dilepas.',[
        {text:'Batal',style:'cancel'},
        {text:'Tarik lamaran',style:'destructive',onPress:()=>mutate('withdraw',{version},'Lamaran ditarik. Akses berbagi melalui lamaran ini dihentikan.')},
      ]);
  };
  const openProject=async url=>{
    const parsed=new URL(url);
    if(!['http:','https:'].includes(parsed.protocol)||parsed.username||parsed.password)throw new Error('Tautan proyek tidak dapat dibuka.');
    await Linking.openURL(url);
  };
  return <FormScreen onBack={()=>navigation.goBack()} backDisabled={busy}
    header={<View style={styles.identity}>
      <Text style={styles.eyebrow}>{own?'LAMARAN SAYA':'RINCIAN LAMARAN'}</Text>
      <Text accessibilityRole="header" style={styles.title}>{current?.vacancy.title||'Rincian lamaran'}</Text>
      <Text style={styles.company}>{current?.vacancy.nama_industri||(busy?'Memuat lamaran…':'Rincian belum tersedia')}</Text>
    </View>}>
    {message?<Text accessibilityLiveRegion="polite" style={styles.notice}>{message}</Text>:null}
    {error?<Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text>:null}
    {current?<View style={styles.overview}>
      <View style={styles.statusLine}><AppIcon name={current.status_lamaran==='accepted'?'check':'briefcase'} size={22}/><Text style={styles.status}>{applicationStatuses[current.status_lamaran]}</Text></View>
      {own&&!data?.legacy?<Text style={styles.body}>{guidance[current.status_lamaran]}</Text>:null}
      {data?<Text style={styles.caption}>Diajukan {new Date(data.applied_at).toLocaleString('id-ID')}</Text>:null}
    </View>:null}
    {data?<>
      {own&&data.can_withdraw?<View style={styles.manage}>
        <PrimaryButton title="Tarik lamaran" variant="outline" disabled={busy} onPress={withdraw}/>
        <Text style={styles.caption}>Berubah rencana? Penarikan tidak dapat dibatalkan.</Text>
      </View>:null}
      {data.selection_note&&data.status_lamaran!=='withdrawn'?<View style={styles.feedback}>
        <Text style={styles.eyebrow}>CATATAN SELEKSI</Text><Text style={styles.feedbackText}>{data.selection_note}</Text>
      </View>:null}
      {data.legacy?<Text style={styles.body}>Lamaran lama ini belum memiliki persetujuan berbagi profil dan bukti. Riwayat tetap tersimpan, tetapi seleksi dan penarikan melalui alur baru tidak tersedia.</Text>:null}
      {own&&!data.can_withdraw&&!data.legacy&&data.status_lamaran==='rejected'?<Text style={styles.caption}>Penarikan tidak tersedia karena seleksi sudah berakhir.</Text>:null}
      {own&&data.consent_revoked_at?<View style={styles.privacy}>
        <AppIcon name="lock" size={19}/><Text style={[styles.caption,styles.flex]}>Berbagi profil dan bukti ke industri sudah dihentikan.</Text>
      </View>:null}

      {data.matching?<DetailSection title="Kecocokan saat melamar" summary={data.match_rate.toFixed(2)+'% · '+data.matching.requirements.length+' keterampilan'} initiallyOpen={!own}>
        <Text style={styles.body}>Nilai dan persyaratan disimpan saat melamar. Penilaian karya berikutnya tidak mengubah riwayat lamaran ini.</Text>
        {data.matching.requirements.map(item=><View key={item.skill_id} style={styles.detailRow}>
          <Text style={styles.itemTitle}>{item.nama_skill}</Text>
          <Text style={styles.body}>{item.importance==='wajib'?'Wajib':'Nilai tambah'} · Nilai {item.current_proficiency}/100 · Minimum {item.min_proficiency}/100</Text>
        </View>)}
      </DetailSection>:null}

      <DetailSection title={own?'Profil dan bukti lamaran':'Profil dan bukti pelamar'} summary={data.profile?data.shared_portfolios.length+' bukti karya tersedia':'Rincian akses dan data pelamar'} initiallyOpen={!own}>
        {own&&data.consent_revoked_at?<Text style={styles.body}>Akses industri ke profil dan bukti melalui lamaran ini sudah dihentikan. Salinan yang sebelumnya disimpan penerima berada di luar kendali aplikasi.</Text>:null}
        {data.profile?<View style={styles.detailRow}>
          <Text style={styles.itemTitle}>{data.profile.nama_lengkap}</Text>
          <Text style={styles.body}>{data.profile.sekolah} · {data.profile.jurusan} · {data.profile.kelas}</Text>
          {data.profile.email?<Text selectable style={styles.body}>{data.profile.email}</Text>:null}
          {own?<Text style={styles.caption}>Salinan profil saat melamar. Perubahan profil berikutnya tidak mengubah salinan ini.</Text>:null}
        </View>:role==='industri'?<Text style={styles.body}>Profil dan bukti tidak tersedia melalui lamaran ini. Akses memerlukan persetujuan berbagi yang aktif serta akun dan sekolah siswa yang aktif.</Text>:<Text style={styles.body}>Salinan profil tidak tersedia pada lamaran ini.</Text>}
        {data.shared_portfolios.map(item=><View key={item.id} style={styles.detailRow}>
          <Text style={styles.itemTitle}>{item.title}</Text><Text style={styles.caption}>{item.nama_skill} · Nilai guru {item.assessed_proficiency}/100</Text><Text style={styles.body}>{item.deskripsi}</Text>
          {item.project_url?<PrimaryButton title="Buka tautan proyek" variant="secondary" disabled={busy} onPress={()=>run(()=>openProject(item.project_url))}/>:null}
          {item.has_evidence?<PrimaryButton title="Buka bukti berkas" variant="secondary" disabled={busy} onPress={()=>run(()=>openApplicationEvidence(id,item.id,item.evidence_type))}/>:null}
        </View>)}
        {!data.shared_portfolios.length?<Text style={styles.caption}>Tidak ada rincian bukti karya yang tersedia melalui lamaran ini.</Text>:null}
      </DetailSection>

      {data.can_review?<View style={styles.review}>
        <Text accessibilityRole="header" style={styles.heading}>Catat hasil seleksi</Text>
        <CustomInput label="Catatan untuk siswa (wajib)" value={note} onChangeText={setNote} multiline maxLength={2000} editable={!busy}/>
        {data.can_view_evidence?<>
          {data.status_lamaran==='pending'?<PrimaryButton title="Tandai dalam proses seleksi" variant="secondary" disabled={busy} onPress={()=>decide('reviewed')}/>:null}
          <PrimaryButton title="Terima pelamar" disabled={busy} onPress={()=>decide('accepted')}/>
        </>:null}
        <PrimaryButton title="Tolak lamaran" variant="outline" disabled={busy} onPress={()=>decide('rejected')}/>
      </View>:null}

      <DetailSection title="Riwayat lamaran" summary={data.history.length+' aktivitas tercatat'}>
        {data.status_lamaran==='withdrawn'&&data.selection_note&&!data.history.some(event=>event.note===data.selection_note)?<Text style={styles.body}>{data.selection_note}</Text>:null}
        {data.history.length?[...data.history].reverse().map(event=><View key={event.id} style={styles.timelineRow}>
          <View style={styles.timelineMark}/><View style={[styles.flex,styles.event]}>
            <Text style={styles.itemTitle}>{actions[event.action]||event.action}</Text><Text style={styles.caption}>{new Date(event.created_at).toLocaleString('id-ID')}</Text>
            {event.note?<Text style={styles.body}>{event.note}</Text>:null}
          </View>
        </View>):<Text style={styles.body}>Belum ada aktivitas yang tercatat.</Text>}
      </DetailSection>
    </>:null}
    <PrimaryButton title={error?'Coba muat ulang':'Muat ulang lamaran'} variant="secondary" onPress={refresh} loading={busy}/>
  </FormScreen>;
}
const styles=StyleSheet.create({
  identity:{gap:8},eyebrow:{fontSize:11,lineHeight:17,letterSpacing:1.2,fontWeight:'700',color:colors.primary},
  title:{fontSize:28,lineHeight:35,fontWeight:'700',color:colors.textPrimary},company:{fontSize:16,lineHeight:24,color:colors.textSecondary},
  overview:{gap:10,paddingVertical:4},statusLine:{flexDirection:'row',alignItems:'center',gap:9},status:{fontSize:18,lineHeight:25,fontWeight:'600',color:colors.primary},
  heading:{fontSize:16,lineHeight:23,fontWeight:'600',color:colors.textPrimary},itemTitle:{fontSize:15,lineHeight:23,fontWeight:'600',color:colors.textPrimary},
  body:{fontSize:14,lineHeight:23,color:colors.textSecondary},caption:{fontSize:12,lineHeight:20,color:colors.textMuted},
  feedback:{padding:spacing.md,gap:8,backgroundColor:colors.primaryLight,borderRadius:borderRadius.md},feedbackText:{fontSize:15,lineHeight:24,color:colors.textPrimary},
  manage:{gap:9},privacy:{flexDirection:'row',alignItems:'flex-start',gap:10},flex:{flex:1},
  section:{borderTopWidth:StyleSheet.hairlineWidth,borderColor:colors.border},sectionToggle:{minHeight:76,paddingVertical:16,flexDirection:'row',alignItems:'center',gap:12},
  sectionBody:{gap:14,paddingBottom:8},detailRow:{gap:8,paddingVertical:14,borderBottomWidth:StyleSheet.hairlineWidth,borderColor:colors.border},
  review:{gap:16,paddingVertical:16},timelineRow:{flexDirection:'row',gap:14},timelineMark:{width:8,height:8,borderRadius:4,marginTop:7,backgroundColor:colors.primary},event:{gap:6,paddingBottom:16},
  notice:{color:colors.successText,lineHeight:23},error:{color:colors.primaryDark,lineHeight:23},pressed:{opacity:0.65},
});
