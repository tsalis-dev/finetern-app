import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AppIcon from './AppIcon';
import { colors, spacing } from '../../utils/theme';

export default function ScreenHeader({ title, subtitle, onBack }) {
  const navigation = useNavigation();
  return <View style={styles.header}>
    {onBack ? <Pressable accessibilityRole="button" accessibilityLabel="Kembali" style={styles.action} onPress={onBack}><AppIcon name="back" /></Pressable> : null}
    <View style={styles.text}><Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
    {!onBack ? <Pressable accessibilityRole="button" accessibilityLabel="Buka profil" style={styles.action} onPress={() => navigation.navigate('Profil')}><AppIcon name="user" size={22} /></Pressable> : null}
  </View>;
}
const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md, backgroundColor: colors.background },
  text: { flex: 1, gap: 6 },
  title: { fontSize: 24, lineHeight: 31, fontWeight: '700', color: colors.textPrimary },
  subtitle: { fontSize: 14, color: colors.textSecondary, lineHeight: 21 },
  action: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
});
