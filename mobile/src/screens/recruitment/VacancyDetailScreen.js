import React, { useCallback, useState } from 'react';
import { Text, View, Pressable, Alert, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../api/axiosClient';
import { useAuthStore } from '../../store/useAuthStore';
import FormScreen from '../../components/common/FormScreen';
import PrimaryButton from '../../components/common/PrimaryButton';
import AppIcon from '../../components/common/AppIcon';
import { applicationPayload, firstSkillGap, formatAllowance, formatDeadline, workModes } from '../../utils/recruitment';
import { colors, spacing } from '../../utils/theme';

export default function VacancyDetailScreen({ route, navigation }) {
  const id = route.params.id;
  const role = useAuthStore(state => state.role);
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [consent, setConsent] = useState(false);
  const [showRequirements, setShowRequirements] = useState(false);
  const load = useCallback(async () => {
    const result = await api.get('/vacancies/' + id);
    setData(result.data); setConsent(false);
  }, [id]);
  useFocusEffect(useCallback(() => {
    let active = true;
    api.get('/vacancies/' + id).then(result => {
      if (active) { setData(result.data); setConsent(false); setError(''); }
    }).catch(failure => { if (active) setError(failure.message); });
    return () => { active = false; };
  }, [id]));
  const run = async task => {
    setBusy(true); setError('');
    try { await task(); } catch (failure) { setError(failure.message); } finally { setBusy(false); }
  };
  const apply = () => {
    let body;
    try { body = applicationPayload(data.revision_number, consent); }
    catch (failure) { setError(failure.message); return; }
    Alert.alert('Kirim lamaran?', 'Profil dasar dan karya terbaik yang relevan akan dibagikan kepada industri tujuan.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Kirim lamaran', onPress: () => run(async () => {
        const result = await api.post('/vacancies/' + id + '/apply', body);
        navigation.replace('ApplicationDetail', { id: result.data.id });
      }) },
    ]);
  };
  const toggle = () => Alert.alert(data.status_aktif ? 'Tutup lowongan?' : 'Buka lowongan?',
    'Status ini mengatur penerimaan lamaran baru. Lamaran yang sudah masuk tetap dapat diproses.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Simpan', onPress: () => run(async () => {
        await api.patch('/vacancies/' + id + '/activity', { active: !data.status_aktif, version: data.revision_number });
        await load();
      }) },
    ]);
  const matching = data?.matching;
  const gap = firstSkillGap(matching?.requirements || []);
  const alreadyApplied = Boolean(matching?.application_id);
  const today = new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10);
  const canLearn = gap && !alreadyApplied && data?.status_aktif && data.tenggat_waktu >= today;
  const learn = skillId => navigation.navigate('LearningTarget', { vacancyId: id, skillId });

  return <FormScreen title={data?.title || 'Rincian lowongan'} subtitle={data?.nama_industri || 'Memuat posisi magang…'} onBack={() => navigation.goBack()} backDisabled={busy}>
    {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
    {data ? <>
      {matching ? <View style={styles.hero}>
        <AppIcon name={alreadyApplied ? 'clock' : matching.can_apply ? 'check' : 'book'} size={28} />
        <Text style={styles.heading}>{alreadyApplied ? 'Lamaran sudah terkirim' : matching.can_apply ? 'Kamu siap melamar' : 'Belum bisa melamar'}</Text>
        {alreadyApplied ? <PrimaryButton title="Lihat status lamaran" onPress={() => navigation.navigate('ApplicationDetail', { id: matching.application_id })} /> : <>
          {canLearn ? <>
            <Text style={styles.body}>{gap.nama_skill} · {gap.importance === 'wajib' ? 'Syarat wajib' : 'Nilai tambah'}</Text>
            <View style={styles.scoreRow}><Text style={styles.score}>{gap.current_proficiency}</Text><Text style={styles.body}>dari target {gap.min_proficiency}</Text></View>
            <View accessibilityRole="progressbar" accessibilityLabel={'Nilai ' + gap.nama_skill}
              accessibilityValue={{ min: 0, max: gap.min_proficiency, now: gap.current_proficiency }}
              style={styles.track}><View style={[styles.fill, { width: Math.min(100, gap.current_proficiency / gap.min_proficiency * 100) + '%' }]} /></View>
            <Text style={styles.body}>Masih kurang {gap.missing_points} poin. Pelajari materinya, lalu ajukan bukti karya untuk dinilai guru.</Text>
            <PrimaryButton title={'Pelajari ' + gap.nama_skill} disabled={busy} onPress={() => learn(gap.skill_id)} />
          </> : <Text style={styles.body}>{matching.reason}</Text>}
        </>}
        <Text style={styles.caption}>Kecocokan keseluruhan {matching.match_rate.toFixed(2)}%</Text>
      </View> : null}
      {matching?.can_apply && !alreadyApplied ? <>
        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: consent }} disabled={busy}
          onPress={() => setConsent(value => !value)} style={[styles.card, styles.consent, consent && styles.checked]}>
          <View style={styles.scoreRow}><View style={[styles.checkbox, consent && styles.checkboxChecked]}>{consent ? <AppIcon name="check" size={16} color={colors.white} /> : null}</View><Text style={styles.cardTitle}>Setujui berbagi data untuk melamar</Text></View>
          <Text style={styles.body}>Saya mengizinkan industri ini melihat nama, email, sekolah, jurusan, kelas, nilai keterampilan saat melamar, dan karya terbaik yang relevan. Akses rincian profil dan bukti berhenti jika lamaran ditarik atau ditolak. Status, catatan, dan skor total tetap tercatat. Salinan yang disimpan penerima berada di luar kendali aplikasi.</Text>
        </Pressable>
        <PrimaryButton title="Kirim lamaran" onPress={apply} disabled={!consent || busy} />
      </> : null}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{data.lokasi || data.kota_domisili} · {workModes[data.tipe_kerja] || 'Sistem kerja belum diisi'}</Text>
        <Text style={styles.body}>{formatAllowance(data.uang_saku)}</Text>
        <Text style={styles.body}>Lamar sebelum {formatDeadline(data.tenggat_waktu)} (WIB)</Text>
        <Text style={styles.caption}>{data.remaining_quota} tempat tersedia · {data.status_aktif ? 'Dibuka' : 'Ditutup'}</Text>
      </View>
      <View style={styles.card}><Text style={styles.cardTitle}>Tentang lowongan</Text><Text style={styles.body}>{data.deskripsi}</Text></View>
      {data.legacy ? <Text style={styles.body}>Lowongan lama ini perlu dilengkapi sebelum tampil di katalog.</Text> : null}
      <PrimaryButton title={showRequirements ? 'Tutup rincian persyaratan' : 'Lihat seluruh persyaratan'} variant="secondary" onPress={() => setShowRequirements(value => !value)} />
      {showRequirements ? <>
        <Text style={styles.body}>Lamaran memerlukan kecocokan minimal 80% dan seluruh syarat wajib terpenuhi. Nilai keterampilan berasal dari karya yang dinilai guru.</Text>
        {(matching?.requirements || data.requirements).map(item => <View key={item.skill_id} style={styles.card}>
          <Text style={styles.cardTitle}>{item.nama_skill}</Text>
          <Text style={styles.body}>{item.importance === 'wajib' ? 'Wajib' : 'Nilai tambah'} · Minimum {item.min_proficiency}/100 · Bobot {item.weight}</Text>
          {matching ? <Text style={styles.body}>Nilaimu {item.current_proficiency}/100 · {item.meets_requirement ? 'Memenuhi' : 'Kurang ' + item.missing_points + ' poin'}</Text> : null}
          {canLearn && item.missing_points > 0 ? <PrimaryButton title="Pelajari keterampilan ini" variant="outline" disabled={busy} onPress={() => learn(item.skill_id)} /> : null}
        </View>)}
      </> : null}
      {role === 'industri' ? <>
        {data.can_edit ? <PrimaryButton title="Edit lowongan" variant="secondary" disabled={busy} onPress={() => navigation.navigate('VacancyForm', { id })} /> : <Text style={styles.body}>Persyaratan terkunci karena sudah ada lamaran. Buat lowongan baru untuk kebutuhan berbeda.</Text>}
        <PrimaryButton title="Lihat pelamar" onPress={() => navigation.navigate('VacancyApplications', { vacancyId: id })} disabled={busy} />
        <PrimaryButton title={data.status_aktif ? 'Tutup lowongan' : 'Buka lowongan'} variant="outline" onPress={toggle} disabled={busy} />
      </> : null}
    </> : null}
    <PrimaryButton title="Perbarui informasi" variant="outline" onPress={() => run(load)} loading={busy} />
  </FormScreen>;
}
const styles = StyleSheet.create({
  hero: { padding: spacing.lg, gap: spacing.md, backgroundColor: colors.primaryLight, borderRadius: 24 },
  card: { padding: spacing.lg, gap: spacing.sm, backgroundColor: colors.white, borderRadius: 20 },
  heading: { fontSize: 24, lineHeight: 31, fontWeight: '700', color: colors.textPrimary },
  cardTitle: { fontSize: 17, lineHeight: 24, fontWeight: '600', color: colors.textPrimary, flexShrink: 1 },
  body: { color: colors.textSecondary, fontSize: 14, lineHeight: 23 },
  caption: { color: colors.textSecondary, fontSize: 13, lineHeight: 21 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  score: { fontSize: 32, fontWeight: '700', color: colors.primary },
  track: { height: 7, backgroundColor: colors.primaryBorder, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
  error: { color: colors.error, lineHeight: 22 },
  consent: { borderWidth: 1, borderColor: colors.border },
  checked: { borderColor: colors.primary },
  checkbox: { width: 24, height: 24, borderWidth: 1, borderColor: colors.primary, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: colors.primary },
});
