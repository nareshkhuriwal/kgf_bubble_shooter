import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import Svg, { G, Rect, Circle, Defs, LinearGradient, Stop, Ellipse, Line } from 'react-native-svg';
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

const COLOR_FACE: Record<BubbleColor, string> = {
  red:    '♦️',
  blue:   '💎',
  green:  '🍀',
  yellow: '⭐',
  purple: '🔮',
  orange: '🔥',
  pink:   '🌸',
  cyan:   '❄️',
};

interface CannonProps {
  angle: number;
  currentColor: BubbleColor;
  currentPowerUp?: PowerUpKind;
  isAiming?: boolean;
  firedAt?: number;
}

// Stone pedestal geometry
const PEDESTAL_W  = BUBBLE_RADIUS * 5.8;
const PEDESTAL_H  = BUBBLE_RADIUS * 0.72;
const PEDESTAL_X  = CANNON_X - PEDESTAL_W / 2;
const PEDESTAL_Y  = CANNON_Y + BUBBLE_RADIUS * 1.52;
const STEP_W      = BUBBLE_RADIUS * 4.2;
const STEP_H      = BUBBLE_RADIUS * 0.44;
const STEP_X      = CANNON_X - STEP_W / 2;
const STEP_Y      = PEDESTAL_Y + PEDESTAL_H;

export const Cannon: React.FC<CannonProps> = ({
  angle, currentColor, currentPowerUp, isAiming = false, firedAt,
}) => {
  const recoilAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!firedAt) return;
    recoilAnim.setValue(0);
    Animated.sequence([
      Animated.timing(recoilAnim, { toValue: 1, duration: 80,  useNativeDriver: true }),
      Animated.spring (recoilAnim, { toValue: 0, friction: 4, tension: 180, useNativeDriver: true }),
    ]).start();
  }, [firedAt]);

  const recoilY = recoilAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 11] });

  const barrelW  = BUBBLE_RADIUS * 0.66;
  const bubbleR  = BUBBLE_RADIUS - 2;
  const [cc1, cc2] = COLOR_GRADIENTS[currentColor];

  const currFontSize = bubbleR * 1.1;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY: recoilY }] }]} pointerEvents="none">
      <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
        <Defs>
          {/* Barrel — dark wood siege cannon */}
          <LinearGradient id="cn_barrel" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%"   stopColor="#1e0a00" />
            <Stop offset="38%"  stopColor="#7a3a0e" />
            <Stop offset="68%"  stopColor="#5c2808" />
            <Stop offset="100%" stopColor="#140600" />
          </LinearGradient>
          {/* Gold barrel rings */}
          <LinearGradient id="cn_ring" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%"   stopColor="#8B6000" />
            <Stop offset="50%"  stopColor="#FFD700" />
            <Stop offset="100%" stopColor="#8B6000" />
          </LinearGradient>
          {/* Current bubble */}
          <LinearGradient id="cn_curr" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%"   stopColor={cc1} />
            <Stop offset="100%" stopColor={cc2} />
          </LinearGradient>
          {/* Stone pedestal */}
          <LinearGradient id="cn_pedestal" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%"   stopColor="#2a1200" />
            <Stop offset="100%" stopColor="#120800" />
          </LinearGradient>
          {/* Carriage wood */}
          <LinearGradient id="cn_carriage" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%"   stopColor="#5a2d0a" />
            <Stop offset="100%" stopColor="#3d1a00" />
          </LinearGradient>
        </Defs>

        {/* ══ Stone pedestal ══ */}
        {/* Base slab */}
        <Rect
          x={PEDESTAL_X} y={PEDESTAL_Y}
          width={PEDESTAL_W} height={PEDESTAL_H}
          rx={4}
          fill="url(#cn_pedestal)"
        />
        {/* Base slab top gold edge */}
        <Rect
          x={PEDESTAL_X} y={PEDESTAL_Y}
          width={PEDESTAL_W} height={2}
          rx={2}
          fill="#B8860B" opacity="0.55"
        />
        {/* Bottom step */}
        <Rect
          x={STEP_X} y={STEP_Y}
          width={STEP_W} height={STEP_H}
          rx={3}
          fill="#0e0600"
        />
        {/* Step top edge */}
        <Rect
          x={STEP_X} y={STEP_Y}
          width={STEP_W} height={1.5}
          rx={1}
          fill="#7a4a00" opacity="0.5"
        />
        {/* Pedestal decorative stone lines */}
        <Line
          x1={PEDESTAL_X + 10} y1={PEDESTAL_Y + PEDESTAL_H * 0.5}
          x2={PEDESTAL_X + PEDESTAL_W - 10} y2={PEDESTAL_Y + PEDESTAL_H * 0.5}
          stroke="rgba(255,180,60,0.1)" strokeWidth="0.8"
        />

        {/* ══ Carriage wheel legs ══ */}
        {(() => {
          const legSpread  = BUBBLE_RADIUS * 1.32;
          const legBottomY = PEDESTAL_Y - 2;
          const legTopY    = CANNON_Y + 6;
          const legW       = Math.max(5, BUBBLE_RADIUS * 0.38);
          const wheelR     = BUBBLE_RADIUS * 0.46;
          const spokeR     = wheelR * 0.7;
          const lx         = CANNON_X - legSpread;
          const rx         = CANNON_X + legSpread;

          return (
            <>
              {/* Carriage body connecting bar */}
              <Rect
                x={lx - legW / 2} y={legTopY - legW / 2}
                width={rx - lx + legW} height={legW}
                rx={legW / 2}
                fill="url(#cn_carriage)"
              />

              {/* Left strut */}
              <Line
                x1={CANNON_X} y1={legTopY}
                x2={lx}       y2={legBottomY}
                stroke="#4a2008" strokeWidth={legW}
                strokeLinecap="round"
              />
              {/* Right strut */}
              <Line
                x1={CANNON_X} y1={legTopY}
                x2={rx}       y2={legBottomY}
                stroke="#4a2008" strokeWidth={legW}
                strokeLinecap="round"
              />
              {/* Axle */}
              <Line
                x1={lx} y1={legBottomY}
                x2={rx} y2={legBottomY}
                stroke="#2e1200" strokeWidth={legW * 0.68}
                strokeLinecap="round"
              />
              {/* Axle gold highlight */}
              <Line
                x1={lx + wheelR} y1={legBottomY}
                x2={rx - wheelR} y2={legBottomY}
                stroke="#B8860B" strokeWidth={1.8}
                strokeLinecap="round" opacity="0.65"
              />

              {/* Left wheel */}
              <Circle cx={lx} cy={legBottomY} r={wheelR} fill="#2e1200" />
              <Circle cx={lx} cy={legBottomY} r={wheelR} fill="none" stroke="#6b2e00" strokeWidth={legW * 0.5} />
              {[0, 45, 90, 135].map(deg => {
                const rad = (deg * Math.PI) / 180;
                return (
                  <Line key={deg}
                    x1={lx + Math.cos(rad) * spokeR} y1={legBottomY + Math.sin(rad) * spokeR}
                    x2={lx - Math.cos(rad) * spokeR} y2={legBottomY - Math.sin(rad) * spokeR}
                    stroke="#4a2008" strokeWidth={1.5}
                  />
                );
              })}
              <Circle cx={lx} cy={legBottomY} r={wheelR * 0.22} fill="#B8860B" />
              <Circle cx={lx} cy={legBottomY} r={wheelR} fill="none" stroke="#B8860B" strokeWidth={1.5} opacity="0.65" />

              {/* Right wheel */}
              <Circle cx={rx} cy={legBottomY} r={wheelR} fill="#2e1200" />
              <Circle cx={rx} cy={legBottomY} r={wheelR} fill="none" stroke="#6b2e00" strokeWidth={legW * 0.5} />
              {[0, 45, 90, 135].map(deg => {
                const rad = (deg * Math.PI) / 180;
                return (
                  <Line key={deg}
                    x1={rx + Math.cos(rad) * spokeR} y1={legBottomY + Math.sin(rad) * spokeR}
                    x2={rx - Math.cos(rad) * spokeR} y2={legBottomY - Math.sin(rad) * spokeR}
                    stroke="#4a2008" strokeWidth={1.5}
                  />
                );
              })}
              <Circle cx={rx} cy={legBottomY} r={wheelR * 0.22} fill="#B8860B" />
              <Circle cx={rx} cy={legBottomY} r={wheelR} fill="none" stroke="#B8860B" strokeWidth={1.5} opacity="0.65" />

              {/* Pivot block at leg junction */}
              <Rect
                x={CANNON_X - legW * 1.1}
                y={legTopY - legW * 0.55}
                width={legW * 2.2} height={legW}
                rx={legW / 2}
                fill="#6b3210"
              />
            </>
          );
        })()}

        {/* ══ Rotating barrel ══ */}
        <G origin={`${CANNON_X}, ${CANNON_Y}`} rotation={angle - 90}>
          {/* Aiming glow behind barrel */}
          {isAiming && (
            <Rect
              x={CANNON_X - barrelW * 0.95}
              y={CANNON_Y - CANNON_LENGTH - 6}
              width={barrelW * 1.9}
              height={CANNON_LENGTH + 12}
              rx={barrelW}
              fill="#FFD700"
              opacity="0.15"
            />
          )}
          {/* Barrel body */}
          <Rect
            x={CANNON_X - barrelW / 2}
            y={CANNON_Y - CANNON_LENGTH}
            width={barrelW}
            height={CANNON_LENGTH}
            rx={barrelW / 2}
            fill="url(#cn_barrel)"
          />
          {/* Gold metal bands */}
          <Rect
            x={CANNON_X - barrelW / 2}
            y={CANNON_Y - CANNON_LENGTH * 0.74}
            width={barrelW} height={4}
            rx={2} fill="url(#cn_ring)"
          />
          <Rect
            x={CANNON_X - barrelW / 2}
            y={CANNON_Y - CANNON_LENGTH * 0.38}
            width={barrelW} height={4}
            rx={2} fill="url(#cn_ring)"
          />
          {/* Muzzle highlight */}
          <Ellipse
            cx={CANNON_X}
            cy={CANNON_Y - CANNON_LENGTH}
            rx={barrelW / 2} ry={barrelW / 4}
            fill="rgba(255,215,0,0.3)"
          />
          {/* Aiming muzzle flash */}
          {isAiming && (
            <Circle
              cx={CANNON_X}
              cy={CANNON_Y - CANNON_LENGTH - 2}
              r={barrelW * 0.95}
              fill="#FFD700"
              opacity="0.55"
            />
          )}
        </G>

        {/* ══ Loaded bubble ══ */}
        {isAiming && (
          <Circle
            cx={CANNON_X} cy={CANNON_Y}
            r={bubbleR + 9}
            fill="#FFD700" opacity="0.12"
          />
        )}
        {/* Bubble body */}
        <Circle cx={CANNON_X} cy={CANNON_Y} r={bubbleR} fill="url(#cn_curr)" />
        {/* Shine highlight */}
        <Circle
          cx={CANNON_X - bubbleR * 0.3}
          cy={CANNON_Y - bubbleR * 0.3}
          r={bubbleR * 0.22}
          fill="rgba(255,255,255,0.6)"
        />
        {/* Gold border */}
        <Circle
          cx={CANNON_X} cy={CANNON_Y} r={bubbleR}
          fill="none" stroke="rgba(255,215,0,0.4)" strokeWidth="1.5"
        />
      </Svg>

      {/* Gem / power-up emoji on loaded bubble */}
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
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  face: {
    position: 'absolute',
    textAlign: 'center',
  },
});
