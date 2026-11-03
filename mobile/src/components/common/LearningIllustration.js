import React from 'react';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { colors } from '../../utils/theme';

// Ilustrasi vektor milik Finetern; tidak memerlukan gambar atau koneksi eksternal.
export default function LearningIllustration({ size = 120 }) {
  return <Svg width={size} height={size} viewBox="0 0 160 160" accessible={false}>
    <Circle cx="80" cy="80" r="68" fill={colors.white} opacity={0.09} />
    <Circle cx="132" cy="32" r="5" fill={colors.accentWarm} />
    <Circle cx="25" cy="106" r="3" fill={colors.primaryBorder} />
    <G rotation={-12} origin="80,80">
      <Rect x="38" y="36" width="84" height="100" rx="10" fill={colors.primaryDark} />
      <Rect x="32" y="27" width="84" height="100" rx="10" fill={colors.accentWarm} />
      <Path d="M46 28v98" stroke={colors.accentWarmText} strokeOpacity={0.2} strokeWidth="2" />
      <Rect x="57" y="45" width="44" height="4" rx="2" fill={colors.primary} />
      <Rect x="57" y="57" width="31" height="4" rx="2" fill={colors.primary} opacity={0.35} />
      <Rect x="57" y="69" width="39" height="4" rx="2" fill={colors.primary} opacity={0.2} />
    </G>
    <G rotation={8} origin="110,98">
      <Rect x="72" y="69" width="70" height="55" rx="9" fill={colors.white} />
      <Path d="M73 82h68" stroke={colors.border} />
      <Circle cx="80" cy="76" r="1.5" fill={colors.primaryBorder} />
      <Circle cx="86" cy="76" r="1.5" fill={colors.primaryBorder} />
      <Path d="m96 92-7 7 7 7 m24-14 7 7-7 7 m-8-17-6 20" fill="none" stroke={colors.primary} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </G>
    <Circle cx="124" cy="133" r="13" fill={colors.accentWarm} />
    <Path d="m118 133 4 4 8-9" fill="none" stroke={colors.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>;
}
