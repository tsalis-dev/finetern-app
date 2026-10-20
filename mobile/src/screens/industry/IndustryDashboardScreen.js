import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, shadows } from '../../utils/theme';
import ScreenHeader from '../../components/common/ScreenHeader';
import RoleBadge from '../../components/common/RoleBadge';
import { useAuthStore } from '../../store/useAuthStore';

export default function IndustryDashboardScreen({ navigation }) {
  const { user } = useAuthStore();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader
        title={`${user?.nama || 'PT Telkom Indonesia'} 🏢`}
        subtitle="Portal Rekrutmen Magang & AI Micro-Skills Matching"
        rightAction={<RoleBadge role="mitra_industri" />}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Metrik Overview */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricMainCard}>
            <Text style={styles.metricMainLabel}>KANDIDAT MATCH >80%</Text>
            <Text style={styles.metricMainValue}>9 Siswa</Text>
            <Text style={styles.metricMainSub}>Kesesuaian micro-skills tertinggi dengan lowongan aktif</Text>
          </View>

          <View style={styles.metricRow}>
            <View style={styles.metricMiniCard}>
              <Text style={styles.miniVal}>3</Text>
              <Text style={styles.miniLabel}>Lowongan Aktif</Text>
            </View>
            <View style={styles.metricMiniCard}>
              <Text style={[styles.miniVal, { color: colors.primary.main }]}>24</Text>
              <Text style={styles.miniLabel}>Total Pelamar</Text>
            </View>
            <View style={styles.metricMiniCard}>
              <Text style={[styles.miniVal, { color: colors.status.success }]}>4</Text>
              <Text style={styles.miniLabel}>Diterima Magang</Text>
            </View>
          </View>
        </View>

        {/* Section: Rekomendasi Kandidat Terbaik AI */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Rekomendasi AI Micro-Skills</Text>
            <Text style={styles.sectionSubtitle}>Siswa dengan validasi keahlian paling relevan</Text>
          </View>
          <Pressable onPress={() => navigation.navigate('Pelamar')}>
            <Text style={styles.sectionLink}>Semua Pelamar</Text>
          </Pressable>
        </View>

        {[
          {
            id: '1',
            name: 'Ahmad Fauzi',
            school: 'SMKN 1 Bandung',
            major: 'Rekayasa Perangkat Lunak',
            roleApplied: 'Mobile Developer Intern (React Native)',
            matchScore: 94,
            skills: ['React Native UI', 'REST API Express', 'Git Flow'],
            verifiedBy: 'Divalidasi oleh Budi Santoso (SMKN 1)',
          },
          {
            id: '2',
            name: 'Siti Nurhaliza',
            school: 'SMKN 1 Bandung',
            major: 'Rekayasa Perangkat Lunak',
            roleApplied: 'Frontend Engineer Intern',
            matchScore: 88,
            skills: ['JavaScript ES6', 'State Management', 'UI Slicing'],
            verifiedBy: 'Divalidasi oleh Budi Santoso (SMKN 1)',
          },
          {
            id: '3',
            name: 'Rian Pratama',
            school: 'SMKN 4 Cimahi',
            major: 'Teknik Komputer Jaringan',
            roleApplied: 'Cloud & Infrastructure Intern',
            matchScore: 82,
            skills: ['Linux Server', 'Nginx Config', 'Docker Basic'],
            verifiedBy: 'Divalidasi oleh Tim Guru Hubin',
          },
        ].map((candidate) => (
          <View key={candidate.id} style={styles.candidateCard}>
            <View style={styles.candidateTop}>
              <View style={styles.candidateInfo}>
                <Text style={styles.candidateName}>{candidate.name}</Text>
                <Text style={styles.candidateSchool}>{candidate.school} • {candidate.major}</Text>
                <Text style={styles.candidateTarget}>Melamar: {candidate.roleApplied}</Text>
              </View>

              <View style={styles.matchScoreBadge}>
                <Text style={styles.matchPercent}>{candidate.matchScore}%</Text>
                <Text style={styles.matchLabel}>Match</Text>
              </View>
            </View>

            <View style={styles.skillTagList}>
              {candidate.skills.map((s, idx) => (
                <View key={idx} style={styles.tag}>
                  <Text style={styles.tagText}>✓ {s}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.verifiedText}>🛡️ {candidate.verifiedBy}</Text>

            <View style={styles.cardActions}>
              <Pressable
                style={styles.btnActionPrimary}
                onPress={() => alert(`Undangan wawancara dikirim ke ${candidate.name}!`)}
              >
                <Text style={styles.btnActionPrimaryText}>Undang Wawancara</Text>
              </Pressable>
              <Pressable
                style={styles.btnActionSecondary}
                onPress={() => navigation.navigate('Pelamar')}
              >
                <Text style={styles.btnActionSecondaryText}>Lihat Portofolio</Text>
              </Pressable>
            </View>
          </View>
        ))}

        {/* Section: Lowongan Aktif Teratas */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Status Lowongan Anda</Text>
          <Pressable onPress={() => navigation.navigate('Lowongan')}>
            <Text style={styles.sectionLink}>Kelola Lowongan</Text>
          </Pressable>
        </View>

        {[
          { title: 'Mobile Developer Intern (React Native)', quota: '2 / 3 Kursi', applicants: 12, deadline: '25 Okt 2026' },
          { title: 'Backend Node.js & MySQL Intern', quota: '1 / 2 Kursi', applicants: 8, deadline: '30 Okt 2026' },
          { title: 'UI/UX Mobile Design Intern', quota: '0 / 1 Kursi', applicants: 4, deadline: '5 Nov 2026' },
        ].map((vac, idx) => (
          <View key={idx} style={styles.vacancyRowCard}>
            <View style={styles.vacHeader}>
              <Text style={styles.vacTitle}>{vac.title}</Text>
              <Text style={styles.vacQuotaBadge}>{vac.quota}</Text>
            </View>
            <View style={styles.vacFooter}>
              <Text style={styles.vacApplicants}>👥 {vac.applicants} Pelamar Terdaftar</Text>
              <Text style={styles.vacDeadline}>Batas: {vac.deadline}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  metricsContainer: {
    marginBottom: spacing.xl,
  },
  metricMainCard: {
    backgroundColor: '#0F172A',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    ...shadows.md,
  },
  metricMainLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  metricMainValue: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.neutral.white,
    marginVertical: spacing.xs,
  },
  metricMainSub: {
    fontSize: 13,
    color: '#CBD5E1',
  },
  metricRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metricMiniCard: {
    flex: 1,
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  miniVal: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 2,
  },
  miniLabel: {
    fontSize: 11,
    color: colors.neutral[500],
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 2,
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary.main,
  },
  candidateCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  candidateTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  candidateInfo: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  candidateName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  candidateSchool: {
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 1,
  },
  candidateTarget: {
    fontSize: 12,
    color: colors.primary.main,
    fontWeight: '600',
    marginTop: 3,
  },
  matchScoreBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  matchPercent: {
    fontSize: 18,
    fontWeight: '800',
    color: '#059669',
  },
  matchLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
    textTransform: 'uppercase',
  },
  skillTagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginVertical: spacing.xs,
  },
  tag: {
    backgroundColor: colors.neutral[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  verifiedText: {
    fontSize: 11,
    color: colors.status.success,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: spacing.md,
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  btnActionPrimary: {
    flex: 2,
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  btnActionPrimaryText: {
    color: colors.neutral.white,
    fontSize: 13,
    fontWeight: '700',
  },
  btnActionSecondary: {
    flex: 1,
    backgroundColor: colors.neutral[100],
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  btnActionSecondaryText: {
    color: colors.neutral[700],
    fontSize: 13,
    fontWeight: '600',
  },
  vacancyRowCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  vacHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  vacTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.neutral[900],
    flex: 1,
    marginRight: spacing.sm,
  },
  vacQuotaBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary.main,
    backgroundColor: colors.primary.light,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  vacFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vacApplicants: {
    fontSize: 12,
    color: colors.neutral[600],
  },
  vacDeadline: {
    fontSize: 11,
    color: colors.neutral[400],
  },
});
