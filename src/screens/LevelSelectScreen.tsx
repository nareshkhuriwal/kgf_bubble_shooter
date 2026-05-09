import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PlayerProgress } from '../types';
import { MAX_STARS_TOTAL, SCREEN_WIDTH } from '../constants/gameConfig';
import { WORLDS } from '../data/levels';

interface LevelSelectScreenProps {
  progress: PlayerProgress;
  onSelectLevel: (level: number) => void;
  onBack: () => void;
}

// Animated star component
const Star: React.FC<{ lit: boolean; delay: number; size?: number }> = ({ lit, delay, size = 20 }) => {
  const scale = useRef(new Animated.Value(lit ? 0 : 1)).current;
  const opacity = useRef(new Animated.Value(lit ? 0 : 0.25)).current;

  useEffect(() => {
    if (lit) {
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.spring(scale, { toValue: 1.3, tension: 200, friction: 6, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]),
        Animated.spring(scale, { toValue: 1, tension: 150, friction: 8, useNativeDriver: true }),
      ]).start();
    }
  }, [lit]);

  return (
    <Animated.Text
      style={{
        fontSize: size,
        transform: [{ scale }],
        opacity,
      }}
    >
      {lit ? '⭐' : '☆'}
    </Animated.Text>
  );
};

const LEVEL_GRADIENTS: [string, string][] = [
  ['#FF6B81', '#FF4757'],
  ['#74B9FF', '#2F86EB'],
  ['#55EFC4', '#00B894'],
  ['#FDCB6E', '#E17055'],
  ['#C39BD3', '#9B59B6'],
  ['#FFA07A', '#FF6B35'],
  ['#FFB6C1', '#FF69B4'],
  ['#81ECEC', '#00CEC9'],
  ['#A29BFE', '#6C5CE7'],
  ['#FAB1A0', '#E17055'],
];

const LEVEL_EMOJIS = ['🌱', '🌊', '🌸', '⚡', '🔮', '🔥', '💎', '🌈', '🚀', '👑'];

const LevelCard: React.FC<{
  level: number;
  stars: number;
  unlocked: boolean;
  onPress: () => void;
  index: number;
}> = ({ level, stars, unlocked, onPress, index }) => {
  const slideAnim = useRef(new Animated.Value(60)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(index * 60),
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const [g1, g2] = LEVEL_GRADIENTS[(level - 1) % LEVEL_GRADIENTS.length];
  const emoji = LEVEL_EMOJIS[(level - 1) % LEVEL_EMOJIS.length];

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        { transform: [{ translateY: slideAnim }], opacity: opacityAnim },
      ]}
    >
      <TouchableOpacity
        onPress={unlocked ? onPress : undefined}
        activeOpacity={unlocked ? 0.8 : 1}
        style={styles.cardTouch}
      >
        <LinearGradient
          colors={unlocked ? [g1, g2] : ['#2a2a3e', '#1a1a2e']}
          style={styles.card}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Lock overlay */}
          {!unlocked && (
            <View style={styles.lockOverlay}>
              <Text style={styles.lockIcon}>🔒</Text>
            </View>
          )}

          {/* Level number + emoji */}
          <View style={styles.cardTop}>
            <Text style={styles.levelEmoji}>{unlocked ? emoji : '❓'}</Text>
            <Text style={[styles.levelNum, !unlocked && styles.levelNumLocked]}>
              {level}
            </Text>
          </View>

          {/* Stars row */}
          <View style={styles.starsRow}>
            {[0, 1, 2].map(i => (
              <Star
                key={i}
                lit={unlocked && i < stars}
                delay={index * 60 + i * 80}
                size={16}
              />
            ))}
          </View>

          {/* Score hint */}
          {unlocked && stars === 0 && (
            <Text style={styles.cardHint}>TAP TO PLAY</Text>
          )}
          {unlocked && stars > 0 && (
            <Text style={styles.cardHint}>
              {stars === 3 ? 'PERFECT!' : stars === 2 ? 'GREAT!' : 'COMPLETE'}
            </Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Top banner: big star count display
const StarsBanner: React.FC<{ total: number; max: number }> = ({ total, max }) => {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const pct = max > 0 ? total / max : 0;
  const progressWidth = (SCREEN_WIDTH - 64) * pct;

  return (
    <Animated.View style={[styles.banner, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
      <LinearGradient
        colors={['#2a1a6e', '#533483', '#2a1a6e']}
        style={styles.bannerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.bannerTop}>
          <Text style={styles.bannerStar}>⭐</Text>
          <View style={styles.bannerCenter}>
            <Text style={styles.bannerTitle}>TOTAL STARS</Text>
            <Text style={styles.bannerCount}>
              <Text style={styles.bannerCountBig}>{total}</Text>
              <Text style={styles.bannerCountMax}> / {max}</Text>
            </Text>
          </View>
          <Text style={styles.bannerStar}>⭐</Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <Animated.View
            style={[styles.progressFill, { width: progressWidth }]}
          />
        </View>

        <Text style={styles.bannerSub}>
          {total === max
            ? '🏆 All Stars Collected! You\'re Amazing!'
            : `${max - total} more stars to collect!`}
        </Text>
      </LinearGradient>
    </Animated.View>
  );
};

export const LevelSelectScreen: React.FC<LevelSelectScreenProps> = ({
  progress,
  onSelectLevel,
  onBack,
}) => {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0f0826', '#1a1a4e', '#16213e']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Level</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Stars banner */}
        <StarsBanner total={progress.totalStars} max={MAX_STARS_TOTAL} />

        {WORLDS.map(world => {
          const [from, to] = world.levelRange;
          const worldStars = progress.levelStars.slice(from - 1, to).reduce((a, b) => a + b, 0);
          return (
            <View key={world.id} style={styles.worldBlock}>
              <LinearGradient colors={world.colors} style={styles.worldHeader} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <View>
                  <Text style={styles.worldTitle}>{world.name}</Text>
                  <Text style={styles.worldLabel}>{world.label} • Levels {from}-{to}</Text>
                </View>
                <Text style={styles.worldStars}>⭐ {worldStars}/24</Text>
              </LinearGradient>
              <View style={styles.grid}>
                {Array.from({ length: to - from + 1 }, (_, offset) => {
                  const level = from + offset;
                  const unlocked = level <= progress.unlockedUpTo;
                  const stars = progress.levelStars[level - 1] ?? 0;
                  return (
                    <LevelCard
                      key={level}
                      level={level}
                      stars={stars}
                      unlocked={unlocked}
                      onPress={() => onSelectLevel(level)}
                      index={level - 1}
                    />
                  );
                })}
              </View>
            </View>
          );
        })}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
};

const CARD_SIZE = (SCREEN_WIDTH - 48) / 2 - 6;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  // Stars banner
  banner: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  bannerGradient: {
    padding: 16,
    alignItems: 'center',
  },
  bannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  bannerStar: {
    fontSize: 28,
  },
  bannerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  bannerTitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
  bannerCount: {
    marginTop: 2,
  },
  bannerCountBig: {
    color: '#FFD700',
    fontSize: 36,
    fontWeight: '900',
  },
  bannerCountMax: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 18,
    fontWeight: '600',
  },
  progressTrack: {
    width: SCREEN_WIDTH - 64,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  bannerSub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Level grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  worldBlock: {
    marginBottom: 18,
  },
  worldHeader: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  worldTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  worldLabel: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  worldStars: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: '900',
  },
  cardWrapper: {
    width: CARD_SIZE,
  },
  cardTouch: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  card: {
    height: CARD_SIZE * 0.9,
    borderRadius: 18,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  lockIcon: {
    fontSize: 28,
  },
  cardTop: {
    alignItems: 'center',
  },
  levelEmoji: {
    fontSize: 28,
    marginBottom: 2,
  },
  levelNum: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  levelNumLocked: {
    color: 'rgba(255,255,255,0.3)',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 3,
    alignItems: 'center',
  },
  cardHint: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
