import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, TouchableOpacity, View } from 'react-native';
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
  nextColor?: BubbleColor;
  nextPowerUp?: PowerUpKind;
  isAiming?: boolean;
  firedAt?: number; // timestamp — changes on each shot to trigger recoil
  onSwap?: () => void;
  swapDisabled?: boolean;
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
  angle, currentColor, currentPowerUp, nextColor, nextPowerUp,
  isAiming = false, firedAt, onSwap, swapDisabled = false,
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
  const nextR    = BUBBLE_RADIUS - 6;
  const [cc1, cc2] = COLOR_GRADIENTS[currentColor];
  const [nc1, nc2] = nextColor ? COLOR_GRADIENTS[nextColor] : ['#555', '#333'];

  const currFontSize = bubbleR * 1.1;
  const nextFontSize = nextR * 1.1;

  // Swap tray geometry: [current] [swap ⇄] [next] evenly spaced, centred on CANNON_X
  const swapBtnSize  = BUBBLE_RADIUS * 1.4;
  const trayPad      = 10;
  const trayItemGap  = 8;
  const trayInnerW   = bubbleR * 2 + trayItemGap + swapBtnSize + trayItemGap + nextR * 2;
  const trayW        = trayInnerW + trayPad * 2;
  const trayH        = Math.max(bubbleR, nextR) * 2 + 20;
  const trayX        = CANNON_X - trayW / 2;
  const trayY        = CANNON_Y + BUBBLE_RADIUS * 1.5 + 10;
  const trayMidY     = trayY + trayH / 2;

  // Element centres inside tray
  const currBX  = trayX + trayPad + bubbleR;           // current bubble (left)
  const swapIconX = currBX + bubbleR + trayItemGap + swapBtnSize / 2;  // swap (middle)
  const nextBX  = swapIconX + swapBtnSize / 2 + trayItemGap + nextR;   // next bubble (right)
  const swapIconY = trayMidY;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
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
          {/* Next bubble */}
          <LinearGradient id="cn_next" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%"   stopColor={nc1} />
            <Stop offset="100%" stopColor={nc2} />
          </LinearGradient>
          {/* Swap tray bg */}
          <LinearGradient id="cn_tray" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%"   stopColor="#1a0800" stopOpacity="0.92" />
            <Stop offset="100%" stopColor="#0a0400" stopOpacity="0.96" />
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

        {/* Carriage wheels removed — cannon now sits cleanly on stone pedestal */}

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

        {/* ══ Loaded bubble on cannon ══ */}
        {isAiming && (
          <Circle
            cx={CANNON_X} cy={CANNON_Y}
            r={bubbleR + 9}
            fill="#FFD700" opacity="0.12"
          />
        )}
        <Circle cx={CANNON_X} cy={CANNON_Y} r={bubbleR} fill="url(#cn_curr)" />
        <Circle
          cx={CANNON_X - bubbleR * 0.3}
          cy={CANNON_Y - bubbleR * 0.3}
          r={bubbleR * 0.22}
          fill="rgba(255,255,255,0.6)"
        />
        <Circle
          cx={CANNON_X} cy={CANNON_Y} r={bubbleR}
          fill="none" stroke="rgba(255,215,0,0.4)" strokeWidth="1.5"
        />

        {/* ══ Swap tray: [current] [⇄] [next] ══ */}
        {/* Tray background */}
        <Rect
          x={trayX} y={trayY}
          width={trayW} height={trayH}
          rx={trayH / 2}
          fill="url(#cn_tray)"
        />
        <Rect
          x={trayX} y={trayY}
          width={trayW} height={trayH}
          rx={trayH / 2}
          fill="none"
          stroke="#B8860B" strokeWidth="1.5" opacity="0.55"
        />

        {/* Current bubble in tray (left slot) */}
        <Circle cx={currBX} cy={trayMidY} r={bubbleR} fill="url(#cn_curr)" />
        <Circle
          cx={currBX - bubbleR * 0.3} cy={trayMidY - bubbleR * 0.3}
          r={bubbleR * 0.22} fill="rgba(255,255,255,0.6)"
        />
        <Circle
          cx={currBX} cy={trayMidY} r={bubbleR}
          fill="none" stroke="rgba(255,215,0,0.4)" strokeWidth="1.5"
        />

        {/* Next bubble in tray (right slot) */}
        {nextColor && (
          <>
            <Circle cx={nextBX} cy={trayMidY} r={nextR} fill="url(#cn_next)" />
            <Circle
              cx={nextBX - nextR * 0.3} cy={trayMidY - nextR * 0.3}
              r={nextR * 0.22} fill="rgba(255,255,255,0.55)"
            />
            <Circle
              cx={nextBX} cy={trayMidY} r={nextR}
              fill="none" stroke="rgba(255,215,0,0.35)" strokeWidth="1.2"
            />
          </>
        )}
      </Svg>

      {/* Loaded bubble emoji (on cannon) */}
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

      {/* Current bubble emoji in tray (left) */}
      <Text
        style={[
          styles.face,
          {
            fontSize: currFontSize,
            left:  currBX - currFontSize * 0.6,
            top:   trayMidY - currFontSize * 0.6,
            width: currFontSize * 1.2,
          },
        ]}
      >
        {currentPowerUp ? POWER_UP_EMOJI[currentPowerUp] : COLOR_FACE[currentColor]}
      </Text>

      {/* Next bubble emoji in tray (right) */}
      {nextColor && (
        <Text
          style={[
            styles.face,
            {
              fontSize: nextFontSize,
              left:  nextBX - nextFontSize * 0.6,
              top:   trayMidY - nextFontSize * 0.6,
              width: nextFontSize * 1.2,
            },
          ]}
        >
          {nextPowerUp ? POWER_UP_EMOJI[nextPowerUp] : COLOR_FACE[nextColor]}
        </Text>
      )}

      {/* NEXT label — above the right bubble, inside tray */}
      {nextColor && (
        <Text style={[styles.nextLabel, { left: nextBX - nextR - 2, top: trayY + 3, width: nextR * 2 + 4 }]}>
          NEXT
        </Text>
      )}
    </Animated.View>

    {/* Swap button (centre of tray) — outside pointerEvents="none" layer so taps register */}
    {nextColor && (
      <TouchableOpacity
        onPress={swapDisabled ? undefined : onSwap}
        activeOpacity={swapDisabled ? 1 : 0.7}
        style={[
          styles.swapBtn,
          swapDisabled && styles.swapBtnDisabled,
          {
            left:         swapIconX - swapBtnSize / 2,
            top:          swapIconY - swapBtnSize / 2,
            width:        swapBtnSize,
            height:       swapBtnSize,
            borderRadius: swapBtnSize / 2,
          },
        ]}
      >
        <Text style={[styles.swapIcon, swapDisabled && styles.swapIconDisabled]}>⇄</Text>
      </TouchableOpacity>
    )}
    </View>
  );
};

const styles = StyleSheet.create({
  face: {
    position: 'absolute',
    textAlign: 'center',
  },
  nextLabel: {
    position: 'absolute',
    textAlign: 'center',
    color: 'rgba(255,215,0,0.55)',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  swapBtn: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(60,15,5,0.88)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,215,0,0.55)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  swapBtnDisabled: {
    backgroundColor: 'rgba(20,10,5,0.6)',
    borderColor: 'rgba(120,90,0,0.25)',
    shadowOpacity: 0,
  },
  swapIcon: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '900',
  },
  swapIconDisabled: {
    color: 'rgba(120,90,0,0.35)',
  },
});
