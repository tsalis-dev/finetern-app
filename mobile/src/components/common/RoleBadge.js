import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, borderRadius, spacing } from '../../utils/theme';

export default function RoleBadge({ role, size = 'medium' }) {
  const getRoleConfig = () => {
    switch (role) {
      case 'siswa':
        return {
          label: 'Siswa SMK',
          bg: colors.roleStudentBg,
          text: colors.roleStudent,
        };
      case 'sekolah':
      case 'guru_smk':
        return {
          label: 'Guru Pembimbing',
          bg: colors.roleSchoolBg,
          text: colors.roleSchool,
        };
      case 'industri':
      case 'mitra_industri':
        return {
          label: 'Mitra Industri DUDI',
          bg: colors.roleIndustryBg,
          text: colors.roleIndustry,
        };
      default:
        return {
          label: 'Pengguna',
          bg: colors.surfaceElevated,
          text: colors.textSecondary,
        };
    }
  };

  const { label, bg, text } = getRoleConfig();
  const isSmall = size === 'small';

  return (
    <View style={[styles.badge, { backgroundColor: bg }, isSmall && styles.badgeSmall]}>
      <Text style={[styles.text, { color: text }, isSmall && styles.textSmall]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
  textSmall: {
    fontSize: 10,
    fontWeight: '700',
  },
});
