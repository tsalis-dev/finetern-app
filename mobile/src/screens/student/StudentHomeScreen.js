import React, { useCallback, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import FormScreen from '../../components/common/FormScreen';
import PrimaryButton from '../../components/common/PrimaryButton';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../api/axiosClient';
import { colors, spacing, borderRadius } from '../../utils/theme';

export default function StudentHomeScreen({ navigation }) {
  const user = useAuthStore(state => state.user);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useFocusEffect(useCallback(() => {
    let active = true;
    api.get('/portfolios/mine').then(response => { if (active) { setData(response.data); setError(''); } }).catch(failure => { if (active) setError(failure.message); });
    return () => { active = false; };
  }, []));
  return <FormScreen title={'Halo, ' + (user?.nama?.split(' ')[0] || 'Siswa') + '.'} subtitle={(user?.sekolah || 'Sekolah') + ' · ' + (user?.kelas || '')}>
    {error ? <Text style={styles.error}>{error}</Text> : null}
    <View style={styles.card}><Text style={styles.heading}>Buktikan kemampuanmu lewat karya</Text><Text style={styles.body}>Kumpulkan proyek yang kamu kerjakan, jelaskan peranmu, dan ajukan untuk pemeriksaan guru.</Text>
      {data ? <Text style={styles.summary}>{data.summary.approved} disetujui · {data.summary.pending} menunggu · {data.summary.revision} perlu perbaikan</Text> : <Text style={styles.body}>{error ? 'Ringkasan belum dapat diperbarui.' : 'Memuat ringkasan karyamu…'}</Text>}
      <PrimaryButton title="+ Ajukan karya" onPress={() => navigation.navigate('PortfolioForm')} />
      <PrimaryButton title="Lihat portofolio dan catatan guru" variant="secondary" onPress={() => navigation.navigate('PortofolioTab')} />
    </View>
    <Text style={styles.heading}>Keterampilan tervalidasi</Text>
    {data?.skills.length ? <>{data.skills.slice(0, 3).map(skill => <View key={skill.id} style={styles.card}><Text style={styles.heading}>{skill.nama_skill}</Text><Text style={styles.summary}>{skill.proficiency}/100 · {skill.evidence_count} karya disetujui guru</Text></View>)}<PrimaryButton title="Lihat keterampilan di portofolio" variant="outline" onPress={() => navigation.navigate('PortofolioTab')} /></> : <Text style={styles.body}>Keterampilan akan muncul setelah guru menyetujui dan menilai bukti karyamu.</Text>}
    <View style={styles.card}><Text style={styles.heading}>Temukan posisi yang sesuai</Text><Text style={styles.body}>Jelajahi lowongan dari industri terverifikasi. Skor kecocokan dihitung dari bukti karyamu; seluruh syarat wajib dan skor minimal 80% perlu terpenuhi untuk melamar.</Text>
      <PrimaryButton title="Jelajahi lowongan magang" onPress={() => navigation.navigate('Eksplorasi')} />
      <PrimaryButton title="Pantau lamaran saya" variant="secondary" onPress={() => navigation.navigate('MyApplications')} />
    </View>
    <View style={styles.card}><Text style={styles.heading}>Belajar untuk langkah berikutnya</Text><Text style={styles.body}>Pelajari keterampilan yang masih kurang untuk lowongan tujuanmu. Kerjakan materi dan kuis dari Gemini, lalu ajukan bukti mini proyek untuk dinilai guru.</Text>
      <PrimaryButton title="Buka AI Mentor dan riwayat belajar" variant="outline" onPress={() => navigation.navigate('AIMentor')} />
    </View>
  </FormScreen>;
}
const styles = StyleSheet.create({ card: { padding: spacing.md, backgroundColor: colors.white, borderRadius: borderRadius.lg, gap: spacing.md }, heading: { fontSize: 18, fontWeight: '600', color: colors.textPrimary }, body: { color: colors.textSecondary, lineHeight: 22 }, summary: { color: colors.primary, fontWeight: '600', lineHeight: 24 }, error: { color: colors.error } });
