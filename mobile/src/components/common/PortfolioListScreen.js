import React, { useCallback, useRef, useState } from 'react';
import { View, Text, FlatList, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../api/axiosClient';
import ScreenHeader from './ScreenHeader';
import PrimaryButton from './PrimaryButton';
import AppIcon from './AppIcon';
import { portfolioStatuses } from '../../utils/portfolio';
import { colors, spacing } from '../../utils/theme';

export default function PortfolioListScreen({ navigation, route, review = false }) {
  const [status, setStatus] = useState('pending');
  const view = route?.params?.view || 'projects';
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
  return <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
    <ScreenHeader title={review ? 'Bukti karya siswa' : 'Karya & keterampilan'} subtitle={review ? 'Periksa bukti dan keterampilan yang ditunjukkan siswa.' : 'Karya nyata, dinilai oleh guru sekolahmu.'} />
    <FlatList data={!review && view === 'skills' ? data.skills : data.items} keyExtractor={item => String(item.id)}
      refreshing={busy} onRefresh={() => load()} contentContainerStyle={styles.content}
      ListHeaderComponent={<View style={styles.header}>
        {!review ? <>
          <PrimaryButton title="Ajukan karya" onPress={() => navigation.navigate('PortfolioForm')} />
          <Text style={styles.body}>{data.summary.approved || 0} disetujui · {data.summary.pending || 0} menunggu · {data.summary.revision || 0} perlu perbaikan</Text>
          <View style={styles.filters}>{[['projects', 'Karya saya'], ['skills', 'Keterampilan']].map(([key, label]) => <Pressable key={key} accessibilityRole="tab" accessibilityState={{ selected: view === key }} onPress={() => navigation.setParams({ view: key })} style={[styles.filter, view === key && styles.selected]}><Text style={[styles.filterLabel, view === key && styles.activeLabel]}>{label}</Text></Pressable>)}</View>
          {view === 'skills' ? <Text style={styles.caption}>Nilai tertinggi dari karya yang disetujui guru. Kuis tidak mengubah nilai ini.</Text> : null}
        </> : <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>{Object.entries(portfolioStatuses).map(([key, label]) => <Pressable key={key} accessibilityRole="tab" accessibilityState={{ selected: status === key }} onPress={() => setStatus(key)} style={[styles.filter, status === key && styles.selected]}><Text style={[styles.filterLabel, status === key && styles.activeLabel]}>{label}</Text></Pressable>)}</ScrollView>}
        {error ? <><Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text><PrimaryButton title="Coba lagi" variant="secondary" onPress={() => load()} disabled={busy} /></> : null}
      </View>}
      ListEmptyComponent={<Text style={styles.body}>{busy ? 'Memuat data…' : error ? '' : view === 'skills' && !review ? 'Belum ada keterampilan yang dinilai guru dari karya. Persetujuan akun dan hasil kuis tidak menjadi bukti keterampilan.' : review ? 'Tidak ada karya pada status ini.' : 'Mulai dengan mengajukan proyek yang pernah kamu kerjakan.'}</Text>}
      renderItem={({ item }) => !review && view === 'skills' ? <View style={styles.row}>
        <AppIcon name="code" size={22} /><View style={styles.copy}><Text style={styles.title}>{item.nama_skill}</Text><Text style={styles.caption}>{item.evidence_count} karya disetujui</Text></View><Text style={styles.grade}>{item.proficiency}<Text style={styles.caption}>/100</Text></Text>
      </View> :
        <Pressable accessibilityRole="button" style={({ pressed }) => [styles.row, pressed && styles.pressed]} onPress={() => navigation.navigate('PortfolioDetail', { id: item.id })}>
          <View style={styles.mark}><AppIcon name="folder" size={21} /></View>
          <View style={styles.copy}>
            <Text numberOfLines={2} style={styles.title}>{item.title}</Text><Text style={styles.body}>{item.nama_skill}</Text>
            {review ? <Text style={styles.caption}>{item.nama_lengkap} · {item.kelas}</Text> : null}
            <View style={styles.meta}><Text style={styles.status}>{item.legacy ? 'Data lama · perlu diajukan ulang' : portfolioStatuses[item.status_verifikasi]}</Text>{item.assessed_proficiency != null ? <Text style={styles.caption}>Nilai {item.assessed_proficiency}/100</Text> : null}</View>
            {item.catatan_guru ? <Text style={styles.caption}>Catatan guru tersedia di detail</Text> : null}
          </View><AppIcon name="next" size={18} color={colors.textMuted} />
        </Pressable>}
      ListFooterComponent={hasMore && (review || view === 'projects') ? <PrimaryButton title="Muat berikutnya" onPress={() => load(data.items.length)} loading={busy} /> : null} />
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  header: { gap: spacing.md, paddingBottom: 8 },
  filters: { flexDirection: 'row', gap: 20, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  filter: { minHeight: 46, paddingVertical: 12, justifyContent: 'center', borderBottomWidth: 2, borderColor: 'transparent' },
  selected: { borderColor: colors.primary },
  filterLabel: { fontSize: 13, color: colors.textSecondary },
  activeLabel: { color: colors.primary, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 18, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  mark: { width: 38, height: 42, borderRadius: 10, backgroundColor: colors.accentWarm, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: 6 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, rowGap: 4 },
  title: { fontSize: 16, lineHeight: 23, fontWeight: '600', color: colors.textPrimary },
  body: { fontSize: 13, color: colors.textSecondary, lineHeight: 21 },
  caption: { fontSize: 12, color: colors.textMuted, lineHeight: 19 },
  grade: { fontSize: 21, fontWeight: '700', color: colors.primary },
  status: { color: colors.primary, fontSize: 12, lineHeight: 19, fontWeight: '600' },
  error: { color: colors.error, lineHeight: 22 },
  pressed: { opacity: 0.65 },
});
