import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors } from '../utils/theme';

import StudentHomeScreen from '../screens/student/StudentHomeScreen';
import StudentExploreScreen from '../screens/student/StudentExploreScreen';
import StudentPortfolioScreen from '../screens/student/StudentPortfolioScreen';
import StudentAIMentorScreen from '../screens/student/StudentAIMentorScreen';
import StudentProfileScreen from '../screens/student/StudentProfileScreen';

const Tab = createBottomTabNavigator();

export default function StudentTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.neutral[400],
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Beranda"
        component={StudentHomeScreen}
        options={{
          tabBarLabel: 'Beranda',
          tabBarIcon: ({ color }) => <Text style={[styles.tabIcon, { color }]}>🏠</Text>,
        }}
      />
      <Tab.Screen
        name="Eksplorasi"
        component={StudentExploreScreen}
        options={{
          tabBarLabel: 'Lowongan',
          tabBarIcon: ({ color }) => <Text style={[styles.tabIcon, { color }]}>🔍</Text>,
        }}
      />
      <Tab.Screen
        name="PortofolioTab"
        component={StudentPortfolioScreen}
        options={{
          tabBarLabel: 'Portofolio',
          tabBarIcon: ({ color }) => <Text style={[styles.tabIcon, { color }]}>📁</Text>,
        }}
      />
      <Tab.Screen
        name="AIMentor"
        component={StudentAIMentorScreen}
        options={{
          tabBarLabel: 'AI Mentor',
          tabBarIcon: ({ color }) => <Text style={[styles.tabIcon, { color }]}>✨</Text>,
        }}
      />
      <Tab.Screen
        name="Profil"
        component={StudentProfileScreen}
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
