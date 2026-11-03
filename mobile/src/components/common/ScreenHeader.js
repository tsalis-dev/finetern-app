import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, spacing, borderRadius } from '../../utils/theme';
import RoleBadge from './RoleBadge';
import { useAuthStore } from '../../store/useAuthStore';

export default function ScreenHeader({ title, subtitle, showRoleBadge = true, demo = false }) {
  const { role, logout } = useAuthStore();

  return (
    <View style={styles.header}>
      <View style={styles.titleContainer}>
        {showRoleBadge && role && (
          <View style={styles.badgeWrapper}>
            <RoleBadge role={role} size="small" />
          </View>
        )}
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        {demo && <Text style={styles.demo}>Pratinjau fitur · Data contoh, belum terhubung</Text>}
      </View>

      <Pressable
        onPress={() => logout().catch(() => {})}
        style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]}
        accessibilityRole="button"
        accessibilityLabel="Keluar / Ganti Akun"
      >
        <Text style={styles.logoutText}>Keluar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  demo: { color: colors.primary, fontSize: 12, marginTop: spacing.sm, lineHeight: 18 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titleContainer: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  badgeWrapper: {
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  logoutButton: {
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoutButtonPressed: {
    backgroundColor: colors.border,
  },
  logoutText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
