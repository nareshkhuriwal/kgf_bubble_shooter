import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Rect, Circle, Line, Defs, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg';
import { PlayerProgress } from '../types';
import { MAX_STARS_TOTAL, SCREEN_WIDTH, SCREEN_HEIGHT } from '../constants/gameConfig';
import { WORLDS } from '../data/levels';

interface LevelSelectScreenProps {
  progress: PlayerProgress;
  onSelectLevel: (level: number) => void;
  onBack: () => void;
}

// ─── Static star background ───────────────────────────────────────────────────
const StarField: React.FC = () => {
  const stars = Array.from({ length: 48 }, (_, i) => ({
    x: ((i * 139.5) % (SCREEN_WIDTH - 8)) + 4,
    y: ((i * 83.7 + i * i * 0.31) % (SCREEN_HEIGHT * 0.55)) + 4,
    r: i % 7 === 0 ? 1.8 : i % 3 === 0 ? 1.2 : 0.75,
    op: 0.3 + (i % 5) * 0.14,
  }));
  return (
    <Svg style={StyleSheet.absoluteFill} width={SCREEN_WIDTH} height={SCREEN_HEIGHT}>
      {stars.map((s, i) => (
        <Circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity={s.op} />
      ))}
    </Svg>
  );
};

// ─── Castle silhouette bottom bar ─────────────────────────────────────────────
const CastleSilhouette: React.FC = () => {
  const W = SCREEN_WIDTH;
  const H = 60;
  const bh = 18; // battlement height
  const bw = 14;
  const gap = 10;
  const base = H - 10;
  const battlements: { x: number }[] = [];
  for (let x = 0; x < W; x += bw + gap) battlements.push({ x });

  return (
    <Svg width={W} height={H} style={{ position: 'absolute', bottom: 0, left: 0 }}>
      <Defs>
        <SvgLinearGradient id="castleGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#1a0530" stopOpacity="0.9" />
          <Stop offset="1" stopColor="#0d0320" stopOpacity="1" />
        </SvgLinearGradient>
      </Defs>
      <Rect x={0} y={base - bh} width={W} height={bh + 10} fill="url(#castleGrad)" />
      {battlements.map((b, i) => (
        <Rect key={i} x={b.x} y={base - bh - 10} width={bw} height={12} fill="#1a0530" />
      ))}
      {/* gold trim line */}
      <Line x1={0} y1={base - bh - 1} x2={W} y2={base - bh - 1} stroke="#B8860B" strokeWidth={1} opacity={0.5} />
    </Svg>
  );
};

// ─── Floating relic particles ─────────────────────────────────────────────────
const RELIC_ITEMS = ['👑', '⚜️', '💎', '🗡️', '🛡️'];

const FloatingRelic: React.FC<{ item: string; startX: number; delay: number }> = ({ item, startX, delay }) => {
  const y        = useRef(new Animated.Value(SCREEN_HEIGHT * 0.7)).current;
  const opacity  = useRef(new Animated.Value(0)).current;
  const rotate   = useRef(new Animated.Value(0)).current;
  const scale    = useRef(new Animated.Value(0.6 + Math.random() * 0.6)).current;

  useEffect(() => {
    const loop = () => {
      y.setValue(SCREEN_HEIGHT * 0.7);
      opacity.setValue(0);
      rotate.setValue(0);
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(y, { toValue: SCREEN_HEIGHT * 0.05, duration: 5000 + Math.random() * 3000, easing: Easing.linear, useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(opacity, { toValue: 0.65, duration: 600, useNativeDriver: true }),
            Animated.delay(3200),
            Animated.timing(opacity, { toValue: 0, duration: 800, useNativeDriver: true }),
          ]),
          Animated.timing(rotate, { toValue: 1, duration: 5000, easing: Easing.linear, useNativeDriver: true }),
        ]),
      ]).start(loop);
    };
    loop();
  }, []);

  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['-20deg', '20deg'] });

  return (
    <Animated.Text
      style={{
        position: 'absolute',
        left: startX,
        fontSize: 14,
        transform: [{ translateY: y }, { rotate: spin }, { scale }],
        opacity,
      }}
    >
      {item}
    </Animated.Text>
  );
};

const RelicRain: React.FC = () => {
  const relics = Array.from({ length: 8 }, (_, i) => ({
    item: RELIC_ITEMS[i % RELIC_ITEMS.length],
    x:    16 + ((i * 51) % (SCREEN_WIDTH - 40)),
    delay: i * 550,
  }));
  return (
    <>
      {relics.map((r, i) => (
        <FloatingRelic key={i} item={r.item} startX={r.x} delay={r.delay} />
      ))}
    </>
  );
};

// ─── Animated crown (replaces star) ──────────────────────────────────────────
const Crown: React.FC<{ lit: boolean; delay: number; size?: number }> = ({ lit, delay, size = 16 }) => {
  const scale   = useRef(new Animated.Value(lit ? 0 : 1)).current;
  const opacity = useRef(new Animated.Value(lit ? 0 : 0.22)).current;

  useEffect(() => {
    if (lit) {
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.spring(scale,   { toValue: 1.35, tension: 200, friction: 6, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]),
        Animated.spring(scale, { toValue: 1, tension: 150, friction: 8, useNativeDriver: true }),
      ]).start();
    }
  }, [lit]);

  return (
    <Animated.Text style={{ fontSize: size, transform: [{ scale }], opacity }}>
      {lit ? '👑' : '♛'}
    </Animated.Text>
  );
};

// ─── Perfect (3-star) shine badge ────────────────────────────────────────────
const PerfectShine: React.FC = () => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const op = anim.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.38] });
  return (
    <Animated.View
      style={[StyleSheet.absoluteFillObject, { borderRadius: 18, backgroundColor: '#FFD700', opacity: op }]}
      pointerEvents="none"
    />
  );
};

// ─── Level card gradients — medieval palette ──────────────────────────────────
const CARD_GRADIENTS: Array<[string, string, string]> = [
  ['#3a6e1e', '#2d5a1a', '#1a3a0a'],
  ['#7a3a0d', '#5a2d0a', '#3a1a00'],
  ['#a02820', '#7B0000', '#4d0000'],
  ['#9a7000', '#7a5800', '#4d3800'],
  ['#5c2a72', '#3d1a55', '#1e0a2a'],
  ['#165a7a', '#0d3d5c', '#062030'],
  ['#0e6a55', '#0a4a3d', '#062e26'],
  ['#7a3f0d', '#5a2d00', '#381a00'],
  ['#3a1a4a', '#260d35', '#120620'],
  ['#6b0000', '#4a0000', '#2a0000'],
];

const LEVEL_EMOJIS = ['⚔️', '🛡️', '🏰', '🐉', '💎', '🏹', '🔮', '⚜️', '🗡️', '👑'];
const WORLD_ICONS  = ['🌿', '🏰', '🗡️', '🐉'];

// ─── Level card ───────────────────────────────────────────────────────────────
const LevelCard: React.FC<{
  level: number;
  stars: number;
  unlocked: boolean;
  onPress: () => void;
  index: number;
}> = ({ level, stars, unlocked, onPress, index }) => {
  const slideAnim   = useRef(new Animated.Value(60)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pressAnim   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(index * 45),
      Animated.parallel([
        Animated.spring(slideAnim,   { toValue: 0, tension: 90, friction: 10, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const onPressIn  = () => Animated.spring(pressAnim, { toValue: 0.95, tension: 200, friction: 8, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(pressAnim, { toValue: 1, tension: 200, friction: 8, useNativeDriver: true }).start();

  const [g1, g2, g3] = CARD_GRADIENTS[(level - 1) % CARD_GRADIENTS.length];
  const emoji        = LEVEL_EMOJIS[(level - 1) % LEVEL_EMOJIS.length];
  const isPerfect    = stars === 3;

  let hintText = '';
  if (unlocked) {
    if (stars === 0) hintText = 'ENTER BATTLE';
    else if (stars === 1) hintText = 'CONQUERED';
    else if (stars === 2) hintText = 'GLORIOUS!';
    else hintText = '✦ LEGENDARY ✦';
  }

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        { transform: [{ translateY: slideAnim }, { scale: pressAnim }], opacity: opacityAnim },
      ]}
    >
      <TouchableOpacity
        onPress={unlocked ? onPress : undefined}
        onPressIn={unlocked ? onPressIn : undefined}
        onPressOut={unlocked ? onPressOut : undefined}
        activeOpacity={1}
        style={styles.cardTouch}
      >
        <LinearGradient
          colors={unlocked ? [g1, g2, g3] : ['#1a0d1a', '#100810', '#0a0514']}
          style={styles.card}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Perfect glow shimmer */}
          {isPerfect && <PerfectShine />}

          {/* Gold border for unlocked cards */}
          {unlocked && (
            <View
              style={[
                styles.goldBorder,
                isPerfect && styles.goldBorderPerfect,
              ]}
            />
          )}

          {/* Inner top-left highlight */}
          {unlocked && <View style={styles.cardHighlight} />}

          {/* Chain lock overlay */}
          {!unlocked && (
            <View style={styles.lockOverlay}>
              <Text style={styles.lockIcon}>⛓️</Text>
              <Text style={styles.lockLabel}>LOCKED</Text>
            </View>
          )}

          <View style={styles.cardTop}>
            <Text style={[styles.levelEmoji, !unlocked && { opacity: 0.25 }]}>
              {unlocked ? emoji : '❓'}
            </Text>
            <Text style={[styles.levelNum, !unlocked && styles.levelNumLocked]}>
              {level}
            </Text>
          </View>

          <View style={styles.starsRow}>
            {[0, 1, 2].map(i => (
              <Crown
                key={i}
                lit={unlocked && i < stars}
                delay={index * 45 + i * 80}
                size={14}
              />
            ))}
          </View>

          {unlocked && (
            <Text
              style={[
                styles.cardHint,
                stars > 0 && styles.cardHintDone,
                isPerfect && styles.cardHintPerfect,
              ]}
            >
              {hintText}
            </Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Royal Glory banner ───────────────────────────────────────────────────────
const RoyalGloryBanner: React.FC<{ total: number; max: number }> = ({ total, max }) => {
  const scaleAnim   = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const fillAnim    = useRef(new Animated.Value(0)).current;

  const pct         = max > 0 ? total / max : 0;
  const maxFillW    = SCREEN_WIDTH - 64;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim,   { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
    Animated.timing(fillAnim, {
      toValue: maxFillW * pct,
      duration: 900,
      delay: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, []);

  const label =
    total === max
      ? '🐉  All Kingdoms Conquered! Long Live the King!'
      : `⚔️  ${max - total} crowns left to claim`;

  return (
    <Animated.View style={[styles.banner, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
      <LinearGradient
        colors={['#3d0a00', '#6b1800', '#3d0a00']}
        style={styles.bannerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        {/* top edge glow */}
        <View style={styles.bannerTopEdge} />

        <View style={styles.bannerTop}>
          <Text style={styles.bannerCrown}>👑</Text>
          <View style={styles.bannerCenter}>
            <Text style={styles.bannerLabel}>ROYAL GLORY</Text>
            <View style={styles.bannerCountRow}>
              <Text style={styles.bannerCountBig}>{total}</Text>
              <Text style={styles.bannerCountSep}> / </Text>
              <Text style={styles.bannerCountMax}>{max}</Text>
            </View>
          </View>
          <Text style={styles.bannerCrown}>👑</Text>
        </View>

        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: fillAnim }]} />
          {pct > 0.05 && (
            <Animated.View style={[styles.progressGlow, { width: fillAnim }]} />
          )}
        </View>

        <Text style={styles.bannerSub}>{label}</Text>
      </LinearGradient>
    </Animated.View>
  );
};

// ─── World section header ─────────────────────────────────────────────────────
const WorldHeader: React.FC<{
  world: (typeof WORLDS)[number];
  icon: string;
  stars: number;
  maxStars: number;
}> = ({ world, icon, stars, maxStars }) => {
  const slideAnim = useRef(new Animated.Value(-30)).current;
  const opAnim    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, tension: 70, friction: 10, useNativeDriver: true }),
      Animated.timing(opAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ translateX: slideAnim }], opacity: opAnim }}>
      <LinearGradient
        colors={world.colors}
        style={styles.worldHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.worldHeaderLeft}>
          <View style={styles.worldIconWrap}>
            <Text style={styles.worldIcon}>{icon}</Text>
          </View>
          <View>
            <Text style={styles.worldTitle}>{world.name}</Text>
            <Text style={styles.worldLabel}>
              {world.label}  ·  Battles {world.levelRange[0]}–{world.levelRange[1]}
            </Text>
          </View>
        </View>
        <View style={styles.worldStarsWrap}>
          <Text style={styles.worldStars}>👑 {stars}</Text>
          <Text style={styles.worldStarsMax}>/{maxStars}</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────
export const LevelSelectScreen: React.FC<LevelSelectScreenProps> = ({
  progress,
  onSelectLevel,
  onBack,
}) => {
  const headerAnim = useRef(new Animated.Value(-20)).current;
  const headerOpAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(headerAnim, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
      Animated.timing(headerOpAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={['#050210', '#0e0620', '#1c0a30', '#2d0d10']}
        style={StyleSheet.absoluteFill}
      />

      {/* Stars */}
      <StarField />

      {/* Floating relics */}
      <RelicRain />

      {/* Castle silhouette at bottom */}
      <CastleSilhouette />

      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          { transform: [{ translateY: headerAnim }], opacity: headerOpAnim },
        ]}
      >
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.75}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>🗺️  KINGDOM MAP</Text>
          <View style={styles.headerUnderline} />
        </View>

        <View style={{ width: 44 }} />
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <RoyalGloryBanner total={progress.totalStars} max={MAX_STARS_TOTAL} />

        {WORLDS.map((world, wi) => {
          const [from, to]  = world.levelRange;
          const worldStars  = progress.levelStars.slice(from - 1, to).reduce((a, b) => a + b, 0);
          const maxWorldStars = (to - from + 1) * 3;

          return (
            <View key={world.id} style={styles.worldBlock}>
              <WorldHeader
                world={world}
                icon={WORLD_ICONS[wi]}
                stars={worldStars}
                maxStars={maxWorldStars}
              />

              <View style={styles.grid}>
                {Array.from({ length: to - from + 1 }, (_, offset) => {
                  const level    = from + offset;
                  const unlocked = level <= progress.unlockedUpTo;
                  const stars    = progress.levelStars[level - 1] ?? 0;
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

        <View style={{ height: 72 }} />
      </ScrollView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const CARD_SIZE = (SCREEN_WIDTH - 48) / 2 - 6;

const styles = StyleSheet.create({
  container: { flex: 1 },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(180,60,0,0.3)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,215,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  backIcon: { color: '#FFD700', fontSize: 20, fontWeight: '900' },
  headerTitleWrap: { alignItems: 'center' },
  headerTitle: {
    color: '#FFD700',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: 'rgba(255,215,0,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  headerUnderline: {
    marginTop: 3,
    height: 1.5,
    width: 120,
    backgroundColor: 'rgba(255,215,0,0.35)',
    borderRadius: 1,
  },

  scroll: { paddingHorizontal: 16, paddingTop: 10 },

  // ── Royal Glory banner ──
  banner: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(255,215,0,0.45)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 8,
  },
  bannerGradient: { padding: 18, alignItems: 'center' },
  bannerTopEdge: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 2,
    backgroundColor: 'rgba(255,215,0,0.5)',
  },
  bannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  bannerCrown: { fontSize: 28 },
  bannerCenter: { alignItems: 'center', flex: 1 },
  bannerLabel: {
    color: 'rgba(255,215,0,0.7)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 3,
  },
  bannerCountRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 2 },
  bannerCountBig: {
    color: '#FFD700',
    fontSize: 40,
    fontWeight: '900',
    textShadowColor: 'rgba(255,215,0,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  bannerCountSep: { color: 'rgba(255,255,255,0.35)', fontSize: 22, fontWeight: '600' },
  bannerCountMax: { color: 'rgba(255,255,255,0.45)', fontSize: 22, fontWeight: '600' },
  progressTrack: {
    width: SCREEN_WIDTH - 64,
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    position: 'absolute',
    top: 0, left: 0, bottom: 0,
    borderRadius: 5,
    backgroundColor: '#FFD700',
  },
  progressGlow: {
    position: 'absolute',
    top: -3, left: 0, bottom: -3,
    borderRadius: 5,
    backgroundColor: 'rgba(255,215,0,0.3)',
  },
  bannerSub: {
    color: 'rgba(255,220,150,0.65)',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.3,
  },

  // ── World section ──
  worldBlock: { marginBottom: 22 },
  worldHeader: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  worldHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  worldIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  worldIcon:   { fontSize: 22 },
  worldTitle:  {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  worldLabel:  { color: 'rgba(255,220,150,0.7)', fontSize: 11, fontWeight: '700', marginTop: 1, letterSpacing: 0.3 },
  worldStarsWrap: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  worldStars: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '900',
    textShadowColor: 'rgba(255,215,0,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  worldStarsMax: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '700' },

  // ── Level grid ──
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },

  cardWrapper: { width: CARD_SIZE },
  cardTouch: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.55,
    shadowRadius: 9,
    elevation: 7,
  },
  card: {
    height: CARD_SIZE * 0.92,
    borderRadius: 18,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  cardHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  goldBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  goldBorderPerfect: {
    borderColor: 'rgba(255,215,0,0.7)',
    borderWidth: 1.5,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    gap: 4,
  },
  lockIcon:  { fontSize: 24 },
  lockLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: '900', letterSpacing: 1.5 },

  cardTop:    { alignItems: 'center' },
  levelEmoji: { fontSize: 24, marginBottom: 2 },
  levelNum: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  levelNumLocked: { color: 'rgba(255,255,255,0.2)' },
  starsRow: { flexDirection: 'row', gap: 3, alignItems: 'center' },
  cardHint: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  cardHintDone:    { color: '#FFD700' },
  cardHintPerfect: {
    color: '#FFE566',
    textShadowColor: 'rgba(255,215,0,0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
});
