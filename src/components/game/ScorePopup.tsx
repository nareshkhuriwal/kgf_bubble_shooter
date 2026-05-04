import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';

interface ScorePopupProps {
  score: number;
  x: number;
  y: number;
  onDone: () => void;
}

export const ScorePopup: React.FC<ScorePopupProps> = ({ score, x, y, onDone }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -60,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(400),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start(onDone);
  }, []);

  const color = score >= 500 ? '#FFD700' : score >= 200 ? '#FF6B35' : '#ffffff';

  return (
    <Animated.Text
      style={[
        styles.text,
        {
          left: x - 40,
          top: y - 20,
          color,
          transform: [{ translateY }, { scale }],
          opacity,
        },
      ]}
    >
      +{score}
    </Animated.Text>
  );
};

const styles = StyleSheet.create({
  text: {
    position: 'absolute',
    fontSize: 26,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
    width: 80,
    textAlign: 'center',
    pointerEvents: 'none',
  },
});
