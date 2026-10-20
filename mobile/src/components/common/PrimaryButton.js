import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, borderRadius, spacing } from '../../utils/theme';

export default function PrimaryButton({
  title,
  onPress,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'danger'
  loading = false,
  disabled = false,
  style,
  textStyle,
}) {
  const getBackgroundColor = (pressed) => {
    if (disabled) return colors.border;
    if (variant === 'secondary') return pressed ? colors.border : colors.surfaceElevated;
    if (variant === 'outline') return pressed ? colors.primaryLight : 'transparent';
    if (variant === 'danger') return pressed ? '#DC2626' : colors.error;
    return pressed ? colors.primaryDark : colors.primary;
  };

  const getTextColor = () => {
    if (disabled) return colors.textMuted;
    if (variant === 'secondary') return colors.textPrimary;
    if (variant === 'outline') return colors.primary;
    return colors.white;
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: getBackgroundColor(pressed) },
        variant === 'outline' && styles.outlineBorder,
        style,
      ]}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48, // Standar aksesibilitas WCAG touch-target
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  outlineBorder: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});
