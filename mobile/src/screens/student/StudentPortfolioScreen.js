import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, shadows } from '../../utils/theme';
import ScreenHeader from '../../components/common/ScreenHeader';
import PrimaryButton from '../../components/common/PrimaryButton';

export default function StudentPortfolioScreen() {
  const [activeTab, setActiveTab] = useState('portfolio'); // 'portfolio' | 'skills'

  const portfolios = [
    {
      id: 1,
      title: 'Aplikasi Katalog Produk SMKN 1',
      skill: 'React Native UI Slicing',
      url: 'https://github.com/siswa-smk/katalog-produk',
      status: 'approved',
      note: 'Hasil karya sangat rapi, struktur kode memenuhi standar praktikum.',
      date: '20 Okt 2026',
    },
    {
      id: 2,
      title: 'Integrasi REST API Presensi Siswa',
      skill: 'RESTful API Integration',
      url: 'https://github.com/siswa-smk/presensi-mobile',
      status: 'approved',
      note: 'Validasi token dan penanganan status error HTTP sudah tepat.',
      date: '18 Okt 2026',
    },
    {
      id: 3,
      title: 'Slicing UI Mockup Kasir Vokasi',
      skill: 'UI/UX Slicing Figma',
      url: 'https://github.com/siswa-smk/ui-kasir',
      status: 'pending',
      note: 'Menunggu peninjauan Guru Pembimbing.',
      date: 'Hari ini',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader
        title="Portofolio Bukti Karya"
        subtitle="Validasi dua arah oleh Guru Pembimbing SMK"
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Toggle Sub-tabs */}
        <View style={styles.tabContainer}>
          <Pressable
            onPress={() => setActiveTab('portfolio')}
            style={[styles.tab, activeTab === 'portfolio' && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === 'portfolio' && styles.tabTextActive]}>
              Bukti Karya ({portfolios.length})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('skills')}
            style={[styles.tab, activeTab === 'skills' && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === 'skills' && styles.tabTextActive]}>
              Keahlian Mikro
            </Text>
          </Pressable>
        </View>

        {/* Upload Action Card */}
        <View style={styles.uploadPromptCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.uploadTitle}>Unggah Bukti Praktikum Baru</Text>
            <Text style={styles.uploadSubtitle}>
              Lampirkan tangkapan layar dan tautan repositori proyek untuk divalidasi guru.
            </Text>
          </View>
          <PrimaryButton
            title="+ Unggah"
            onPress={() => alert('Fitur upload berkas (expo-image-picker / expo-document-picker) siap diintegrasikan!')}
            style={{ minHeight: 40, paddingHorizontal: spacing.md }}
          />
        </View>

        {/* Portfolio List */}
        {portfolios.map((item) => {
          const isApproved = item.status === 'approved';
          return (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <View style={styles.skillTag}>
                  <Text style={styles.skillTagText}>{item.skill}</Text>
                </View>
                <View
                  style={[
                    styles.statusPill,
                    { backgroundColor: isApproved ? colors.roleSchoolBg : colors.warningBg },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      { color: isApproved ? colors.success : colors.warning },
                    ]}
                  >
                    {isApproved ? '✓ Disetujui Guru' : '⏳ Menunggu Validasi'}
                  </Text>
                </View>
              </View>

              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemUrl}>🔗 {item.url}</Text>

              {item.note && (
                <View style={styles.noteBox}>
                  <Text style={styles.noteLabel}>Catatan Guru Pembimbing:</Text>
                  <Text style={styles.noteText}>{item.note}</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.md },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.border,
    padding: 4,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  tab: { flex: 1, minHeight: 38, alignItems: 'center', justifyContent: 'center', borderRadius: borderRadius.sm },
  tabActive: { backgroundColor: colors.white, ...shadows.subtle },
  tabText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  tabTextActive: { color: colors.primary, fontWeight: '700' },
  uploadPromptCard: {
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  uploadTitle: { fontSize: 14, fontWeight: '700', color: colors.primaryDark },
  uploadSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2, paddingRight: spacing.sm },
  itemCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  skillTag: { backgroundColor: colors.surfaceElevated, paddingHorizontal: 8, paddingVertical: 3, borderRadius: borderRadius.sm },
  skillTagText: { fontSize: 11, fontWeight: '700', color: colors.textSecondary },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: borderRadius.full },
  statusPillText: { fontSize: 10, fontWeight: '700' },
  itemTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginTop: 4 },
  itemUrl: { fontSize: 12, color: colors.primary, marginTop: 2, fontWeight: '500' },
  noteBox: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginTop: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  noteLabel: { fontSize: 11, fontWeight: '700', color: colors.textPrimary },
  noteText: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
});
