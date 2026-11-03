import React, { useState } from 'react';
import { Text } from 'react-native';
import FormScreen from '../../components/common/FormScreen';
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
    setError('');
    if (!selected) return navigation.replace('RoleSelection');
    if (!email.trim() || !password) return setError('Isi email dan kata sandi.');
    setBusy(true);
    try { await authenticate('login', { email, password }, role); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  };
  return <FormScreen title={'Masuk sebagai ' + (selected?.label.toLowerCase() || 'pengguna')}
    subtitle={selected?.description} onBack={() => navigation.goBack()} backDisabled={busy}>
    <PrimaryButton title="Ganti peran" variant="outline" disabled={busy} onPress={() => navigation.goBack()} />
    <CustomInput label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" editable={!busy} />
    <CustomInput label="Kata sandi" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" editable={!busy} />
    {error ? <Text accessibilityLiveRegion="polite" style={{ color: colors.error }}>{error}</Text> : null}
    <PrimaryButton title="Masuk" onPress={submit} loading={busy} />
    <PrimaryButton title="Belum punya akun? Daftar" variant="secondary" onPress={() => navigation.navigate('Register', { role })} disabled={busy} />
  </FormScreen>;
}
