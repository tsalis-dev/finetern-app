import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, shadows } from '../../utils/theme';
import ScreenHeader from '../../components/common/ScreenHeader';
import { useAuthStore } from '../../store/useAuthStore';

export default function StudentHomeScreen({ navigation }) {
  const { user } = useAuthStore();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader
        title={`Halo, ${user?.nama?.split(' ')[0] || 'Siswa'}! 👋`}
        subtitle={`${user?.sekolah || 'SMKN 1 Bandung'} • ${user?.jurusan || 'RPL'}`}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner Status Portofolio */}
        <View style={styles.portfolioBanner}>
          <View style={styles.bannerInfo}>
            <Text style={styles.bannerBadge}>SIAP MAGANG</Text>
            <Text style={styles.bannerTitle}>Portofolio & Bukti Karya</Text>
            <Text style={styles.bannerSubtitle}>
              3 dari 5 keahlian mikro Anda telah divalidasi oleh Guru Pembimbing.
            </Text>
          </View>
          <View style={styles.gaugeContainer}>
            <Text style={styles.gaugeValue}>85%</Text>
            <Text style={styles.gaugeLabel}>Valid</Text>
          </View>
        </View>

        {/* Section: Keahlian Tervalidasi */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Micro-Skills Tervalidasi</Text>
          <Pressable onPress={() => navigation.navigate('PortofolioTab')}>
            <Text style={styles.sectionLink}>Lihat Semua</Text>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.skillScroll}>
          {[
            { name: 'React Native UI Slicing', score: '85%', valid: true },
            { name: 'RESTful API Integration', score: '80%', valid: true },
            { name: 'Git Collaboration', score: '75%', valid: true },
            { name: 'Zustand State', score: '60%', valid: false },
          ].map((skill, index) => (
            <View key={index} style={[styles.skillChip, !skill.valid && styles.skillChipPending]}>
              <Text style={styles.skillName}>{skill.name}</Text>
              <View style={styles.skillScoreRow}>
                <Text style={styles.skillScore}>{skill.score}</Text>
                <Text style={[styles.skillStatus, { color: skill.valid ? colors.success : colors.warning }]}>
                  {skill.valid ? '✓ Tervalidasi' : '⏳ Pending'}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Section: Rekomendasi Lowongan Teratas */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Rekomendasi Magang Presisi</Text>
          <Pressable onPress={() => navigation.navigate('LowonganTab')}>
            <Text style={styles.sectionLink}>Eksplorasi</Text>
          </Pressable>
        </View>

        {/* Vacancy Card 1 */}
        <View style={styles.vacancyCard}>
          <View style={styles.cardTopRow}>
            <View style={styles.companyInfo}>
              <Text style={styles.vacancyTitle}>Junior Mobile React Native Intern</Text>
              <Text style={styles.companyName}>PT Digital Kreatif Nusantara • Bandung</Text>
            </View>
            <View style={styles.matchRateBadge}>
              <Text style={styles.matchRateNumber}>94%</Text>
              <Text style={styles.matchRateLabel}>MATCH</Text>
            </View>
          </View>

          <Text style={styles.vacancyDesc} numberOfLines={2}>
            Slicing layout Figma ke React Native dan integrasi REST API backend. Kuota: 2 siswa.
          </Text>

          <View style={styles.tagRow}>
            <View style={styles.matchedTag}><Text style={styles.matchedTagText}>✓ React Native</Text></View>
            <View style={styles.matchedTag}><Text style={styles.matchedTagText}>✓ REST API</Text></View>
            <View style={styles.optionalTag}><Text style={styles.optionalTagText}>Zustand (Nilai Tambah)</Text></View>
          </View>

          <Pressable
            onPress={() => navigation.navigate('LowonganTab')}
            style={({ pressed }) => [styles.applyButton, pressed && { opacity: 0.8 }]}
          >
            <Text style={styles.applyButtonText}>Lihat Detail & Ajukan Lamaran</Text>
          </Pressable>
        </View>

        {/* AI Mentor Callout */}
        <View style={styles.aiCalloutCard}>
          <View style={styles.aiBadge}><Text style={styles.aiBadgeText}>AI LEARNING RECOMMENDER</Text></View>
          <Text style={styles.aiTitle}>Tutup Kesenjangan Skill dengan AI</Text>
          <Text style={styles.aiDesc}>
            Dapatkan modul belajar adaptif & kuis 15 menit dari Google Gemini untuk meningkatkan skor Match Rate Anda.
          </Text>
          <Pressable
            onPress={() => navigation.navigate('AIMentorTab')}
            style={styles.aiButton}
          >
            <Text style={styles.aiButtonText}>Buka AI Mentor</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.md },
  portfolioBanner: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md + 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  bannerInfo: { flex: 1, paddingRight: spacing.sm },
  bannerBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  bannerTitle: { fontSize: 18, fontWeight: '700', color: colors.white },
  bannerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 4, lineHeight: 16 },
  gaugeContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeValue: { fontSize: 18, fontWeight: '800', color: colors.primary },
  gaugeLabel: { fontSize: 10, fontWeight: '600', color: colors.textSecondary },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm + 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  sectionLink: { fontSize: 13, fontWeight: '600', color: colors.primary },
  skillScroll: { marginBottom: spacing.lg },
  skillChip: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    width: 170,
    ...shadows.subtle,
  },
  skillChipPending: { backgroundColor: colors.surfaceElevated },
  skillName: { fontSize: 13, fontWeight: '600', color: colors.textPrimary, height: 36 },
  skillScoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  skillScore: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  skillStatus: { fontSize: 11, fontWeight: '600' },
  vacancyCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  companyInfo: { flex: 1, paddingRight: spacing.sm },
  vacancyTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  companyName: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  matchRateBadge: {
    backgroundColor: colors.roleSchoolBg,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  matchRateNumber: { fontSize: 16, fontWeight: '800', color: colors.success },
  matchRateLabel: { fontSize: 9, fontWeight: '800', color: colors.success },
  vacancyDesc: { fontSize: 13, color: colors.textSecondary, marginVertical: spacing.sm, lineHeight: 18 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.md },
  matchedTag: { backgroundColor: colors.roleStudentBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: borderRadius.sm },
  matchedTagText: { fontSize: 11, color: colors.primary, fontWeight: '600' },
  optionalTag: { backgroundColor: colors.surfaceElevated, paddingHorizontal: 8, paddingVertical: 4, borderRadius: borderRadius.sm },
  optionalTagText: { fontSize: 11, color: colors.textSecondary, fontWeight: '500' },
  applyButton: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  applyButtonText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  aiCalloutCard: {
    backgroundColor: '#FAF5FF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  aiBadge: {
    backgroundColor: '#7C3AED',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    marginBottom: spacing.xs,
  },
  aiBadgeText: { color: colors.white, fontSize: 9, fontWeight: '800' },
  aiTitle: { fontSize: 15, fontWeight: '700', color: '#581C87' },
  aiDesc: { fontSize: 12, color: '#6B21A8', marginVertical: spacing.xs, lineHeight: 17 },
  aiButton: {
    backgroundColor: '#7C3AED',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  aiButtonText: { color: colors.white, fontSize: 13, fontWeight: '600' },
});
