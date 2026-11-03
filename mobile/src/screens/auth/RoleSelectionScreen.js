import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import FormScreen from '../../components/common/FormScreen';
import AppIcon from '../../components/common/AppIcon';
import { accountRoles } from '../../utils/accountRoles';
import { colors, spacing } from '../../utils/theme';

export default function RoleSelectionScreen({ navigation }) {
  return <FormScreen title="Masuk sebagai siapa?" subtitle="Pilih peranmu di Finetern." onBack={() => navigation.goBack()}>
    {Object.entries(accountRoles).map(([role, details]) => <Pressable key={role}
      accessibilityRole="button" accessibilityLabel={'Masuk sebagai ' + details.label.toLowerCase()}
      onPress={() => navigation.navigate('Login', { role })}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.icon}><AppIcon name={details.icon} size={28} /></View>
      <View style={styles.description}><Text style={styles.title}>{details.label}</Text><Text style={styles.body}>{details.description}</Text></View>
      <AppIcon name="next" size={20} color={colors.textSecondary} />
    </Pressable>)}
  </FormScreen>;
}
const styles = StyleSheet.create({
  card: { minHeight: 104, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 20 },
  icon: { padding: 12, borderRadius: 16, backgroundColor: colors.primaryLight },
  description: { flex: 1, gap: 6 },
  title: { fontSize: 20, fontWeight: '600', color: colors.textPrimary },
  body: { color: colors.textSecondary, lineHeight: 21 },
  pressed: { borderColor: colors.primary },
});
