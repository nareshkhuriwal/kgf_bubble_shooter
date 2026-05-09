import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { G, Rect, Circle, Defs, LinearGradient, Stop, Ellipse } from 'react-native-svg';
import {
  CANNON_X,
  CANNON_Y,
  CANNON_LENGTH,
  BUBBLE_RADIUS,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  COLOR_GRADIENTS,
  POWER_UP_EMOJI,
} from '../../constants/gameConfig';
import { BubbleColor, PowerUpKind } from '../../types';

// Same face map as BubbleView
const COLOR_FACE: Record<BubbleColor, string> = {
  red:    '😊',
  blue:   '😄',
  green:  '🥳',
  yellow: '😎',
  purple: '🤩',
  orange: '😋',
  pink:   '🥰',
  cyan:   '😜',
};

interface CannonProps {
  angle: number;
  currentColor: BubbleColor;
  nextColor: BubbleColor;
  currentPowerUp?: PowerUpKind;
  nextPowerUp?: PowerUpKind;
  isAiming?: boolean;
}

export const Cannon: React.FC<CannonProps> = ({ angle, currentColor, nextColor, currentPowerUp, nextPowerUp, isAiming = false }) => {
  const barrelW  = BUBBLE_RADIUS * 0.65;
  const bubbleR  = BUBBLE_RADIUS - 2;
  const nextR    = BUBBLE_RADIUS * 0.55;
  const [cc1, cc2] = COLOR_GRADIENTS[currentColor];
  const [nc1, nc2] = COLOR_GRADIENTS[nextColor];

  // Font sizes for emojis
  const currFontSize = bubbleR * 1.1;
  const nextFontSize = nextR * 1.1;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* ── SVG: barrel + base + bubble shells ── */}
      <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="barrel" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%"   stopColor="#666" />
            <Stop offset="50%"  stopColor="#ddd" />
            <Stop offset="100%" stopColor="#555" />
          </LinearGradient>
          <LinearGradient id="base" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%"   stopColor="#bbb" />
            <Stop offset="100%" stopColor="#333" />
          </LinearGradient>
          <LinearGradient id="curr" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%"   stopColor={cc1} />
            <Stop offset="100%" stopColor={cc2} />
          </LinearGradient>
          <LinearGradient id="nxt" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%"   stopColor={nc1} />
            <Stop offset="100%" stopColor={nc2} />
          </LinearGradient>
        </Defs>

        {/* Rotating barrel */}
        <G origin={`${CANNON_X}, ${CANNON_Y}`} rotation={angle - 90}>
          {isAiming && (
            <Rect
              x={CANNON_X - barrelW * 0.92}
              y={CANNON_Y - CANNON_LENGTH - 5}
              width={barrelW * 1.84}
              height={CANNON_LENGTH + 10}
              rx={barrelW}
              fill="#4ECDC4"
              opacity="0.18"
            />
          )}
          <Rect
            x={CANNON_X - barrelW / 2}
            y={CANNON_Y - CANNON_LENGTH}
            width={barrelW}
            height={CANNON_LENGTH}
            rx={barrelW / 2}
            fill="url(#barrel)"
          />
          <Ellipse
            cx={CANNON_X}
            cy={CANNON_Y - CANNON_LENGTH}
            rx={barrelW / 2}
            ry={barrelW / 4}
            fill="rgba(255,255,255,0.45)"
          />
          {isAiming && (
            <Circle
              cx={CANNON_X}
              cy={CANNON_Y - CANNON_LENGTH - 2}
              r={barrelW * 0.92}
              fill="#FFD700"
              opacity="0.55"
            />
          )}
        </G>

        {/* Base */}
        <Ellipse
          cx={CANNON_X}
          cy={CANNON_Y + 8}
          rx={BUBBLE_RADIUS * 1.6}
          ry={BUBBLE_RADIUS * 0.45}
          fill="url(#base)"
        />

        {/* Current bubble body */}
        {isAiming && (
          <Circle
            cx={CANNON_X}
            cy={CANNON_Y}
            r={bubbleR + 8}
            fill="#FF4757"
            opacity="0.18"
          />
        )}
        <Circle cx={CANNON_X} cy={CANNON_Y} r={bubbleR} fill="url(#curr)" />
        <Circle
          cx={CANNON_X - bubbleR * 0.3}
          cy={CANNON_Y - bubbleR * 0.3}
          r={bubbleR * 0.21}
          fill="rgba(255,255,255,0.58)"
        />
        <Circle
          cx={CANNON_X} cy={CANNON_Y} r={bubbleR}
          fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1"
        />

        {/* Next bubble body */}
        <Circle
          cx={CANNON_X + BUBBLE_RADIUS * 2.4}
          cy={CANNON_Y + 2}
          r={nextR}
          fill="url(#nxt)"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="1.5"
        />
        <Circle
          cx={CANNON_X + BUBBLE_RADIUS * 2.4 - nextR * 0.28}
          cy={CANNON_Y + 2 - nextR * 0.28}
          r={nextR * 0.22}
          fill="rgba(255,255,255,0.55)"
        />
      </Svg>

      {/* ── Emoji overlay on current bubble ── */}
      <Text
        style={[
          styles.face,
          {
            fontSize: currFontSize,
            left:  CANNON_X - currFontSize * 0.6,
            top:   CANNON_Y - currFontSize * 0.6,
            width: currFontSize * 1.2,
          },
        ]}
      >
        {currentPowerUp ? POWER_UP_EMOJI[currentPowerUp] : COLOR_FACE[currentColor]}
      </Text>

      {/* ── Emoji overlay on next bubble ── */}
      <Text
        style={[
          styles.face,
          {
            fontSize: nextFontSize,
            left:  CANNON_X + BUBBLE_RADIUS * 2.4 - nextFontSize * 0.55,
            top:   CANNON_Y + 2 - nextFontSize * 0.55,
            width: nextFontSize * 1.1,
          },
        ]}
      >
        {nextPowerUp ? POWER_UP_EMOJI[nextPowerUp] : COLOR_FACE[nextColor]}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  face: {
    position: 'absolute',
    textAlign: 'center',
    lineHeight: undefined,
  },
});
