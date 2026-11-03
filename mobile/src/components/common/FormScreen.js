import React from 'react';
import { ScrollView, KeyboardAvoidingView, Platform, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../utils/theme';

export default function FormScreen({ title, subtitle, children }) {
  return <SafeAreaView style={styles.safe}><KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
      <Text style={styles.brand}>finetern</Text><Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}{children}
    </ScrollView>
  </KeyboardAvoidingView></SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.background }, content: { padding: spacing.lg, gap: spacing.md },
  brand: { color: colors.primary, fontSize: 20, fontWeight: '700' }, title: { color: colors.textPrimary, fontSize: 28, fontWeight: '700', lineHeight: 36 }, subtitle: { color: colors.textSecondary, lineHeight: 22, fontSize: 14 } });
