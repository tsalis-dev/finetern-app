import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import FloatingTabBar from '../components/common/FloatingTabBar';
import IndustryDashboardScreen from '../screens/industry/IndustryDashboardScreen';
import IndustryVacancyScreen from '../screens/industry/IndustryVacancyScreen';
import IndustryApplicantsScreen from '../screens/industry/IndustryApplicantsScreen';
import IndustryProfileScreen from '../screens/industry/IndustryProfileScreen';

const Tab = createBottomTabNavigator();
export default function IndustryTabs() {
  return <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={props => <FloatingTabBar {...props} />}>
    <Tab.Screen name="Beranda" component={IndustryDashboardScreen} options={{ tabBarLabel: 'Beranda', tabBarIconName: 'home' }} />
    <Tab.Screen name="Lowongan" component={IndustryVacancyScreen} options={{ tabBarLabel: 'Lowongan', tabBarIconName: 'briefcase' }} />
    <Tab.Screen name="Pelamar" component={IndustryApplicantsScreen} options={{ tabBarLabel: 'Pelamar', tabBarIconName: 'users' }} />
    <Tab.Screen name="Profil" component={IndustryProfileScreen} options={{ tabBarLabel: 'Profil', tabBarIconName: 'user' }} />
  </Tab.Navigator>;
}
