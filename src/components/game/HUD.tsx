import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SCREEN_WIDTH } from '../../constants/gameConfig';

interface HUDProps {
  score: number;
  highScore: number;
  level: number;
  shotsLeft: number;
  combo: number;
  onPause?: () => void;
}

const AnimatedScore: React.FC<{ value: number; style?: any }> = ({ value, style }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const prevValue = useRef(value);

  useEffect(() => {
    if (value !== prevValue.current) {
      prevValue.current = value;
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.3,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [value]);

  return (
    <Animated.Text style={[style, { transform: [{ scale: scaleAnim }] }]}>
      {value.toLocaleString()}
    </Animated.Text>
  );
};

const ShotBubble: React.FC<{ index: number; filled: boolean }> = ({ index, filled }) => (
  <View
    style={[
      styles.shotBubble,
      filled ? styles.shotFilled : styles.shotEmpty,
    ]}
  />
);

export const HUD: React.FC<HUDProps> = ({
  score,
  highScore,
  level,
  shotsLeft,
  combo,
  onPause,
}) => {
  const shots = Array.from({ length: Math.min(shotsLeft, 10) }, (_, i) => i);

  return (
    <LinearGradient
      colors={['rgba(0,0,0,0.75)', 'rgba(0,0,0,0)']}
      style={styles.container}
    >
      <View style={styles.row}>
        {/* Level */}
        <View style={styles.levelBadge}>
          <Text style={styles.levelLabel}>LEVEL</Text>
          <Text style={styles.levelValue}>{level}</Text>
        </View>

        {/* Score */}
        <View style={styles.scoreBlock}>
          <AnimatedScore value={score} style={styles.scoreText} />
          <Text style={styles.highScoreText}>BEST {highScore.toLocaleString()}</Text>
        </View>

        {/* Pause */}
        <TouchableOpacity style={styles.pauseBtn} onPress={onPause}>
          <Text style={styles.pauseIcon}>⏸</Text>
        </TouchableOpacity>
      </View>

      {/* Combo */}
      {combo >= 2 && (
        <View style={styles.comboRow}>
          <Text style={styles.comboText}>🔥 x{combo} COMBO!</Text>
        </View>
      )}

      {/* Shots left */}
      <View style={styles.shotsRow}>
        {shots.map(i => (
          <ShotBubble key={i} index={i} filled={true} />
        ))}
        {shotsLeft > 10 && (
          <Text style={styles.moreShotsText}>+{shotsLeft - 10}</Text>
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  levelBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    minWidth: 60,
  },
  levelLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  levelValue: {
    color: '#FFD700',
    fontSize: 24,
    fontWeight: '900',
  },
  scoreBlock: {
    alignItems: 'center',
  },
  scoreText: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  highScoreText: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  pauseBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseIcon: {
    fontSize: 18,
  },
  comboRow: {
    alignItems: 'center',
    marginTop: 4,
  },
  comboText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '900',
    textShadowColor: '#FF6B35',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  shotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 4,
  },
  shotBubble: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  shotFilled: {
    backgroundColor: '#4ECDC4',
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 4,
    shadowOpacity: 0.8,
  },
  shotEmpty: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  moreShotsText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
});
