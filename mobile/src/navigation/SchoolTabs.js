import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import FloatingTabBar from '../components/common/FloatingTabBar';
import SchoolDashboardScreen from '../screens/school/SchoolDashboardScreen';
import VerificationQueueScreen from '../screens/school/VerificationQueueScreen';
import SchoolProfileScreen from '../screens/school/SchoolProfileScreen';
import PortfolioQueueScreen from '../screens/school/PortfolioQueueScreen';

const Tab = createBottomTabNavigator();
export default function SchoolTabs() {
  return <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={props => <FloatingTabBar {...props} />}>
    <Tab.Screen name="Dashboard" component={SchoolDashboardScreen} options={{ tabBarLabel: 'Beranda', tabBarIconName: 'home' }} />
    <Tab.Screen name="Karya" component={PortfolioQueueScreen} options={{ tabBarLabel: 'Bukti karya', tabBarIconName: 'folder' }} />
    <Tab.Screen name="Validasi" component={VerificationQueueScreen} options={{ tabBarLabel: 'Verifikasi', tabBarIconName: 'check' }} />
    <Tab.Screen name="Profil" component={SchoolProfileScreen} options={{ tabBarLabel: 'Profil', tabBarIconName: 'user' }} />
  </Tab.Navigator>;
}
