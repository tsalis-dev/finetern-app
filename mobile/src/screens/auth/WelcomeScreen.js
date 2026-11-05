import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PrimaryButton from '../../components/common/PrimaryButton';
import BrandLogo from '../../components/common/BrandLogo';
import { colors } from '../../utils/theme';

export default function WelcomeScreen({ navigation }) {
  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.content}>
    <BrandLogo size={40} />
    <View style={styles.feature}>
      <Text style={styles.eyebrow}>DARI KARYA KE KARIER</Text>
      <View style={styles.symbol}><BrandLogo markOnly size={140} color={colors.white} /></View>
      <Text style={styles.caption}>Karya hari ini.{ '\n' }Peluang esok hari.</Text>
    </View>
    <View style={styles.message}>
      <Text style={styles.title}>Temukan tempat{ '\n' }bertumbuh.</Text>
      <Text style={styles.body}>Belajar, tunjukkan karya, dan temukan magang yang sesuai dengan kemampuanmu.</Text>
    </View>
    <PrimaryButton title="Masuk" onPress={() => navigation.navigate('RoleSelection')} style={styles.button} />
    <Text style={styles.footer}>Untuk siswa, guru, dan industri.</Text>
  </ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, padding: 24, gap: 24 },
  feature: { flexGrow: 1, minHeight: 290, backgroundColor: colors.primary, borderRadius: 30, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'space-between', padding: 26, gap: 24 },
  eyebrow: { color: colors.onPrimaryMuted, fontSize: 10, fontWeight: '700', letterSpacing: 2 },
  symbol: { paddingVertical: 12 },
  caption: { color: colors.white, fontSize: 20, fontWeight: '600', lineHeight: 27, textAlign: 'center', letterSpacing: -0.3 },
  message: { gap: 12 },
  title: { fontSize: 34, lineHeight: 41, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.9 },
  body: { fontSize: 15, lineHeight: 24, color: colors.textSecondary },
  button: { borderRadius: 16, minHeight: 52 },
  footer: { color: colors.textMuted, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: -10 },
});
