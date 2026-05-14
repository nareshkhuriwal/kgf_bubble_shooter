import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Easing, ScrollView, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Circle, Defs, RadialGradient, LinearGradient as SvgLinear,
  Stop, Rect, Path, Line,
} from 'react-native-svg';
import {
  SCREEN_WIDTH as W,
  SCREEN_HEIGHT as H,
  MAX_STARS_TOTAL,
} from '../constants/gameConfig';
import { PlayerProgress } from '../types';

// ─── Palette ──────────────────────────────────────────────────────────────────
const GOLD  = '#FFD700';
const GOLD2 = '#B8860B';

// ──────────────────────────────────────────────────────────────────────────────
//  BACKGROUND LAYERS
// ──────────────────────────────────────────────────────────────────────────────

/** Static deterministic star field */
const StarField: React.FC = () => {
  const stars = Array.from({ length: 60 }, (_, i) => ({
    x:  ((i * 137.5 + i * i * 0.4) % (W - 6)) + 3,
    y:  ((i * 89.3  + i * i * 0.2) % (H * 0.72)) + 3,
    r:  i % 9 === 0 ? 2.2 : i % 4 === 0 ? 1.5 : 0.9,
    op: 0.25 + (i % 7) * 0.11,
  }));
  return (
    <Svg style={StyleSheet.absoluteFill} width={W} height={H} pointerEvents="none">
      {stars.map((s, i) => (
        <Circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity={s.op} />
      ))}
    </Svg>
  );
};

/** Tall side towers that frame the screen */
const SideTowers: React.FC = () => {
  const TW  = 66;   // tower width
  const TH  = H * 0.72; // tower height
  const BW  = 14;   // battlement width
  const BH  = 18;   // battlement height
  const GAP = 10;
  const WIN = { w: 12, h: 18 }; // window size

  const renderTower = (x: number, flip = false) => {
    const battlements = [];
    for (let bx = x; bx < x + TW - BW; bx += BW + GAP) battlements.push(bx);
    const winX = flip ? x + TW * 0.28 : x + TW * 0.28;
    return (
      <>
        {/* Main body */}
        <Rect x={x} y={BH} width={TW} height={TH - BH} fill="url(#towerGrad)" />
        {/* Battlements */}
        {battlements.map((bx, i) => (
          <Rect key={i} x={bx} y={0} width={BW} height={BH + 4} fill="#0e051a" />
        ))}
        {/* Gold trim line */}
        <Rect x={x} y={BH + 4} width={TW} height={2} fill={GOLD2} opacity="0.5" />
        {/* Stone line textures */}
        <Line x1={x} y1={BH + 40}  x2={x + TW} y2={BH + 40}  stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        <Line x1={x} y1={BH + 80}  x2={x + TW} y2={BH + 80}  stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        <Line x1={x} y1={BH + 120} x2={x + TW} y2={BH + 120} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        {/* Window 1 */}
        <Rect x={winX} y={BH + 30} width={WIN.w} height={WIN.h} rx={WIN.w / 2} fill="#3a1800" />
        <Rect x={winX} y={BH + 30} width={WIN.w} height={WIN.h} rx={WIN.w / 2} fill="#FF8C00" opacity="0.35" />
        {/* Window 2 */}
        <Rect x={winX} y={BH + 80} width={WIN.w} height={WIN.h} rx={WIN.w / 2} fill="#3a1800" />
        <Rect x={winX} y={BH + 80} width={WIN.w} height={WIN.h} rx={WIN.w / 2} fill="#FF8C00" opacity="0.28" />
        {/* Banner flag */}
        <Rect x={flip ? x + TW * 0.65 : x + TW * 0.2} y={BH + 6} width={3} height={34} fill="#5a0000" />
        <Path
          d={flip
            ? `M ${x + TW * 0.65} ${BH + 6} L ${x + TW * 0.65 - 22} ${BH + 17} L ${x + TW * 0.65} ${BH + 28}`
            : `M ${x + TW * 0.2} ${BH + 6} L ${x + TW * 0.2 + 22} ${BH + 17} L ${x + TW * 0.2} ${BH + 28}`}
          fill="#9B0000"
          opacity="0.9"
        />
      </>
    );
  };

  return (
    <Svg
      style={{ position: 'absolute', top: 0, left: 0 }}
      width={W}
      height={TH + 4}
      pointerEvents="none"
    >
      <Defs>
        <SvgLinear id="towerGrad" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%"   stopColor="#0a031a" />
          <Stop offset="100%" stopColor="#14063a" />
        </SvgLinear>
      </Defs>
      {/* Left tower */}
      {renderTower(-4, false)}
      {/* Right tower */}
      {renderTower(W - 62, true)}
    </Svg>
  );
};

/** Torch glow animated — positioned over tower window */
const TorchGlow: React.FC<{ x: number; y: number }> = ({ x, y }) => {
  const flicker = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const anim = Animated.loop(Animated.sequence([
      Animated.timing(flicker, { toValue: 0.5 + Math.random() * 0.45, duration: 80  + Math.random() * 120, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(flicker, { toValue: 0.8 + Math.random() * 0.2,  duration: 90  + Math.random() * 90,  easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(flicker, { toValue: 1,                           duration: 70  + Math.random() * 100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    anim.start();
    return () => anim.stop();
  }, []);
  return (
    <Animated.View pointerEvents="none" style={{
      position: 'absolute', left: x - 22, top: y - 22,
      width: 44, height: 44, opacity: flicker,
    }}>
      <Svg width={44} height={44}>
        <Defs>
          <RadialGradient id={`fg${Math.round(x)}`} cx="50%" cy="40%" r="60%">
            <Stop offset="0%"   stopColor="#FFD700" stopOpacity="0.8" />
            <Stop offset="50%"  stopColor="#FF6B00" stopOpacity="0.5" />
            <Stop offset="100%" stopColor="#FF2200" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx={22} cy={22} r={22} fill={`url(#fg${Math.round(x)})`} />
        <Circle cx={22} cy={17} r={5}  fill="#FFD700" opacity="0.9" />
      </Svg>
    </Animated.View>
  );
};

/** Bottom castle wall connecting the two towers */
const BottomCastle: React.FC = () => {
  const h   = 110;
  const cx  = W / 2;
  const ww  = W * 0.52;
  const wt  = h - 52;
  const bw  = 14, bh = 10, bg = 8;
  return (
    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }} pointerEvents="none">
      <Svg width={W} height={h}>
        <Defs>
          <SvgLinear id="wallG" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%"   stopColor="#140830" />
            <Stop offset="100%" stopColor="#0a0318" />
          </SvgLinear>
          <RadialGradient id="gGlow" cx="50%" cy="100%" r="70%">
            <Stop offset="0%"   stopColor="#FF6B00" stopOpacity="0.28" />
            <Stop offset="100%" stopColor="#FF6B00" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x={cx - 55} y={wt} width={110} height={h - wt} fill="url(#gGlow)" />
        <Rect x={cx - ww / 2} y={wt} width={ww} height={h - wt} fill="url(#wallG)" />
        {[-3,-1,1,3].map((n, i) => (
          <Rect key={i} x={cx + n * (bw + bg) - bw / 2} y={wt - bh} width={bw} height={bh} fill="#140830" />
        ))}
        <Rect x={cx - 22} y={wt + 12} width={44} height={h - wt - 12} fill="#050210" />
        <Circle cx={cx} cy={wt + 12} r={22} fill="#050210" />
        <Rect x={cx - ww / 2} y={wt - 2} width={ww} height={3} fill={GOLD2} opacity="0.65" />
        <Rect x={0} y={h - 4} width={W} height={4} fill={GOLD2} opacity="0.55" />
      </Svg>
    </View>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
//  PARTICLES
// ──────────────────────────────────────────────────────────────────────────────
interface Drop { id: number; x: number; emoji: string; size: number; dur: number; delay: number; rot: number }
const ITEMS = ['💎','🪙','⭐','👑','💎','🪙','⭐','💎','⚜️','🪙'];

function makeDrop(id: number): Drop {
  return {
    id, x: Math.random(),
    emoji: ITEMS[id % ITEMS.length],
    size:  10 + Math.random() * 13,
    dur:   4200 + Math.random() * 3000,
    delay: Math.random() * 900,
    rot:   (Math.random() - 0.5) * 50,
  };
}

const Particle: React.FC<{ drop: Drop; onDone: () => void }> = ({ drop, onDone }) => {
  const ty  = useRef(new Animated.Value(-drop.size * 2)).current;
  const op  = useRef(new Animated.Value(0)).current;
  const sc  = useRef(new Animated.Value(0.3)).current;
  const rot = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.delay(drop.delay),
      Animated.parallel([
        Animated.timing(op,  { toValue: 0.75, duration: 280, useNativeDriver: true }),
        Animated.spring(sc,  { toValue: 1, tension: 100, friction: 7, useNativeDriver: true }),
        Animated.timing(ty,  { toValue: H + drop.size * 2, duration: drop.dur, useNativeDriver: true }),
        Animated.timing(rot, { toValue: drop.rot, duration: drop.dur, useNativeDriver: true }),
      ]),
      Animated.timing(op, { toValue: 0, duration: 260, useNativeDriver: true }),
    ]).start(onDone);
  }, []);
  const rotStr = rot.interpolate({ inputRange: [-50, 50], outputRange: ['-50deg', '50deg'] });
  return (
    <Animated.View pointerEvents="none" style={{
      position: 'absolute', left: drop.x * W - drop.size,
      top: 0, width: drop.size * 2, height: drop.size * 2,
      transform: [{ translateY: ty }, { scale: sc }, { rotate: rotStr }], opacity: op,
    }}>
      <Text style={{ fontSize: drop.size * 1.1, textAlign: 'center' }}>{drop.emoji}</Text>
    </Animated.View>
  );
};

const KingdomRain: React.FC = () => {
  const ctr = useRef(0);
  const [drops, setDrops] = useState<Drop[]>(() =>
    Array.from({ length: 10 }, () => makeDrop(ctr.current++))
  );
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {drops.map(d => (
        <Particle key={d.id} drop={d}
          onDone={() => setDrops(p => [...p.filter(x => x.id !== d.id), makeDrop(ctr.current++)])}
        />
      ))}
    </View>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
//  TOP STAT BADGES
// ──────────────────────────────────────────────────────────────────────────────
const GloryBadge: React.FC<{ stars: number; max: number }> = ({ stars, max }) => {
  const sc = useRef(new Animated.Value(0.7)).current;
  useEffect(() => {
    Animated.spring(sc, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={[styles.gloryBadge, { transform: [{ scale: sc }] }]}>
      <LinearGradient colors={['rgba(70,20,5,0.97)', 'rgba(12,4,30,0.97)']}
        style={styles.gloryGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <Text style={styles.gloryIcon}>👑</Text>
        <View>
          <View style={styles.gloryCountRow}>
            <Text style={styles.gloryCount}>{stars}</Text>
            <Text style={styles.gloryMax}>/{max}</Text>
          </View>
          <Text style={styles.gloryLabel}>GLORY</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const CoinBadge: React.FC<{ coins: number; onPress: () => void }> = ({ coins, onPress }) => {
  const sc = useRef(new Animated.Value(0.7)).current;
  useEffect(() => {
    Animated.spring(sc, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={[styles.coinBadge, { transform: [{ scale: sc }] }]}>
      <LinearGradient colors={['rgba(55,18,0,0.97)', 'rgba(10,3,25,0.97)']}
        style={styles.coinGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <Text style={styles.coinIcon}>🪙</Text>
        <Text style={styles.coinCount}>{coins.toLocaleString()}</Text>
        <TouchableOpacity style={styles.coinPlus} onPress={onPress} activeOpacity={0.8}>
          <Text style={styles.coinPlusText}>+</Text>
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
//  GREATEST GLORY CARD
// ──────────────────────────────────────────────────────────────────────────────
const GloryCard: React.FC<{ score: number }> = ({ score }) => {
  const sc = useRef(new Animated.Value(0.85)).current;
  const op = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.spring(sc, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.timing(op, { toValue: 1, duration: 500, delay: 200, useNativeDriver: true }),
    ]).start();
  }, []);
  if (score === 0) return null;
  return (
    <Animated.View style={[styles.gloryCard, { transform: [{ scale: sc }], opacity: op }]}>
      <LinearGradient
        colors={['#0f0420', '#1c093a', '#0f0420']}
        style={styles.gloryCardInner}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      >
        {/* Top edge accent */}
        <View style={styles.gloryTopEdge} />
        {/* Corner diamonds */}
        <Text style={[styles.gloryCorner, { left: 10, top: 7 }]}>✦</Text>
        <Text style={[styles.gloryCorner, { right: 10, top: 7 }]}>✦</Text>
        <Text style={[styles.gloryCorner, { left: 10, bottom: 7 }]}>✦</Text>
        <Text style={[styles.gloryCorner, { right: 10, bottom: 7 }]}>✦</Text>

        <Text style={styles.gloryCardLabel}>GREATEST GLORY</Text>
        <View style={styles.gloryScoreRow}>
          <Text style={styles.gloryLaurelL}>🌿</Text>
          <Text style={styles.gloryCardScore}>{score.toLocaleString()}</Text>
          <Text style={[styles.gloryLaurelR, { transform: [{ scaleX: -1 }] }]}>🌿</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
//  BATTLE BUTTON
// ──────────────────────────────────────────────────────────────────────────────
const BattleButton: React.FC<{ onPress: () => void; pulseAnim: Animated.Value; entranceAnim: Animated.Value }> = ({
  onPress, pulseAnim, entranceAnim,
}) => (
  <Animated.View style={[styles.battleWrap, {
    transform: [{ scale: Animated.multiply(entranceAnim, pulseAnim) }],
  }]}>
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.battleOuter}>
      <LinearGradient
        colors={['#ff1a1a', '#d00000', '#8b0000', '#550000']}
        style={styles.battleBtn}
        start={{ x: 0, y: 0 }} end={{ x: 0.5, y: 1 }}
      >
        {/* Top sheen */}
        <View style={styles.battleSheen} />
        {/* Bottom shadow band */}
        <View style={styles.battleShadowBand} />
        <Text style={styles.battleText}>⚔️   BATTLE!</Text>
      </LinearGradient>
    </TouchableOpacity>
  </Animated.View>
);

// ──────────────────────────────────────────────────────────────────────────────
//  THREE-COLUMN MINI CARDS
// ──────────────────────────────────────────────────────────────────────────────
const CARD_W = (W * 0.88 - 16) / 3;

const MiniCard: React.FC<{
  icon: string;
  label: string;
  sub: string;
  onPress: () => void;
  delay: number;
}> = ({ icon, label, sub, onPress, delay }) => {
  const sc   = useRef(new Animated.Value(0)).current;
  const press = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.spring(sc, { toValue: 1, tension: 60, friction: 8, delay, useNativeDriver: true }).start();
  }, []);
  const onIn  = () => Animated.spring(press, { toValue: 0.94, tension: 200, friction: 8, useNativeDriver: true }).start();
  const onOut = () => Animated.spring(press, { toValue: 1, tension: 200, friction: 8, useNativeDriver: true }).start();
  return (
    <Animated.View style={[styles.miniCardWrap, { transform: [{ scale: sc }] }]}>
      <TouchableOpacity
        onPress={onPress} onPressIn={onIn} onPressOut={onOut}
        activeOpacity={1} style={styles.miniCardTouch}
      >
        <Animated.View style={{ transform: [{ scale: press }] }}>
          <LinearGradient
            colors={['#1c0945', '#2a1155', '#1a0838']}
            style={styles.miniCard}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            {/* Gold border inset */}
            <View style={styles.miniCardBorder} />
            {/* Top sheen */}
            <View style={styles.miniCardSheen} />
            <Text style={styles.miniCardIcon}>{icon}</Text>
            <Text style={styles.miniCardLabel}>{label}</Text>
            <Text style={styles.miniCardSub}>{sub}</Text>
            <View style={styles.miniCardArrowWrap}>
              <Text style={styles.miniCardArrow}>→</Text>
            </View>
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
//  BATTLE GUIDE
// ──────────────────────────────────────────────────────────────────────────────
const GUIDE_ROWS: Array<{ icon: string; text: React.ReactNode }> = [
  { icon: '⚔️', text: 'Tap to aim & launch gems' },
  { icon: '💎', text: <Text>Match 3 gems to <Text style={{ color: GOLD, fontWeight: '900' }}>BLAST</Text></Text> },
  { icon: '🔥', text: 'Chain combos for glory' },
  { icon: '👑', text: 'Earn up to 3 crowns per battle' },
];

const BattleGuide: React.FC = () => (
  <View style={styles.guide}>
    <LinearGradient colors={['rgba(22,6,52,0.92)', 'rgba(10,3,28,0.92)']} style={styles.guideInner}>
      <View style={styles.guideTitleRow}>
        <View style={styles.guideDivLine} />
        <Text style={styles.guideTitle}>✦  BATTLE GUIDE  ✦</Text>
        <View style={styles.guideDivLine} />
      </View>
      <View style={styles.guideBody}>
        <View style={styles.guideRows}>
          {GUIDE_ROWS.map((row, i) => (
            <View key={i} style={styles.guideLine}>
              <Text style={styles.guideIcon}>{row.icon}</Text>
              <Text style={styles.guideText}>{row.text}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.guideKnight}>🧑‍⚔️</Text>
      </View>
    </LinearGradient>
  </View>
);

// ──────────────────────────────────────────────────────────────────────────────
//  BOTTOM NAV BAR
// ──────────────────────────────────────────────────────────────────────────────
const NAV = [
  { icon: '🏰', active: true  },
  { icon: '🛡️', active: false },
  { icon: '⚔️', active: false },
  { icon: '🏆', active: false },
  { icon: '⚙️', active: false },
];

const BottomNavBar: React.FC<{ onLevels: () => void; onBattle: () => void }> = ({ onLevels, onBattle }) => {
  const slide = useRef(new Animated.Value(72)).current;
  const op    = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.spring(slide, { toValue: 0, tension: 55, friction: 10, delay: 350, useNativeDriver: true }),
      Animated.timing(op,    { toValue: 1, duration: 380, delay: 350, useNativeDriver: true }),
    ]).start();
  }, []);
  const handlers: Array<(() => void) | undefined> = [undefined, onLevels, onBattle, undefined, undefined];
  return (
    <Animated.View style={[styles.navBar, { transform: [{ translateY: slide }], opacity: op }]}>
      <LinearGradient
        colors={['rgba(14,5,35,0.98)', 'rgba(8,2,20,0.98)']}
        style={styles.navInner}
      >
        <View style={styles.navTopLine} />
        {NAV.map((item, i) => (
          <TouchableOpacity
            key={i} style={styles.navItem}
            onPress={handlers[i]} activeOpacity={0.7}
          >
            <Text style={[styles.navIcon, item.active && styles.navIconActive]}>
              {item.icon}
            </Text>
            {item.active && <View style={styles.navActiveDot} />}
          </TouchableOpacity>
        ))}
      </LinearGradient>
    </Animated.View>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
//  MAIN SCREEN
// ──────────────────────────────────────────────────────────────────────────────
interface HomeScreenProps {
  progress: PlayerProgress;
  onPlay: () => void;
  onSelectLevel: () => void;
  onClaimDaily: () => { reward: number; claimed: boolean };
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  progress, onPlay, onSelectLevel, onClaimDaily,
}) => {
  const titleSc = useRef(new Animated.Value(0)).current;
  const titleOp = useRef(new Animated.Value(0)).current;
  const btnSc   = useRef(new Animated.Value(0)).current;
  const pulse   = useRef(new Animated.Value(1)).current;
  const [toast, setToast] = useState<string | null>(null);
  const toastOp = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(titleSc, { toValue: 1, tension: 55, friction: 8, useNativeDriver: true }),
        Animated.timing(titleOp, { toValue: 1, duration: 480, useNativeDriver: true }),
      ]),
      Animated.spring(btnSc, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start(() => {
      Animated.loop(Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])).start();
    });
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    toastOp.setValue(0);
    Animated.sequence([
      Animated.timing(toastOp, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1700),
      Animated.timing(toastOp, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setToast(null));
  };

  const handleDaily = () => {
    const r = onClaimDaily();
    showToast(r.claimed ? `⚜️  +${r.reward} gold claimed!` : '⚜️  Already claimed today');
  };

  return (
    <View style={styles.root}>

      {/* ── Background ── */}
      <LinearGradient
        colors={['#080030', '#130050', '#1e0860', '#2a0d14', '#5a1800']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.45, y: 0 }} end={{ x: 0.55, y: 1 }}
      />

      {/* Stars */}
      <StarField />

      {/* Centre purple radial glow */}
      <View style={styles.centreGlow} pointerEvents="none">
        <Svg width={W} height={H * 0.6}>
          <Defs>
            <RadialGradient id="cg" cx="50%" cy="30%" r="50%">
              <Stop offset="0%"   stopColor="#6020c0" stopOpacity="0.18" />
              <Stop offset="60%"  stopColor="#3a0080" stopOpacity="0.06" />
              <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width={W} height={H * 0.6} fill="url(#cg)" />
        </Svg>
      </View>

      {/* Torch warmth at bottom */}
      <LinearGradient
        colors={['transparent', 'rgba(120,35,0,0.12)', 'rgba(180,60,0,0.2)']}
        style={[StyleSheet.absoluteFill, { top: H * 0.62 }]}
        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
        pointerEvents="none"
      />

      {/* Particles */}
      <KingdomRain />

      {/* Side towers */}
      <SideTowers />

      {/* Tower torch glows */}
      <TorchGlow x={56}      y={74} />
      <TorchGlow x={W - 56}  y={74} />

      {/* Bottom wall */}
      <BottomCastle />

      {/* ── Top badges (above scroll) ── */}
      <GloryBadge stars={progress.totalStars} max={MAX_STARS_TOTAL} />
      <CoinBadge  coins={progress.coins} onPress={handleDaily} />

      {/* ── Content ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Logo image */}
        <Animated.View style={[styles.titleBlock, { transform: [{ scale: titleSc }], opacity: titleOp }]}>
          <Image
            source={require('../../assets/kgf-orbito-icon-master.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Greatest Glory */}
        <GloryCard score={progress.highScore} />

        {/* BATTLE! */}
        <BattleButton onPress={onPlay} pulseAnim={pulse} entranceAnim={btnSc} />

        {/* Three cards */}
        <View style={styles.cardsRow}>
          <MiniCard
            icon="🗺️"
            label="KINGDOM MAP"
            sub={`👑 ${progress.totalStars}/${MAX_STARS_TOTAL} crowns`}
            onPress={onSelectLevel}
            delay={80}
          />
          <MiniCard
            icon="💰"
            label="TREASURY"
            sub={`🔥 Streak ${progress.dailyStreak}`}
            onPress={handleDaily}
            delay={160}
          />
          <MiniCard
            icon="🎁"
            label="DAILY REWARD"
            sub="Claim your gift!"
            onPress={handleDaily}
            delay={240}
          />
        </View>

        {/* Guide */}
        <BattleGuide />

        <View style={{ height: 88 }} />
      </ScrollView>

      {/* Bottom nav */}
      <BottomNavBar onLevels={onSelectLevel} onBattle={onPlay} />

      {/* Toast */}
      {toast && (
        <Animated.View style={[styles.toast, { opacity: toastOp }]}>
          <Text style={styles.toastText}>{toast}</Text>
        </Animated.View>
      )}

    </View>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
//  STYLES
// ──────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:       { flex: 1 },
  centreGlow: { position: 'absolute', top: 0, left: 0, right: 0 },
  scroll:     { flex: 1 },
  scrollContent: {
    alignItems: 'center',
    paddingTop: 88,
    paddingHorizontal: W * 0.06,
  },

  // ── Top badges ──
  gloryBadge: {
    position: 'absolute', top: 42, left: 14, zIndex: 20,
    borderRadius: 28, overflow: 'hidden',
    borderWidth: 1.5, borderColor: 'rgba(255,215,0,0.55)',
    shadowColor: GOLD, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 10,
  },
  gloryGrad: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 7, gap: 7,
  },
  gloryIcon: { fontSize: 20 },
  gloryCountRow: { flexDirection: 'row', alignItems: 'baseline' },
  gloryCount: { color: GOLD, fontSize: 18, fontWeight: '900' },
  gloryMax:   { color: 'rgba(255,255,255,0.38)', fontSize: 12, fontWeight: '700' },
  gloryLabel: { color: 'rgba(255,215,0,0.65)', fontSize: 9, fontWeight: '900', letterSpacing: 1.5, marginTop: 1 },

  coinBadge: {
    position: 'absolute', top: 42, right: 14, zIndex: 20,
    borderRadius: 28, overflow: 'hidden',
    borderWidth: 1.5, borderColor: 'rgba(255,215,0,0.45)',
    shadowColor: GOLD, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 8,
  },
  coinGrad: {
    flexDirection: 'row', alignItems: 'center',
    paddingLeft: 11, paddingRight: 5, paddingVertical: 8, gap: 5,
  },
  coinIcon:     { fontSize: 17 },
  coinCount:    { color: GOLD, fontSize: 16, fontWeight: '900' },
  coinPlus: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(255,215,0,0.2)',
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 3,
  },
  coinPlusText: { color: GOLD, fontSize: 16, fontWeight: '900', lineHeight: 19 },

  // ── Title ──
  titleBlock: { alignItems: 'center', marginBottom: 14, zIndex: 5 },
  logoImage: {
    width: W * 0.88,
    height: W * 0.88,
  },

  // ── Greatest Glory card ──
  gloryCard: {
    width: W * 0.88,
    borderRadius: 18, overflow: 'hidden',
    marginBottom: 16, zIndex: 5,
    borderWidth: 1.5, borderColor: 'rgba(255,215,0,0.45)',
    shadowColor: GOLD, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45, shadowRadius: 14,
  },
  gloryCardInner: { alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20 },
  gloryTopEdge: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 2,
    backgroundColor: 'rgba(255,215,0,0.45)',
  },
  gloryCorner:     { position: 'absolute', color: GOLD, fontSize: 11, opacity: 0.55 },
  gloryCardLabel:  { color: 'rgba(255,215,0,0.65)', fontSize: 10, fontWeight: '900', letterSpacing: 3, marginBottom: 4 },
  gloryScoreRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  gloryLaurelL:    { fontSize: 22, opacity: 0.65 },
  gloryLaurelR:    { fontSize: 22, opacity: 0.65 },
  gloryCardScore: {
    color: '#fff', fontSize: 38, fontWeight: '900', lineHeight: 44,
    textShadowColor: 'rgba(255,215,0,0.45)',
    textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 12,
  },

  // ── Battle button ──
  battleWrap: {
    width: W * 0.82,
    marginBottom: 18, zIndex: 5,
    shadowColor: '#CC0000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.7, shadowRadius: 24, elevation: 16,
  },
  battleOuter: {
    borderRadius: 44, overflow: 'hidden',
    borderWidth: 2.5, borderColor: 'rgba(255,215,0,0.75)',
  },
  battleBtn: {
    paddingVertical: 20,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  battleSheen: {
    position: 'absolute', top: 0, left: 0, right: 0, height: '45%',
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 44,
  },
  battleShadowBand: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: '22%',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  battleText: {
    color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: 3.5,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 1, height: 2 }, textShadowRadius: 6,
  },

  // ── Three cards ──
  cardsRow: {
    flexDirection: 'row', gap: 8,
    width: W * 0.88, marginBottom: 14, zIndex: 5,
  },
  miniCardWrap:  { width: CARD_W },
  miniCardTouch: {
    borderRadius: 18, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5, shadowRadius: 8, elevation: 6,
  },
  miniCard: {
    padding: 11, alignItems: 'center',
    borderRadius: 18, minHeight: 118,
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.18)',
    overflow: 'hidden', gap: 3,
  },
  miniCardBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255,215,0,0.25)',
  },
  miniCardSheen: {
    position: 'absolute', top: 0, left: 0, right: 0, height: '40%',
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 18,
  },
  miniCardIcon:  { fontSize: 32, marginBottom: 3 },
  miniCardLabel: {
    color: '#fff', fontSize: 9, fontWeight: '900',
    letterSpacing: 0.7, textAlign: 'center',
  },
  miniCardSub: {
    color: 'rgba(255,215,0,0.72)', fontSize: 9, fontWeight: '700', textAlign: 'center',
  },
  miniCardArrowWrap: {
    marginTop: 6,
    backgroundColor: 'rgba(255,215,0,0.12)',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 2,
  },
  miniCardArrow: { color: 'rgba(255,215,0,0.7)', fontSize: 12, fontWeight: '900' },

  // ── Battle guide ──
  guide: {
    width: W * 0.88, borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.22)',
    marginBottom: 14, zIndex: 5,
  },
  guideInner: { padding: 14 },
  guideTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  guideDivLine:  { flex: 1, height: 1, backgroundColor: 'rgba(255,215,0,0.25)' },
  guideTitle: {
    color: GOLD, fontSize: 11, fontWeight: '900', letterSpacing: 1.8,
    textShadowColor: 'rgba(255,215,0,0.5)',
    textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 6,
  },
  guideBody:   { flexDirection: 'row', alignItems: 'center' },
  guideRows:   { flex: 1, gap: 6 },
  guideLine:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  guideIcon:   { fontSize: 16, width: 22, textAlign: 'center' },
  guideText:   { color: 'rgba(255,218,170,0.9)', fontSize: 12, fontWeight: '600', flex: 1 },
  guideKnight: { fontSize: 56, marginLeft: 8 },

  // ── Bottom nav ──
  navBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 68, zIndex: 30,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.6, shadowRadius: 12,
  },
  navInner: {
    flex: 1, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-around',
    paddingBottom: 6, paddingTop: 2, overflow: 'hidden',
  },
  navTopLine: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 1,
    backgroundColor: 'rgba(255,215,0,0.25)',
  },
  navItem: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingTop: 8, gap: 4,
  },
  navIcon:       { fontSize: 24, opacity: 0.4 },
  navIconActive: { opacity: 1 },
  navActiveDot: {
    width: 5, height: 5, borderRadius: 2.5,
    backgroundColor: GOLD,
    shadowColor: GOLD, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9, shadowRadius: 4,
  },

  // ── Toast ──
  toast: {
    position: 'absolute', bottom: 82, alignSelf: 'center',
    backgroundColor: 'rgba(70,15,5,0.96)',
    borderRadius: 22, paddingHorizontal: 22, paddingVertical: 12,
    borderWidth: 1.5, borderColor: 'rgba(255,215,0,0.5)', zIndex: 50,
    shadowColor: GOLD, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 10,
  },
  toastText: { color: GOLD, fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
});
