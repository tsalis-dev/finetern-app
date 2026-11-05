import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import AuthLayout from '../../components/common/AuthLayout';
import AppIcon from '../../components/common/AppIcon';
import CustomInput from '../../components/common/CustomInput';
import PrimaryButton from '../../components/common/PrimaryButton';
import { useAuthStore } from '../../store/useAuthStore';
import { accountRoles } from '../../utils/accountRoles';
import { colors } from '../../utils/theme';

export default function LoginScreen({ route, navigation }) {
  const role = route.params?.role;
  const selected = accountRoles[role];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const authenticate = useAuthStore(state => state.authenticate);
  const submit = async () => {
    if (busy) return;
    setError('');
    if (!selected) return navigation.replace('RoleSelection');
    if (!email.trim() || !password) return setError('Isi email dan kata sandi.');
    setBusy(true);
    try { await authenticate('login', { email, password }, role); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  };
  return <AuthLayout title={'Selamat datang\nkembali.'} subtitle="Masuk dan lanjutkan perjalananmu di Finetern." onBack={() => navigation.goBack()} backDisabled={busy}>
    <View style={styles.roleRow}><View style={styles.role}><AppIcon name={selected?.icon || 'user'} size={17} /><Text style={styles.roleLabel}>Masuk sebagai {selected?.label || 'pengguna'}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Ganti peran" disabled={busy} onPress={() => navigation.goBack()} style={styles.changeRole}><Text style={styles.link}>Ganti</Text><AppIcon name="next" size={15} /></Pressable></View>
    <View style={styles.fields}>
      <CustomInput label="Email" icon="mail" placeholder="nama@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" editable={!busy} />
      <CustomInput label="Kata sandi" icon="lock" placeholder="Masukkan kata sandi" value={password} onChangeText={setPassword} secureTextEntry showPasswordToggle autoComplete="current-password" returnKeyType="go" onSubmitEditing={submit} editable={!busy} />
    </View>
    {error ? <View style={styles.errorBox}><Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text></View> : null}
    <PrimaryButton title="Masuk" onPress={submit} loading={busy} style={styles.button} />
    <View style={styles.register}><Text style={styles.note}>Belum punya akun?</Text><Pressable accessibilityRole="button" accessibilityLabel="Daftar akun" onPress={() => navigation.navigate('Register', { role })} disabled={busy} style={styles.registerLink}><Text style={styles.link}>Daftar sekarang</Text><AppIcon name="arrow" size={16} /></Pressable></View>
  </AuthLayout>;
}
const styles = StyleSheet.create({
  roleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  role: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, backgroundColor: colors.primaryLight },
  roleLabel: { fontSize: 12, fontWeight: '600', color: colors.primary },
  changeRole: { flexDirection: 'row', alignItems: 'center', gap: 3, minHeight: 44, paddingHorizontal: 4 },
  fields: { gap: 18 },
  button: { borderRadius: 16, minHeight: 52 },
  link: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  note: { color: colors.textSecondary, fontSize: 13 },
  register: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 5 },
  registerLink: { flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 44, paddingHorizontal: 4 },
  errorBox: { backgroundColor: colors.errorBg, padding: 12, borderRadius: 12 },
  error: { color: colors.primaryDark, fontSize: 13, lineHeight: 20 },
});
