import React, { useEffect, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppIcon from './AppIcon';
import { colors, spacing } from '../../utils/theme';

export default function FloatingTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);
  if (keyboardVisible) return null;
  return <View style={[styles.space, { paddingBottom: insets.bottom + 12 }]}>
    <View style={styles.bar}>
      {state.routes.map((route, index) => {
        const options = descriptors[route.key].options;
        const selected = state.index === index;
        const color = selected ? colors.primary : colors.textSecondary;
        return <Pressable key={route.key} accessibilityRole="tab"
          accessibilityLabel={options.tabBarLabel} accessibilityState={{ selected }}
          onPress={() => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!selected && !event.defaultPrevented) navigation.navigate(route.name, route.params);
          }}
          onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
          style={({ pressed }) => [styles.tab, pressed && styles.pressed]}>
          <View style={[styles.icon, selected && styles.active]}><AppIcon name={options.tabBarIconName} size={22} color={color} /></View>
          <Text style={[styles.label, { color }, selected && styles.selected]}>{options.tabBarLabel}</Text>
        </Pressable>;
      })}
    </View>
  </View>;
}
const styles = StyleSheet.create({
  space: { backgroundColor: colors.background, paddingHorizontal: spacing.md, paddingTop: 10 },
  bar: { flexDirection: 'row', backgroundColor: colors.white, borderRadius: 24, padding: 6, borderWidth: 1, borderColor: colors.border, elevation: 5, shadowColor: '#30262A', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 3 } },
  tab: { flex: 1, minHeight: 62, alignItems: 'center', justifyContent: 'center', gap: 3, borderRadius: 18 },
  icon: { paddingVertical: 4, paddingHorizontal: 14, borderRadius: 16 },
  active: { backgroundColor: colors.primaryLight },
  label: { fontSize: 11, textAlign: 'center' },
  selected: { fontWeight: '700' },
  pressed: { backgroundColor: colors.surfaceElevated },
});
