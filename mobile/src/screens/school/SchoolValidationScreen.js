import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, shadows } from '../../utils/theme';
import ScreenHeader from '../../components/common/ScreenHeader';

export default function SchoolValidationScreen() {
  const [activeFilter, setActiveFilter] = useState('pending'); // 'all', 'pending', 'approved'
  const [validations, setValidations] = useState([
    {
      id: '1',
      studentName: 'Ahmad Fauzi',
      class: 'XII Rekayasa Perangkat Lunak 1',
      skill: 'RESTful API Integration & Express.js',
      projectTitle: 'Sistem Pembayaran SPP Online SMK Berbasis Web API',
      description: 'Membangun backend REST API dengan autentikasi JWT, hashing password bcrypt, dan integrasi payment gateway simulator.',
      proofUrl: 'https://github.com/ahmadfauzi/spp-online-api',
      status: 'pending',
      date: '20 Okt 2026',
    },
    {
      id: '2',
      studentName: 'Siti Nurhaliza',
      class: 'XII Rekayasa Perangkat Lunak 2',
      skill: 'React Native Component Slicing',
      projectTitle: 'Aplikasi FinTech E-Wallet Clone (Finetern Pay)',
      description: 'Implementasi navigasi @react-navigation bottom tabs, state management Zustand, dan styling Toss design tokens.',
      proofUrl: 'https://github.com/sitinur/finetern-wallet-rn',
      status: 'pending',
      date: '19 Okt 2026',
    },
    {
      id: '3',
      studentName: 'Rian Pratama',
      class: 'XII Teknik Komputer Jaringan 1',
      skill: 'Linux Server Hardening & Nginx Proxy',
      projectTitle: 'Konfigurasi Reverse Proxy Nginx & SSL Let\'s Encrypt',
      description: 'Konfigurasi VPS Ubuntu Linux untuk load balancing 2 instance server sekolah dengan sertifikat SSL otomatis.',
      proofUrl: 'https://github.com/rianpratama/nginx-conf-smk',
      status: 'pending',
      date: '18 Okt 2026',
    },
    {
      id: '4',
      studentName: 'Budi Santoso',
      class: 'XII Rekayasa Perangkat Lunak 1',
      skill: 'Relational Database Schema Design (MySQL)',
      projectTitle: 'Normalisasi Database Sistem Perpustakaan Digital',
      description: 'Merancang 3NF schema dengan foreign keys, indexing, dan trigger otomatis peminjaman buku.',
      proofUrl: 'https://github.com/budisantoso/perpustakaan-db',
      status: 'approved',
      date: '15 Okt 2026',
    },
  ]);

  const handleApprove = (id, studentName, skill) => {
    setValidations((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'approved' } : item))
    );
    Alert.alert(
      'Validasi Berhasil',
      `Keahlian "${skill}" milik ${studentName} berhasil divalidasi dan match score siswa telah diperbarui!`
    );
  };

  const handleRevision = (id, studentName) => {
    Alert.alert(
      'Minta Catatan Revisi',
      `Kirimkan catatan masukan kepada ${studentName} agar menyempurnakan bukti karya proyeknya.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Kirim Notifikasi',
          onPress: () => {
            Alert.alert('Terkirim', 'Catatan evaluasi telah diteruskan ke portal siswa.');
          },
        },
      ]
    );
  };

  const filteredItems = validations.filter((item) => {
    if (activeFilter === 'all') return true;
    return item.status === activeFilter;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader
        title="Validasi Portofolio Siswa"
        subtitle="Verifikasi bukti karya siswa untuk meningkatkan Match Score Magang"
      />

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {[
          { key: 'pending', label: 'Menunggu (3)' },
          { key: 'approved', label: 'Tervalidasi (1)' },
          { key: 'all', label: 'Semua (4)' },
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
        {filteredItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🎉</Text>
            <Text style={styles.emptyTitle}>Semua Portofolio Selesai Divalidasi</Text>
            <Text style={styles.emptySubtitle}>Tidak ada pengajuan keahlian yang menunggu verifikasi saat ini.</Text>
          </View>
        ) : (
          filteredItems.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemTopRow}>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{item.studentName}</Text>
                  <Text style={styles.studentClass}>{item.class}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    item.status === 'approved' ? styles.badgeApproved : styles.badgePending,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      item.status === 'approved' ? styles.textApproved : styles.textPending,
                    ]}
                  >
                    {item.status === 'approved' ? '✓ Terverifikasi' : 'Menunggu Validasi'}
                  </Text>
                </View>
              </View>

              <View style={styles.skillBox}>
                <Text style={styles.skillLabel}>MICRO-SKILL DIAJUKAN:</Text>
                <Text style={styles.skillName}>{item.skill}</Text>
              </View>

              <Text style={styles.projectTitle}>{item.projectTitle}</Text>
              <Text style={styles.projectDesc}>{item.description}</Text>

              <View style={styles.proofBox}>
                <Text style={styles.proofLabel}>Bukti Proyek / Repositori:</Text>
                <Text style={styles.proofUrl} numberOfLines={1}>{item.proofUrl}</Text>
              </View>

              {item.status === 'pending' ? (
                <View style={styles.actionRow}>
                  <Pressable
                    style={styles.approveButton}
                    onPress={() => handleApprove(item.id, item.studentName, item.skill)}
                  >
                    <Text style={styles.approveButtonText}>✓ Setujui & Validasi</Text>
                  </Pressable>
                  <Pressable
                    style={styles.revisionButton}
                    onPress={() => handleRevision(item.id, item.studentName)}
                  >
                    <Text style={styles.revisionButtonText}>Minta Catatan</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.validatedFooter}>
                  <Text style={styles.validatedDate}>Tervalidasi pada {item.date} oleh Guru Hubin</Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  filterTab: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[100],
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral[600],
  },
  filterTabTextActive: {
    color: colors.white,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.neutral[500],
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  itemCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  studentClass: {
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  badgePending: {
    backgroundColor: '#FEF3C7',
  },
  badgeApproved: {
    backgroundColor: '#E8F5E9',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  textPending: {
    color: '#B45309',
  },
  textApproved: {
    color: colors.status.success,
  },
  skillBox: {
    backgroundColor: colors.primaryLight,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  skillLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primaryDark,
    letterSpacing: 0.5,
  },
  skillName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
    marginTop: 2,
  },
  projectTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 4,
  },
  projectDesc: {
    fontSize: 12,
    color: colors.neutral[600],
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  proofBox: {
    backgroundColor: colors.neutral[50],
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  proofLabel: {
    fontSize: 11,
    color: colors.neutral[500],
    marginBottom: 2,
  },
  proofUrl: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  approveButton: {
    flex: 2,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  approveButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  revisionButton: {
    flex: 1,
    backgroundColor: colors.neutral[100],
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  revisionButtonText: {
    color: colors.neutral[700],
    fontSize: 13,
    fontWeight: '600',
  },
  validatedFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.xs,
  },
  validatedDate: {
    fontSize: 11,
    color: colors.status.success,
    fontWeight: '600',
  },
});
