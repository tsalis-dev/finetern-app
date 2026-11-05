import React, { useCallback, useState } from 'react';
import { Text, View, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AppIcon from '../../components/common/AppIcon';
import BrandLogo from '../../components/common/BrandLogo';
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
        <BrandLogo size={34} />
        <Pressable accessibilityRole="button" accessibilityLabel="Buka profil" onPress={() => navigation.navigate('Profil')} style={styles.avatar}><Text style={styles.initial}>{firstName[0]}</Text></Pressable>
      </View>
      <View style={styles.greeting}><Text style={styles.title}>Halo, {firstName}.</Text><Text style={styles.body}>Selangkah lebih dekat ke magang impianmu.</Text></View>
      {error ? <Text style={styles.body} accessibilityLiveRegion="polite">{error}</Text> : null}
      <View style={styles.focus}>
        <Text style={styles.eyebrow}>LANGKAH BERIKUTNYA</Text>
        <Pressable accessibilityRole="button" onPress={() => module ? navigation.navigate('LearningModule', { id: module.id }) : navigation.navigate('Eksplorasi', { view: 'vacancies' })} style={({ pressed }) => [styles.focusRow, pressed && styles.pressed]}>
          <View style={styles.focusIcon}><AppIcon name={module ? 'book' : 'search'} size={24} /></View>
          <View style={styles.focusCopy}><Text style={styles.focusTitle}>{module?.nama_skill || 'Temukan peluang magang'}</Text><Text numberOfLines={2} style={styles.body}>{module ? 'Bekal untuk ' + (module.source_context?.vacancy.title || 'peluang berikutnya') : 'Kenali posisi dan keterampilan yang dibutuhkan.'}</Text><Text style={styles.focusAction}>{module ? 'Lanjutkan belajar' : 'Jelajahi lowongan'}</Text></View>
          <AppIcon name="arrow" size={20} />
        </Pressable>
      </View>
      <View style={styles.sectionTitle}><Text style={styles.heading}>Perjalananmu</Text></View>
      <View style={styles.shortcuts}>
        <Pressable accessibilityRole="button" style={({ pressed }) => [styles.shortcut, pressed && styles.pressed]} onPress={() => navigation.navigate('PortofolioTab', { view: 'projects' })}>
          <AppIcon name="folder" size={22} color={colors.textSecondary} /><View style={styles.shortcutCopy}><Text style={styles.shortcutLabel}>{portfolio ? portfolio.summary.approved : '—'} karya disetujui</Text><Text style={styles.caption}>{portfolio ? portfolio.summary.pending + ' menunggu penilaian' : 'Lihat karya saya'}</Text></View><AppIcon name="next" size={18} color={colors.textMuted} />
        </Pressable>
        <Pressable accessibilityRole="button" style={({ pressed }) => [styles.shortcut, styles.shortcutDivider, pressed && styles.pressed]} onPress={() => navigation.navigate('Eksplorasi', { view: 'applications' })}>
          <AppIcon name="briefcase" size={22} color={colors.textSecondary} /><View style={styles.shortcutCopy}><Text style={styles.shortcutLabel}>Lamaran saya</Text><Text style={styles.caption}>Ikuti proses seleksimu</Text></View><AppIcon name="next" size={18} color={colors.textMuted} />
        </Pressable>
      </View>
      <View style={styles.sectionTitle}><View style={styles.sectionRow}><Text style={styles.heading}>Bekal keterampilan</Text><Pressable accessibilityRole="button" onPress={() => navigation.navigate('PortofolioTab', { view: 'skills' })} style={styles.textButton}><Text style={styles.link}>Lihat semua</Text><AppIcon name="next" size={15} /></Pressable></View><Text style={styles.caption}>Dari karya yang sudah dinilai guru.</Text></View>
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
  content: { padding: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xl, gap: 24 },
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 3, borderColor: colors.white, backgroundColor: colors.accentWarm, alignItems: 'center', justifyContent: 'center' },
  initial: { color: colors.primaryDark, fontWeight: '700', fontSize: 17 },
  greeting: { gap: 5 },
  title: { color: colors.textPrimary, fontSize: 31, lineHeight: 39, fontWeight: '700', letterSpacing: -0.8 },
  body: { fontSize: 14, color: colors.textSecondary, lineHeight: 21 },
  focus: { borderLeftWidth: 3, borderColor: colors.primary, paddingLeft: 16, gap: 14 },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  focusRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64 },
  focusIcon: { width: 44, height: 48, backgroundColor: colors.primaryLight, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  focusCopy: { flex: 1, gap: 5 },
  focusTitle: { color: colors.textPrimary, fontSize: 18, lineHeight: 25, fontWeight: '700' },
  focusAction: { color: colors.primary, fontSize: 13, fontWeight: '700', paddingTop: 5 },
  sectionTitle: { gap: 4 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  heading: { color: colors.textPrimary, fontWeight: '700', fontSize: 19, letterSpacing: -0.3, flexShrink: 1 },
  caption: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  shortcuts: { marginTop: -12 },
  shortcut: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 72, paddingVertical: 14 },
  shortcutCopy: { flex: 1, gap: 4 },
  shortcutDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  shortcutLabel: { color: colors.textPrimary, fontSize: 15, lineHeight: 21, fontWeight: '600' },
  skills: { marginTop: -16 },
  skill: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 15 },
  skillDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  skillIcon: { width: 28, alignItems: 'center' },
  skillInfo: { flex: 1, gap: 9 },
  skillName: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  track: { height: 4, borderRadius: 2, backgroundColor: colors.surfaceElevated, overflow: 'hidden' },
  fill: { height: 4, borderRadius: 2, backgroundColor: colors.primary },
  value: { color: colors.primary, fontWeight: '700', fontSize: 17 },
  valueUnit: { fontSize: 10, color: colors.textMuted, fontWeight: '400' },
  textButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 2 },
  link: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  library: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48, borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border, paddingTop: 12 },
  libraryLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.primary },
  pressed: { opacity: 0.8 },
});
