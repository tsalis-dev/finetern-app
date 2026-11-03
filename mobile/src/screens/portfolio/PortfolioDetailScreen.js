import React, { useCallback, useState } from 'react';
import { Text, View, Alert, Linking, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../api/axiosClient';
import FormScreen from '../../components/common/FormScreen';
import PrimaryButton from '../../components/common/PrimaryButton';
import CustomInput from '../../components/common/CustomInput';
import { useAuthStore } from '../../store/useAuthStore';
import { portfolioStatuses, reviewPayload } from '../../utils/portfolio';
import { openPortfolioEvidence } from '../../utils/portfolioEvidence';
import { colors, spacing, borderRadius } from '../../utils/theme';

const actions = { submitted: 'Diajukan', resubmitted: 'Diajukan ulang', legacy_imported: 'Data sebelum penilaian terstruktur', ...portfolioStatuses };
export default function PortfolioDetailScreen({ route, navigation }) {
  const id = route.params.id;
  const role = useAuthStore(state => state.role);
  const [data, setData] = useState(null);
  const [note, setNote] = useState('');
  const [score, setScore] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const load = useCallback(async () => {
    const response = await api.get('/portfolios/' + id);
    setData(response.data);
  }, [id]);
  useFocusEffect(useCallback(() => {
    let active = true;
    api.get('/portfolios/' + id).then(response => { if (active) { setData(response.data); setError(''); } }).catch(failure => { if (active) setError(failure.message); });
    return () => { active = false; };
  }, [id]));
  const run = async task => {
    setBusy(true); setError(''); setMessage('');
    try { await task(); } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  };
  const decide = status => {
    let body;
    try { body = reviewPayload(status, note, score, data.revision_number); } catch (failure) { setError(failure.message); return; }
    Alert.alert('Simpan hasil pemeriksaan?', `Versi ${data.revision_number} · ${portfolioStatuses[status]}${status === 'approved' ? ' · Nilai ' + body.proficiency + '/100' : ''}`, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Simpan', onPress: () => run(async () => {
        await api.post('/portfolios/' + id + '/review', body);
        setMessage('Hasil pemeriksaan tersimpan.'); setNote(''); setScore(''); await load();
      }) },
    ]);
  };
  const own = role === 'siswa';
  const editable = own && data && (data.legacy || ['pending', 'revision'].includes(data.status_verifikasi));
  return <FormScreen onBack={() => navigation.goBack()} backDisabled={busy} title={data?.title || 'Rincian bukti karya'} subtitle={data ? `${data.nama_skill} · ${data.legacy ? 'Data lama, perlu diajukan ulang' : portfolioStatuses[data.status_verifikasi] + ' · Versi ' + data.revision_number}` : 'Memuat karya…'}>
    {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
    {message ? <Text accessibilityLiveRegion="polite" style={styles.success}>{message}</Text> : null}
    {data ? <>
      <View style={styles.card}><Text style={styles.heading}>{data.nama_lengkap}</Text><Text style={styles.body}>{data.jurusan} · {data.kelas}</Text><Text style={styles.body}>{data.deskripsi || 'Belum ada penjelasan.'}</Text>
        {data.project_url ? <><Text selectable style={styles.body}>{data.project_url}</Text><PrimaryButton title="Buka tautan proyek" variant="secondary" disabled={busy} onPress={() => run(() => Linking.openURL(data.project_url))} /></> : null}
        {data.has_evidence ? <PrimaryButton title="Buka bukti berkas" variant="secondary" disabled={busy} onPress={() => run(() => openPortfolioEvidence(id, data.evidence_type))} /> : <Text style={styles.body}>Bukti berkas belum tersedia; periksa tautan proyek bila ada.</Text>}
      </View>
      {data.assessed_proficiency != null ? <View style={styles.card}><Text style={styles.heading}>Nilai keterampilan: {data.assessed_proficiency}/100</Text><Text style={styles.body}>Dinilai oleh {data.reviewer_email} berdasarkan karya ini.</Text></View> : null}
      {data.catatan_guru ? <View style={styles.card}><Text style={styles.heading}>Catatan guru</Text><Text style={styles.body}>{data.catatan_guru}</Text></View> : null}
      {data.legacy ? <Text style={styles.body}>Karya ini berasal dari data sebelum alur pemeriksaan Tahap 3. Ajukan ulang untuk memperoleh penilaian yang tercatat; data dan catatan lama tetap disimpan dalam riwayat.</Text> : null}
      {editable ? <PrimaryButton title={data.legacy ? 'Lengkapi dan ajukan ulang' : 'Perbaiki dan ajukan ulang karya'} disabled={busy} onPress={() => navigation.navigate('PortfolioForm', { id })} /> : null}
      {own && data.status_verifikasi === 'rejected' && !data.legacy ? <Text style={styles.body}>Pengajuan ini sudah ditolak. Baca catatan guru dan buat karya baru jika memiliki bukti berikutnya.</Text> : null}
      {data.can_review ? <View style={styles.card}>
        <Text style={styles.heading}>Pemeriksaan guru</Text><Text style={styles.body}>Periksa karya, peran siswa, dan relevansinya dengan {data.nama_skill}. Beri nilai 1–100 berdasarkan bukti; nilai tidak dihitung dari kuis atau jumlah unggahan.</Text>
        <CustomInput label="Catatan untuk siswa (wajib)" value={note} onChangeText={setNote} multiline maxLength={2000} editable={!busy} />
        <CustomInput label="Nilai keterampilan 1–100 (jika disetujui)" value={score} onChangeText={setScore} keyboardType="number-pad" maxLength={3} editable={!busy} />
        <PrimaryButton title="Setujui karya dan nilai keterampilan" onPress={() => decide('approved')} disabled={busy} />
        <PrimaryButton title="Minta perbaikan" variant="secondary" onPress={() => decide('revision')} disabled={busy} />
        <PrimaryButton title="Tolak pengajuan karya" variant="outline" onPress={() => decide('rejected')} disabled={busy} />
      </View> : null}
      <Text style={styles.heading}>Riwayat karya</Text>
      {data.history.map(event => <View key={event.id} style={styles.card}>
        <Text style={styles.heading}>{actions[event.action] || event.action} · Versi {event.revision_number}</Text>
        <Text style={styles.body}>{new Date(event.created_at).toLocaleString('id-ID')} · {event.actor_email}</Text>
        {event.note ? <Text style={styles.body}>{event.note}</Text> : null}
        {event.submission_snapshot.title ? <Text style={styles.body}>{event.submission_snapshot.title}{'\n'}{event.submission_snapshot.deskripsi}{event.submission_snapshot.project_url ? '\n' + event.submission_snapshot.project_url : ''}</Text> : null}
        {event.submission_snapshot.proficiency != null ? <Text style={styles.body}>Nilai guru: {event.submission_snapshot.proficiency}/100</Text> : null}
        {event.has_evidence ? <PrimaryButton title="Buka bukti versi ini" variant="outline" onPress={() => run(() => openPortfolioEvidence(id, event.evidence_type, event.id))} disabled={busy} /> : null}
      </View>)}
    </> : null}
    <PrimaryButton title="Muat ulang karya" variant="secondary" onPress={() => run(load)} loading={busy} />
  </FormScreen>;
}
const styles = StyleSheet.create({ card: { padding: spacing.md, borderRadius: borderRadius.lg, backgroundColor: colors.white, gap: spacing.md }, body: { color: colors.textSecondary, lineHeight: 22 }, heading: { color: colors.textPrimary, fontSize: 16, fontWeight: '600' }, error: { color: colors.error, lineHeight: 22 }, success: { color: colors.primary, lineHeight: 22 } });
