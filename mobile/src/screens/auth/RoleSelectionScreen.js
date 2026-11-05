import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import AuthLayout from '../../components/common/AuthLayout';
import AppIcon from '../../components/common/AppIcon';
import { accountRoles } from '../../utils/accountRoles';
import { colors } from '../../utils/theme';

export default function RoleSelectionScreen({ navigation }) {
  return <AuthLayout title="Mulai dari peranmu." subtitle="Satu tempat untuk belajar, membimbing, dan membuka peluang." onBack={() => navigation.goBack()}>
    <View style={styles.intro}><Text style={styles.heading}>Masuk sebagai siapa?</Text><Text style={styles.note}>Pilih peran yang sesuai dengan akunmu.</Text></View>
    <View style={styles.roles}>{Object.entries(accountRoles).map(([role, details]) => <Pressable key={role}
      accessibilityRole="button" accessibilityLabel={'Masuk sebagai ' + details.label.toLowerCase()}
      onPress={() => navigation.navigate('Login', { role })}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={[styles.icon, role === 'sekolah' && styles.warm]}><AppIcon name={details.icon} size={25} /></View>
      <View style={styles.description}><Text style={styles.title}>{details.label}</Text><Text style={styles.body}>{details.description}</Text></View>
      <AppIcon name="arrow" size={20} />
    </Pressable>)}</View>
  </AuthLayout>;
}
const styles = StyleSheet.create({
  intro: { gap: 5 },
  heading: { color: colors.textPrimary, fontSize: 20, fontWeight: '700', letterSpacing: -0.4 },
  note: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },
  roles: { gap: 12 },
  card: { minHeight: 94, flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 20, borderCurve: 'continuous' },
  icon: { padding: 13, borderRadius: 15, backgroundColor: colors.primaryLight },
  warm: { backgroundColor: colors.accentWarm },
  description: { flex: 1, gap: 5 },
  title: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  body: { color: colors.textSecondary, fontSize: 12, lineHeight: 19 },
  pressed: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
});
