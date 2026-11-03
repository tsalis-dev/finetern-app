import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, AppState } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/useAuthStore';
import { colors } from '../utils/theme';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import VerificationStatusScreen from '../screens/auth/VerificationStatusScreen';
import VerificationDetailScreen from '../screens/auth/VerificationDetailScreen';
import SessionRecoveryScreen from '../screens/auth/SessionRecoveryScreen';
import StudentTabs from './StudentTabs';
import SchoolTabs from './SchoolTabs';
import IndustryTabs from './IndustryTabs';
import PortfolioDetailScreen from '../screens/portfolio/PortfolioDetailScreen';
import PortfolioFormScreen from '../screens/portfolio/PortfolioFormScreen';
import VacancyDetailScreen from '../screens/recruitment/VacancyDetailScreen';
import VacancyFormScreen from '../screens/recruitment/VacancyFormScreen';
import ApplicationDetailScreen from '../screens/recruitment/ApplicationDetailScreen';
import ApplicationListScreen from '../components/common/ApplicationListScreen';
import LearningTargetScreen from '../screens/learning/LearningTargetScreen';
import LearningModuleScreen from '../screens/learning/LearningModuleScreen';

const Stack = createNativeStackNavigator();
export default function AppNavigator() {
  const { user, isAuthenticated, isLoading, sessionError, restoreSession } = useAuthStore();
  useEffect(() => {
    restoreSession();
    const subscription = AppState.addEventListener('change', state => {
      const auth = useAuthStore.getState();
      if (state === 'active' && auth.token) auth.refreshProfile().catch(() => {});
    });
    return () => subscription.remove();
  }, [restoreSession]);
  if (isLoading) return <View style={styles.loading}><Text style={styles.brand}>finetern</Text><ActivityIndicator size="large" color={colors.primary} /></View>;
  if (sessionError) return <SessionRecoveryScreen />;
  return <NavigationContainer key={isAuthenticated ? user.id + ':' + user.role + ':' + user.canUseApp : 'guest'}>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? <>
        <Stack.Screen name="Login" component={LoginScreen} /><Stack.Screen name="Register" component={RegisterScreen} />
      </> : user.role === 'admin' ? <Stack.Screen name="Admin">{() => <SessionRecoveryScreen admin />}</Stack.Screen>
        : !user.canUseApp ? <Stack.Screen name="Pending" component={VerificationStatusScreen} />
          : user.role === 'sekolah' ? <Stack.Screen name="SchoolRoot" component={SchoolTabs} />
            : user.role === 'industri' ? <Stack.Screen name="IndustryRoot" component={IndustryTabs} />
              : <Stack.Screen name="StudentRoot" component={StudentTabs} />}
      {isAuthenticated ? <>
        <Stack.Screen name="VerificationStatus" component={VerificationStatusScreen} />
        <Stack.Screen name="VerificationDetail" component={VerificationDetailScreen} />
      </> : null}
      {isAuthenticated && user.canUseApp && ['siswa', 'sekolah'].includes(user.role) ? <Stack.Screen name="PortfolioDetail" component={PortfolioDetailScreen} /> : null}
      {isAuthenticated && user.canUseApp && user.role === 'siswa' ? <Stack.Screen name="PortfolioForm" component={PortfolioFormScreen} /> : null}
      {isAuthenticated && user.canUseApp && ['siswa','industri'].includes(user.role)?<Stack.Screen name="VacancyDetail" component={VacancyDetailScreen}/>:null}
      {isAuthenticated && user.canUseApp && user.role==='industri'?<>
        <Stack.Screen name="VacancyForm" component={VacancyFormScreen}/>
        <Stack.Screen name="VacancyApplications">{props=><ApplicationListScreen {...props} mode="industry" back/>}</Stack.Screen>
      </>:null}
      {isAuthenticated && user.canUseApp && user.role==='siswa'?<Stack.Screen name="MyApplications">{props=><ApplicationListScreen {...props} back/>}</Stack.Screen>:null}
      {isAuthenticated && user.canUseApp && user.role==='siswa'?<>
        <Stack.Screen name="LearningTarget" component={LearningTargetScreen}/>
        <Stack.Screen name="LearningModule" component={LearningModuleScreen}/>
      </>:null}
      {isAuthenticated && user.canUseApp && user.role==='sekolah'?<Stack.Screen name="SchoolApplications">{props=><ApplicationListScreen {...props} mode="school" back/>}</Stack.Screen>:null}
      {isAuthenticated && user.canUseApp && ['siswa','industri','sekolah'].includes(user.role)?<Stack.Screen name="ApplicationDetail" component={ApplicationDetailScreen}/>:null}
    </Stack.Navigator>
  </NavigationContainer>;
}
const styles = StyleSheet.create({ loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, gap: 24 }, brand: { fontSize: 28, fontWeight: '700', color: colors.primary } });
