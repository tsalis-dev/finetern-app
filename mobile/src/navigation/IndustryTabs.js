import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors } from '../utils/theme';

import IndustryDashboardScreen from '../screens/industry/IndustryDashboardScreen';
import IndustryVacancyScreen from '../screens/industry/IndustryVacancyScreen';
import IndustryApplicantsScreen from '../screens/industry/IndustryApplicantsScreen';
import IndustryProfileScreen from '../screens/industry/IndustryProfileScreen';

const Tab = createBottomTabNavigator();

export default function IndustryTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.role.industri.text,
        tabBarInactiveTintColor: colors.neutral[400],
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Beranda"
        component={IndustryDashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color }) => <Text style={[styles.tabIcon, { color }]}>🏢</Text>,
        }}
      />
      <Tab.Screen
        name="Lowongan"
        component={IndustryVacancyScreen}
        options={{
          tabBarLabel: 'Lowongan',
          tabBarIcon: ({ color }) => <Text style={[styles.tabIcon, { color }]}>📋</Text>,
        }}
      />
      <Tab.Screen
        name="Pelamar"
        component={IndustryApplicantsScreen}
        options={{
          tabBarLabel: 'Pelamar AI',
          tabBarIcon: ({ color }) => <Text style={[styles.tabIcon, { color }]}>👥</Text>,
          tabBarBadge: 4,
        }}
      />
      <Tab.Screen
        name="Profil"
        component={IndustryProfileScreen}
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color }) => <Text style={[styles.tabIcon, { color }]}>👤</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.neutral.white,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    height: 60,
    paddingBottom: 6,
    paddingTop: 6,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  tabIcon: {
    fontSize: 18,
  },
});
