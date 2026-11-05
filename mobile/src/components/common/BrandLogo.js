import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import mark from '../../../assets/brand/mark.json';
import { colors } from '../../utils/theme';

export default function BrandLogo({ size = 36, color = colors.primary, markOnly = false }) {
  return <View accessible accessibilityRole="image" accessibilityLabel="Finetern" style={[styles.logo, { gap: size * 0.24 }]}>
    <Svg width={size * mark.width / mark.height} height={size} viewBox={mark.viewBox} accessible={false}>
      {mark.paths.map((path, index) => <Path key={index} d={path} fill={color} />)}
    </Svg>
    {!markOnly ? <Text accessible={false} allowFontScaling={false} style={[styles.wordmark, { color, fontSize: size * 0.84, lineHeight: size * 1.12, letterSpacing: -size * 0.025 }]}>finetern</Text> : null}
  </View>;
}
const styles = StyleSheet.create({
  logo: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  wordmark: { fontWeight: '700', flexShrink: 1 },
});
