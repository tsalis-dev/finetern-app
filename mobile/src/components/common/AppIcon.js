import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../../utils/theme';

const paths = {
  home: 'M3 10 12 3l9 7v11h-6v-7H9v7H3Z',
  briefcase: 'M3 8h18v13H3Z M8 8V4h8v4 M3 13h18 M10 13v3h4v-3',
  folder: 'M3 6h7l2 3h9v12H3Z',
  user: 'M16 8a4 4 0 1 1-8 0 4 4 0 1 1 8 0 M4 21a8 8 0 0 1 16 0',
  users: 'M15 8a3 3 0 1 1-6 0 3 3 0 1 1 6 0 M5 21a7 7 0 0 1 14 0 M19 5a3 3 0 0 1 0 6 M21 15a5 5 0 0 1 2 5',
  book: 'M2 4q6-2 10 2 4-4 10-2v14q-6-2-10 2-4-4-10-2Z M12 6v14',
  school: 'M2 8 12 3l10 5-10 5Z M6 11v5q6 4 12 0v-5 M22 8v9',
  back: 'm15 5-7 7 7 7',
  next: 'm9 5 7 7-7 7',
  check: 'm5 12 4 4L19 6',
  clock: 'M21 12a9 9 0 1 1-18 0 9 9 0 1 1 18 0 M12 7v5l3 2',
  search: 'M18 10a8 8 0 1 1-16 0 8 8 0 1 1 16 0 m-2 6 6 6',
};
export default function AppIcon({ name, size = 24, color = colors.primary }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
    <Path d={paths[name]} fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>;
}
