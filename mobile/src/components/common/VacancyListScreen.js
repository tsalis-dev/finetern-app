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
        return <Pressable accessibilityRole="button" style={({ pressed }) => [styles.card, pressed && styles.pressed]} onPress={() => navigation.navigate('VacancyDetail', { id: item.id })}>
          <View style={styles.companyRow}><View style={styles.companyMark}><AppIcon name="briefcase" size={22} /></View><View style={styles.companyInfo}><Text style={styles.company}>{item.nama_industri}</Text><View style={styles.location}><AppIcon name="pin" size={13} color={colors.textMuted} /><Text style={styles.note}>{item.lokasi || item.kota_domisili}</Text></View></View></View>
          <Text style={styles.title}>{item.title}</Text>
          <View style={styles.meta}><View style={styles.chip}><Text style={styles.chipLabel}>{workModes[item.tipe_kerja] || 'Sistem kerja belum diisi'}</Text></View><Text style={styles.allowance}>{formatAllowance(item.uang_saku)}</Text></View>
          <View style={[styles.status, status.tone === 'success' ? styles.statusSuccess : status.tone === 'warning' ? styles.statusWarning : styles.statusNeutral]}><AppIcon name={status.icon} size={14} color={status.tone === 'success' ? colors.successText : status.tone === 'warning' ? colors.accentWarmText : colors.textSecondary} /><Text style={[styles.statusLabel, status.tone === 'success' ? styles.successText : status.tone === 'warning' ? styles.warningText : styles.body]}>{status.label}</Text></View>
          <View style={styles.footer}><View style={styles.footerInfo}>
            {own ? <Text style={styles.matchLabel}>Sisa kuota <Text style={styles.matchValue}>{item.remaining_quota}/{item.kuota}</Text></Text> : <Text style={styles.matchLabel}>Kecocokan <Text style={styles.matchValue}>{item.matching.match_rate.toFixed(2)}%</Text></Text>}
            <Text style={styles.deadline}>Batas lamaran {formatDeadline(item.tenggat_waktu)}</Text>
          </View><View style={styles.cardArrow}><AppIcon name="arrow" size={19} /></View></View>
        </Pressable>;
      }}
      ListFooterComponent={hasMore ? <PrimaryButton title="Muat berikutnya" onPress={() => load(items.length)} loading={busy} /> : null} />
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingTop: spacing.md, gap: 16, paddingBottom: spacing.xl },
  header: { gap: 20 },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 16, paddingRight: 6, paddingVertical: 6, backgroundColor: colors.white, borderRadius: 18, borderWidth: 1, borderColor: colors.border },
  searchInput: { flex: 1, minWidth: 0, minHeight: 44, paddingVertical: 0, fontSize: 13, color: colors.textPrimary },
  searchButton: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  intro: { gap: 5, paddingBottom: 2 },
  listTitle: { fontSize: 19, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.3 },
  card: { padding: 20, backgroundColor: colors.white, borderRadius: 23, borderWidth: 1, borderColor: colors.border, gap: 14 },
  companyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  companyMark: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  companyInfo: { flex: 1, gap: 5 },
  company: { color: colors.textSecondary, fontSize: 12, fontWeight: '600', lineHeight: 18 },
  location: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  title: { fontSize: 19, lineHeight: 26, fontWeight: '700', letterSpacing: -0.3, color: colors.textPrimary },
  body: { color: colors.textSecondary, lineHeight: 22 },
  note: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  chip: { backgroundColor: colors.surfaceElevated, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 7 },
  chipLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '600' },
  allowance: { fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
  status: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 9, borderRadius: 8 },
  statusSuccess: { backgroundColor: colors.successBg },
  statusWarning: { backgroundColor: colors.warningBg },
  statusNeutral: { backgroundColor: colors.surfaceElevated },
  statusLabel: { fontSize: 11, fontWeight: '600', lineHeight: 18 },
  successText: { color: colors.successText },
  warningText: { color: colors.accentWarmText },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderColor: colors.surfaceElevated, paddingTop: 14 },
  footerInfo: { flex: 1, gap: 5 },
  matchLabel: { color: colors.textSecondary, fontSize: 12 },
  matchValue: { color: colors.primary, fontSize: 17, fontWeight: '700' },
  deadline: { color: colors.textMuted, fontSize: 11, lineHeight: 17 },
  cardArrow: { width: 36, height: 36, backgroundColor: colors.primaryLight, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  error: { color: colors.error, lineHeight: 22 },
  pressed: { opacity: 0.75 },
});
