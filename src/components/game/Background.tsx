import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Defs, RadialGradient, LinearGradient, Stop,
  Rect, Circle, Ellipse, Line,
} from 'react-native-svg';
import {
  SCREEN_WIDTH, SCREEN_HEIGHT,
  GAME_HEADER_HEIGHT, GRID_OFFSET_Y,
  CANNON_Y, BUBBLE_DIAMETER,
} from '../../constants/gameConfig';

// ─── Derived layout constants ─────────────────────────────────────────────────
const FLOOR_TOP   = CANNON_Y - 90;
const MORTAR_STEP = Math.round(BUBBLE_DIAMETER * 0.866);
const NUM_MORTARS = Math.ceil((FLOOR_TOP - GRID_OFFSET_Y) / MORTAR_STEP) + 1;

// Torches sit just above the stone floor line
const TORCH_Y  = CANNON_Y - 72;
const TORCH_LX = 22;
const TORCH_RX = SCREEN_WIDTH - 22;

// Stars — confined to the sky zone (0 → GAME_HEADER_HEIGHT)
// Deterministic positions so they never flicker on re-renders
const STARS = Array.from({ length: 54 }, (_, i) => ({
  id: i,
  cx: (i * 137.508 + i * 0.72) % (SCREEN_WIDTH - 10) + 5,
  cy: ((i * 79.3 + 11) % (GAME_HEADER_HEIGHT * 0.92)) + 2,
  r:  i % 3 === 0 ? 1.9 : i % 5 === 0 ? 1.3 : 0.75,
  op: 0.22 + (i % 7) * 0.09,
}));

export const Background: React.FC = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
      <Defs>
        {/* ── Gradients ── */}
        <LinearGradient id="bg_sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%"   stopColor="#010010" />
          <Stop offset="22%"  stopColor="#07021e" />
          <Stop offset="52%"  stopColor="#12062c" />
          <Stop offset="78%"  stopColor="#1e0812" />
          <Stop offset="100%" stopColor="#340b00" />
        </LinearGradient>

        <RadialGradient id="bg_moonHalo" cx="50%" cy="50%" r="50%">
          <Stop offset="0%"   stopColor="#fff8dc" stopOpacity="0.88" />
          <Stop offset="48%"  stopColor="#ffe480" stopOpacity="0.22" />
          <Stop offset="100%" stopColor="#ffe480" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="bg_moon" cx="35%" cy="32%" r="66%">
          <Stop offset="0%"   stopColor="#fffdec" />
          <Stop offset="100%" stopColor="#ddb40c" />
        </RadialGradient>

        <LinearGradient id="bg_dungeon" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%"   stopColor="#050008" stopOpacity="0.93" />
          <Stop offset="100%" stopColor="#0d0108" stopOpacity="0.97" />
        </LinearGradient>

        <LinearGradient id="bg_floor" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%"   stopColor="#120602" stopOpacity="0.98" />
          <Stop offset="100%" stopColor="#040100" stopOpacity="1" />
        </LinearGradient>

        <LinearGradient id="bg_colL" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%"   stopColor="#020008" stopOpacity="1" />
          <Stop offset="62%"  stopColor="#020008" stopOpacity="0.44" />
          <Stop offset="100%" stopColor="#020008" stopOpacity="0" />
        </LinearGradient>
        <LinearGradient id="bg_colR" x1="1" y1="0" x2="0" y2="0">
          <Stop offset="0%"   stopColor="#020008" stopOpacity="1" />
          <Stop offset="62%"  stopColor="#020008" stopOpacity="0.44" />
          <Stop offset="100%" stopColor="#020008" stopOpacity="0" />
        </LinearGradient>

        <RadialGradient id="bg_tL" cx="0%" cy="74%" r="100%">
          <Stop offset="0%"   stopColor="#FF7600" stopOpacity="0.7" />
          <Stop offset="38%"  stopColor="#FF3e00" stopOpacity="0.22" />
          <Stop offset="100%" stopColor="#FF2000" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="bg_tR" cx="100%" cy="74%" r="100%">
          <Stop offset="0%"   stopColor="#FF7600" stopOpacity="0.7" />
          <Stop offset="38%"  stopColor="#FF3e00" stopOpacity="0.22" />
          <Stop offset="100%" stopColor="#FF2000" stopOpacity="0" />
        </RadialGradient>
      </Defs>

      {/* ══ Full-screen sky ══ */}
      <Rect x={0} y={0} width={SCREEN_WIDTH} height={SCREEN_HEIGHT} fill="url(#bg_sky)" />

      {/* Stars — sky zone only, deterministic */}
      {STARS.map(s => (
        <Circle key={s.id} cx={s.cx} cy={s.cy} r={s.r} fill="#fff8dc" opacity={s.op} />
      ))}

      {/* Moon halo + body */}
      <Circle cx={SCREEN_WIDTH * 0.78} cy={GAME_HEADER_HEIGHT * 0.45} r={58} fill="url(#bg_moonHalo)" />
      <Circle cx={SCREEN_WIDTH * 0.78} cy={GAME_HEADER_HEIGHT * 0.45} r={28} fill="url(#bg_moon)" />
      {/* Crescent shadow */}
      <Circle
        cx={SCREEN_WIDTH * 0.78 + 12}
        cy={GAME_HEADER_HEIGHT * 0.45 - 9}
        r={23} fill="#07021e" opacity="0.52"
      />

      {/* ══ Dungeon wall — grid zone ══ */}
      <Rect
        x={0} y={GRID_OFFSET_Y}
        width={SCREEN_WIDTH} height={FLOOR_TOP - GRID_OFFSET_Y + 4}
        fill="url(#bg_dungeon)"
      />

      {/* Horizontal mortar lines — very subtle stone joints */}
      {Array.from({ length: NUM_MORTARS }, (_, i) => {
        const y = GRID_OFFSET_Y + (i + 0.5) * MORTAR_STEP;
        return y < FLOOR_TOP ? (
          <Line
            key={i}
            x1={34} y1={y} x2={SCREEN_WIDTH - 34} y2={y}
            stroke="rgba(255,182,82,0.048)" strokeWidth="0.8"
          />
        ) : null;
      })}

      {/* Side column shadow vignettes */}
      <Rect x={0}                   y={GRID_OFFSET_Y} width={54} height={FLOOR_TOP - GRID_OFFSET_Y + 130} fill="url(#bg_colL)" />
      <Rect x={SCREEN_WIDTH - 54}   y={GRID_OFFSET_Y} width={54} height={FLOOR_TOP - GRID_OFFSET_Y + 130} fill="url(#bg_colR)" />

      {/* Column inner-edge accent lines */}
      <Line x1={30} y1={GRID_OFFSET_Y + 2} x2={30} y2={FLOOR_TOP + 22} stroke="rgba(130,64,0,0.28)" strokeWidth="1" />
      <Line x1={SCREEN_WIDTH - 30} y1={GRID_OFFSET_Y + 2} x2={SCREEN_WIDTH - 30} y2={FLOOR_TOP + 22} stroke="rgba(130,64,0,0.28)" strokeWidth="1" />

      {/* ══ Grid top gold trim ══ */}
      <Rect x={0} y={GRID_OFFSET_Y - 2.5} width={SCREEN_WIDTH} height={2.5} fill="#B8860B" opacity="0.72" />
      <Rect x={0} y={GRID_OFFSET_Y - 8}   width={SCREEN_WIDTH} height={6}   fill="#FFD700" opacity="0.12" />

      {/* Wall sconce brackets — decorative top-left + top-right */}
      <Rect x={7}                y={GRID_OFFSET_Y + 8} width={5}  height={18} rx={2} fill="#3a1600" />
      <Rect x={4}                y={GRID_OFFSET_Y + 4} width={11} height={6}  rx={2} fill="#5c2800" />
      <Rect x={SCREEN_WIDTH - 12} y={GRID_OFFSET_Y + 8} width={5}  height={18} rx={2} fill="#3a1600" />
      <Rect x={SCREEN_WIDTH - 15} y={GRID_OFFSET_Y + 4} width={11} height={6}  rx={2} fill="#5c2800" />

      {/* ══ Floor top gold trim ══ */}
      <Rect x={0} y={FLOOR_TOP}     width={SCREEN_WIDTH} height={2.5} fill="#B8860B" opacity="0.65" />
      <Rect x={0} y={FLOOR_TOP + 2} width={SCREEN_WIDTH} height={7}   fill="#FFD700" opacity="0.09" />

      {/* ══ Stone floor ══ */}
      <Rect x={0} y={FLOOR_TOP + 2} width={SCREEN_WIDTH} height={SCREEN_HEIGHT - FLOOR_TOP - 2} fill="url(#bg_floor)" />

      {/* Floor tile grid lines */}
      {[0.25, 0.5, 0.75].map(f => (
        <Line
          key={f}
          x1={SCREEN_WIDTH * f} y1={FLOOR_TOP + 10}
          x2={SCREEN_WIDTH * f} y2={SCREEN_HEIGHT}
          stroke="rgba(190,100,35,0.07)" strokeWidth="1"
        />
      ))}
      <Line x1={0} y1={FLOOR_TOP + 48} x2={SCREEN_WIDTH} y2={FLOOR_TOP + 48} stroke="rgba(190,100,35,0.065)" strokeWidth="1" />
      <Line x1={0} y1={FLOOR_TOP + 96} x2={SCREEN_WIDTH} y2={FLOOR_TOP + 96} stroke="rgba(190,100,35,0.065)" strokeWidth="1" />

      {/* ══ Torch glows ══ */}
      <Ellipse cx={TORCH_LX} cy={TORCH_Y + 20} rx={95} ry={108} fill="url(#bg_tL)" />
      <Ellipse cx={TORCH_RX} cy={TORCH_Y + 20} rx={95} ry={108} fill="url(#bg_tR)" />

      {/* Left torch mount + flame */}
      <Rect x={TORCH_LX - 5} y={TORCH_Y + 12} width={10} height={26} rx={3} fill="#361600" />
      <Rect x={TORCH_LX - 9} y={TORCH_Y + 4}  width={18} height={9}  rx={3} fill="#572a00" />
      <Circle cx={TORCH_LX} cy={TORCH_Y + 3} r={12}  fill="#FF7500" opacity="0.93" />
      <Circle cx={TORCH_LX} cy={TORCH_Y + 3} r={6.5} fill="#FFB800" opacity="0.97" />
      <Circle cx={TORCH_LX} cy={TORCH_Y}     r={3}   fill="#fffff4" opacity="0.88" />

      {/* Right torch mount + flame */}
      <Rect x={TORCH_RX - 5} y={TORCH_Y + 12} width={10} height={26} rx={3} fill="#361600" />
      <Rect x={TORCH_RX - 9} y={TORCH_Y + 4}  width={18} height={9}  rx={3} fill="#572a00" />
      <Circle cx={TORCH_RX} cy={TORCH_Y + 3} r={12}  fill="#FF7500" opacity="0.93" />
      <Circle cx={TORCH_RX} cy={TORCH_Y + 3} r={6.5} fill="#FFB800" opacity="0.97" />
      <Circle cx={TORCH_RX} cy={TORCH_Y}     r={3}   fill="#fffff4" opacity="0.88" />
    </Svg>
  </View>
);
