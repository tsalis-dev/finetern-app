import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, shadows } from '../../utils/theme';
import ScreenHeader from '../../components/common/ScreenHeader';

export default function IndustryApplicantsScreen() {
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'high_match', 'interview', 'accepted'
  const [applicants, setApplicants] = useState([
    {
      id: '1',
      name: 'Ahmad Fauzi',
      school: 'SMKN 1 Bandung',
      major: 'Rekayasa Perangkat Lunak',
      position: 'Mobile Developer Intern (React Native)',
      matchScore: 94,
      skills: ['React Native UI', 'REST API Express', 'Git Flow'],
      portfolioTitle: 'Sistem Pembayaran SPP Online SMK',
      portfolioUrl: 'github.com/ahmad/spp-api',
      status: 'review', // 'review', 'interview', 'accepted', 'rejected'
      appliedDate: '20 Okt 2026',
    },
    {
      id: '2',
      name: 'Siti Nurhaliza',
      school: 'SMKN 1 Bandung',
      major: 'Rekayasa Perangkat Lunak',
      position: 'Mobile Developer Intern (React Native)',
      matchScore: 88,
      skills: ['React Native Slicing', 'Zustand State', 'Figma Slicing'],
      portfolioTitle: 'Aplikasi FinTech E-Wallet Clone',
      portfolioUrl: 'github.com/siti/ewallet-app',
      status: 'interview',
      appliedDate: '19 Okt 2026',
    },
    {
      id: '3',
      name: 'Rian Pratama',
      school: 'SMKN 4 Cimahi',
      major: 'Teknik Komputer Jaringan',
      position: 'Backend Engineer Intern',
      matchScore: 82,
      skills: ['Linux Server', 'Nginx Config', 'Docker Basic'],
      portfolioTitle: 'Server Infrastruktur Ujian Sekolah',
      portfolioUrl: 'github.com/rian/school-server',
      status: 'review',
      appliedDate: '18 Okt 2026',
    },
    {
      id: '4',
      name: 'Dewi Sartika',
      school: 'SMKN 2 Bandung',
      major: 'Multimedia / DKV',
      position: 'UI/UX Mobile Design Intern',
      matchScore: 91,
      skills: ['Figma Design System', 'Prototyping', 'User Flow'],
      portfolioTitle: 'Design System & UI Kit FinTech Nusantara',
      portfolioUrl: 'figma.com/@dewisartika/fintech-ui',
      status: 'accepted',
      appliedDate: '15 Okt 2026',
    },
  ]);

  const handleUpdateStatus = (id, newStatus, studentName) => {
    setApplicants((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
    );
    const label =
      newStatus === 'accepted'
        ? 'Diterima Magang'
        : newStatus === 'interview'
        ? 'Dijadwalkan Wawancara'
        : 'Ditolak';
    Alert.alert('Status Pelamar Diperbarui', `${studentName} berhasil ditandai sebagai "${label}". Notifikasi resmi dikirim ke siswa dan pihak SMK.`);
  };

  const filteredApplicants = applicants.filter((item) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'high_match') return item.matchScore >= 85;
    return item.status === activeFilter;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader
        title="Daftar Pelamar Magang"
        subtitle="Evaluasi profil siswa dan hasil AI Micro-Skills Matching"
      />

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {[
          { key: 'all', label: 'Semua (4)' },
          { key: 'high_match', label: 'Match >85% (3)' },
          { key: 'interview', label: 'Wawancara (1)' },
          { key: 'accepted', label: 'Diterima (1)' },
        ].map((tab) => (
          <Pressable
            key={tab.key}
            style={[styles.filterTab, activeFilter === tab.key && styles.filterTabActive]}
            onPress={() => setActiveFilter(tab.key)}
          >
            <Text style={[styles.filterTabText, activeFilter === tab.key && styles.filterTabTextActive]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {filteredApplicants.map((item) => (
          <View key={item.id} style={styles.applicantCard}>
            <View style={styles.cardTop}>
              <View style={styles.applicantInfo}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.school}>{item.school} • {item.major}</Text>
                <Text style={styles.position}>Melamar: {item.position}</Text>
              </View>

              <View style={styles.matchScoreBox}>
                <Text style={styles.matchPercent}>{item.matchScore}%</Text>
                <Text style={styles.matchLabel}>AI Match</Text>
              </View>
            </View>

            {/* Micro-Skills Valid */}
            <View style={styles.skillsSection}>
              <Text style={styles.skillsHeading}>Keahlian Tervalidasi Sekolah:</Text>
              <View style={styles.skillsWrap}>
                {item.skills.map((s, idx) => (
                  <View key={idx} style={styles.skillChip}>
                    <Text style={styles.skillChipText}>✓ {s}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Portofolio */}
            <View style={styles.portfolioBox}>
              <Text style={styles.portfolioLabel}>Portofolio Bukti:</Text>
              <Text style={styles.portfolioTitle}>{item.portfolioTitle}</Text>
              <Text style={styles.portfolioUrl}>🔗 {item.portfolioUrl}</Text>
            </View>

            {/* Status & Actions */}
            <View style={styles.cardActions}>
              {item.status === 'accepted' ? (
                <View style={styles.badgeSuccess}>
                  <Text style={styles.badgeSuccessText}>✓ Diterima Magang</Text>
                </View>
              ) : item.status === 'interview' ? (
                <View style={styles.actionRow}>
                  <View style={styles.badgeInterview}>
                    <Text style={styles.badgeInterviewText}>Tahap Wawancara</Text>
                  </View>
                  <Pressable
                    style={styles.btnAccept}
                    onPress={() => handleUpdateStatus(item.id, 'accepted', item.name)}
                  >
                    <Text style={styles.btnAcceptText}>Terima Magang</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.actionRow}>
                  <Pressable
                    style={styles.btnInterview}
                    onPress={() => handleUpdateStatus(item.id, 'interview', item.name)}
                  >
                    <Text style={styles.btnInterviewText}>Undang Wawancara</Text>
                  </Pressable>
                  <Pressable
                    style={styles.btnAccept}
                    onPress={() => handleUpdateStatus(item.id, 'accepted', item.name)}
                  >
                    <Text style={styles.btnAcceptText}>Terima</Text>
                  </Pressable>
                  <Pressable
                    style={styles.btnReject}
                    onPress={() => handleUpdateStatus(item.id, 'rejected', item.name)}
                  >
                    <Text style={styles.btnRejectText}>Tolak</Text>
                  </Pressable>
                </View>
              )}
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    gap: spacing.xs,
  },
  filterTab: {
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[100],
  },
  filterTabActive: {
    backgroundColor: colors.primary.main,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral[600],
  },
  filterTabTextActive: {
    color: colors.neutral.white,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  applicantCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  applicantInfo: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  school: {
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 1,
  },
  position: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary.main,
    marginTop: 3,
  },
  matchScoreBox: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  matchPercent: {
    fontSize: 16,
    fontWeight: '800',
    color: '#059669',
  },
  matchLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#059669',
  },
  skillsSection: {
    marginVertical: spacing.xs,
  },
  skillsHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.neutral[500],
    marginBottom: 4,
  },
  skillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  skillChip: {
    backgroundColor: colors.primary.light,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  skillChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary.dark,
  },
  portfolioBox: {
    backgroundColor: colors.neutral[50],
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginVertical: spacing.sm,
  },
  portfolioLabel: {
    fontSize: 10,
    color: colors.neutral[400],
    fontWeight: '600',
  },
  portfolioTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutral[800],
    marginTop: 2,
  },
  portfolioUrl: {
    fontSize: 11,
    color: colors.primary.main,
    marginTop: 2,
  },
  cardActions: {
    marginTop: spacing.xs,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
  },
  btnInterview: {
    flex: 2,
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  btnInterviewText: {
    color: colors.neutral.white,
    fontSize: 12,
    fontWeight: '700',
  },
  btnAccept: {
    flex: 1,
    backgroundColor: '#059669',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  btnAcceptText: {
    color: colors.neutral.white,
    fontSize: 12,
    fontWeight: '700',
  },
  btnReject: {
    backgroundColor: colors.neutral[100],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  btnRejectText: {
    color: colors.status.error,
    fontSize: 12,
    fontWeight: '600',
  },
  badgeSuccess: {
    backgroundColor: '#DCFCE7',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  badgeSuccessText: {
    color: '#15803D',
    fontSize: 13,
    fontWeight: '700',
  },
  badgeInterview: {
    flex: 1,
    backgroundColor: '#FEF3C7',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  badgeInterviewText: {
    color: '#B45309',
    fontSize: 12,
    fontWeight: '700',
  },
});
