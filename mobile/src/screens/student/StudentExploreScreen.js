import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, shadows } from '../../utils/theme';
import ScreenHeader from '../../components/common/ScreenHeader';
import PrimaryButton from '../../components/common/PrimaryButton';

export default function StudentExploreScreen() {
  const [activeFilter, setActiveFilter] = useState('Semua');

  const vacancies = [
    {
      id: 1,
      title: 'Junior Mobile React Native Intern',
      company: 'PT Digital Kreatif Nusantara',
      location: 'Bandung (Hybrid)',
      quota: 2,
      matchRate: 94,
      skills: [
        { name: 'React Native UI', matched: true, type: 'wajib' },
        { name: 'RESTful API', matched: true, type: 'wajib' },
        { name: 'Zustand State', matched: false, type: 'nilai_tambah' },
      ],
      desc: 'Pengembangan modul antarmuka mobile vokasi dan integrasi API auth serta katalog data.',
    },
    {
      id: 2,
      title: 'UI/UX Design & Prototyping Apprentice',
      company: 'Studio Nusantara Interaktif',
      location: 'Jakarta Selatan (Remote)',
      quota: 1,
      matchRate: 65,
      skills: [
        { name: 'UI/UX Figma', matched: false, type: 'wajib' },
        { name: 'React Native UI', matched: true, type: 'nilai_tambah' },
      ],
      desc: 'Membangun design system tokens dan wireframing alur pendaftaran siswa SMK.',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader
        title="Katalog Lowongan Magang"
        subtitle="Pencocokan presisi berbasis micro-skills tervalidasi"
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
          {['Semua', 'Frontend Mobile', 'UI/UX Design', 'Backend API', 'Match ≥ 80%'].map((item) => (
            <Pressable
              key={item}
              onPress={() => setActiveFilter(item)}
              style={[styles.filterPill, activeFilter === item && styles.filterPillActive]}
            >
              <Text style={[styles.filterText, activeFilter === item && styles.filterTextActive]}>
                {item}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Vacancy List */}
        {vacancies.map((vac) => {
          const isEligible = vac.matchRate >= 80;
          return (
            <View key={vac.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{vac.title}</Text>
                  <Text style={styles.companyText}>{vac.company} • {vac.location}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: isEligible ? colors.roleSchoolBg : '#FEF3C7' }]}>
                  <Text style={[styles.badgeScore, { color: isEligible ? colors.success : '#D97706' }]}>
                    {vac.matchRate}%
                  </Text>
                  <Text style={[styles.badgeLabel, { color: isEligible ? colors.success : '#D97706' }]}>
                    MATCH
                  </Text>
                </View>
              </View>

              <Text style={styles.descText}>{vac.desc}</Text>

              {/* Required Skills breakdown */}
              <Text style={styles.skillsHeading}>Kesesuaian Micro-Skills:</Text>
              <View style={styles.skillList}>
                {vac.skills.map((s, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.skillItem,
                      s.matched ? styles.skillMatched : styles.skillGap,
                    ]}
                  >
                    <Text
                      style={[
                        styles.skillItemText,
                        { color: s.matched ? colors.primary : colors.error },
                      ]}
                    >
                      {s.matched ? '✓' : '✗'} {s.name} ({s.type})
                    </Text>
                  </View>
                ))}
              </View>

              {/* Action Decision Gate (per proposal Section 2.A) */}
              <View style={styles.actionContainer}>
                {isEligible ? (
                  <PrimaryButton
                    title="Ajukan Lamaran dengan Portofolio"
                    onPress={() => alert(`Lamaran berhasil dikirim ke ${vac.company} (Match Rate: ${vac.matchRate}%)`)}
                  />
                ) : (
                  <PrimaryButton
                    title="Tutup Skill-Gap dengan AI Mentor"
                    variant="secondary"
                    onPress={() => alert('Membuka modul latihan AI untuk menutup kekurangan skill lowongan ini')}
                  />
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.md },
  filterBar: { marginBottom: spacing.md },
  filterPill: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  filterTextActive: { color: colors.white },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  companyText: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  badge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeScore: { fontSize: 16, fontWeight: '800' },
  badgeLabel: { fontSize: 9, fontWeight: '800' },
  descText: { fontSize: 13, color: colors.textSecondary, marginVertical: spacing.sm, lineHeight: 18 },
  skillsHeading: { fontSize: 12, fontWeight: '700', color: colors.textPrimary, marginTop: 4, marginBottom: 6 },
  skillList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.md },
  skillItem: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: borderRadius.sm },
  skillMatched: { backgroundColor: colors.roleStudentBg },
  skillGap: { backgroundColor: colors.errorBg },
  skillItemText: { fontSize: 11, fontWeight: '600' },
  actionContainer: { marginTop: spacing.xs },
});
