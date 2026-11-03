import React, { useState, useCallback, useRef } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../api/axiosClient';
import ScreenHeader from '../../components/common/ScreenHeader';
import PrimaryButton from '../../components/common/PrimaryButton';
import { colors, spacing, borderRadius } from '../../utils/theme';
import { statusLabels } from '../auth/VerificationStatusScreen';

export default function VerificationQueueScreen({ navigation }) {
  const [status, setStatus] = useState('pending');
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const generation = useRef(0);
  const load = useCallback(async (offset = 0) => {
    const current = ++generation.current;
    setBusy(true); setError('');
    try {
      const response = await api.get('/verification/queue', { params: { status, offset } });
      if (current !== generation.current) return;
      setRows(rows => offset ? [...rows, ...response.data] : response.data); setHasMore(response.data.length === 30);
    } catch (failure) { if (current === generation.current) setError(failure.message); }
    finally { if (current === generation.current) setBusy(false); }
  }, [status]);
  useFocusEffect(useCallback(() => { load(); return () => { generation.current++; }; }, [load]));
  return <SafeAreaView style={styles.safe}>
    <ScreenHeader title="Verifikasi anggota sekolah" subtitle="Periksa identitas siswa dan pengajuan guru sesuai kewenanganmu." />
    <View style={styles.filters}>{Object.entries(statusLabels).map(([key, label]) => <Pressable key={key} onPress={() => setStatus(key)} accessibilityRole="tab" accessibilityState={{ selected: status === key }} style={[styles.filter, status === key && styles.active]}><Text style={{ color: status === key ? colors.primary : colors.textSecondary }}>{label}</Text></Pressable>)}</View>
    {error ? <Text style={styles.error}>{error}</Text> : null}
    <FlatList data={rows} keyExtractor={item => String(item.id)} contentContainerStyle={styles.content} refreshing={busy} onRefresh={() => load()}
      ListEmptyComponent={<Text style={styles.body}>{busy ? 'Memuat antrean…' : 'Tidak ada pengajuan pada status ini.'}</Text>}
      renderItem={({ item }) => <Pressable accessibilityRole="button" onPress={() => navigation.navigate('VerificationDetail', { id: item.id })} style={styles.card}>
        <Text style={styles.title}>{item.title}</Text><Text style={styles.body}>{item.kind === 'teacher' ? 'Guru' : 'Siswa'} · {item.applicant_email}</Text><Text style={styles.link}>Periksa pengajuan →</Text>
      </Pressable>}
      ListFooterComponent={hasMore ? <PrimaryButton title="Muat berikutnya" onPress={() => load(rows.length)} loading={busy} /> : null} />
  </SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.background }, filters: { flexDirection: 'row', flexWrap: 'wrap', padding: spacing.md, gap: spacing.sm }, filter: { padding: spacing.sm, minHeight: 44, justifyContent: 'center', borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.border }, active: { backgroundColor: colors.primaryLight, borderColor: colors.primary }, content: { padding: spacing.md, gap: spacing.md }, card: { backgroundColor: colors.white, padding: spacing.md, borderRadius: borderRadius.lg, gap: spacing.sm }, title: { fontSize: 16, color: colors.textPrimary, fontWeight: '600' }, body: { color: colors.textSecondary, lineHeight: 22 }, link: { color: colors.primary, fontWeight: '600' }, error: { color: colors.error, padding: spacing.md } });
