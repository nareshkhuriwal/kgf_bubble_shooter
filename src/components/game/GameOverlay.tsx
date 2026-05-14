import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { SCREEN_WIDTH as width } from '../../constants/gameConfig';

type OverlayType = 'gameOver' | 'levelComplete' | 'pause';

interface GameOverlayProps {
  type: OverlayType;
  score: number;
  level: number;
  starsEarned: number;
  highScore: number;
  onRestart: () => void;
  onNextLevel: () => void;
  onHome: () => void;
  onResume?: () => void;
}

// ─── Animated score counter ────────────────────────────────────────────────────
const CountUp: React.FC<{ target: number; duration?: number }> = ({ target, duration = 1100 }) => {
  const [displayed, setDisplayed] = useState(0);
  const animVal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (target === 0) return;
    const listener = animVal.addListener(({ value }) => setDisplayed(Math.floor(value)));
    Animated.timing(animVal, {
      toValue: target,
      duration,
      delay: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    return () => animVal.removeListener(listener);
  }, [target]);

  return (
    <Text style={styles.scoreValue}>{displayed.toLocaleString()}</Text>
  );
};

// ─── Animated crown ────────────────────────────────────────────────────────────
const AnimatedCrown: React.FC<{ lit: boolean; index: number }> = ({ lit, index }) => {
  const scale   = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const glow    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (lit) {
      Animated.sequence([
        Animated.delay(350 + index * 220),
        Animated.parallel([
          Animated.spring(scale,   { toValue: 1.45, tension: 260, friction: 5, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 140, useNativeDriver: true }),
        ]),
        Animated.spring(scale, { toValue: 1, tension: 160, friction: 9, useNativeDriver: true }),
      ]).start(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(glow, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
            Animated.timing(glow, { toValue: 0, duration: 1000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          ])
        ).start();
      });
    } else {
      Animated.parallel([
        Animated.timing(scale,   { toValue: 1, duration: 350 + index * 80, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.22, duration: 280, useNativeDriver: true }),
      ]).start();
    }
  }, [lit, index]);

  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.0, 0.5] });

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      {lit && (
        <Animated.Text
          style={[
            styles.crownChar,
            styles.crownGlowLayer,
            { transform: [{ scale }], opacity: glowOpacity },
          ]}
        >
          👑
        </Animated.Text>
      )}
      <Animated.Text style={[styles.crownChar, lit && styles.crownLit, { transform: [{ scale }], opacity }]}>
        {lit ? '👑' : '♛'}
      </Animated.Text>
    </View>
  );
};

// ─── New best pulsing badge ────────────────────────────────────────────────────
const NewBestBadge: React.FC = () => {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={[styles.newBestBadge, { transform: [{ scale: pulse }] }]}>
      <Text style={styles.newBestText}>🏆  NEW RECORD!</Text>
    </Animated.View>
  );
};

// ─── Kingdom confetti items ────────────────────────────────────────────────────
const CONFETTI = ['⚔️','👑','💎','🏆','⭐','✨','🪙','⚜️','🔮','🏹','🛡️','🐉'];

// ─── Decorative divider ────────────────────────────────────────────────────────
const GoldDivider: React.FC = () => (
  <View style={styles.divider}>
    <View style={styles.dividerLine} />
    <Text style={styles.dividerGem}>⚜️</Text>
    <View style={styles.dividerLine} />
  </View>
);

// ─── Main overlay ──────────────────────────────────────────────────────────────
export const GameOverlay: React.FC<GameOverlayProps> = ({
  type, score, level, starsEarned, highScore,
  onRestart, onNextLevel, onHome, onResume,
}) => {
  const cardScale  = useRef(new Animated.Value(0.72)).current;
  const cardOp     = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(-16)).current;
  const confetti   = useRef(
    Array.from({ length: 12 }, () => ({
      x:  new Animated.Value(0),
      y:  new Animated.Value(0),
      op: new Animated.Value(1),
      r:  new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(cardScale,  { toValue: 1, tension: 65, friction: 8, useNativeDriver: true }),
      Animated.timing(cardOp,     { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.spring(titleSlide, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
    ]).start();

    if (type === 'levelComplete') {
      confetti.forEach((a, i) => {
        const angle = (i / 12) * 2 * Math.PI;
        const dist  = 120 + Math.random() * 30;
        Animated.sequence([
          Animated.delay(200),
          Animated.parallel([
            Animated.timing(a.x, { toValue: Math.cos(angle) * dist, duration: 850, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.timing(a.y, { toValue: Math.sin(angle) * 100 - 60, duration: 850, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.sequence([
              Animated.delay(500),
              Animated.timing(a.op, { toValue: 0, duration: 400, useNativeDriver: true }),
            ]),
            Animated.timing(a.r, { toValue: 360, duration: 850, useNativeDriver: true }),
          ]),
        ]).start();
      });
    }
  }, [type]);

  const isComplete = type === 'levelComplete';
  const isPause    = type === 'pause';
  const isOver     = type === 'gameOver';
  const isNewBest  = !isPause && score > 0 && score >= highScore && highScore > 0;

  const cfg = {
    gameOver: {
      emoji:  '💀',
      title:  'DEFEATED',
      sub:    'The kingdom needs you!',
      grad:   ['#200000', '#400808', '#1a0000'] as [string, string, string],
      border: 'rgba(180,0,0,0.6)',
    },
    levelComplete: {
      emoji:  '⚔️',
      title:  `BATTLE ${level}`,
      sub:    '— VICTORIOUS! —',
      grad:   ['#0e0520', '#3d1a00', '#1c0a30'] as [string, string, string],
      border: 'rgba(255,215,0,0.55)',
    },
    pause: {
      emoji:  '🏕️',
      title:  'ENCAMPED',
      sub:    'Rest your troops...',
      grad:   ['#0e0520', '#1a0a30', '#0e0520'] as [string, string, string],
      border: 'rgba(255,215,0,0.3)',
    },
  }[type];

  return (
    <Animated.View style={[styles.backdrop, { opacity: cardOp }]}>
      {/* dark vignette bg */}
      <LinearGradient
        colors={['rgba(0,0,0,0.88)', 'rgba(8,0,4,0.96)']}
        style={StyleSheet.absoluteFill}
      />

      {/* subtle centre glow */}
      <Svg style={StyleSheet.absoluteFill} width={width} height="100%">
        <Defs>
          <RadialGradient id="vig" cx="50%" cy="50%" rx="50%" ry="40%">
            <Stop offset="0"   stopColor={isComplete ? '#FFD700' : isOver ? '#C00000' : '#3d00a0'} stopOpacity="0.08" />
            <Stop offset="1"   stopColor="#000" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx={width / 2} cy="50%" r={width} fill="url(#vig)" />
      </Svg>

      <Animated.View style={[styles.card, { transform: [{ scale: cardScale }], borderColor: cfg.border }]}>
        <LinearGradient
          colors={cfg.grad}
          style={styles.cardInner}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Top edge gold line */}
          <View style={[styles.topEdge, { backgroundColor: cfg.border }]} />

          {/* Confetti burst (level complete) */}
          {isComplete && confetti.map((a, i) => (
            <Animated.Text
              key={i}
              style={{
                position: 'absolute',
                fontSize: 15,
                top: '38%',
                left: '50%',
                transform: [
                  { translateX: a.x },
                  { translateY: a.y },
                  { rotate: a.r.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] }) },
                ],
                opacity: a.op,
              }}
            >
              {CONFETTI[i]}
            </Animated.Text>
          ))}

          {/* Emoji + Title */}
          <Animated.View
            style={[styles.titleBlock, { transform: [{ translateY: titleSlide }] }]}
          >
            <Text style={styles.emoji}>{cfg.emoji}</Text>
            <Text style={[styles.title, isComplete && styles.titleVictory]}>
              {cfg.title}
            </Text>
            <Text style={[styles.subtitle, isComplete && styles.subtitleVictory, isOver && styles.subtitleDead]}>
              {cfg.sub}
            </Text>
          </Animated.View>

          <GoldDivider />

          {/* Crowns earned (level complete) */}
          {isComplete && (
            <View style={styles.crownsBlock}>
              <Text style={styles.crownsLabel}>CROWNS EARNED</Text>
              <View style={styles.crownsRow}>
                {[0, 1, 2].map(i => (
                  <AnimatedCrown key={i} lit={i < starsEarned} index={i} />
                ))}
              </View>
            </View>
          )}

          {/* Glory (score) block */}
          {!isPause && (
            <View style={styles.scoreBlock}>
              <Text style={styles.scoreLabel}>⚜️  GLORY</Text>
              <CountUp target={score} />
              {isNewBest && <NewBestBadge />}
            </View>
          )}

          {/* Pause info */}
          {isPause && (
            <View style={styles.pauseBlock}>
              <Text style={styles.pauseInfo}>Level  <Text style={styles.pauseVal}>{level}</Text></Text>
              <Text style={styles.pauseInfo}>Score  <Text style={styles.pauseVal}>{score.toLocaleString()}</Text></Text>
            </View>
          )}

          {/* Buttons */}
          <View style={styles.btns}>
            {isPause && (
              <TouchableOpacity style={styles.btnPrimary} onPress={onResume} activeOpacity={0.82}>
                <LinearGradient
                  colors={['#8B4513', '#5a2d0a']}
                  style={styles.btnGrad}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.btnTxt}>▶  Resume March</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {isComplete && (
              <TouchableOpacity style={styles.btnPrimary} onPress={onNextLevel} activeOpacity={0.82}>
                <LinearGradient
                  colors={['#FFE566', '#FFD700', '#C0392B']}
                  style={styles.btnGrad}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.btnTxt}>Next Battle  ⚔️</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {isOver && (
              <TouchableOpacity style={styles.btnPrimary} onPress={onRestart} activeOpacity={0.82}>
                <LinearGradient
                  colors={['#C0392B', '#8B0000', '#5a0000']}
                  style={styles.btnGrad}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.btnTxt}>⚔️  Charge Again!</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.btnSecondary} onPress={onHome} activeOpacity={0.8}>
              <Text style={styles.btnSecTxt}>🏰  Return to Castle</Text>
            </TouchableOpacity>
          </View>

        </LinearGradient>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  card: {
    width: width * 0.86,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1.5,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.55,
    shadowRadius: 30,
    elevation: 22,
  },
  cardInner: {
    padding: 26,
    alignItems: 'center',
    borderRadius: 28,
  },
  topEdge: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 2,
    opacity: 0.8,
  },

  // ── Title block ──
  titleBlock: { alignItems: 'center', marginBottom: 4, marginTop: 4 },
  emoji: { fontSize: 54, marginBottom: 4 },
  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  titleVictory: {
    color: '#FFD700',
    textShadowColor: 'rgba(255,215,0,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  subtitle: {
    color: 'rgba(255,220,180,0.75)',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  subtitleVictory: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(255,215,0,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitleDead: { color: 'rgba(255,100,100,0.65)' },

  // ── Divider ──
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 12,
    gap: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,215,0,0.25)',
  },
  dividerGem: { fontSize: 14, opacity: 0.7 },

  // ── Crowns ──
  crownsBlock: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 18,
    paddingHorizontal: 24,
    paddingVertical: 14,
    width: '100%',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
  },
  crownsLabel: {
    color: 'rgba(255,215,0,0.6)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2.5,
    marginBottom: 10,
  },
  crownsRow: {
    flexDirection: 'row',
    gap: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crownChar: { fontSize: 40, color: 'rgba(255,255,255,0.22)' },
  crownLit: {
    color: '#FFD700',
    textShadowColor: 'rgba(255,215,0,0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  crownGlowLayer: {
    position: 'absolute',
    color: '#FFD700',
  },

  // ── Score ──
  scoreBlock: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    width: '100%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.18)',
  },
  scoreLabel: {
    color: 'rgba(255,215,0,0.65)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.5,
    marginBottom: 2,
  },
  scoreValue: {
    color: '#fff',
    fontSize: 42,
    fontWeight: '900',
    textShadowColor: 'rgba(255,215,0,0.35)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  newBestBadge: {
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(255,215,0,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.5)',
  },
  newBestText: { color: '#FFD700', fontSize: 12, fontWeight: '900', letterSpacing: 1 },

  // ── Pause block ──
  pauseBlock: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.15)',
    gap: 6,
  },
  pauseInfo: { color: 'rgba(255,220,180,0.6)', fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  pauseVal:  { color: '#FFD700', fontWeight: '900' },

  // ── Buttons ──
  btns: { width: '100%', gap: 10 },
  btnPrimary: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },
  btnGrad: { paddingVertical: 15, alignItems: 'center' },
  btnTxt:  { color: '#fff', fontSize: 17, fontWeight: '900', letterSpacing: 0.6 },
  btnSecondary: {
    backgroundColor: 'rgba(180,60,0,0.2)',
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.25)',
  },
  btnSecTxt: { color: 'rgba(255,220,150,0.88)', fontSize: 15, fontWeight: '700' },
});
