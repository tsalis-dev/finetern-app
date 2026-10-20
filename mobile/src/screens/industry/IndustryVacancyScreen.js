import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, shadows } from '../../utils/theme';
import ScreenHeader from '../../components/common/ScreenHeader';

export default function IndustryVacancyScreen({ navigation }) {
  const [vacancies, setVacancies] = useState([
    {
      id: '1',
      title: 'Mobile Developer Intern (React Native)',
      department: 'Digital Consumer Squad',
      type: 'Hybrid (Bandung)',
      allowance: 'Rp 2.500.000 / bln',
      quota: 3,
      filled: 1,
      applicants: 12,
      skills: ['React Native UI', 'RESTful API', 'Git Flow'],
      status: 'active',
      deadline: '31 Okt 2026',
    },
    {
      id: '2',
      title: 'Backend Engineer Intern (Node.js & MySQL)',
      department: 'Cloud Platform Squad',
      type: 'On-site (Jakarta Selatan)',
      allowance: 'Rp 2.800.000 / bln',
      quota: 2,
      filled: 1,
      applicants: 8,
      skills: ['Express.js', 'MySQL Schema', 'JWT Security'],
      status: 'active',
      deadline: '15 Nov 2026',
    },
    {
      id: '3',
      title: 'UI/UX Mobile Design Intern',
      department: 'Product Experience',
      type: 'Remote',
      allowance: 'Rp 2.000.000 / bln',
      quota: 1,
      filled: 0,
      applicants: 4,
      skills: ['Figma Wireframing', 'Design Systems', 'Micro-Interactions'],
      status: 'active',
      deadline: '20 Nov 2026',
    },
  ]);

  const handleCreateVacancy = () => {
    Alert.alert(
      'Tambah Lowongan Baru',
      'Fitur penambahan lowongan magang SMK baru terintegrasi ke form database backend pada Sprint berikutnya.',
      [{ text: 'Mengerti' }]
    );
  };

  const handleToggleStatus = (id, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'closed' : 'active';
    setVacancies((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status: nextStatus } : v))
    );
    Alert.alert('Status Diperbarui', `Status lowongan berhasil diubah menjadi ${nextStatus.toUpperCase()}.`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader
        title="Manajemen Lowongan Magang"
        subtitle="Publikasikan posisi dan tentukan standar micro-skills SMK"
      />

      <View style={styles.topActionContainer}>
        <Pressable style={styles.createButton} onPress={handleCreateVacancy}>
          <Text style={styles.createButtonText}>+ Buat Lowongan Baru</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {vacancies.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.headerInfo}>
                <Text style={styles.vacTitle}>{item.title}</Text>
                <Text style={styles.deptText}>{item.department} • {item.type}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  item.status === 'active' ? styles.statusActive : styles.statusClosed,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    item.status === 'active' ? styles.statusTextActive : styles.statusTextClosed,
                  ]}
                >
                  {item.status === 'active' ? 'Aktif' : 'Ditutup'}
                </Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Uang Saku</Text>
                <Text style={styles.statValue}>{item.allowance}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Kuota Terisi</Text>
                <Text style={styles.statValue}>{item.filled} / {item.quota} Kursi</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Pelamar</Text>
                <Text style={[styles.statValue, { color: colors.primary.main }]}>
                  {item.applicants} Siswa
                </Text>
              </View>
            </View>

            <Text style={styles.skillsRequiredTitle}>SYARAT MICRO-SKILLS:</Text>
            <View style={styles.skillsRow}>
              {item.skills.map((skill, idx) => (
                <View key={idx} style={styles.skillBadge}>
                  <Text style={styles.skillText}>⚡ {skill}</Text>
                </View>
              ))}
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.deadlineText}>Batas Lamaran: {item.deadline}</Text>
              <View style={styles.footerButtons}>
                <Pressable
                  style={styles.toggleBtn}
                  onPress={() => handleToggleStatus(item.id, item.status)}
                >
                  <Text style={styles.toggleBtnText}>
                    {item.status === 'active' ? 'Tutup' : 'Buka'}
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.viewApplicantsBtn}
                  onPress={() => navigation.navigate('Pelamar')}
                >
                  <Text style={styles.viewApplicantsText}>Lihat Pelamar ({item.applicants})</Text>
                </Pressable>
              </View>
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
  topActionContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  createButton: {
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
  },
  createButtonText: {
    color: colors.neutral.white,
    fontSize: 14,
    fontWeight: '700',
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  card: {
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  headerInfo: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  vacTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 2,
  },
  deptText: {
    fontSize: 12,
    color: colors.neutral[500],
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  statusActive: {
    backgroundColor: '#DCFCE7',
  },
  statusClosed: {
    backgroundColor: colors.neutral[100],
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextActive: {
    color: '#15803D',
  },
  statusTextClosed: {
    color: colors.neutral[500],
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: colors.neutral[500],
    marginBottom: 2,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutral[800],
  },
  skillsRequiredTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.neutral[500],
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  skillBadge: {
    backgroundColor: colors.primary.light,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  skillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary.dark,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deadlineText: {
    fontSize: 11,
    color: colors.neutral[500],
  },
  footerButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  toggleBtn: {
    backgroundColor: colors.neutral[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
  },
  toggleBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  viewApplicantsBtn: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
  },
  viewApplicantsText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.neutral.white,
  },
});
