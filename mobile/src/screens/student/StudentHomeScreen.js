import React, { useCallback, useState } from 'react';
import { Text, View, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AppIcon from '../../components/common/AppIcon';
import LearningIllustration from '../../components/common/LearningIllustration';
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
  const firstName = user?.nama?.split(' ')[0] || 'Siswa';
  return <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.topbar}>
        <View style={styles.brandRow}><View style={styles.brandMark}><AppIcon name="school" size={20} color={colors.white} /></View><Text style={styles.brand}>finetern</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel="Buka profil" onPress={() => navigation.navigate('Profil')} style={styles.avatar}><Text style={styles.initial}>{firstName[0]}</Text></Pressable>
      </View>
      <View style={styles.greeting}><Text style={styles.title}>Halo, {firstName}.</Text><Text style={styles.body}>Selangkah lebih dekat ke magang impianmu.</Text></View>
      {error ? <Text style={styles.body} accessibilityLiveRegion="polite">{error}</Text> : null}
      <View style={styles.hero}>
        <View style={styles.heroTop}><View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>{module ? 'RUANG BELAJARMU' : 'LANGKAH PERTAMAMU'}</Text>
          <Text style={styles.heroTitle}>{module?.nama_skill || 'Temukan tempat bertumbuh.'}</Text>
        </View><LearningIllustration size={112} /></View>
        <Text style={styles.heroBody}>{module ? 'Persiapkan diri untuk ' + (module.source_context?.vacancy.title || 'peluang berikutnya') + '.' : 'Kenali peluang magang dan keterampilan yang dibutuhkan industri.'}</Text>
        <Pressable accessibilityRole="button" onPress={() => module ? navigation.navigate('LearningModule', { id: module.id }) : navigation.navigate('Eksplorasi', { view: 'vacancies' })} style={({ pressed }) => [styles.heroButton, pressed && styles.pressed]}>
          <AppIcon name={module ? 'book' : 'search'} size={20} /><Text style={styles.heroButtonText}>{module ? 'Lanjutkan belajar' : 'Jelajahi lowongan'}</Text><AppIcon name="arrow" size={19} />
        </Pressable>
      </View>
      <View style={styles.sectionTitle}><Text style={styles.heading}>Perjalananmu</Text><Text style={styles.caption}>Sedikit demi sedikit, jadi siap.</Text></View>
      <View style={styles.shortcuts}>
        <Pressable accessibilityRole="button" style={({ pressed }) => [styles.shortcut, styles.warm, pressed && styles.pressed]} onPress={() => navigation.navigate('PortofolioTab')}>
          <View style={styles.shortcutTop}><AppIcon name="folder" size={23} color={colors.accentWarmText} /><AppIcon name="next" size={17} color={colors.accentWarmText} /></View>
          <Text style={styles.shortcutTitle}>{portfolio ? portfolio.summary.approved : '—'}<Text style={styles.shortcutUnit}> karya disetujui</Text></Text>
          <Text style={styles.shortcutNote}>{portfolio ? portfolio.summary.pending + ' menunggu penilaian' : 'Lihat karya saya'}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" style={({ pressed }) => [styles.shortcut, styles.rose, pressed && styles.pressed]} onPress={() => navigation.navigate('Eksplorasi', { view: 'applications' })}>
          <View style={styles.shortcutTop}><AppIcon name="briefcase" size={23} /><AppIcon name="next" size={17} /></View>
          <Text style={styles.shortcutLabel}>Lamaran saya</Text><Text style={styles.shortcutNote}>Ikuti proses seleksimu</Text>
        </Pressable>
      </View>
      <View style={styles.sectionTitle}><View style={styles.sectionRow}><Text style={styles.heading}>Bekal keterampilan</Text><Pressable accessibilityRole="button" onPress={() => navigation.navigate('PortofolioTab')} style={styles.textButton}><Text style={styles.link}>Lihat semua</Text><AppIcon name="next" size={15} /></Pressable></View><Text style={styles.caption}>Dari karya yang sudah dinilai guru.</Text></View>
      <View style={styles.skills}>
        {portfolio?.skills.length ? portfolio.skills.slice(0, 3).map((skill, index) => <View key={skill.id} style={[styles.skill, index > 0 && styles.skillDivider]}>
          <View style={styles.skillIcon}><AppIcon name="code" size={20} /></View><View style={styles.skillInfo}><Text style={styles.skillName}>{skill.nama_skill}</Text>
            <View style={styles.track} accessible accessibilityRole="progressbar" accessibilityLabel={skill.nama_skill} accessibilityValue={{ min: 0, max: 100, now: skill.proficiency }}><View style={[styles.fill, { width: skill.proficiency + '%' }]} /></View>
          </View><Text style={styles.value}>{skill.proficiency}<Text style={styles.valueUnit}>/100</Text></Text>
        </View>) : <Text style={styles.body}>{portfolio ? 'Ajukan bukti karya untuk mendapatkan penilaian guru.' : 'Memuat keterampilanmu…'}</Text>}
      </View>
      <Pressable accessibilityRole="button" style={styles.library} onPress={() => navigation.navigate('AIMentor')}><AppIcon name="book" size={20} /><Text style={styles.libraryLabel}>Semua materi belajar</Text><AppIcon name="arrow" size={20} /></Pressable>
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xl, gap: 20 },
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  brandMark: { width: 31, height: 31, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  brand: { color: colors.primary, fontSize: 23, fontWeight: '700', letterSpacing: -0.8 },
  avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 3, borderColor: colors.white, backgroundColor: colors.accentWarm, alignItems: 'center', justifyContent: 'center' },
  initial: { color: colors.primaryDark, fontWeight: '700', fontSize: 17 },
  greeting: { gap: 5 },
  title: { color: colors.textPrimary, fontSize: 31, lineHeight: 39, fontWeight: '700', letterSpacing: -0.8 },
  body: { fontSize: 14, color: colors.textSecondary, lineHeight: 21 },
  hero: { backgroundColor: colors.primary, borderRadius: 26, padding: 22, gap: 16 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  heroCopy: { flex: 1, gap: 9 },
  eyebrow: { color: colors.onPrimaryMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1.7 },
  heroTitle: { color: colors.white, fontSize: 24, lineHeight: 30, fontWeight: '700', letterSpacing: -0.4 },
  heroBody: { color: colors.onPrimaryMuted, fontSize: 13, lineHeight: 20 },
  heroButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, minHeight: 48, padding: 12, borderRadius: 15, backgroundColor: colors.white },
  heroButtonText: { color: colors.primary, fontSize: 14, fontWeight: '700', flex: 1 },
  sectionTitle: { gap: 4 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  heading: { color: colors.textPrimary, fontWeight: '700', fontSize: 19, letterSpacing: -0.3, flexShrink: 1 },
  caption: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  shortcuts: { flexDirection: 'row', alignItems: 'stretch', gap: 12, marginTop: -8 },
  shortcut: { flex: 1, padding: 16, gap: 8, borderRadius: 20 },
  warm: { backgroundColor: colors.accentWarm },
  rose: { backgroundColor: colors.primaryLight },
  shortcutTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  shortcutTitle: { color: colors.textPrimary, fontSize: 25, fontWeight: '700' },
  shortcutUnit: { fontSize: 13, fontWeight: '600' },
  shortcutLabel: { color: colors.textPrimary, fontSize: 16, lineHeight: 30, fontWeight: '700' },
  shortcutNote: { color: colors.textSecondary, fontSize: 11, lineHeight: 17 },
  skills: { paddingHorizontal: 16, paddingVertical: 4, borderRadius: 20, backgroundColor: colors.white, marginTop: -8 },
  skill: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 17 },
  skillDivider: { borderTopWidth: 1, borderColor: colors.surfaceElevated },
  skillIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  skillInfo: { flex: 1, gap: 9 },
  skillName: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  track: { height: 4, borderRadius: 2, backgroundColor: colors.surfaceElevated, overflow: 'hidden' },
  fill: { height: 4, borderRadius: 2, backgroundColor: colors.primary },
  value: { color: colors.primary, fontWeight: '700', fontSize: 17 },
  valueUnit: { fontSize: 10, color: colors.textMuted, fontWeight: '400' },
  textButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 2 },
  link: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  library: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 },
  libraryLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.primary },
  pressed: { opacity: 0.8 },
});
