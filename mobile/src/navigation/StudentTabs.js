import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import FloatingTabBar from '../components/common/FloatingTabBar';
import StudentHomeScreen from '../screens/student/StudentHomeScreen';
import StudentExploreScreen from '../screens/student/StudentExploreScreen';
import StudentPortfolioScreen from '../screens/student/StudentPortfolioScreen';
import StudentProfileScreen from '../screens/student/StudentProfileScreen';

const Tab = createBottomTabNavigator();
export default function StudentTabs() {
  return <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={props => <FloatingTabBar {...props} />}>
    <Tab.Screen name="Beranda" component={StudentHomeScreen} options={{ tabBarLabel: 'Beranda', tabBarIconName: 'home' }} />
    <Tab.Screen name="Eksplorasi" component={StudentExploreScreen} options={{ tabBarLabel: 'Magang', tabBarIconName: 'briefcase' }} />
    <Tab.Screen name="PortofolioTab" component={StudentPortfolioScreen} options={{ tabBarLabel: 'Karya', tabBarIconName: 'folder' }} />
    <Tab.Screen name="Profil" component={StudentProfileScreen} options={{ tabBarLabel: 'Profil', tabBarIconName: 'user' }} />
  </Tab.Navigator>;
}
