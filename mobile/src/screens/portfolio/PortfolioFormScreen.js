import React, { useEffect, useState } from 'react';
import { Text, View, Modal, FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import api from '../../api/axiosClient';
import FormScreen from '../../components/common/FormScreen';
import CustomInput from '../../components/common/CustomInput';
import PrimaryButton from '../../components/common/PrimaryButton';
import { validatePortfolio } from '../../utils/portfolio';
import { colors, spacing, borderRadius } from '../../utils/theme';

export default function PortfolioFormScreen({ route, navigation }) {
  const id = route.params?.id;
  const [values, setValues] = useState({ title: '', deskripsi: '', skillId: null, projectUrl: '' });
  const [original, setOriginal] = useState(null);
  const [skills, setSkills] = useState([]);
  const [query, setQuery] = useState('');
  const [picker, setPicker] = useState(false);
  const [asset, setAsset] = useState(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const load = async () => {
    setError(''); setReady(false);
    try {
      const [dictionary, project] = await Promise.all([api.get('/portfolios/skills'), id ? api.get('/portfolios/' + id) : Promise.resolve(null)]);
      setSkills(dictionary.data);
      if (project) { setOriginal(project.data); setValues({ title: project.data.title, deskripsi: project.data.deskripsi || '', skillId: project.data.skill_id, projectUrl: project.data.project_url || '' }); }
      setReady(true);
    } catch (failure) { setError(failure.message); }
  };
  useEffect(() => { load(); }, [id]);
  const choose = async photo => {
    setError(''); setBusy(true);
    try {
      const result = photo ? await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 }) : await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/png', 'image/jpeg'], multiple: false, copyToCacheDirectory: true });
      if (result.canceled) return;
      const selected = result.assets[0];
      if ((selected.size || selected.fileSize || 0)>5*1024*1024) throw new Error('Bukti maksimal 5 MB. Pilih berkas yang lebih kecil.');
      const type = selected.mimeType || (selected.uri.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg');
      if (!['image/jpeg', 'image/png', 'application/pdf'].includes(type)) throw new Error('Gunakan foto JPG/PNG atau PDF.');
      setAsset({ ...selected, mimeType: type, name: selected.name || selected.fileName || 'bukti-karya.' + (type === 'image/png' ? 'png' : type === 'application/pdf' ? 'pdf' : 'jpg') });
    } catch (failure) { setError(failure.message || 'Pemilih berkas tidak dapat dibuka.'); }
    finally { setBusy(false); }
  };
  const submit = async () => {
    setError('');
    let checked;
    try { checked = validatePortfolio(values, Boolean(asset || original?.has_evidence)); } catch (failure) { setError(failure.message); return; }
    setBusy(true);
    try {
      const form = new FormData();
      for (const [key, value] of Object.entries(checked)) form.append(key, String(value));
      if (id) form.append('version', String(original.revision_number));
      if (asset) form.append('file', asset.file || { uri: asset.uri, name: asset.name, type: asset.mimeType });
      const response = id ? await api.patch('/portfolios/' + id, form, { headers: { 'Content-Type': 'multipart/form-data' } }) : await api.post('/portfolios', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (id) navigation.goBack(); else navigation.replace('PortfolioDetail', { id: response.data.id });
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  };
  const selectedSkill = skills.find(skill => skill.id === values.skillId);
  return <FormScreen title={id ? 'Perbaiki bukti karyamu' : 'Ajukan karya terbaikmu'} subtitle="Satu pengajuan untuk satu keterampilan. Jelaskan bagian proyek yang kamu kerjakan sendiri dan bukti yang dapat diperiksa guru.">
    {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
    {!ready ? <PrimaryButton title="Muat formulir" variant="secondary" onPress={load} /> : <>
      <CustomInput label="Judul karya" value={values.title} onChangeText={title => setValues(current => ({ ...current, title }))} maxLength={150} editable={!busy} />
      <CustomInput label="Apa yang kamu buat dan apa peranmu?" value={values.deskripsi} onChangeText={deskripsi => setValues(current => ({ ...current, deskripsi }))} multiline maxLength={5000} editable={!busy} />
      <PrimaryButton title={selectedSkill?.nama_skill || 'Pilih keterampilan yang dibuktikan'} variant="outline" disabled={busy} onPress={() => setPicker(true)} />
      <CustomInput label="Tautan proyek (opsional jika ada berkas)" value={values.projectUrl} onChangeText={projectUrl => setValues(current => ({ ...current, projectUrl }))} keyboardType="url" maxLength={255} editable={!busy} />
      <Text style={styles.body}>Foto JPG/PNG atau PDF maksimal 5 MB. Berkas tersimpan privat untuk kamu dan guru yang berwenang.</Text>
      {asset ? <><Text style={styles.body}>Berkas dipilih: {asset.name}</Text><PrimaryButton title="Batalkan pilihan berkas" onPress={() => setAsset(null)} variant="outline" disabled={busy} /></> : original?.has_evidence ? <Text style={styles.body}>Bukti versi sebelumnya akan dipakai jika tidak diganti.</Text> : null}
      <PrimaryButton title="Pilih foto dari galeri" variant="secondary" onPress={() => choose(true)} disabled={busy} />
      <PrimaryButton title="Pilih berkas PDF/JPG/PNG" variant="secondary" onPress={() => choose(false)} disabled={busy} />
      <PrimaryButton title="Ajukan untuk pemeriksaan guru" onPress={submit} loading={busy} />
    </>}
    <PrimaryButton title="Kembali" variant="outline" onPress={() => navigation.goBack()} disabled={busy} />
    <Modal visible={picker} animationType="slide" onRequestClose={() => setPicker(false)}><SafeAreaView style={styles.modal}>
      <Text style={styles.title}>Pilih keterampilan</Text><CustomInput label="Cari nama atau kategori" value={query} onChangeText={setQuery} />
      <FlatList data={skills.filter(skill => (skill.nama_skill + ' ' + skill.kategori).toLowerCase().includes(query.toLowerCase()))} keyExtractor={item => String(item.id)} keyboardShouldPersistTaps="handled" ListEmptyComponent={<Text style={styles.body}>Keterampilan belum ditemukan.</Text>}
        renderItem={({ item }) => <Pressable accessibilityRole="button" style={styles.option} onPress={() => { setValues(current => ({ ...current, skillId: item.id })); setPicker(false); }}><Text style={styles.title}>{item.nama_skill}</Text><Text style={styles.body}>{item.kategori}</Text></Pressable>} />
      <PrimaryButton title="Tutup" variant="secondary" onPress={() => setPicker(false)} />
    </SafeAreaView></Modal>
  </FormScreen>;
}
const styles = StyleSheet.create({ body: { color: colors.textSecondary, lineHeight: 22 }, error: { color: colors.error, lineHeight: 22 }, title: { color: colors.textPrimary, fontWeight: '600', fontSize: 16 }, modal: { flex: 1, padding: spacing.lg, gap: spacing.md, backgroundColor: colors.background }, option: { padding: spacing.md, marginBottom: spacing.sm, borderRadius: borderRadius.md, backgroundColor: colors.white, gap: spacing.xs } });
