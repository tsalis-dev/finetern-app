import React from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import Svg, { Defs, Ellipse, G, LinearGradient, Path, Stop } from 'react-native-svg';
import useWelcomeMotion from '../../hooks/useWelcomeMotion';
import mark from '../../../assets/brand/mark.json';
import { colors } from '../../utils/theme';

export default function WelcomeScene() {
  const phase = useWelcomeMotion();
  const roomOpacity = phase.interpolate({ inputRange: [0, 0.1, 0.9, 1], outputRange: [0, 1, 1, 0] });
  const objectStyle = (start, exit, offsetX) => {
    const inputRange = [0, start, start + 0.18, 0.72, exit, 1];
    return {
      opacity: phase.interpolate({ inputRange, outputRange: [0, 0, 1, 1, 0, 0] }),
      transform: [
        { translateY: phase.interpolate({ inputRange, outputRange: [-130, -130, 0, -5, -130, -130] }) },
        { translateX: phase.interpolate({ inputRange, outputRange: [offsetX, offsetX, 0, 0, -offsetX, -offsetX] }) },
        { rotate: phase.interpolate({ inputRange, outputRange: ['-6deg', '-6deg', '0deg', '1deg', '5deg', '5deg'] }) },
      ],
    };
  };

  return <View style={styles.scene} accessible accessibilityRole="image" accessibilityLabel="Ilustrasi isometrik karya, penilaian guru, dan peluang magang">
    <Animated.View style={[styles.layer, { opacity: roomOpacity }]} importantForAccessibility="no-hide-descendants">
      <Svg width="100%" height="100%" viewBox="0 0 400 360" accessible={false}>
        <Defs>
          <LinearGradient id="welcomeFloor" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.primaryLight} /><Stop offset="1" stopColor={colors.primaryBorder} />
          </LinearGradient>
        </Defs>
        <Path d="M60 252 196 173 337 254 201 333Z" fill="url(#welcomeFloor)" />
        <G fill="none" stroke={colors.primary} strokeOpacity={0.16} strokeWidth={0.9}>
          <Path d="M60 252V104L196 25 337 106V254 M196 25V173 M60 104 201 185 337 106" />
          <Path d="M105 226V78 M150 200V52 M243 200V52 M290 227V79" />
          <Path d="m60 153 136-79 141 81 M60 202l136-79 141 82" />
          <Path d="m60 252 141 81 136-79-141-81Z M105 226l141 81 M150 200l141 81 M107 279l136-79 M154 306l136-79" />
        </G>
        <Ellipse cx="202" cy="267" rx="106" ry="30" fill={colors.primaryDark} opacity={0.07} />
      </Svg>
    </Animated.View>

    <Animated.View style={[styles.layer, objectStyle(0.06, 0.82, -24)]} importantForAccessibility="no-hide-descendants">
      <Svg width="100%" height="100%" viewBox="0 0 400 360" accessible={false}>
        <Defs><LinearGradient id="welcomeBook" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor={colors.primary} /><Stop offset="1" stopColor={colors.primaryDark} /></LinearGradient></Defs>
        <Path d="m93 139 16-9 83 48-16 9Z" fill={colors.accentWarm} stroke={colors.primaryDark} strokeWidth={1.2} />
        <Path d="m176 187 16-9v94l-16 9Z" fill={colors.primaryDark} />
        <Path d="m93 139 83 48v94l-83-48Z" fill="url(#welcomeBook)" stroke={colors.primaryDark} strokeWidth={1.2} />
        <Path d="m102 138 80 46 m-74-49 78 46" fill="none" stroke={colors.white} strokeOpacity={0.7} strokeWidth={1.8} />
        <Path d="M103 153v75" stroke={colors.onPrimaryMuted} strokeOpacity={0.3} strokeWidth={1.4} />
        <G transform="matrix(0.13 0.075 0 0.13 116 171)">{mark.paths.map((path, index) => <Path key={index} d={path} fill={colors.white} />)}</G>
      </Svg>
    </Animated.View>

    <Animated.View style={[styles.layer, objectStyle(0.26, 0.94, 24)]} importantForAccessibility="no-hide-descendants">
      <Svg width="100%" height="100%" viewBox="0 0 400 360" accessible={false}>
        <Defs><LinearGradient id="welcomeCase" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor={colors.white} /><Stop offset="1" stopColor={colors.primaryBorder} /></LinearGradient></Defs>
        <Path d="m263 158v-17l29 17v17" fill="none" stroke={colors.primaryDark} strokeWidth={6} strokeLinejoin="round" />
        <Path d="m238 167 17-10 84 49-17 10Z" fill={colors.accentWarm} stroke={colors.primaryDark} strokeWidth={1.2} />
        <Path d="m322 216 17-10v68l-17 10Z" fill={colors.primaryDark} />
        <Path d="m238 167 84 49v68l-84-49Z" fill="url(#welcomeCase)" stroke={colors.primaryDark} strokeWidth={1.4} />
        <Path d="m238 191 84 49" stroke={colors.primary} strokeOpacity={0.6} strokeWidth={1.2} />
        <Path d="m273 207 16 9v16l-16-9Z" fill={colors.primary} />
        <Path d="m280 215v9" stroke={colors.accentWarm} strokeWidth={2.4} strokeLinecap="round" />
      </Svg>
    </Animated.View>

    <Animated.View style={[styles.layer, objectStyle(0.16, 0.88, 8)]} importantForAccessibility="no-hide-descendants">
      <Svg width="100%" height="100%" viewBox="0 0 400 360" accessible={false}>
        <Defs><LinearGradient id="welcomeShield" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor={colors.white} /><Stop offset="0.5" stopColor={colors.accentWarm} /><Stop offset="1" stopColor={colors.primaryBorder} /></LinearGradient></Defs>
        <Path d="m166 171 11-7 83 46-4 44q-4 37-36 56l-10-7Z" fill={colors.primaryDark} stroke={colors.primaryDark} strokeWidth={1.2} />
        <Path d="M166 171q42 4 83 46l-4 37q-4 30-35 49-37-40-41-73Z" fill="url(#welcomeShield)" stroke={colors.primary} strokeWidth={1.5} />
        <Path d="m183 227 18 22 27-17" fill="none" stroke={colors.primary} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M175 184q30 7 62 36" fill="none" stroke={colors.white} strokeOpacity={0.8} strokeWidth={2} />
      </Svg>
    </Animated.View>
  </View>;
}

const styles = StyleSheet.create({
  scene: { width: '100%', aspectRatio: 400 / 360, maxWidth: 400, alignSelf: 'center' },
  layer: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
});
