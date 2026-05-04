import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import Svg, { Circle, RadialGradient, Defs, Stop, Ellipse } from 'react-native-svg';
import { BubbleColor } from '../../types';
import { BUBBLE_RADIUS, COLOR_GRADIENTS, FACE_COLORS } from '../../constants/gameConfig';

interface BubbleViewProps {
  color: BubbleColor;
  x: number;
  y: number;
  size?: number;
  isPopping?: boolean;
  isFalling?: boolean;
}

// Every colour has its own face — shown on both grid and projectile bubbles
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

export const BubbleView: React.FC<BubbleViewProps> = ({
  color,
  x,
  y,
  size = BUBBLE_RADIUS,
  isPopping = false,
  isFalling = false,
}) => {
  const scaleAnim     = useRef(new Animated.Value(1)).current;
  const opacityAnim   = useRef(new Animated.Value(1)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;

  // Pop: expand → vanish
  useEffect(() => {
    if (isPopping) {
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scaleAnim,  { toValue: 1.45, duration: 110, useNativeDriver: true }),
          Animated.timing(scaleAnim,  { toValue: 0,    duration: 140, useNativeDriver: true }),
        ]),
        Animated.timing(opacityAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [isPopping]);

  // Fall: drop down + fade
  useEffect(() => {
    if (isFalling) {
      Animated.parallel([
        Animated.timing(translateYAnim, { toValue: 450, duration: 600, useNativeDriver: true }),
        Animated.timing(opacityAnim,    { toValue: 0,   duration: 600, useNativeDriver: true }),
      ]).start();
    }
  }, [isFalling]);

  const gradId = `grad-${color}`;
  const [g1, g2] = COLOR_GRADIENTS[color];
  const face = COLOR_FACE[color];
  const fontSize = size * 0.74;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          left: x - size,
          top:  y - size,
          width:  size * 2,
          height: size * 2,
          transform: [{ scale: scaleAnim }, { translateY: translateYAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
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
        <Circle cx={size} cy={size} r={size - 2} fill={`url(#${gradId})`} />
        {/* Shine */}
        <Circle cx={size * 0.62} cy={size * 0.52} r={size * 0.21} fill="rgba(255,255,255,0.55)" />
        {/* Outline */}
        <Circle
          cx={size} cy={size} r={size - 2}
          fill="none" stroke={FACE_COLORS[color]}
          strokeWidth="1.5" strokeOpacity="0.35"
        />
      </Svg>

      {/* Emoji face — always visible */}
      <Text
        style={[styles.face, { fontSize, top: size - fontSize * 0.62, width: size * 2 }]}
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
    position: 'absolute',
    textAlign: 'center',
  },
});
