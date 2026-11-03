import React, { useState } from 'react';
import { Text, View, Pressable, StyleSheet } from 'react-native';
import FormScreen from '../../components/common/FormScreen';
import CustomInput from '../../components/common/CustomInput';
import PrimaryButton from '../../components/common/PrimaryButton';
import SchoolPicker from '../../components/common/SchoolPicker';
import { useAuthStore } from '../../store/useAuthStore';
import { colors, spacing, borderRadius } from '../../utils/theme';

const choices = [['siswa', 'Siswa'], ['guru', 'Guru'], ['school', 'Sekolah baru'], ['industri', 'Industri']];
export default function RegisterScreen({ route, navigation }) {
  const [kind, setKind] = useState(route.params?.role === 'sekolah' ? 'guru' : route.params?.role || 'siswa');
  const [school, setSchool] = useState(null);
  const [values, setValues] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const authenticate = useAuthStore(state => state.authenticate);
  const fields = [['nama', kind === 'industri' ? 'Nama perwakilan' : 'Nama lengkap'], ['email', 'Email'], ['password', 'Kata sandi (minimal 8 karakter)'], ['passwordConfirmation', 'Ulangi kata sandi'],
    ...(kind === 'siswa' ? [['nisn', 'NISN (opsional)'], ['jurusan', 'Jurusan'], ['kelas', 'Kelas']] : []),
    ...(kind === 'school' ? [['schoolName', 'Nama sekolah'], ['npsn', 'NPSN (8 angka)'], ['alamat', 'Alamat sekolah'], ['contactPhone', 'Telepon perwakilan']] : []),
    ...(kind === 'industri' ? [['companyName', 'Nama industri'], ['sektor', 'Sektor industri'], ['kota', 'Kota'], ['nomorRegistrasi', 'Nomor registrasi usaha (misalnya NIB)'], ['contactPhone', 'Telepon perwakilan']] : [])];
  const submit = async () => {
    setError('');
    if (values.password !== values.passwordConfirmation) return setError('Konfirmasi kata sandi tidak sesuai.');
    if ((kind === 'siswa' || kind === 'guru') && !school) return setError('Pilih sekolah terverifikasi.');
    setBusy(true);
    try { await authenticate('register', { ...values, role: ['guru', 'school'].includes(kind) ? 'sekolah' : kind, newSchool: kind === 'school', schoolId: school?.id }); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  };
  return <FormScreen title="Buat akun Finetern" subtitle="Lengkapi identitasmu untuk mengajukan verifikasi." onBack={() => navigation.goBack()} backDisabled={busy}>
    <View style={styles.choices}>{choices.map(([key, label]) => <Pressable key={key} accessibilityRole="tab" accessibilityState={{ selected: kind === key }} disabled={busy} onPress={() => { setKind(key); setError(''); }} style={[styles.choice, kind === key && styles.active]}><Text style={{ color: kind === key ? colors.primary : colors.textSecondary }}>{label}</Text></Pressable>)}</View>
    {kind === 'siswa' || kind === 'guru' ? <SchoolPicker value={school} onChange={setSchool} /> : null}
    {kind === 'school' ? <Text style={styles.hint}>Perwakilan sekolah membuat akun guru pribadi. Admin Finetern memeriksa institusi dan menunjuk perwakilan yang sah sebagai koordinator.</Text> : null}
    {fields.map(([key, label]) => <CustomInput key={key} label={label} value={values[key] || ''} onChangeText={value => setValues(current => ({ ...current, [key]: value }))} secureTextEntry={key.startsWith('password')} keyboardType={key === 'email' ? 'email-address' : ['npsn', 'nisn', 'contactPhone'].includes(key) ? 'phone-pad' : 'default'} autoCapitalize={['nama', 'schoolName', 'companyName', 'alamat'].includes(key) ? 'words' : 'none'} />)}
    {error ? <Text accessibilityLiveRegion="polite" style={{ color: colors.error }}>{error}</Text> : null}
    <PrimaryButton title="Daftar dan ajukan verifikasi" onPress={submit} loading={busy} />
    <PrimaryButton title="Sudah punya akun? Masuk" onPress={() => navigation.goBack()} variant="secondary" disabled={busy} />
  </FormScreen>;
}
const styles = StyleSheet.create({ choices: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, choice: { minHeight: 44, padding: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.sm, justifyContent: 'center' }, active: { backgroundColor: colors.primaryLight, borderColor: colors.primary }, hint: { color: colors.textSecondary, lineHeight: 22 } });
