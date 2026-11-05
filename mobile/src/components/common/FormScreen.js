import React from 'react';
import { ScrollView, KeyboardAvoidingView, Platform, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppIcon from './AppIcon';
import BrandLogo from './BrandLogo';
import { colors, spacing } from '../../utils/theme';

export default function FormScreen({ title, subtitle, children, onBack, backDisabled = false, header }) {
  return <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
    <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        {onBack ? <Pressable accessibilityRole="button" accessibilityLabel="Kembali" disabled={backDisabled} onPress={onBack} style={styles.back}><AppIcon name="back" /><Text style={styles.backLabel}>Kembali</Text></Pressable> : <BrandLogo size={30} />}
        {header || <><Text style={styles.title}>{title}</Text>{subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}</>}
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, padding: spacing.lg, paddingBottom: spacing.xl, gap: spacing.lg },
  title: { color: colors.textPrimary, fontSize: 28, fontWeight: '700', lineHeight: 36 },
  subtitle: { color: colors.textSecondary, lineHeight: 23, fontSize: 15 },
  back: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 48, alignSelf: 'flex-start' },
  backLabel: { color: colors.primary, fontSize: 15 },
});
