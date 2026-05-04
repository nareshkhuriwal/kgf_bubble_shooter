import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import {
  CANNON_X,
  CANNON_Y,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  GRID_OFFSET_Y,
  CANNON_LENGTH,
} from '../../constants/gameConfig';

interface AimLineProps {
  angle: number;
  visible: boolean;
}

function computeDots(angle: number, count: number): { x: number; y: number }[] {
  const rad = ((angle - 90) * Math.PI) / 180;
  const dots: { x: number; y: number }[] = [];

  let x = CANNON_X;
  let y = CANNON_Y - CANNON_LENGTH - 5;
  let dvx = Math.cos(rad);
  let dvy = Math.sin(rad);
  const step = 18;

  for (let i = 0; i < count; i++) {
    x += dvx * step;
    y += dvy * step;

    if (x <= 2) { dvx = Math.abs(dvx); x = 2; }
    else if (x >= SCREEN_WIDTH - 2) { dvx = -Math.abs(dvx); x = SCREEN_WIDTH - 2; }
    if (y <= GRID_OFFSET_Y + 10) break;

    dots.push({ x, y });
  }
  return dots;
}

export const AimLine: React.FC<AimLineProps> = ({ angle, visible }) => {
  if (!visible) return null;
  const dots = computeDots(angle, 20);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
        {dots.map((d, i) => (
          <Circle
            key={i}
            cx={d.x}
            cy={d.y}
            r={i % 2 === 0 ? 3.5 : 2.5}
            fill="white"
            opacity={Math.max(0.15, 0.8 - i * 0.035)}
          />
        ))}
      </Svg>
    </View>
  );
};
