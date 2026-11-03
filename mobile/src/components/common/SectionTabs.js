import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../../utils/theme';

export default function SectionTabs({ choices, value, onChange }) {
  return <View style={styles.row}>{choices.map(([key, label]) =>
    <Pressable key={key} accessibilityRole="tab" accessibilityState={{ selected: key === value }}
      onPress={() => onChange(key)} style={[styles.tab, key === value && styles.active]}>
      <Text style={[styles.label, key === value && styles.selected]}>{label}</Text>
    </Pressable>
  )}</View>;
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginHorizontal: spacing.lg, marginVertical: spacing.sm, padding: 4, gap: 4, borderRadius: 14, backgroundColor: colors.surfaceElevated },
  tab: { flex: 1, minHeight: 48, padding: spacing.sm, justifyContent: 'center', borderRadius: 11 },
  active: { backgroundColor: colors.white },
  label: { textAlign: 'center', color: colors.textSecondary, fontSize: 14 },
  selected: { color: colors.primary, fontWeight: '700' },
});
