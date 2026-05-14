import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import Svg, { Circle, RadialGradient, Defs, Stop, Ellipse } from 'react-native-svg';
import { BubbleColor, BubbleKind, PowerUpKind } from '../../types';
import { BUBBLE_RADIUS, COLOR_GRADIENTS, FACE_COLORS, POWER_UP_EMOJI } from '../../constants/gameConfig';

interface BubbleViewProps {
  color: BubbleColor;
  kind?: BubbleKind;
  powerUp?: PowerUpKind;
  x: number;
  y: number;
  size?: number;
  isPopping?: boolean;
  isFalling?: boolean;
}

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

export const BubbleView: React.FC<BubbleViewProps> = ({
  color,
  kind = 'normal',
  powerUp,
  x,
  y,
  size = BUBBLE_RADIUS,
  isPopping = false,
  isFalling = false,
}) => {
  // ── Core anims ────────────────────────────────────────────────────────────
  const scaleAnim      = useRef(new Animated.Value(1)).current;
  const opacityAnim    = useRef(new Animated.Value(1)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;

  // ── Dynamic anims ─────────────────────────────────────────────────────────
  const rotateAnim  = useRef(new Animated.Value(0)).current; // fall spin
  const shockAnim   = useRef(new Animated.Value(0)).current; // pop shockwave ring
  const glowAnim    = useRef(new Animated.Value(0)).current; // power-up pulse
  const glowLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  // Pop: expand → vanish + shockwave burst
  useEffect(() => {
    if (!isPopping) return;
    shockAnim.setValue(0);
    Animated.parallel([
      Animated.sequence([
        Animated.timing(scaleAnim,  { toValue: 1.48, duration: 105, useNativeDriver: true }),
        Animated.timing(scaleAnim,  { toValue: 0,    duration: 145, useNativeDriver: true }),
      ]),
      Animated.timing(opacityAnim, { toValue: 0,    duration: 250, useNativeDriver: true }),
      Animated.timing(shockAnim,   { toValue: 1,    duration: 310, useNativeDriver: true }),
    ]).start();
  }, [isPopping]);

  // Fall: drop + fade + spin
  useEffect(() => {
    if (!isFalling) return;
    rotateAnim.setValue(0);
    Animated.parallel([
      Animated.timing(translateYAnim, { toValue: 460, duration: 620, useNativeDriver: true }),
      Animated.timing(opacityAnim,    { toValue: 0,   duration: 620, useNativeDriver: true }),
      Animated.timing(rotateAnim,     { toValue: 1,   duration: 620, useNativeDriver: true }),
    ]).start();
  }, [isFalling]);

  // Power-up glow pulse (loop while loaded/in-flight)
  useEffect(() => {
    if (powerUp && !isPopping && !isFalling) {
      glowLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 660, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0, duration: 660, useNativeDriver: true }),
        ])
      );
      glowLoopRef.current.start();
    } else {
      glowLoopRef.current?.stop();
      glowAnim.setValue(0);
    }
    return () => { glowLoopRef.current?.stop(); };
  }, [!!powerUp, isPopping, isFalling]);

  // ── Interpolations ────────────────────────────────────────────────────────
  const rotate = rotateAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: ['0deg', '300deg'],
  });

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.14, 0.68] });
  const glowScale   = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [1.0,  1.20] });

  const shockScale   = shockAnim.interpolate({ inputRange: [0,    1], outputRange: [0.5,  2.9]  });
  const shockOpacity = shockAnim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.88, 0.4, 0] });

  // ── Derived ───────────────────────────────────────────────────────────────
  const gradId     = `grad-${color}`;
  const [g1, g2]   = COLOR_GRADIENTS[color];
  const [popColor] = COLOR_GRADIENTS[color];

  const face = powerUp
    ? POWER_UP_EMOJI[powerUp]
    : kind === 'stone'  ? '🪨'
    : kind === 'locked' ? '⛓️'
    : kind === 'ice'    ? '❄️'
    : kind === 'steel'  ? '⚙️'
    : COLOR_FACE[color];

  const fontSize   = size * 0.74;
  const isObstacle = kind !== 'normal';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          left:   x - size,
          top:    y - size,
          width:  size * 2,
          height: size * 2,
          opacity: opacityAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: translateYAnim },
            { rotate },
          ],
        },
      ]}
    >
      {/* ── Power-up glow ring (behind bubble) ── */}
      {!!powerUp && (
        <Animated.View
          pointerEvents="none"
          style={{
            position:     'absolute',
            left:         -(size * 0.38),
            top:          -(size * 0.38),
            width:        size * 2.76,
            height:       size * 2.76,
            borderRadius: size * 1.38,
            borderWidth:  2.5,
            borderColor:  '#FFD700',
            opacity:      glowOpacity,
            transform:    [{ scale: glowScale }],
          }}
        />
      )}

      {/* ── Pop shockwave ring ── */}
      {isPopping && (
        <Animated.View
          pointerEvents="none"
          style={{
            position:        'absolute',
            left:            0,
            top:             0,
            width:           size * 2,
            height:          size * 2,
            borderRadius:    size,
            borderWidth:     2.5,
            borderColor:     popColor,
            backgroundColor: 'rgba(255,255,255,0.05)',
            opacity:         shockOpacity,
            transform:       [{ scale: shockScale }],
          }}
        />
      )}

      {/* ── Bubble SVG ── */}
      <Svg width={size * 2} height={size * 2}>
        <Defs>
          <RadialGradient id={gradId} cx="35%" cy="30%" r="70%" fx="35%" fy="30%">
            <Stop offset="0%"   stopColor="#ffffff" stopOpacity="0.9" />
            <Stop offset="40%"  stopColor={g1}      stopOpacity="1" />
            <Stop offset="100%" stopColor={g2}      stopOpacity="1" />
          </RadialGradient>
        </Defs>

        {/* Drop shadow */}
        <Ellipse
          cx={size} cy={size * 1.82}
          rx={size * 0.68} ry={size * 0.18}
          fill="rgba(0,0,0,0.18)"
        />
        {/* Bubble body */}
        <Circle
          cx={size} cy={size} r={size - 2}
          fill={
            kind === 'stone' ? '#5d6470' :
            kind === 'steel' ? '#7a8a9a' :
            `url(#${gradId})`
          }
        />
        {/* Shine */}
        <Circle
          cx={size * 0.62} cy={size * 0.52}
          r={size * 0.21}
          fill="rgba(255,255,255,0.55)"
        />
        {/* Steel accent */}
        {kind === 'steel' && (
          <>
            <Circle cx={size * 0.62} cy={size * 0.38} r={size * 0.12} fill="rgba(255,255,255,0.3)" />
            <Circle cx={size} cy={size} r={size - 2} fill="none" stroke="#4a90c0" strokeWidth="2.5" strokeOpacity="0.6" />
          </>
        )}
        {/* Outline */}
        <Circle
          cx={size} cy={size} r={size - 2}
          fill={kind === 'ice' ? 'rgba(177,232,255,0.22)' : 'none'}
          stroke={
            powerUp      ? '#ffffff' :
            kind === 'steel'  ? '#60a0d0' :
            isObstacle   ? '#D8DEE9' :
            FACE_COLORS[color]
          }
          strokeWidth={powerUp ? '3' : kind === 'steel' ? '2' : '1.5'}
          strokeOpacity={powerUp ? '0.85' : kind === 'steel' ? '0.7' : '0.35'}
        />
      </Svg>

      {/* ── Emoji face ── */}
      <Text
        style={[
          styles.face,
          {
            fontSize: powerUp ? fontSize * 0.92 : fontSize,
            top:      size - fontSize * 0.62,
            width:    size * 2,
          },
        ]}
      >
        {face}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  face: {
    position:  'absolute',
    textAlign: 'center',
  },
});
