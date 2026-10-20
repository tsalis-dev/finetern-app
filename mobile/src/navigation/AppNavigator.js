import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/useAuthStore';
import { colors } from '../utils/theme';

import LoginScreen from '../screens/auth/LoginScreen';
import StudentTabs from './StudentTabs';
import SchoolTabs from './SchoolTabs';
import IndustryTabs from './IndustryTabs';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { isAuthenticated, role, isLoading, restoreSession } = useAuthStore();

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.brandTitle}>Finetern</Text>
        <Text style={styles.brandSubtitle}>AI Micro-Skills Matching Platform</Text>
        <ActivityIndicator size="large" color={colors.primary.main} style={styles.spinner} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : role === 'sekolah' || role === 'guru_smk' ? (
          <Stack.Screen name="SchoolRoot" component={SchoolTabs} />
        ) : role === 'industri' || role === 'mitra_industri' ? (
          <Stack.Screen name="IndustryRoot" component={IndustryTabs} />
        ) : (
          <Stack.Screen name="StudentRoot" component={StudentTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.neutral.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary.main,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 13,
    color: colors.neutral[500],
    marginTop: 4,
    marginBottom: 24,
  },
  spinner: {
    marginTop: 8,
  },
});
