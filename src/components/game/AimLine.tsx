import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import {
  CANNON_X,
  CANNON_Y,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  GRID_OFFSET_Y,
  CANNON_LENGTH,
  BUBBLE_RADIUS,
} from '../../constants/gameConfig';
import { angleToUnitVector } from '../../utils/physics';

interface AimLineProps {
  angle: number;
  visible: boolean;
}

interface Segment {
  x1: number; y1: number;
  x2: number; y2: number;
  bounced: boolean;
}

// Muzzle offset matches SHOOT action exactly
const MUZZLE_OFFSET = CANNON_LENGTH + BUBBLE_RADIUS * 0.35;

function computeTrajectory(angle: number): {
  segments: Segment[];
  dots: { x: number; y: number; bounced: boolean }[];
  bouncePoint: { x: number; y: number } | null;
} {
  const vector = angleToUnitVector(angle);
  const step   = 14;
  const maxDots = 40;

  // Start exactly where the projectile spawns
  let x   = CANNON_X + vector.x * MUZZLE_OFFSET;
  let y   = CANNON_Y + vector.y * MUZZLE_OFFSET;
  let dvx = vector.x;
  let dvy = vector.y;

  const dots: { x: number; y: number; bounced: boolean }[] = [];
  const segments: Segment[] = [];

  let bounceCount  = 0;
  let bounced      = false;
  let bouncePoint: { x: number; y: number } | null = null;
  let segStart     = { x, y };
  let prevBounced  = false;

  for (let i = 0; i < maxDots; i++) {
    let nx = x + dvx * step;
    let ny = y + dvy * step;

    let didBounce = false;

    // Wall bounce — same threshold as physics (BUBBLE_RADIUS from wall)
    if (nx - BUBBLE_RADIUS <= 0 && bounceCount < 2) {
      nx = BUBBLE_RADIUS;           // clamp to wall, same as physics
      dvx = Math.abs(dvx);
      bounceCount++;
      didBounce = true;
      if (!bouncePoint) bouncePoint = { x, y };
    } else if (nx + BUBBLE_RADIUS >= SCREEN_WIDTH && bounceCount < 2) {
      nx = SCREEN_WIDTH - BUBBLE_RADIUS;
      dvx = -Math.abs(dvx);
      bounceCount++;
      didBounce = true;
      if (!bouncePoint) bouncePoint = { x, y };
    }

    x = nx;
    y = ny;

    // Ceiling stop — same as physics: top of bubble touches grid ceiling
    if (y - BUBBLE_RADIUS <= GRID_OFFSET_Y) {
      segments.push({ x1: segStart.x, y1: segStart.y, x2: x, y2: y, bounced: prevBounced });
      break;
    }

    if (didBounce) {
      segments.push({ x1: segStart.x, y1: segStart.y, x2: x, y2: y, bounced: prevBounced });
      segStart    = { x, y };
      prevBounced = true;
      bounced     = true;
    }

    dots.push({ x, y, bounced: bounceCount > 0 });

    if (i === maxDots - 1) {
      segments.push({ x1: segStart.x, y1: segStart.y, x2: x, y2: y, bounced: prevBounced });
    }
  }

  return { segments, dots, bouncePoint };
}

export const AimLine: React.FC<AimLineProps> = ({ angle, visible }) => {
  if (!visible) return null;

  const vector = angleToUnitVector(angle);
  const startX = CANNON_X + vector.x * MUZZLE_OFFSET;
  const startY = CANNON_Y + vector.y * MUZZLE_OFFSET;

  const { dots, bouncePoint } = computeTrajectory(angle);
  const bounceIdx  = dots.findIndex(d => d.bounced);
  const preBounce  = bounceIdx >= 0 ? dots.slice(0, bounceIdx) : dots;
  const postBounce = bounceIdx >= 0 ? dots.slice(bounceIdx)    : [];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="aimPre" x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0%"   stopColor="#FFD700" stopOpacity="0.95" />
            <Stop offset="100%" stopColor="#ffffff" stopOpacity="0.85" />
          </LinearGradient>
          <LinearGradient id="aimPost" x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0%"   stopColor="#FF8C00" stopOpacity="0.85" />
            <Stop offset="100%" stopColor="#FFD700" stopOpacity="0.6"  />
          </LinearGradient>
        </Defs>

        {/* Pre-bounce: bright gold dots */}
        {preBounce.map((d, i) => (
          <Circle
            key={`pre-${i}`}
            cx={d.x} cy={d.y}
            r={Math.max(2.4, 5.2 - i * 0.1)}
            fill={i % 4 === 0 ? '#FFD700' : '#ffffff'}
            opacity={Math.max(0.2, 0.95 - i * 0.03)}
          />
        ))}

        {/* Bounce impact marker */}
        {bouncePoint && (
          <>
            <Circle cx={bouncePoint.x} cy={bouncePoint.y} r={9}   fill="#FFD700" opacity="0.18" />
            <Circle cx={bouncePoint.x} cy={bouncePoint.y} r={5}   fill="#FFD700" opacity="0.55" />
            <Circle cx={bouncePoint.x} cy={bouncePoint.y} r={2.5} fill="#fff"    opacity="0.9"  />
          </>
        )}

        {/* Post-bounce: amber dots (dimmer) */}
        {postBounce.map((d, i) => (
          <Circle
            key={`post-${i}`}
            cx={d.x} cy={d.y}
            r={Math.max(1.5, 3.8 - i * 0.08)}
            fill={i % 4 === 0 ? '#FF8C00' : '#FFD700'}
            opacity={Math.max(0.12, 0.65 - i * 0.04)}
          />
        ))}
      </Svg>
    </View>
  );
};
