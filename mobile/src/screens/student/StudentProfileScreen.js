import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, shadows } from '../../utils/theme';
import ScreenHeader from '../../components/common/ScreenHeader';
import PrimaryButton from '../../components/common/PrimaryButton';
import { useAuthStore } from '../../store/useAuthStore';

export default function StudentProfileScreen() {
  const { user, logout } = useAuthStore();

  const profileItems = [
    { label: 'Nama Lengkap', value: user?.nama || 'Ahmad Pratama' },
    { label: 'Asal Sekolah', value: user?.sekolah || 'SMKN 1 Bandung' },
    { label: 'Kompetensi Keahlian', value: user?.jurusan || 'Rekayasa Perangkat Lunak' },
    { label: 'Tingkat / Kelas', value: user?.kelas || 'XII RPL 1' },
    { label: 'Nomor Induk Siswa (NISN)', value: '0061234561' },
    { label: 'Email Terdaftar', value: user?.email || 'siswa1@finetern.id' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader
        title="Profil Siswa"
        subtitle="Identitas akademik talenta vokasi"
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card Header */}
        <View style={styles.avatarCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.nama || 'S').slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.profileName}>{user?.nama || 'Ahmad Pratama'}</Text>
          <Text style={styles.profileSchool}>{user?.sekolah || 'SMKN 1 Bandung'}</Text>
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>Status: Aktif Magang (Prakerin)</Text>
          </View>
        </View>

        {/* Info List Card */}
        <View style={styles.infoCard}>
          <Text style={styles.cardHeading}>Informasi Akademik</Text>
          {profileItems.map((item, index) => (
            <View key={index} style={[styles.infoRow, index !== profileItems.length - 1 && styles.rowBorder]}>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Action Button */}
        <PrimaryButton
          title="Keluar dari Akun"
          variant="danger"
          onPress={logout}
          style={{ marginTop: spacing.md }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.md },
  avatarCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.primaryLight,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: { fontSize: 22, fontWeight: '800', color: colors.primary },
  profileName: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  profileSchool: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  statusPill: {
    backgroundColor: colors.roleSchoolBg,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
  },
  statusPillText: { fontSize: 11, fontWeight: '700', color: colors.success },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  cardHeading: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  infoRow: { paddingVertical: spacing.sm + 2 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  infoLabel: { fontSize: 12, color: colors.textMuted },
  infoValue: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginTop: 2 },
});
