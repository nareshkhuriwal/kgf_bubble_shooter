import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import {
  SCREEN_WIDTH as width,
  SCREEN_HEIGHT as height,
  MAX_STARS_TOTAL,
} from '../constants/gameConfig';
import { PlayerProgress } from '../types';

// ─── Types ───────────────────────────────────────────────────────────────────
interface RainDrop {
  id: number;
  x: number;        // fixed horizontal position (0..1 × width)
  size: number;     // radius px
  color: [string, string];
  emoji: string;
  duration: number; // fall duration ms
  delay: number;    // initial delay ms
}

// Palette + matching emojis
const RAIN_PALETTE: { c: [string, string]; e: string }[] = [
  { c: ['#FF6B81', '#FF4757'], e: '😊' },
  { c: ['#74B9FF', '#2F86EB'], e: '😄' },
  { c: ['#55EFC4', '#2ED573'], e: '🥳' },
  { c: ['#FDCB6E', '#E17055'], e: '😎' },
  { c: ['#C39BD3', '#9B59B6'], e: '🤩' },
  { c: ['#FFA07A', '#FF6B35'], e: '😋' },
  { c: ['#FFB6C1', '#FF69B4'], e: '😊' },
  { c: ['#81ECEC', '#00CEC9'], e: '😄' },
];

function makeRainDrop(id: number): RainDrop {
  const p = RAIN_PALETTE[Math.floor(Math.random() * RAIN_PALETTE.length)];
  return {
    id,
    x: Math.random(),
    size: 16 + Math.random() * 20,       // 16–36 px radius
    color: p.c,
    emoji: p.e,
    duration: 3200 + Math.random() * 3000, // 3.2–6.2 s
    delay: Math.random() * 1200,
  };
}

// ─── Single falling bubble ───────────────────────────────────────────────────
const RainBubble: React.FC<{ drop: RainDrop; onDone: () => void }> = ({ drop, onDone }) => {
  const ty      = useRef(new Animated.Value(-drop.size * 2)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale   = useRef(new Animated.Value(0.4)).current;
  const gradId  = `rg${drop.id}`;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(drop.delay),
      Animated.parallel([
        // fade + scale in
        Animated.timing(opacity, { toValue: 0.88, duration: 350, useNativeDriver: true }),
        Animated.spring(scale,   { toValue: 1, tension: 120, friction: 6, useNativeDriver: true }),
        // fall from top to bottom
        Animated.timing(ty, {
          toValue: height + drop.size * 2,
          duration: drop.duration,
          useNativeDriver: true,
        }),
      ]),
      // fade out near bottom
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(onDone);
  }, []);

  const s = drop.size;
  const fontSize = s * 0.9;

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: drop.x * width - s,
        top: 0,
        width: s * 2,
        height: s * 2,
        transform: [{ translateY: ty }, { scale }],
        opacity,
      }}
    >
      {/* SVG bubble shell */}
      <Svg width={s * 2} height={s * 2}>
        <Defs>
          <RadialGradient id={gradId} cx="35%" cy="30%" r="70%">
            <Stop offset="0%"   stopColor="#ffffff"       stopOpacity="0.9" />
            <Stop offset="40%"  stopColor={drop.color[0]} stopOpacity="1" />
            <Stop offset="100%" stopColor={drop.color[1]} stopOpacity="1" />
          </RadialGradient>
        </Defs>
        <Circle cx={s} cy={s} r={s - 1}     fill={`url(#${gradId})`} />
        <Circle cx={s * 0.62} cy={s * 0.52} r={s * 0.2} fill="rgba(255,255,255,0.55)" />
      </Svg>
      {/* Emoji face centered */}
      <Text
        style={{
          position: 'absolute',
          width: s * 2,
          textAlign: 'center',
          top: s - fontSize * 0.6,
          fontSize,
          lineHeight: fontSize * 1.2,
        }}
      >
        {drop.emoji}
      </Text>
    </Animated.View>
  );
};

// ─── Rain manager: keep ~14 bubbles falling at all times ────────────────────
const BubbleRain: React.FC = () => {
  const counterRef = useRef(0);
  const [drops, setDrops] = useState<RainDrop[]>(() =>
    Array.from({ length: 14 }, () => makeRainDrop(counterRef.current++))
  );

  const removeDrop = (id: number) => {
    setDrops(prev => {
      const next = prev.filter(d => d.id !== id);
      // Spawn a new one to keep the count up
      return [...next, makeRainDrop(counterRef.current++)];
    });
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {drops.map(d => (
        <RainBubble key={d.id} drop={d} onDone={() => removeDrop(d.id)} />
      ))}
    </View>
  );
};

// ─── Top stars badge ─────────────────────────────────────────────────────────
const TopStarsBadge: React.FC<{ total: number; max: number }> = ({ total, max }) => {
  const scale = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(scale, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={[styles.topBadge, { transform: [{ scale }] }]}>
      <LinearGradient
        colors={['rgba(83,52,131,0.92)', 'rgba(26,26,78,0.92)']}
        style={styles.topBadgeGrad}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
      >
        <Text style={styles.topBadgeStar}>⭐</Text>
        <Text style={styles.topBadgeCount}>{total}</Text>
        <Text style={styles.topBadgeMax}> / {max}</Text>
        <Text style={styles.topBadgeLabel}>  STARS</Text>
      </LinearGradient>
    </Animated.View>
  );
};

// ─── Main HomeScreen ──────────────────────────────────────────────────────────
interface HomeScreenProps {
  progress: PlayerProgress;
  onPlay: () => void;
  onSelectLevel: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ progress, onPlay, onSelectLevel }) => {
  const titleScale  = useRef(new Animated.Value(0)).current;
  const titleOp     = useRef(new Animated.Value(0)).current;
  const btnScale    = useRef(new Animated.Value(0)).current;
  const pulse       = useRef(new Animated.Value(1)).current;
  const lvlBtnScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(titleScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.timing(titleOp,    { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(btnScale,    { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
        Animated.spring(lvlBtnScale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
      ]),
    ]).start(() => {
      Animated.loop(Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: 850, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 850, useNativeDriver: true }),
      ])).start();
    });
  }, []);

  return (
    <View style={styles.container}>
      {/* Sky gradient background */}
      <LinearGradient
        colors={['#0f0826', '#1a1a4e', '#0f3460', '#533483']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
      />

      {/* 🫧 Continuous top-to-bottom bubble rain */}
      <BubbleRain />

      {/* Stars badge — above everything */}
      <TopStarsBadge total={progress.totalStars} max={MAX_STARS_TOTAL} />

      {/* Title */}
      <Animated.View
        style={[styles.titleBlock, { transform: [{ scale: titleScale }], opacity: titleOp }]}
      >
        <Text style={styles.emoji}>🫧</Text>
        <Text style={styles.title}>Bubble</Text>
        <Text style={styles.titleAccent}>Shooter</Text>
        <Text style={styles.subtitle}>✨ Pop • Match • Win ✨</Text>
      </Animated.View>

      {/* Best score */}
      {progress.highScore > 0 && (
        <View style={styles.highScoreBlock}>
          <Text style={styles.highScoreLabel}>🏆 BEST SCORE</Text>
          <Text style={styles.highScoreValue}>{progress.highScore.toLocaleString()}</Text>
        </View>
      )}

      {/* PLAY button */}
      <Animated.View style={{ transform: [{ scale: Animated.multiply(btnScale, pulse) }] }}>
        <TouchableOpacity onPress={onPlay} style={styles.playBtn} activeOpacity={0.85}>
          <LinearGradient
            colors={['#FFD700', '#FF6B35', '#FF4757']}
            style={styles.playGrad}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <Text style={styles.playText}>🎯  PLAY!</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Level Select button */}
      <Animated.View style={[styles.lvlBtnWrap, { transform: [{ scale: lvlBtnScale }] }]}>
        <TouchableOpacity onPress={onSelectLevel} activeOpacity={0.85}>
          <LinearGradient
            colors={['rgba(83,52,131,0.88)', 'rgba(47,134,235,0.88)']}
            style={styles.lvlBtn}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            <Text style={styles.lvlBtnText}>🗺  Select Level</Text>
            <View style={styles.lvlBtnStars}>
              <Text style={styles.lvlBtnStarText}>⭐ {progress.totalStars}/{MAX_STARS_TOTAL}</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* How to play */}
      <View style={styles.howTo}>
        <Text style={styles.howToTitle}>How to Play</Text>
        <Text style={styles.howToLine}>👆  Tap to aim & shoot</Text>
        <Text style={styles.howToLine}>💥  3 same-colour bubbles touching = BLAST!</Text>
        <Text style={styles.howToLine}>🔥  Chain combos for bonus points</Text>
        <Text style={styles.howToLine}>⭐  Earn up to 3 stars per level</Text>
      </View>
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  topBadge: {
    position: 'absolute', top: 44, alignSelf: 'center',
    borderRadius: 30, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.4)',
    shadowColor: '#FFD700', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 12, zIndex: 10,
  },
  topBadgeGrad: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 8 },
  topBadgeStar:  { fontSize: 20 },
  topBadgeCount: { color: '#FFD700', fontSize: 22, fontWeight: '900', marginLeft: 6 },
  topBadgeMax:   { color: 'rgba(255,255,255,0.5)', fontSize: 16, fontWeight: '600' },
  topBadgeLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '700', letterSpacing: 1 },

  titleBlock: { alignItems: 'center', marginBottom: 18, zIndex: 5 },
  emoji:       { fontSize: 56, marginBottom: 4 },
  title:       { fontSize: 48, fontWeight: '900', color: '#fff', letterSpacing: 2,
                 textShadowColor: 'rgba(83,52,131,0.9)', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 8 },
  titleAccent: { fontSize: 44, fontWeight: '900', color: '#FFD700', letterSpacing: 4, marginTop: -6,
                 textShadowColor: 'rgba(255,107,53,0.9)', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 10 },
  subtitle:    { fontSize: 15, color: 'rgba(255,255,255,0.78)', marginTop: 8, letterSpacing: 1 },

  highScoreBlock: {
    alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14, paddingHorizontal: 22, paddingVertical: 8, marginBottom: 18,
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.25)', zIndex: 5,
  },
  highScoreLabel: { color: '#FFD700', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  highScoreValue: { color: '#fff', fontSize: 26, fontWeight: '900' },

  playBtn: {
    borderRadius: 36, shadowColor: '#FFD700', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.65, shadowRadius: 20, elevation: 10, marginBottom: 14, zIndex: 5,
  },
  playGrad: { paddingHorizontal: 56, paddingVertical: 16, borderRadius: 36, alignItems: 'center' },
  playText: {
    color: '#fff', fontSize: 26, fontWeight: '900', letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 4,
  },

  lvlBtnWrap: { marginBottom: 22, zIndex: 5 },
  lvlBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingVertical: 13,
    borderRadius: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', minWidth: 220,
  },
  lvlBtnText:     { color: '#fff', fontSize: 17, fontWeight: '800' },
  lvlBtnStars:    { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  lvlBtnStarText: { color: '#FFD700', fontSize: 12, fontWeight: '700' },

  howTo: {
    backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 18, padding: 16,
    alignItems: 'flex-start', width: width * 0.82,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', zIndex: 5,
  },
  howToTitle: { color: '#FFD700', fontSize: 14, fontWeight: '800', marginBottom: 8, alignSelf: 'center', letterSpacing: 1 },
  howToLine:  { color: 'rgba(255,255,255,0.82)', fontSize: 13, marginBottom: 5, lineHeight: 19 },
});
