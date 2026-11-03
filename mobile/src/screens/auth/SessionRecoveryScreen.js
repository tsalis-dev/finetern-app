import React, { useState } from 'react';
import { Text, Linking } from 'react-native';
import FormScreen from '../../components/common/FormScreen';
import PrimaryButton from '../../components/common/PrimaryButton';
import { useAuthStore } from '../../store/useAuthStore';
import { API_BASE_URL } from '../../api/axiosClient';
import { colors } from '../../utils/theme';

export default function SessionRecoveryScreen({ admin = false }) {
  const failure = useAuthStore(state => state.sessionError);
  const refresh = useAuthStore(state => state.restoreSession);
  const logout = useAuthStore(state => state.logout);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const retry = async () => { setBusy(true); try { await refresh(); } finally { setBusy(false); } };
  return <FormScreen title={admin ? 'Ruang admin Finetern' : 'Sesi belum dapat diperiksa'} subtitle={admin ? 'Pemeriksaan institusi tersedia melalui halaman admin di browser.' : failure}>
    {error ? <Text style={{ color: colors.error }}>{error}</Text> : null}
    {admin ? <PrimaryButton title="Buka halaman admin" onPress={() => Linking.openURL(API_BASE_URL.replace(/\/api$/, '') + '/admin/').catch(() => setError('Browser tidak dapat dibuka.'))} /> : <PrimaryButton title="Coba periksa sesi lagi" onPress={retry} loading={busy} />}
    <PrimaryButton title="Keluar dari akun" variant="secondary" onPress={() => logout().catch(f => setError(f.message))} />
  </FormScreen>;
}
