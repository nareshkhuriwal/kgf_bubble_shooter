import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Line, Stop } from 'react-native-svg';
import {
  CANNON_X,
  CANNON_Y,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  GRID_OFFSET_Y,
  CANNON_LENGTH,
} from '../../constants/gameConfig';
import { angleToUnitVector } from '../../utils/physics';

interface AimLineProps {
  angle: number;
  visible: boolean;
}

function computeDots(angle: number, count: number): { x: number; y: number }[] {
  const vector = angleToUnitVector(angle);
  const dots: { x: number; y: number }[] = [];

  let x = CANNON_X;
  let y = CANNON_Y - CANNON_LENGTH - 5;
  let dvx = vector.x;
  let dvy = vector.y;
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
  const dots = computeDots(angle, 24);
  const start = { x: CANNON_X, y: CANNON_Y - CANNON_LENGTH - 6 };
  const end = dots[dots.length - 1] ?? start;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="aimGlow" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.96" />
            <Stop offset="50%" stopColor="#4ECDC4" stopOpacity="0.92" />
            <Stop offset="100%" stopColor="#FFD700" stopOpacity="0.8" />
          </LinearGradient>
        </Defs>
        <Line
          x1={start.x}
          y1={start.y}
          x2={end.x}
          y2={end.y}
          stroke="#4ECDC4"
          strokeWidth="10"
          strokeLinecap="round"
          opacity="0.12"
        />
        <Line
          x1={start.x}
          y1={start.y}
          x2={end.x}
          y2={end.y}
          stroke="url(#aimGlow)"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.9"
        />
        {dots.map((d, i) => (
          <Circle
            key={i}
            cx={d.x}
            cy={d.y}
            r={Math.max(2.2, 5 - i * 0.08)}
            fill={i % 3 === 0 ? '#FFD700' : '#ffffff'}
            opacity={Math.max(0.18, 0.92 - i * 0.035)}
          />
        ))}
      </Svg>
    </View>
  );
};
