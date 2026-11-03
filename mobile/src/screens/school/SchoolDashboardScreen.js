import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import FormScreen from '../../components/common/FormScreen';
import PrimaryButton from '../../components/common/PrimaryButton';
import { useAuthStore } from '../../store/useAuthStore';
import { colors, spacing, borderRadius } from '../../utils/theme';

export default function SchoolDashboardScreen({ navigation }) {
  const user = useAuthStore(state => state.user);
  return <FormScreen title={'Halo, ' + (user?.nama?.split(' ')[0] || 'Guru') + '.'} subtitle={user?.sekolah}>
    <View style={styles.card}><Text style={styles.heading}>Dampingi karya siswa</Text><Text style={styles.body}>Periksa bukti proyek, beri masukan yang dapat ditindaklanjuti, lalu nilai keterampilan yang benar-benar ditunjukkan.</Text><PrimaryButton title="Periksa bukti karya siswa" onPress={() => navigation.navigate('Karya')} /></View>
    <View style={styles.card}><Text style={styles.heading}>Keanggotaan sekolah</Text><Text style={styles.body}>{user?.posisi === 'koordinator' ? 'Periksa pengajuan guru dan siswa yang terhubung ke sekolahmu.' : 'Cocokkan pengajuan siswa dengan data sekolah sebelum menyetujuinya.'} Verifikasi akun tidak menggantikan pemeriksaan karya.</Text><PrimaryButton title="Buka verifikasi akun" variant="secondary" onPress={() => navigation.navigate('Validasi')} /></View>
    <PrimaryButton title="Lihat profil guru" variant="outline" onPress={() => navigation.navigate('Profil')} />
    <View style={styles.card}><Text style={styles.heading}>Pantau perjalanan magang</Text><Text style={styles.body}>Lihat lamaran siswa di sekolahmu beserta status dan catatan seleksi dari industri.</Text><PrimaryButton title="Pantau lamaran siswa" variant="secondary" onPress={() => navigation.navigate('SchoolApplications')} /></View>
  </FormScreen>;
}
const styles = StyleSheet.create({ card: { padding: spacing.md, backgroundColor: colors.white, borderRadius: borderRadius.lg, gap: spacing.md }, heading: { fontSize: 18, fontWeight: '600', color: colors.textPrimary }, body: { color: colors.textSecondary, lineHeight: 22 } });
