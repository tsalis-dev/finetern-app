import React, { useCallback, useRef, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../api/axiosClient';
import ScreenHeader from './ScreenHeader';
import PrimaryButton from './PrimaryButton';
import { portfolioStatuses } from '../../utils/portfolio';
import { colors, spacing, borderRadius } from '../../utils/theme';

export default function PortfolioListScreen({ navigation, review = false }) {
  const [status, setStatus] = useState('pending');
  const [view, setView] = useState('projects');
  const [data, setData] = useState({ items: [], skills: [], summary: {} });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const generation = useRef(0);
  const load = useCallback(async (offset = 0) => {
    const current = ++generation.current;
    setBusy(true); setError('');
    if (!offset) setData(previous => ({ ...previous, items: [] }));
    try {
      const response = await api.get('/portfolios/' + (review ? 'queue' : 'mine'), { params: { status, offset } });
      if (generation.current !== current) return;
      const next = review ? { items: response.data, skills: [], summary: {} } : response.data;
      setData(previous => ({ ...next, items: offset ? [...previous.items, ...next.items] : next.items }));
      setHasMore(next.items.length === 30);
    } catch (failure) { if (generation.current === current) setError(failure.message); }
    finally { if (generation.current === current) setBusy(false); }
  }, [review, status]);
  useFocusEffect(useCallback(() => { load(); return () => { generation.current++; }; }, [load]));
  return <SafeAreaView style={styles.safe}>
    <ScreenHeader title={review ? 'Pemeriksaan karya siswa' : 'Portofolio bukti karya'} subtitle={review ? 'Periksa bukti, peran siswa, dan keterampilan yang ditunjukkan.' : 'Tunjukkan karyamu dan dapatkan penilaian dari guru sekolahmu.'} />
    <FlatList data={!review && view === 'skills' ? data.skills : data.items} keyExtractor={item => String(item.id)}
      refreshing={busy} onRefresh={() => load()} contentContainerStyle={styles.content}
      ListHeaderComponent={<View style={styles.header}>
        {!review ? <>
          <PrimaryButton title="+ Ajukan karya" onPress={() => navigation.navigate('PortfolioForm')} />
          <Text style={styles.body}>{data.summary.approved || 0} karya disetujui · {data.summary.pending || 0} menunggu · {data.summary.revision || 0} perlu perbaikan</Text>
          <View style={styles.filters}>{[['projects', 'Karya saya'], ['skills', 'Keterampilan tervalidasi']].map(([key, label]) => <Pressable key={key} accessibilityRole="tab" accessibilityState={{ selected: view === key }} onPress={() => setView(key)} style={[styles.filter, view === key && styles.selected]}><Text style={styles.link}>{label}</Text></Pressable>)}</View>
        </> : <View style={styles.filters}>{Object.entries(portfolioStatuses).map(([key, label]) => <Pressable key={key} accessibilityRole="tab" accessibilityState={{ selected: status === key }} onPress={() => setStatus(key)} style={[styles.filter, status === key && styles.selected]}><Text style={styles.link}>{label}</Text></Pressable>)}</View>}
        {error ? <><Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text><PrimaryButton title="Coba lagi" variant="secondary" onPress={() => load()} disabled={busy} /></> : null}
      </View>}
      ListEmptyComponent={<Text style={styles.body}>{busy ? 'Memuat data…' : error ? '' : view === 'skills' && !review ? 'Belum ada keterampilan yang dinilai guru dari karya. Persetujuan akun dan hasil kuis tidak menjadi bukti keterampilan.' : review ? 'Tidak ada karya pada status ini.' : 'Mulai dengan mengajukan proyek yang pernah kamu kerjakan.'}</Text>}
      renderItem={({ item }) => !review && view === 'skills' ? <View style={styles.card}><Text style={styles.title}>{item.nama_skill}</Text><Text style={styles.body}>Nilai guru: {item.proficiency}/100 · {item.evidence_count} karya disetujui</Text><Text style={styles.body}>Nilai tertinggi dari bukti karya yang disetujui.</Text></View> :
        <Pressable accessibilityRole="button" style={styles.card} onPress={() => navigation.navigate('PortfolioDetail', { id: item.id })}>
          <Text style={styles.status}>{item.legacy ? 'Data lama · perlu diajukan ulang' : portfolioStatuses[item.status_verifikasi]}</Text>
          <Text style={styles.title}>{item.title}</Text><Text style={styles.body}>{item.nama_skill}</Text>
          {review ? <Text style={styles.body}>{item.nama_lengkap} · {item.kelas}</Text> : null}
          {item.assessed_proficiency != null ? <Text style={styles.link}>Nilai guru: {item.assessed_proficiency}/100</Text> : null}
          {item.catatan_guru ? <Text style={styles.body}>Catatan: {item.catatan_guru}</Text> : null}
          <Text style={styles.link}>Lihat bukti dan riwayat →</Text>
        </Pressable>}
      ListFooterComponent={hasMore && (review || view === 'projects') ? <PrimaryButton title="Muat berikutnya" onPress={() => load(data.items.length)} loading={busy} /> : null} />
  </SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.background }, content: { padding: spacing.md, gap: spacing.md }, header: { gap: spacing.md }, filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, filter: { minHeight: 44, padding: spacing.sm, justifyContent: 'center', borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.border }, selected: { backgroundColor: colors.primaryLight, borderColor: colors.primary }, card: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.md, gap: spacing.sm }, title: { fontSize: 17, fontWeight: '600', color: colors.textPrimary }, body: { color: colors.textSecondary, lineHeight: 22 }, link: { color: colors.primary, fontWeight: '600' }, status: { color: colors.primary, fontSize: 12 }, error: { color: colors.error, lineHeight: 22 } });
