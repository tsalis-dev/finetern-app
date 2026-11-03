import React, { useState } from 'react';
import { Text } from 'react-native';
import FormScreen from '../../components/common/FormScreen';
import CustomInput from '../../components/common/CustomInput';
import PrimaryButton from '../../components/common/PrimaryButton';
import { useAuthStore } from '../../store/useAuthStore';
import { colors } from '../../utils/theme';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const authenticate = useAuthStore(state => state.authenticate);
  const submit = async () => {
    setError('');
    if (!email.trim() || !password) return setError('Isi email dan kata sandi.');
    setBusy(true);
    try { await authenticate('login', { email, password }); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  };
  return <FormScreen title="Temukan tempatmu untuk bertumbuh." subtitle="Masuk untuk melanjutkan portofolio dan proses magangmu.">
    <CustomInput label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" />
    <CustomInput label="Kata sandi" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" />
    {error ? <Text accessibilityLiveRegion="polite" style={{ color: colors.error }}>{error}</Text> : null}
    <PrimaryButton title="Masuk" onPress={submit} loading={busy} />
    <PrimaryButton title="Buat akun baru" variant="secondary" onPress={() => navigation.navigate('Register')} disabled={busy} />
  </FormScreen>;
}
