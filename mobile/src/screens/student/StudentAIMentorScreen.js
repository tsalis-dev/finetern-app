import React, { useCallback, useRef, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../api/axiosClient';
import ScreenHeader from '../../components/common/ScreenHeader';
import PrimaryButton from '../../components/common/PrimaryButton';
import { learningStatuses } from '../../utils/learning';
import { colors, spacing, borderRadius } from '../../utils/theme';

export default function StudentAIMentorScreen({ navigation }) {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const generation = useRef(0);
  const load = useCallback(async (offset = 0) => {
    const current = ++generation.current;
    setBusy(true); setError('');
    try {
      const response = await api.get('/ai/modules', { params: { offset } });
      if (generation.current !== current) return;
      setData(previous => ({ ...response.data, items: offset ? [...previous.items, ...response.data.items] : response.data.items }));
      setHasMore(response.data.items.length === 20);
    } catch (failure) { if (generation.current === current) setError(failure.message); }
    finally { if (generation.current === current) setBusy(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); return () => { generation.current++; }; }, [load]));
  return <SafeAreaView style={styles.safe}>
    <ScreenHeader title="Materi belajar" subtitle="Lanjutkan materi untuk tujuan magangmu." onBack={() => navigation.goBack()} />
    <FlatList data={data?.items || []} keyExtractor={item => String(item.id)}
      refreshing={busy} onRefresh={() => load()} contentContainerStyle={styles.content}
      ListHeaderComponent={<View style={styles.header}>
        <View style={styles.card}>
          <Text style={styles.title}>Mulai dari tujuan magangmu</Text>
          <Text style={styles.body}>Buka lowongan, lihat keterampilan yang belum memenuhi kebutuhan, lalu pilih “Pelajari keterampilan ini”. Gemini akan menyiapkan materi singkat, mini proyek, dan tiga soal latihan.</Text>
          <PrimaryButton title="Pilih lowongan untuk belajar" onPress={() => navigation.popTo('StudentRoot', { screen: 'Eksplorasi', params: { view: 'vacancies' } })} />
          <Text style={styles.body}>Nilai kuis mencatat progres belajar. Kerjakan mini proyek dan ajukan bukti kepada guru untuk mendapatkan nilai keterampilan tervalidasi.</Text>
        </View>
        {data ? <Text style={styles.body}>Sisa pembuatan baru {data.remaining_requests}/{data.daily_limit} dalam 24 jam. Modul tersimpan dapat dipelajari kembali.</Text> : null}
        {data && !data.configuration.configured ? <Text style={styles.body}>Pembuatan materi baru belum tersedia. Kamu tetap dapat membuka modul yang sudah tersimpan.</Text> : null}
        <Text style={styles.title}>Riwayat belajarmu</Text>
        {error ? <><Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text><PrimaryButton title="Coba lagi" variant="secondary" disabled={busy} onPress={() => load()} /></> : null}
      </View>}
      ListEmptyComponent={<Text style={styles.body}>{busy ? 'Memuat riwayat belajar…' : error ? '' : 'Belum ada modul belajar. Pilih kebutuhan keterampilan dari rincian lowongan untuk memulai.'}</Text>}
      renderItem={({ item }) => <Pressable accessibilityRole="button" style={styles.card} onPress={() => navigation.navigate('LearningModule', { id: item.id })}>
        <Text style={styles.status}>{learningStatuses[item.generation_status]}</Text>
        <Text style={styles.title}>{item.title}</Text><Text style={styles.body}>{item.nama_skill}</Text>
        {item.source_context ? <Text style={styles.body}>Tujuan: {item.source_context.vacancy.title}</Text> : null}
        {item.progress.attempt_count > 0 ? <Text style={styles.status}>Nilai latihan terbaik {item.progress.best_score}/100 · {item.progress.attempt_count} latihan</Text> : null}
        <Text style={styles.status}>Buka materi dan progres →</Text>
      </Pressable>}
      ListFooterComponent={hasMore ? <PrimaryButton title="Muat berikutnya" onPress={() => load(data.items.length)} loading={busy} /> : null} />
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md },
  header: { gap: spacing.md },
  card: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.md, gap: spacing.sm },
  title: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  body: { color: colors.textSecondary, lineHeight: 22 },
  status: { color: colors.primary, fontWeight: '600', lineHeight: 22 },
  error: { color: colors.error, lineHeight: 22 },
});
