import React, { useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import FormScreen from '../../components/common/FormScreen';
import PrimaryButton from '../../components/common/PrimaryButton';
import { useAuthStore } from '../../store/useAuthStore';
import { colors, spacing, borderRadius } from '../../utils/theme';

export const statusLabels = { pending: 'Menunggu pemeriksaan', approved: 'Disetujui', needs_revision: 'Perlu perbaikan', rejected: 'Ditolak' };
export const requestTitle = r => r.sekolah_id ? 'Institusi sekolah' : r.industri_id ? 'Institusi industri' : r.membership_id ? 'Keanggotaan guru' : 'Keanggotaan siswa';

export default function VerificationStatusScreen({ navigation }) {
  const user = useAuthStore(state => state.user);
  const refresh = useAuthStore(state => state.refreshProfile);
  const logout = useAuthStore(state => state.logout);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const reload = async () => { setBusy(true); setError(''); try { await refresh(); } catch (failure) { setError(failure.message); } finally { setBusy(false); } };
  return <FormScreen title="Status verifikasi" subtitle={user?.accessMessage || 'Pantau pengajuan dan catatan pemeriksaan akunmu.'}>
    <Text style={styles.name}>{user?.nama}</Text>
    {(user?.verification || []).map(request => <View key={request.id} style={styles.card}>
      <Text style={styles.name}>{requestTitle(request)}</Text>
      <Text style={styles.status}>{statusLabels[request.status]}</Text>
      {request.note ? <Text style={styles.body}>Catatan pemeriksa: {request.note}</Text> : null}
      <PrimaryButton title="Lihat rincian dan perbaiki data" variant="secondary" onPress={() => navigation.navigate('VerificationDetail', { id: request.id })} />
    </View>)}
    {error ? <Text style={{ color: colors.error }}>{error}</Text> : null}
    <PrimaryButton title="Periksa status terbaru" onPress={reload} loading={busy} />
    {user?.canUseApp ? <PrimaryButton title="Kembali" variant="secondary" onPress={() => navigation.goBack()} /> : null}
    <PrimaryButton title="Keluar dari akun" variant="outline" onPress={() => logout().catch(failure => setError(failure.message))} />
  </FormScreen>;
}
const styles = StyleSheet.create({ card: { padding: spacing.md, borderRadius: borderRadius.lg, backgroundColor: colors.white, gap: spacing.sm, borderWidth: 1, borderColor: colors.border }, name: { color: colors.textPrimary, fontWeight: '600', fontSize: 16 }, status: { color: colors.primary, fontWeight: '600' }, body: { color: colors.textSecondary, lineHeight: 22 } });
