import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PrimaryButton from '../../components/common/PrimaryButton';
import BrandLogo from '../../components/common/BrandLogo';
import WelcomeScene from '../../components/common/WelcomeScene';
import { colors } from '../../utils/theme';

export default function WelcomeScreen({ navigation }) {
  return <SafeAreaView style={styles.safe}>
    <ScrollView contentContainerStyle={styles.content}>
      <BrandLogo size={26} />
      <View style={styles.intro}>
        <WelcomeScene />
        <Text style={styles.title}>Tunjukkan karyamu.{ '\n' }Temukan peluang{ '\n' }untuk bertumbuh.</Text>
      </View>
      <View style={styles.actions}>
        <PrimaryButton title="Masuk" onPress={() => navigation.navigate('RoleSelection')} style={styles.button} />
        <PrimaryButton title="Buat akun baru" variant="secondary" onPress={() => navigation.navigate('Register')} style={styles.button} />
        <Text style={styles.footer}>Untuk siswa, guru, dan industri.</Text>
      </View>
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, width: '100%', maxWidth: 520, alignSelf: 'center', padding: 24, paddingTop: 16, gap: 24 },
  intro: { flexGrow: 1, justifyContent: 'center', gap: 8, minHeight: 390 },
  title: { fontSize: 27, lineHeight: 35, fontWeight: '500', color: colors.textPrimary, letterSpacing: -0.6, paddingHorizontal: 8 },
  actions: { gap: 12 },
  button: { borderRadius: 28, minHeight: 52 },
  footer: { color: colors.textMuted, fontSize: 12, lineHeight: 18, textAlign: 'center', paddingTop: 8 },
});
