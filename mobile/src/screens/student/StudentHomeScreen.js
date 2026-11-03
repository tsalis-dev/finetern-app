import React, { useCallback, useState } from 'react';
import { Text, View, Pressable, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import FormScreen from '../../components/common/FormScreen';
import PrimaryButton from '../../components/common/PrimaryButton';
import AppIcon from '../../components/common/AppIcon';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../api/axiosClient';
import { colors, spacing } from '../../utils/theme';

export default function StudentHomeScreen({ navigation }) {
  const user = useAuthStore(state => state.user);
  const [portfolio, setPortfolio] = useState(null);
  const [module, setModule] = useState(null);
  const [error, setError] = useState('');
  useFocusEffect(useCallback(() => {
    let active = true;
    Promise.allSettled([api.get('/portfolios/mine'), api.get('/ai/modules')]).then(([proofs, learning]) => {
      if (!active) return;
      if (proofs.status === 'fulfilled') setPortfolio(proofs.value.data);
      if (learning.status === 'fulfilled') setModule(learning.value.data.items.find(item => item.generation_status === 'ready') || null);
      setError(proofs.status === 'rejected' || learning.status === 'rejected' ? 'Sebagian ringkasan belum dapat diperbarui. Buka menu terkait untuk mencoba lagi.' : '');
    });
    return () => { active = false; };
  }, []));
  return <FormScreen title={'Halo, ' + (user?.nama?.split(' ')[0] || 'Siswa') + '.'} subtitle="Apa langkahmu hari ini?">
    {error ? <Text style={styles.body} accessibilityLiveRegion="polite">{error}</Text> : null}
    <View style={styles.feature}>
      <View style={styles.row}><AppIcon name={module ? 'book' : 'briefcase'} size={20} /><Text style={styles.eyebrow}>{module ? 'LANJUTKAN BELAJAR' : 'MULAI DARI TUJUANMU'}</Text></View>
      <Text style={styles.heading}>{module?.nama_skill || 'Temukan tempat magangmu'}</Text>
      <Text style={styles.body}>{module ? 'Untuk ' + (module.source_context?.vacancy.title || 'keterampilanmu') : 'Pilih lowongan untuk melihat keterampilan yang dibutuhkan industri.'}</Text>
      <PrimaryButton title={module ? 'Buka materi' : 'Cari lowongan'} onPress={() => module ? navigation.navigate('LearningModule', { id: module.id }) : navigation.navigate('Eksplorasi', { view: 'vacancies' })} />
    </View>
    <Text style={styles.heading}>Perjalananmu</Text>
    <View style={styles.row}>
      <Pressable accessibilityRole="button" style={styles.shortcut} onPress={() => navigation.navigate('PortofolioTab')}>
        <AppIcon name="folder" /><Text style={styles.cardTitle}>Karya saya</Text><Text style={styles.body}>{portfolio ? portfolio.summary.pending + ' menunggu penilaian' : 'Bukti dan catatan guru'}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" style={styles.shortcut} onPress={() => navigation.navigate('Eksplorasi', { view: 'applications' })}>
        <AppIcon name="briefcase" /><Text style={styles.cardTitle}>Lamaran saya</Text><Text style={styles.body}>Pantau proses seleksi</Text>
      </Pressable>
    </View>
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Keterampilan tervalidasi</Text>
      {portfolio?.skills.length ? portfolio.skills.slice(0, 3).map(skill => <View key={skill.id} style={styles.row}>
        <Text style={[styles.body, styles.flex]}>{skill.nama_skill}</Text><Text style={styles.value}>{skill.proficiency}/100</Text>
      </View>) : <Text style={styles.body}>Ajukan bukti karya untuk mendapatkan penilaian guru.</Text>}
      <PrimaryButton title="Lihat karya dan penilaian" variant="outline" onPress={() => navigation.navigate('PortofolioTab')} />
    </View>
    <PrimaryButton title="Semua materi belajar" variant="secondary" onPress={() => navigation.navigate('AIMentor')} />
  </FormScreen>;
}
const styles = StyleSheet.create({
  feature: { padding: spacing.lg, gap: spacing.md, backgroundColor: colors.primaryLight, borderRadius: 24 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  heading: { fontSize: 22, lineHeight: 29, fontWeight: '700', color: colors.textPrimary },
  cardTitle: { fontSize: 17, lineHeight: 24, fontWeight: '600', color: colors.textPrimary },
  body: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
  shortcut: { flex: 1, alignSelf: 'stretch', gap: spacing.sm, backgroundColor: colors.white, borderRadius: 20, padding: spacing.md },
  card: { padding: spacing.lg, gap: spacing.md, backgroundColor: colors.white, borderRadius: 20 },
  value: { color: colors.primary, fontWeight: '700' },
  flex: { flex: 1 },
});
