import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, shadows } from '../../utils/theme';
import CustomInput from '../../components/common/CustomInput';
import PrimaryButton from '../../components/common/PrimaryButton';
import { useAuthStore } from '../../store/useAuthStore';

export default function LoginScreen() {
  const [selectedRole, setSelectedRole] = useState('siswa'); // 'siswa' | 'sekolah' | 'industri'
  const [email, setEmail] = useState('siswa1@finetern.id');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);

  const { login, switchRole } = useAuthStore();

  const handleRoleTabChange = (role) => {
    setSelectedRole(role);
    if (role === 'siswa') {
      setEmail('siswa1@finetern.id');
    } else if (role === 'sekolah') {
      setEmail('guru@smkn1bandung.sch.id');
    } else if (role === 'industri') {
      setEmail('hrd@digitalkreatif.com');
    }
  };

  const handleQuickDemoLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      switchRole(selectedRole);
      setIsLoading(false);
    }, 400);
  };

  const handleStandardLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      switchRole(selectedRole);
      setIsLoading(false);
    }, 400);
  };

  const roleTitles = {
    siswa: 'Siswa SMK',
    sekolah: 'Guru / Sekolah',
    industri: 'Mitra Industri',
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo & Header */}
          <View style={styles.brandContainer}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>F</Text>
            </View>
            <Text style={styles.brandTitle}>Finetern</Text>
            <Text style={styles.brandSubtitle}>
              Platform Rekrutmen Magang Vokasi Berbasis Bukti & Micro-Skills
            </Text>
          </View>

          {/* Role Switcher Tabs */}
          <View style={styles.tabContainer}>
            {['siswa', 'sekolah', 'industri'].map((roleKey) => {
              const active = selectedRole === roleKey;
              return (
                <Pressable
                  key={roleKey}
                  onPress={() => handleRoleTabChange(roleKey)}
                  style={[styles.tabButton, active && styles.tabButtonActive]}
                  accessibilityRole="tab"
                >
                  <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>
                    {roleTitles[roleKey]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Login Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              Masuk sebagai {roleTitles[selectedRole]}
            </Text>
            <Text style={styles.cardSubtitle}>
              Gunakan kredensial akun terdaftar untuk melanjutkan ke dasbor peran.
            </Text>

            <CustomInput
              label="Alamat Surel (Email)"
              value={email}
              onChangeText={setEmail}
              placeholder="nama@email.com"
              keyboardType="email-address"
            />

            <CustomInput
              label="Kata Sandi (Password)"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              helperText="Default demo: password123"
            />

            <PrimaryButton
              title="Masuk ke Finetern"
              onPress={handleStandardLogin}
              loading={isLoading}
              style={styles.submitButton}
            />

            {/* Quick Demo Login Option */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OPSI DEMO CEPAT</Text>
              <View style={styles.dividerLine} />
            </View>

            <PrimaryButton
              title={`Demo Langsung: Akun ${roleTitles[selectedRole]}`}
              onPress={handleQuickDemoLogin}
              variant="secondary"
            />
          </View>

          {/* Footer Context */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              IK300 Mobile Programming • Uji Coba Navigasi Multi-Peran
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    ...shadows.subtle,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.white,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.border,
    padding: 4,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  tabButton: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.sm + 2,
  },
  tabButtonActive: {
    backgroundColor: colors.white,
    ...shadows.subtle,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabButtonTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: spacing.md,
  },
  submitButton: {
    marginTop: spacing.xs,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    paddingHorizontal: spacing.sm,
    letterSpacing: 0.5,
  },
  footer: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
