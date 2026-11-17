import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PrimaryButton from '../../components/common/PrimaryButton';
import BrandLogo from '../../components/common/BrandLogo';
import AppIcon from '../../components/common/AppIcon';
import { colors } from '../../utils/theme';

export default function WelcomeScreen({ navigation }) {
  return <SafeAreaView style={styles.safe}>
    <ScrollView contentContainerStyle={styles.content}>
      <BrandLogo size={32} />
      <View style={styles.message}>
        <Text style={styles.title}>Karyamu membuka{ '\n' }<Text style={styles.accent}>peluang magang.</Text></Text>
        <Text style={styles.body}>Tunjukkan kemampuanmu lewat karya, lalu temukan magang yang sesuai.</Text>
      </View>
      <View style={styles.photo}>
        <Image
          source={require('../../../assets/onboarding/students-collaborating-v1.png')}
          style={styles.photoImage}
          resizeMode="cover"
          accessible
          accessibilityLabel="Ilustrasi siswa berkolaborasi mengerjakan proyek"
        />
      </View>
      <View style={styles.journey} accessible accessibilityLabel="Bukti karya, penilaian guru, peluang magang">
        <View style={styles.step}><AppIcon name="folder" size={20} /><Text style={styles.stepLabel}>Karya</Text></View>
        <AppIcon name="next" size={14} color={colors.textMuted} />
        <View style={styles.step}><AppIcon name="check" size={20} /><Text style={styles.stepLabel}>Penilaian</Text></View>
        <AppIcon name="next" size={14} color={colors.textMuted} />
        <View style={styles.step}><AppIcon name="briefcase" size={20} /><Text style={styles.stepLabel}>Magang</Text></View>
      </View>
      <View style={styles.actions}>
        <PrimaryButton title="Masuk" onPress={() => navigation.navigate('RoleSelection')} style={styles.button} />
        <Text style={styles.footer}>Untuk siswa, guru, dan industri.</Text>
      </View>
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, width: '100%', maxWidth: 520, alignSelf: 'center', padding: 24, gap: 24 },
  message: { gap: 10, paddingTop: 8 },
  title: { fontSize: 35, lineHeight: 42, fontWeight: '700', color: colors.textPrimary, letterSpacing: -1.1 },
  accent: { color: colors.primary },
  body: { fontSize: 15, lineHeight: 23, color: colors.textSecondary },
  photo: { width: '100%', aspectRatio: 4 / 3, overflow: 'hidden', borderTopLeftRadius: 42, borderTopRightRadius: 12, borderBottomLeftRadius: 12, borderBottomRightRadius: 42, backgroundColor: colors.surfaceElevated },
  photoImage: { width: '100%', height: '100%' },
  journey: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6, paddingVertical: 8 },
  step: { flexShrink: 1, alignItems: 'center', gap: 8 },
  stepLabel: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  actions: { marginTop: 'auto', gap: 12, paddingTop: 4 },
  button: { borderRadius: 14, minHeight: 54 },
  footer: { color: colors.textMuted, fontSize: 12, lineHeight: 18, textAlign: 'center' },
});
