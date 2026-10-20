import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, shadows } from '../../utils/theme';
import ScreenHeader from '../../components/common/ScreenHeader';
import RoleBadge from '../../components/common/RoleBadge';
import { useAuthStore } from '../../store/useAuthStore';

export default function SchoolDashboardScreen({ navigation }) {
  const { user } = useAuthStore();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader
        title={`Halo, Pak ${user?.nama?.split(' ')[0] || 'Guru'}! 👨‍🏫`}
        subtitle={`${user?.sekolah || 'SMKN 1 Bandung'} • Bimbingan & Hubin PKL`}
        rightAction={<RoleBadge role="guru_smk" />}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Ringkasan Metrik Sekolah */}
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, styles.metricCardPrimary]}>
            <Text style={styles.metricPrimaryLabel}>Menunggu Validasi</Text>
            <Text style={styles.metricPrimaryValue}>8</Text>
            <Text style={styles.metricPrimarySub}>Portofolio siswa baru masuk</Text>
          </View>

          <View style={styles.metricsSubRow}>
            <View style={styles.metricSmallCard}>
              <Text style={styles.metricSmallValue}>32</Text>
              <Text style={styles.metricSmallLabel}>Total Siswa Bimbingan</Text>
            </View>
            <View style={styles.metricSmallCard}>
              <Text style={[styles.metricSmallValue, { color: colors.status.success }]}>18</Text>
              <Text style={styles.metricSmallLabel}>Diterima Magang</Text>
            </View>
            <View style={styles.metricSmallCard}>
              <Text style={[styles.metricSmallValue, { color: colors.status.warning }]}>6</Text>
              <Text style={styles.metricSmallLabel}>Aktif Melamar</Text>
            </View>
          </View>
        </View>

        {/* Section: Validasi Perlu Tindakan Segera */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Validasi Portofolio Menunggu</Text>
            <Text style={styles.sectionSubtitle}>Beri verifikasi untuk meningkatkan match score siswa</Text>
          </View>
          <Pressable onPress={() => navigation.navigate('Validasi')}>
            <Text style={styles.sectionLink}>Semua (8)</Text>
          </Pressable>
        </View>

        {[
          {
            id: '1',
            student: 'Ahmad Fauzi',
            class: 'XII RPL 1',
            skill: 'RESTful API Express.js',
            project: 'Sistem Pembayaran SPP Online SMK',
            link: 'github.com/ahmad/spp-api',
            time: '2 jam yang lalu',
          },
          {
            id: '2',
            student: 'Siti Nurhaliza',
            class: 'XII RPL 2',
            skill: 'React Native Component Slicing',
            project: 'Aplikasi FinTech E-Wallet Clone',
            link: 'github.com/siti/ewallet-app',
            time: '5 jam yang lalu',
          },
          {
            id: '3',
            student: 'Rian Pratama',
            class: 'XII TKJ 1',
            skill: 'Linux Server Hardening & Nginx',
            project: 'Server Infrastruktur Ujian Sekolah',
            link: 'github.com/rian/school-server',
            time: '1 hari yang lalu',
          },
        ].map((item) => (
          <View key={item.id} style={styles.pendingCard}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.studentName}>{item.student}</Text>
                <Text style={styles.studentClass}>{item.class}</Text>
              </View>
              <View style={styles.badgePending}>
                <Text style={styles.badgePendingText}>Perlu Verifikasi</Text>
              </View>
            </View>

            <View style={styles.skillRow}>
              <Text style={styles.skillTag}>Keahlian: {item.skill}</Text>
            </View>

            <Text style={styles.projectDesc}>Proyek: {item.project}</Text>
            <Text style={styles.projectLink}>🔗 {item.link}</Text>

            <View style={styles.actionRow}>
              <Pressable
                style={styles.btnApprove}
                onPress={() => alert(`Portofolio ${item.student} disetujui!`)}
              >
                <Text style={styles.btnApproveText}>✓ Validasi Keahlian</Text>
              </Pressable>
              <Pressable
                style={styles.btnReview}
                onPress={() => navigation.navigate('Validasi')}
              >
                <Text style={styles.btnReviewText}>Detail</Text>
              </Pressable>
            </View>
          </View>
        ))}

        {/* Section: Penyaluran Magang Terkini */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Penyaluran Magang Siswa Terkini</Text>
        </View>

        <View style={styles.statusList}>
          {[
            { name: 'Budi Santoso', company: 'PT Telkom Indonesia', role: 'Mobile Dev Intern', status: 'Diterima Magang', date: 'Mulai 1 Nov 2026' },
            { name: 'Dewi Lestari', company: 'PT GoTo Gojek Tokopedia', role: 'Quality Assurance', status: 'Wawancara Akhir', date: 'Jadwal 24 Okt 2026' },
            { name: 'Fajar Nugraha', company: 'Bank Mandiri Digital', role: 'Backend Support', status: 'Seleksi Berkas', date: 'Diajukan 20 Okt 2026' },
          ].map((item, idx) => (
            <View key={idx} style={styles.statusItem}>
              <View style={styles.statusDot} />
              <View style={styles.statusContent}>
                <Text style={styles.statusName}>{item.name}</Text>
                <Text style={styles.statusCompany}>{item.company} • {item.role}</Text>
                <Text style={styles.statusDate}>{item.date}</Text>
              </View>
              <Text style={styles.statusBadgeText}>{item.status}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  metricsGrid: {
    marginBottom: spacing.xl,
  },
  metricCardPrimary: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    ...shadows.md,
  },
  metricPrimaryLabel: {
    fontSize: 13,
    color: '#DCE6F5',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricPrimaryValue: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.white,
    marginVertical: spacing.xs,
  },
  metricPrimarySub: {
    fontSize: 13,
    color: '#EAF0F9',
  },
  metricsSubRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metricSmallCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  metricSmallValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 2,
  },
  metricSmallLabel: {
    fontSize: 11,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: 14,
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
    color: colors.primary,
  },
  pendingCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  studentClass: {
    fontSize: 12,
    color: colors.neutral[500],
  },
  badgePending: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  badgePendingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#B45309',
  },
  skillRow: {
    marginVertical: spacing.xs,
  },
  skillTag: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  projectDesc: {
    fontSize: 13,
    color: colors.neutral[700],
    marginBottom: 4,
  },
  projectLink: {
    fontSize: 12,
    color: colors.neutral[500],
    marginBottom: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  btnApprove: {
    flex: 2,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  btnApproveText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  btnReview: {
    flex: 1,
    backgroundColor: colors.neutral[100],
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  btnReviewText: {
    color: colors.neutral[700],
    fontSize: 13,
    fontWeight: '600',
  },
  statusList: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: spacing.sm,
  },
  statusContent: {
    flex: 1,
  },
  statusName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  statusCompany: {
    fontSize: 12,
    color: colors.neutral[600],
  },
  statusDate: {
    fontSize: 11,
    color: colors.neutral[400],
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
});
