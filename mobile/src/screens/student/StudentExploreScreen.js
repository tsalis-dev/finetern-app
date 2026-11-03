import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../../components/common/ScreenHeader';
import SectionTabs from '../../components/common/SectionTabs';
import VacancyListScreen from '../../components/common/VacancyListScreen';
import ApplicationListScreen from '../../components/common/ApplicationListScreen';
import { colors } from '../../utils/theme';

export default function StudentExploreScreen({ navigation, route }) {
  const view = route.params?.view || 'vacancies';
  return <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
    <ScreenHeader eyebrow="TEMUKAN ARAHMU" title="Magang" subtitle="Tempat baru untuk belajar dan bertumbuh." />
    <SectionTabs choices={[['vacancies', 'Cari lowongan'], ['applications', 'Lamaran saya']]}
      value={view} onChange={next => navigation.setParams({ view: next })} />
    <View style={styles.safe}>{view === 'applications'
      ? <ApplicationListScreen navigation={navigation} route={route} embedded />
      : <VacancyListScreen navigation={navigation} embedded />}
    </View>
  </SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.background } });
