import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLOR_GRADIENTS, GAME_HEADER_HEIGHT, POWER_UP_EMOJI } from '../../constants/gameConfig';
import { PlayBubble } from '../../types';

interface HUDProps {
  score: number;
  highScore: number;
  level: number;
  shotsLeft: number;
  combo: number;
  nextBubble: PlayBubble;
  progress: number;
  coinsEarned: number;
  onPause?: () => void;
  onBack?: () => void;
}

const AnimatedScore: React.FC<{ value: number }> = ({ value }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const previous = useRef(value);

  useEffect(() => {
    if (previous.current !== value) {
      previous.current = value;
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.12, duration: 90, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, tension: 180, friction: 8, useNativeDriver: true }),
      ]).start();
    }
  }, [scale, value]);

  return (
    <Animated.Text style={[styles.scoreText, { transform: [{ scale }] }]}>
      {value.toLocaleString()}
    </Animated.Text>
  );
};

export const HUD: React.FC<HUDProps> = ({
  score,
  highScore,
  level,
  shotsLeft,
  combo,
  nextBubble,
  progress,
  coinsEarned,
  onPause,
  onBack,
}) => {
  const [g1, g2] = COLOR_GRADIENTS[nextBubble.color];
  const completion = Math.max(0, Math.min(1, progress));
  const comboLabel = combo >= 5 ? 'MEGA' : combo >= 3 ? 'SUPER' : combo >= 2 ? `COMBO x${combo}` : 'READY';

  return (
    <View style={styles.shell} pointerEvents="box-none">
      <LinearGradient
        colors={['rgba(8,10,31,0.98)', 'rgba(15,20,58,0.94)', 'rgba(15,15,46,0.72)']}
        style={styles.header}
      >
        <View style={styles.topRow}>
          <TouchableOpacity onPress={onBack} activeOpacity={0.82} style={styles.iconButton}>
            <Text style={styles.iconText}>‹</Text>
          </TouchableOpacity>

          <View style={styles.scoreWrap}>
            <AnimatedScore value={score} />
            <View style={styles.bestPill}>
              <Text style={styles.bestText}>BEST {highScore.toLocaleString()}</Text>
            </View>
          </View>

          <TouchableOpacity onPress={onPause} activeOpacity={0.82} style={[styles.iconButton, styles.pauseButton]}>
            <Text style={styles.pauseText}>Ⅱ</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.levelCard}>
            <Text style={styles.statLabel}>LEVEL</Text>
            <Text style={styles.levelText}>{level}</Text>
          </View>

          <View style={styles.centerPanel}>
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>SHOTS {shotsLeft}</Text>
              <Text style={[styles.metaText, combo >= 2 && styles.comboActive]}>{comboLabel}</Text>
              {coinsEarned > 0 && <Text style={styles.coinText}>COINS {coinsEarned}</Text>}
            </View>
            <View style={styles.progressTrack}>
              <LinearGradient
                colors={['#4ECDC4', '#8BE9FD', '#FFD700']}
                style={[styles.progressFill, { width: `${completion * 100}%` }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
          </View>

          <View style={styles.nextCard}>
            <LinearGradient colors={[g1, g2]} style={styles.nextBubble}>
              <Text style={styles.nextText}>{nextBubble.powerUp ? POWER_UP_EMOJI[nextBubble.powerUp] : '●'}</Text>
            </LinearGradient>
            <Text style={styles.nextLabel}>NEXT</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  shell: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: GAME_HEADER_HEIGHT,
    zIndex: 20,
  },
  header: {
    flex: 1,
    paddingTop: 34,
    paddingHorizontal: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderColor: 'rgba(78,205,196,0.26)',
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
  },
  topRow: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  iconText: {
    color: '#fff',
    fontSize: 34,
    lineHeight: 36,
    fontWeight: '700',
    marginTop: -2,
  },
  pauseButton: {
    backgroundColor: 'rgba(255,107,53,0.95)',
    borderColor: 'rgba(255,215,0,0.42)',
  },
  pauseText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
  },
  scoreWrap: {
    alignItems: 'center',
    flex: 1,
  },
  scoreText: {
    color: '#fff',
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '900',
    textShadowColor: 'rgba(78,205,196,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  bestPill: {
    marginTop: -1,
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(255,215,0,0.14)',
  },
  bestText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  levelCard: {
    minWidth: 62,
    borderRadius: 16,
    paddingVertical: 7,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  levelText: {
    color: '#FFD700',
    fontSize: 24,
    lineHeight: 27,
    fontWeight: '900',
  },
  centerPanel: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 6,
  },
  metaText: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 10,
    fontWeight: '900',
  },
  comboActive: {
    color: '#FFD700',
  },
  coinText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '900',
  },
  progressTrack: {
    height: 9,
    borderRadius: 9,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  progressFill: {
    height: '100%',
    borderRadius: 9,
  },
  nextCard: {
    width: 50,
    alignItems: 'center',
  },
  nextBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  nextText: {
    color: '#fff',
    fontSize: 17,
    lineHeight: 19,
    fontWeight: '900',
  },
  nextLabel: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 9,
    fontWeight: '900',
    marginTop: 2,
    letterSpacing: 0.9,
  },
});
