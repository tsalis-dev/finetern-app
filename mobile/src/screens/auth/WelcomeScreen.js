import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PrimaryButton from '../../components/common/PrimaryButton';
import AppIcon from '../../components/common/AppIcon';
import { colors, spacing } from '../../utils/theme';

export default function WelcomeScreen({ navigation }) {
  return <SafeAreaView style={styles.safe}><View style={styles.content}>
    <Text style={styles.brand}>finetern</Text>
    <View style={styles.illustration}>
      <View style={styles.emblem}><AppIcon name="school" size={76} /></View>
      <Text style={styles.caption}>Karya hari ini. Peluang esok hari.</Text>
    </View>
    <View style={styles.message}>
      <Text style={styles.title}>Temukan tempat magangmu.</Text>
      <Text style={styles.body}>Tunjukkan kemampuan lewat karya. Temukan industri yang membutuhkannya.</Text>
    </View>
    <PrimaryButton title="Masuk" onPress={() => navigation.navigate('RoleSelection')} />
  </View></SafeAreaView>;
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: spacing.lg, gap: spacing.lg },
  brand: { fontSize: 28, fontWeight: '700', color: colors.primary },
  illustration: { flex: 1, minHeight: 110, backgroundColor: colors.primaryLight, borderRadius: 28, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  emblem: { padding: spacing.md, backgroundColor: colors.white, borderRadius: 24 },
  caption: { color: colors.primary, fontSize: 13, paddingHorizontal: 12, textAlign: 'center' },
  message: { gap: spacing.md },
  title: { fontSize: 36, lineHeight: 43, fontWeight: '700', color: colors.textPrimary },
  body: { fontSize: 16, lineHeight: 25, color: colors.textSecondary },
});
