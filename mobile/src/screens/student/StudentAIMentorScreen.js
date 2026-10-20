import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, shadows } from '../../utils/theme';
import ScreenHeader from '../../components/common/ScreenHeader';
import PrimaryButton from '../../components/common/PrimaryButton';

export default function StudentAIMentorScreen() {
  const [isGenerating, setIsGenerating] = useState(false);

  const skillGaps = [
    {
      id: 1,
      skillName: 'State Management Zustand',
      currentProficiency: 60,
      targetProficiency: 70,
      targetVacancy: 'Junior Mobile React Native Intern (PT Digital Kreatif)',
    },
    {
      id: 2,
      skillName: 'UI/UX Slicing Figma',
      currentProficiency: 50,
      targetProficiency: 75,
      targetVacancy: 'UI/UX Design Apprentice (Studio Nusantara)',
    },
  ];

  const handleGenerateModule = (skillName) => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      alert(`Modul Pembelajaran & 5 Soal Kuis untuk "${skillName}" berhasil digenerate oleh Google Gemini AI!`);
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader
        title="AI Learning Recommender"
        subtitle="Jalur belajar adaptif untuk menutup kesenjangan kompetensi"
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* AI Engine Status Card */}
        <View style={styles.engineCard}>
          <View style={styles.engineBadge}><Text style={styles.engineBadgeText}>GOOGLE GEMINI SDK 2.5</Text></View>
          <Text style={styles.engineTitle}>Asisten Belajar Vokasi Aktif</Text>
          <Text style={styles.engineSubtitle}>
            AI mendeteksi kualifikasi lowongan yang belum terpenuhi dan secara dinamis menyusun materi microlearning 15 menit beserta kuis formatif.
          </Text>
        </View>

        {/* Section: Detected Gaps */}
        <Text style={styles.sectionHeading}>Kesenjangan Keterampilan (Skill-Gap) Terdeteksi</Text>

        {skillGaps.map((gap) => (
          <View key={gap.id} style={styles.gapCard}>
            <View style={styles.gapTopRow}>
              <Text style={styles.gapTitle}>{gap.skillName}</Text>
              <Text style={styles.gapDiff}>
                Kekurangan: +{gap.targetProficiency - gap.currentProficiency}%
              </Text>
            </View>

            <Text style={styles.gapTarget}>Syarat untuk: {gap.targetVacancy}</Text>

            {/* Progress Visual Bar */}
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${gap.currentProficiency}%` }]} />
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.progressText}>Keahlian Saat Ini: {gap.currentProficiency}%</Text>
              <Text style={styles.progressTextTarget}>Target: {gap.targetProficiency}%</Text>
            </View>

            <PrimaryButton
              title={`Mulai Learning Sprint: ${gap.skillName}`}
              loading={isGenerating}
              onPress={() => handleGenerateModule(gap.skillName)}
              style={styles.sprintButton}
            />
          </View>
        ))}

        {/* Closed-Loop Learning Guarantee */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 Siklus Belajar Tertutup (Closed-Loop):</Text>
          <Text style={styles.infoDesc}>
            Pelajari Modul Ringkas → Kerjakan Kuis Evaluasi (Skor ≥ 80) → Unggah Bukti Mini Proyek → Divalidasi Guru → Match Rate Naik Otomatis.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.md },
  engineCard: {
    backgroundColor: '#312E81',
    borderRadius: borderRadius.lg,
    padding: spacing.md + 2,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  engineBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    marginBottom: spacing.xs,
  },
  engineBadgeText: { color: colors.white, fontSize: 10, fontWeight: '800' },
  engineTitle: { fontSize: 17, fontWeight: '700', color: colors.white },
  engineSubtitle: { fontSize: 12, color: '#C7D2FE', marginTop: 4, lineHeight: 17 },
  sectionHeading: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm + 2 },
  gapCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  gapTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  gapTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  gapDiff: { fontSize: 12, fontWeight: '700', color: colors.error },
  gapTarget: { fontSize: 12, color: colors.textSecondary, marginTop: 2, marginBottom: spacing.sm },
  progressTrack: { height: 8, backgroundColor: colors.surfaceElevated, borderRadius: borderRadius.full, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.warning },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, marginBottom: spacing.md },
  progressText: { fontSize: 11, color: colors.textSecondary },
  progressTextTarget: { fontSize: 11, fontWeight: '700', color: colors.textPrimary },
  sprintButton: { minHeight: 44 },
  infoCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  infoTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  infoDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 4, lineHeight: 18 },
});
