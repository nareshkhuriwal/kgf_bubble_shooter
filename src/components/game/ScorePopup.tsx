import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';

interface ScorePopupProps {
  score: number;
  x: number;
  y: number;
  combo?: number;
  onDone: () => void;
}

export const ScorePopup: React.FC<ScorePopupProps> = ({ score, x, y, combo = 1, onDone }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity    = useRef(new Animated.Value(1)).current;
  const scale      = useRef(new Animated.Value(0.4)).current;

  const isCombo  = combo >= 2;
  const isEpic   = combo >= 4 || score >= 800;
  const isBig    = score >= 300 || combo >= 3;

  useEffect(() => {
    const wobble = isCombo
      ? Animated.sequence([
          Animated.timing(translateX, { toValue: -6,  duration: 60,  useNativeDriver: true }),
          Animated.timing(translateX, { toValue:  8,  duration: 60,  useNativeDriver: true }),
          Animated.timing(translateX, { toValue: -5,  duration: 60,  useNativeDriver: true }),
          Animated.timing(translateX, { toValue:  4,  duration: 60,  useNativeDriver: true }),
          Animated.timing(translateX, { toValue:  0,  duration: 60,  useNativeDriver: true }),
        ])
      : Animated.timing(translateX, { toValue: 0, duration: 1, useNativeDriver: true });

    const popScale = Animated.sequence([
      Animated.timing(scale, { toValue: isEpic ? 1.5 : isBig ? 1.3 : 1.15, duration: isEpic ? 220 : 160, useNativeDriver: true }),
      Animated.timing(scale, { toValue: isEpic ? 1.2 : 1.0,                duration: 120,                useNativeDriver: true }),
    ]);

    Animated.parallel([
      Animated.timing(translateY, { toValue: isEpic ? -88 : isBig ? -72 : -58, duration: isEpic ? 900 : 820, useNativeDriver: true }),
      wobble,
      popScale,
      Animated.sequence([
        Animated.delay(isEpic ? 520 : 440),
        Animated.timing(opacity, { toValue: 0, duration: 380, useNativeDriver: true }),
      ]),
    ]).start(onDone);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const color = isEpic  ? '#FFD700'
              : isBig   ? '#FF9500'
              : combo >= 2 ? '#FF6B35'
              : '#fff8dc';

  const shadowColor = isEpic  ? 'rgba(255,215,0,0.85)'
                    : isBig   ? 'rgba(255,120,0,0.75)'
                    : 'rgba(0,0,0,0.75)';

  const prefix = isEpic   ? '🐉 +'
               : combo >= 3 ? '⚔️ +'
               : combo >= 2 ? '⚜️ +'
               : '+';

  const fontSize = isEpic ? 34 : isBig ? 29 : 24;
  const width    = isEpic ? 110 : isBig ? 95 : 80;

  return (
    <Animated.Text
      style={[
        styles.text,
        {
          left:            x - width / 2,
          top:             y - 24,
          color,
          fontSize,
          width,
          textShadowColor: shadowColor,
          opacity,
          transform:       [{ translateY }, { translateX }, { scale }],
        },
      ]}
    >
      {prefix}{score}
    </Animated.Text>
  );
};

const styles = StyleSheet.create({
  text: {
    position:          'absolute',
    fontWeight:        '900',
    textShadowOffset:  { width: 1, height: 2 },
    textShadowRadius:  5,
    textAlign:         'center',
  },
});
