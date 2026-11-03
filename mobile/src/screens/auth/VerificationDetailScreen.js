import React, { useEffect, useState, useCallback } from 'react';
import { Text, View, Alert, StyleSheet } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import api from '../../api/axiosClient';
import FormScreen from '../../components/common/FormScreen';
import CustomInput from '../../components/common/CustomInput';
import PrimaryButton from '../../components/common/PrimaryButton';
import { useAuthStore } from '../../store/useAuthStore';
import { statusLabels } from './VerificationStatusScreen';
import { colors, spacing, borderRadius } from '../../utils/theme';

export default function VerificationDetailScreen({ route, navigation }) {
  const id = route.params.id;
  const user = useAuthStore(state => state.user);
  const refresh = useAuthStore(state => state.refreshProfile);
  const [data, setData] = useState(null);
  const [values, setValues] = useState({});
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try {
      const current = (await api.get('/verification/' + id)).data;
      setData(current);
      const snapshot = [...current.history].reverse().find(item => item.submission_snapshot?.nama)?.submission_snapshot || {};
      setValues({ nama: current.teacher_name || current.student_name || snapshot.nama || user?.profile?.nama_lengkap || '',
        jurusan: current.student_major || '', kelas: current.student_class || '', nisn: current.student_nisn || '',
        schoolName: current.nama_sekolah || '', npsn: current.npsn || '', alamat: current.school_address || '',
        companyName: current.nama_industri || '', sektor: current.sektor_industri || '', kota: current.kota_domisili || '', nomorRegistrasi: current.nomor_registrasi || '', contactPhone: snapshot.contactPhone || '' });
    } catch (failure) { setError(failure.message); }
  }, [id, user?.id]);
  useEffect(() => { load(); }, [load]);
  const run = async task => { setBusy(true); setError(''); setMessage(''); try { await task(); await load(); } catch (failure) { setError(failure.message); } finally { setBusy(false); } };
  const upload = () => run(async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/png', 'image/jpeg'], copyToCacheDirectory: true, multiple: false });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (asset.size > 5 * 1024 * 1024) throw { message: 'Berkas maksimal 5 MB.' };
    const form = new FormData(); form.append('file', asset.file || { uri: asset.uri, name: asset.name, type: asset.mimeType || 'application/octet-stream' });
    await api.post('/verification/' + id + '/evidence', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    setMessage('Bukti berhasil diunggah secara privat.'); await refresh();
  });
  const decide = status => {
    if (!note.trim()) return setError('Isi catatan hasil pemeriksaan.');
    Alert.alert('Simpan keputusan?', 'Pastikan identitas dan hubungan dengan sekolah sudah diperiksa.', [{ text: 'Batal', style: 'cancel' }, { text: 'Simpan', onPress: () => run(async () => { await api.post('/verification/' + id + '/review', { status, note }); setMessage('Keputusan tersimpan.'); }) }]);
  };
  const own = data?.applicant_user_id === user?.id;
  const editable = own && ['pending', 'needs_revision'].includes(data?.status);
  const institutional = ['school', 'industry'].includes(data?.kind);
  const fields = [['nama', 'Nama lengkap'], ...(data?.kind === 'student' ? [['jurusan', 'Jurusan'], ['kelas', 'Kelas'], ['nisn', 'NISN (opsional)']] : []),
    ...(data?.kind === 'school' ? [['schoolName', 'Nama sekolah'], ['npsn', 'NPSN'], ['alamat', 'Alamat sekolah'], ['contactPhone', 'Telepon perwakilan']] : []),
    ...(data?.kind === 'industry' ? [['companyName', 'Nama industri'], ['sektor', 'Sektor'], ['kota', 'Kota'], ['nomorRegistrasi', 'Nomor registrasi'], ['contactPhone', 'Telepon perwakilan']] : [])];
  return <FormScreen onBack={() => navigation.goBack()} backDisabled={busy} title={data?.title || 'Rincian pengajuan'} subtitle={data ? statusLabels[data.status] : 'Memuat data…'}>
    {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
    {message ? <Text accessibilityLiveRegion="polite" style={styles.success}>{message}</Text> : null}
    {data ? <>
      <Text style={styles.body}>{data.applicant_email}</Text>
      {data.related_school ? <Text style={styles.body}>Sekolah: {data.related_school}</Text> : null}
      {data.kind === 'student' ? <Text style={styles.body}>Jurusan: {data.student_major} · Kelas: {data.student_class}{'\n'}NISN: {data.student_nisn || 'Belum diisi'}</Text> : null}
      {institutional ? <Text style={styles.body}>Bukti institusi: {data.has_evidence ? 'sudah diunggah' : 'belum diunggah'}. Bukti hanya dapat diakses pengaju dan pemeriksa berwenang.</Text> : null}
      <Text style={styles.heading}>Riwayat pengajuan</Text>
      {data.history.map(item => <View key={item.id} style={styles.history}><Text style={styles.heading}>{statusLabels[item.action] || (item.action === 'resubmitted' ? 'Diajukan ulang' : 'Pengajuan diperbarui')}</Text><Text style={styles.body}>{new Date(item.created_at).toLocaleString('id-ID')}</Text>{item.note ? <Text style={styles.body}>{item.note}</Text> : null}</View>)}
      {editable ? <>
        <Text style={styles.heading}>Lengkapi atau perbaiki data</Text>
        {fields.map(([key, label]) => <CustomInput key={key} label={label} value={values[key] || ''} onChangeText={value => setValues(current => ({ ...current, [key]: value }))} />)}
        {institutional ? <><Text style={styles.body}>Lampirkan bukti identitas institusi dan kewenangan sebagai perwakilan (PDF/JPG/PNG, maksimal 5 MB).</Text><PrimaryButton title="Unggah atau ganti bukti" variant="secondary" onPress={upload} loading={busy} /></> : null}
        <PrimaryButton title="Simpan dan ajukan pemeriksaan" disabled={busy} onPress={() => run(async () => { await api.patch('/verification/' + id + '/resubmit', values); setMessage('Pengajuan diperbarui.'); await refresh(); })} />
      </> : null}
      {data.can_review && data.status === 'pending' ? <>
        <Text style={styles.body}>Cocokkan nama, kelas, dan keanggotaan dengan data sekolah. Nilai kuis atau persetujuan akun tidak menggantikan validasi bukti proyek.</Text>
        <CustomInput label="Catatan pemeriksaan" value={note} onChangeText={setNote} />
        <PrimaryButton title="Setujui keanggotaan" disabled={busy} onPress={() => decide('approved')} />
        <PrimaryButton title="Minta perbaikan" variant="secondary" disabled={busy} onPress={() => decide('needs_revision')} />
        <PrimaryButton title="Tolak pengajuan" variant="outline" disabled={busy} onPress={() => decide('rejected')} />
      </> : null}
    </> : null}
    <PrimaryButton title="Muat ulang rincian" variant="secondary" onPress={load} disabled={busy} />
  </FormScreen>;
}
const styles = StyleSheet.create({ error: { color: colors.error }, success: { color: colors.success }, body: { color: colors.textSecondary, lineHeight: 22 }, heading: { fontSize: 16, fontWeight: '600', color: colors.textPrimary }, history: { padding: spacing.md, backgroundColor: colors.white, borderRadius: borderRadius.md, gap: spacing.sm } });
