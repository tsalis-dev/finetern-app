import React, { useState } from 'react';
import { View, Text, Modal, FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api/axiosClient';
import CustomInput from './CustomInput';
import PrimaryButton from './PrimaryButton';
import { colors, spacing, borderRadius } from '../../utils/theme';

export default function SchoolPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const load = async () => {
    setBusy(true); setError('');
    try { setRows((await api.get('/schools', { params: { q: query } })).data); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  };
  return <View><Text style={styles.label}>Sekolah terverifikasi</Text>
    <PrimaryButton title={value?.nama_sekolah || 'Pilih sekolah'} variant="outline" onPress={() => { setOpen(true); load(); }} />
    <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
      <SafeAreaView style={styles.screen}>
        <Text style={styles.title}>Pilih sekolahmu</Text>
        <CustomInput label="Nama sekolah" value={query} onChangeText={setQuery} />
        <PrimaryButton title="Cari sekolah" onPress={load} loading={busy} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <FlatList data={rows} keyExtractor={row => String(row.id)} keyboardShouldPersistTaps="handled" ListEmptyComponent={<Text style={styles.hint}>Sekolah belum ditemukan? Minta perwakilan sekolah mendaftar dan menyelesaikan verifikasi terlebih dahulu.</Text>}
          renderItem={({ item }) => <Pressable accessibilityRole="button" style={styles.option} onPress={() => { onChange(item); setOpen(false); }}><Text style={styles.label}>{item.nama_sekolah}</Text></Pressable>} />
        <PrimaryButton title="Tutup" variant="secondary" onPress={() => setOpen(false)} />
      </SafeAreaView>
    </Modal>
  </View>;
}
const styles = StyleSheet.create({ screen: { flex: 1, padding: spacing.lg, gap: spacing.md, backgroundColor: colors.background }, label: { color: colors.textPrimary, fontSize: 14, fontWeight: '600', marginBottom: spacing.sm },
  title: { fontSize: 24, fontWeight: '700', color: colors.textPrimary }, option: { backgroundColor: colors.white, padding: spacing.md, marginTop: spacing.sm, borderRadius: borderRadius.md }, hint: { color: colors.textSecondary, paddingVertical: spacing.md, lineHeight: 22 }, error: { color: colors.error } });
