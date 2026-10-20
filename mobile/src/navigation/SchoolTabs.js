import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors } from '../utils/theme';

import SchoolDashboardScreen from '../screens/school/SchoolDashboardScreen';
import SchoolValidationScreen from '../screens/school/SchoolValidationScreen';
import SchoolProfileScreen from '../screens/school/SchoolProfileScreen';

const Tab = createBottomTabNavigator();

export default function SchoolTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.role.guru.text,
        tabBarInactiveTintColor: colors.neutral[400],
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={SchoolDashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color }) => <Text style={[styles.tabIcon, { color }]}>📊</Text>,
        }}
      />
      <Tab.Screen
        name="Validasi"
        component={SchoolValidationScreen}
        options={{
          tabBarLabel: 'Validasi Skill',
          tabBarIcon: ({ color }) => <Text style={[styles.tabIcon, { color }]}>✅</Text>,
          tabBarBadge: 3,
        }}
      />
      <Tab.Screen
        name="Profil"
        component={SchoolProfileScreen}
        options={{
          tabBarLabel: 'Profil Guru',
          tabBarIcon: ({ color }) => <Text style={[styles.tabIcon, { color }]}>👤</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
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
