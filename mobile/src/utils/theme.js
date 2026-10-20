/**
 * Finetern Design Tokens
 * Mengadopsi prinsip Toss-Style Design System (Disiplin Spacing, Hirarki Grayscale, dan Warna Semantik)
 */

export const colors = {
  // Grayscale Hierarchy (High-trust, clean)
  white: '#FFFFFF',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceElevated: '#F1F5F9',
  border: '#E2E8F0',
  borderFocus: '#94A3B8',

  textPrimary: '#0F172A',   // Slate 900
  textSecondary: '#475569', // Slate 600
  textMuted: '#94A3B8',     // Slate 400

  // Brand Accent
  primary: '#2563EB',       // Blue 600
  primaryDark: '#1D4ED8',   // Blue 700
  primaryLight: '#EFF6FF',  // Blue 50
  primaryBorder: '#BFDBFE', // Blue 200

  // Role Identifiers
  roleStudent: '#2563EB',   // Biru Siswa
  roleStudentBg: '#EFF6FF',
  roleSchool: '#059669',    // Hijau Guru/Sekolah
  roleSchoolBg: '#ECFDF5',
  roleIndustry: '#7C3AED',  // Ungu Industri
  roleIndustryBg: '#F5F3FF',

  // Status Colors
  success: '#10B981',
  successBg: '#ECFDF5',
  warning: '#F59E0B',
  warningBg: '#FFFBEB',
  error: '#EF4444',
  errorBg: '#FEF2F2',
  info: '#3B82F6',
  infoBg: '#EFF6FF',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const typography = {
  titleLarge: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    color: colors.textPrimary,
  },
  titleMedium: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    color: colors.textPrimary,
  },
  titleSmall: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    color: colors.textPrimary,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: colors.textSecondary,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    color: colors.textMuted,
  },
  labelBold: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    textTransform: 'uppercase',
  },
};

export const shadows = {
  subtle: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
};
