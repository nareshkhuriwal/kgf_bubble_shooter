import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect, Circle } from 'react-native-svg';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../../constants/gameConfig';

const STARS = Array.from({ length: 50 }, (_, i) => ({
  id: i,
  cx: Math.random() * SCREEN_WIDTH,
  cy: Math.random() * SCREEN_HEIGHT * 0.6,
  r: Math.random() * 1.5 + 0.5,
  opacity: Math.random() * 0.7 + 0.3,
}));

export const Background: React.FC = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
      <Defs>
        <RadialGradient id="sky" cx="50%" cy="0%" r="100%">
          <Stop offset="0%" stopColor="#1a1a4e" />
          <Stop offset="60%" stopColor="#16213e" />
          <Stop offset="100%" stopColor="#0f3460" />
        </RadialGradient>
        <RadialGradient id="moon" cx="40%" cy="40%" r="60%">
          <Stop offset="0%" stopColor="#fffff0" />
          <Stop offset="100%" stopColor="#f0e68c" />
        </RadialGradient>
      </Defs>

      <Rect x={0} y={0} width={SCREEN_WIDTH} height={SCREEN_HEIGHT} fill="url(#sky)" />

      {STARS.map(s => (
        <Circle key={s.id} cx={s.cx} cy={s.cy} r={s.r} fill="white" opacity={s.opacity} />
      ))}

      {/* Moon */}
      <Circle cx={SCREEN_WIDTH * 0.82} cy={SCREEN_HEIGHT * 0.07} r={22} fill="url(#moon)" />
      <Circle cx={SCREEN_WIDTH * 0.82 + 8} cy={SCREEN_HEIGHT * 0.07 - 6} r={20} fill="#16213e" opacity={0.3} />

      {/* Bottom ground fade */}
      <Rect x={0} y={SCREEN_HEIGHT * 0.87} width={SCREEN_WIDTH} height={SCREEN_HEIGHT * 0.13} fill="#0a0a2e" opacity={0.8} />
    </Svg>
  </View>
);
