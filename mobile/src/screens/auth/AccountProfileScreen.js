import React, { useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import FormScreen from '../../components/common/FormScreen';
import PrimaryButton from '../../components/common/PrimaryButton';
import { useAuthStore } from '../../store/useAuthStore';
import { colors, spacing, borderRadius } from '../../utils/theme';

export default function AccountProfileScreen({ navigation }) {
  const user = useAuthStore(state => state.user);
  const refresh = useAuthStore(state => state.refreshProfile);
  const logout = useAuthStore(state => state.logout);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const profile = user?.profile || {};
  const fields = [['Email', user?.email], ...(user?.role === 'siswa' ? [['Nama lengkap', profile.nama_lengkap], ['NISN', profile.nisn], ['Sekolah', profile.sekolah], ['Jurusan', profile.jurusan], ['Kelas', profile.kelas], ['Biodata', profile.biodata]]
    : user?.role === 'sekolah' ? [['Nama lengkap', profile.nama_lengkap], ['Sekolah', profile.sekolah], ['Kewenangan', profile.posisi === 'koordinator' ? 'Koordinator sekolah' : 'Guru'], ['Akreditasi', profile.akreditasi], ['Alamat sekolah', profile.alamat]]
      : [['Nama industri', profile.nama_industri], ['Sektor', profile.sektor_industri], ['Kota', profile.kota_domisili], ['Deskripsi', profile.deskripsi_perusahaan]])];
  return <FormScreen title={user?.nama || 'Profil akun'} subtitle="Identitas akun yang tersimpan di Finetern.">
    <View style={styles.card}>{fields.map(([label, value]) => <View key={label} style={styles.row}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value || 'Belum diisi'}</Text></View>)}</View>
    {error ? <Text style={{ color: colors.error }}>{error}</Text> : null}
    <PrimaryButton title="Muat ulang profil" loading={busy} onPress={async () => { setBusy(true); setError(''); try { await refresh(); } catch (f) { setError(f.message); } finally { setBusy(false); } }} />
    <PrimaryButton title="Lihat status verifikasi" variant="secondary" onPress={() => navigation.navigate('VerificationStatus')} />
    <PrimaryButton title="Keluar dari akun" variant="outline" onPress={() => logout().catch(f => setError(f.message))} />
  </FormScreen>;
}
const styles = StyleSheet.create({ card: { padding: spacing.md, backgroundColor: colors.white, borderRadius: borderRadius.lg, gap: spacing.md }, row: { gap: spacing.xs }, label: { color: colors.textSecondary, fontSize: 12 }, value: { color: colors.textPrimary, fontSize: 15, lineHeight: 22 } });
