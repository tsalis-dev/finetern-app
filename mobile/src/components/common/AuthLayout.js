import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppIcon from './AppIcon';
import BrandLogo from './BrandLogo';
import { colors } from '../../utils/theme';

export default function AuthLayout({ title, subtitle, onBack, backDisabled = false, children }) {
  return <SafeAreaView style={styles.safe}>
    <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <Pressable accessibilityRole="button" accessibilityLabel="Kembali" disabled={backDisabled} onPress={onBack} style={styles.back}><AppIcon name="back" size={20} /><Text style={styles.backLabel}>Kembali</Text></Pressable>
        <View style={styles.hero}>
          <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.watermark}><BrandLogo markOnly size={176} color={colors.white} /></View>
          <BrandLogo size={30} color={colors.white} />
          <View style={styles.message}><Text style={styles.title}>{title}</Text><Text style={styles.subtitle}>{subtitle}</Text></View>
        </View>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, padding: 24, paddingTop: 8, gap: 20 },
  back: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, minHeight: 44 },
  backLabel: { color: colors.primary, fontSize: 13, fontWeight: '500' },
  hero: { backgroundColor: colors.primary, borderRadius: 26, borderCurve: 'continuous', padding: 22, gap: 22, overflow: 'hidden' },
  watermark: { position: 'absolute', right: -24, bottom: -28, opacity: 0.07 },
  message: { gap: 8 },
  title: { fontSize: 28, lineHeight: 35, letterSpacing: -0.6, fontWeight: '700', color: colors.white },
  subtitle: { color: colors.onPrimaryMuted, fontSize: 13, lineHeight: 20 },
});
