import React, { useCallback, useRef, useState } from 'react';
import { Text, View, FlatList, Pressable, TextInput, Keyboard, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../api/axiosClient';
import ScreenHeader from './ScreenHeader';
import AppIcon from './AppIcon';
import PrimaryButton from './PrimaryButton';
import { formatAllowance, formatDeadline, workModes, vacancyStatus } from '../../utils/recruitment';
import { colors, spacing } from '../../utils/theme';

export default function VacancyListScreen({ navigation, own = false, embedded = false }) {
  const [input, setInput] = useState(''), [query, setQuery] = useState('');
  const [items, setItems] = useState([]), [busy, setBusy] = useState(false), [error, setError] = useState(''), [hasMore, setHasMore] = useState(false);
  const generation = useRef(0);
  const load = useCallback(async (offset = 0) => {
    const current = ++generation.current; setBusy(true); setError(''); if (!offset) setItems([]);
    try {
      const response = await api.get(own ? '/vacancies/mine' : '/vacancies', { params: { offset, q: query } });
      if (current !== generation.current) return;
      setItems(previous => offset ? [...previous, ...response.data.items] : response.data.items); setHasMore(response.data.items.length === 20);
    } catch (failure) { if (current === generation.current) setError(failure.message); }
    finally { if (current === generation.current) setBusy(false); }
  }, [own, query]);
  useFocusEffect(useCallback(() => { load(); return () => { generation.current++; }; }, [load]));
  const search = () => { Keyboard.dismiss(); if (query === input.trim()) load(); else setQuery(input.trim()); };
  return <SafeAreaView style={styles.safe} edges={embedded ? [] : ['top', 'left', 'right']}>
    {!embedded ? <ScreenHeader title={own ? 'Lowongan' : 'Temukan tempat bertumbuh'} subtitle={own ? 'Kelola kesempatan magang di industrimu.' : 'Temukan posisi yang sesuai dengan keterampilanmu.'} /> : null}
    <FlatList data={items} keyExtractor={item => String(item.id)} refreshing={busy} onRefresh={() => load()} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}
      ListHeaderComponent={<View style={styles.header}>
        {own ? <PrimaryButton title="+ Terbitkan lowongan" onPress={() => navigation.navigate('VacancyForm')} /> : <>
          <View style={styles.searchBar}><AppIcon name="search" size={20} color={colors.textMuted} />
            <TextInput accessibilityLabel="Cari posisi, industri, atau lokasi" placeholder="Posisi, industri, atau lokasi" placeholderTextColor={colors.textMuted} value={input} onChangeText={setInput} maxLength={100} autoCapitalize="none" autoCorrect={false} returnKeyType="search" onSubmitEditing={search} style={styles.searchInput} />
            <Pressable accessibilityRole="button" accessibilityLabel="Cari lowongan" disabled={busy} onPress={search} style={styles.searchButton}>{busy ? <ActivityIndicator color={colors.white} size="small" /> : <AppIcon name="arrow" size={20} color={colors.white} />}</Pressable>
          </View>
          <View style={styles.intro}><Text style={styles.listTitle}>Peluang magang</Text><Text style={styles.note}>Kecocokan berdasarkan karya yang dinilai guru.</Text></View>
        </>}
        {error ? <><Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text><PrimaryButton title="Coba lagi" variant="secondary" onPress={() => load()} disabled={busy} /></> : null}
      </View>}
      ListEmptyComponent={<Text style={styles.body}>{busy ? 'Memuat lowongan…' : error ? '' : own ? 'Belum ada lowongan. Terbitkan posisi magang pertamamu.' : 'Belum ada lowongan aktif yang cocok dengan pencarianmu.'}</Text>}
      renderItem={({ item }) => {
        const status = own ? { label: item.legacy ? 'Data lama · perlu dilengkapi' : item.status_aktif ? 'Dibuka' : 'Ditutup', tone: 'neutral', icon: 'briefcase' } : vacancyStatus(item.matching);
        return <Pressable accessibilityRole="button" style={({ pressed }) => [styles.row, pressed && styles.pressed]} onPress={() => navigation.navigate('VacancyDetail', { id: item.id })}>
          <View style={styles.companyMark}><AppIcon name="briefcase" size={21} /></View>
          <View style={styles.rowCopy}>
            <Text style={styles.company}>{item.nama_industri}</Text>
            <Text numberOfLines={2} style={styles.title}>{item.title}</Text>
            <Text style={styles.note}>{item.lokasi || item.kota_domisili} · {workModes[item.tipe_kerja] || 'Sistem kerja belum diisi'}</Text>
            <Text style={styles.allowance}>{formatAllowance(item.uang_saku)}</Text>
            <View style={styles.meta}>
              <View style={styles.status}><AppIcon name={status.icon} size={14} color={status.tone === 'success' ? colors.successText : status.tone === 'warning' ? colors.accentWarmText : colors.textSecondary} /><Text style={[styles.statusLabel, status.tone === 'success' ? styles.successText : status.tone === 'warning' ? styles.warningText : styles.neutralText]}>{status.label}</Text></View>
              {own ? <Text style={styles.matchLabel}>Kuota {item.remaining_quota}/{item.kuota}</Text> : <Text style={styles.matchLabel}>{item.matching.match_rate.toFixed(2)}% cocok</Text>}
            </View>
            <Text style={styles.deadline}>Batas lamaran {formatDeadline(item.tenggat_waktu)}</Text>
          </View><AppIcon name="next" size={18} color={colors.textMuted} />
        </Pressable>;
      }}
      ListFooterComponent={hasMore ? <PrimaryButton title="Muat berikutnya" onPress={() => load(items.length)} loading={busy} /> : null} />
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xl },
  header: { gap: 20 },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 16, paddingRight: 6, paddingVertical: 6, backgroundColor: colors.white, borderRadius: 18, borderWidth: 1, borderColor: colors.border },
  searchInput: { flex: 1, minWidth: 0, minHeight: 44, paddingVertical: 0, fontSize: 13, color: colors.textPrimary },
  searchButton: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  intro: { gap: 5, paddingBottom: 2 },
  listTitle: { fontSize: 19, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.3 },
  row: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 20, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border, gap: 12 },
  rowCopy: { flex: 1, gap: 6 },
  companyMark: { width: 40, height: 40, borderRadius: 11, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  company: { color: colors.textSecondary, fontSize: 12, fontWeight: '600', lineHeight: 18 },
  title: { fontSize: 17, lineHeight: 24, fontWeight: '700', letterSpacing: -0.2, color: colors.textPrimary },
  body: { color: colors.textSecondary, lineHeight: 22 },
  note: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  meta: { flexDirection: 'row', alignItems: 'center', columnGap: 12, rowGap: 5, flexWrap: 'wrap', paddingTop: 3 },
  allowance: { fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 1 },
  statusLabel: { fontSize: 11, fontWeight: '600', lineHeight: 18 },
  successText: { color: colors.successText },
  warningText: { color: colors.accentWarmText },
  neutralText: { color: colors.textSecondary },
  matchLabel: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  deadline: { color: colors.textMuted, fontSize: 11, lineHeight: 17 },
  error: { color: colors.error, lineHeight: 22 },
  pressed: { opacity: 0.75 },
});
