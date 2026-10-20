import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, shadows } from '../../utils/theme';
import ScreenHeader from '../../components/common/ScreenHeader';
import RoleBadge from '../../components/common/RoleBadge';
import { useAuthStore } from '../../store/useAuthStore';

export default function IndustryProfileScreen() {
  const { user, role, switchRole, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Konfirmasi Keluar', 'Apakah Anda yakin ingin keluar dari akun mitra industri ini?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="Profil Mitra Industri" subtitle="Kelola identitas perusahaan & preferensi rekrutmen" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user?.nama ? user.nama.charAt(0) : 'T'}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.nama || 'PT Telkom Indonesia (Persero) Tbk'}</Text>
          <Text style={styles.userSector}>Telekomunikasi, Digital Service & AI Solution</Text>
          <View style={styles.badgeRow}>
            <RoleBadge role={role || 'mitra_industri'} />
          </View>
        </View>

        {/* Info Detail Perusahaan */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Informasi Perusahaan</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nama PIC Magang</Text>
            <Text style={styles.infoValue}>Andi Wijaya, S.T. (Talent Acquisition)</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email PIC</Text>
            <Text style={styles.infoValue}>{user?.email || 'hr@telkom.co.id'}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Alamat Kantor</Text>
            <Text style={styles.infoValue}>Jl. Japati No. 1, Kota Bandung</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Website Resmi</Text>
            <Text style={styles.infoValue}>https://telkom.co.id</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status Kemitraan</Text>
            <Text style={[styles.infoValue, { color: colors.status.success }]}>✓ Mitra Resmi DUDI SMK</Text>
          </View>
        </View>

        {/* Role Switcher Testing Simulator */}
        <View style={styles.switcherCard}>
          <Text style={styles.switcherTitle}>🧪 Simulator Uji Role (Testing Mode)</Text>
          <Text style={styles.switcherSubtitle}>
            Pindah role secara instan tanpa login ulang untuk verifikasi antarmuka:
          </Text>

          <View style={styles.switchButtonRow}>
            <Pressable
              style={[styles.switchBtn, role === 'siswa' && styles.switchBtnActive]}
              onPress={() => switchRole('siswa')}
            >
              <Text style={[styles.switchBtnText, role === 'siswa' && styles.switchBtnTextActive]}>
                👨‍🎓 Siswa SMK
              </Text>
            </Pressable>

            <Pressable
              style={[styles.switchBtn, role === 'guru_smk' && styles.switchBtnActive]}
              onPress={() => switchRole('guru_smk')}
            >
              <Text style={[styles.switchBtnText, role === 'guru_smk' && styles.switchBtnTextActive]}>
                👨‍🏫 Guru SMK
              </Text>
            </Pressable>

            <Pressable
              style={[styles.switchBtn, role === 'mitra_industri' && styles.switchBtnActive]}
              onPress={() => switchRole('mitra_industri')}
            >
              <Text style={[styles.switchBtnText, role === 'mitra_industri' && styles.switchBtnTextActive]}>
                🏢 Industri
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Tombol Logout */}
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Keluar dari Akun</Text>
        </Pressable>

        <Text style={styles.versionText}>Finetern v1.0.0 • Mobile Programming UPI</Text>
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
  profileCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  avatarContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.role.industri.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.role.industri.border,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.role.industri.text,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 4,
    textAlign: 'center',
  },
  userSector: {
    fontSize: 12,
    color: colors.neutral[500],
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
  },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.neutral[500],
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral[900],
    maxWidth: '60%',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  switcherCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  switcherTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 4,
  },
  switcherSubtitle: {
    fontSize: 12,
    color: '#3B82F6',
    marginBottom: spacing.md,
    lineHeight: 16,
  },
  switchButtonRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  switchBtn: {
    flex: 1,
    backgroundColor: colors.white,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  switchBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  switchBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.neutral[700],
  },
  switchBtnTextActive: {
    color: colors.white,
  },
  logoutButton: {
    backgroundColor: '#FEE2E2',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.status.error,
  },
  versionText: {
    fontSize: 12,
    color: colors.neutral[400],
    textAlign: 'center',
  },
});
