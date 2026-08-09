import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, LinearGradient as SvgLG, Stop, Rect } from 'react-native-svg';
import { GAME_HEADER_HEIGHT, SCREEN_WIDTH, SHOTS_PER_DROP } from '../../constants/gameConfig';

interface HUDProps {
  score: number;
  highScore: number;
  level: number;
  shotsLeft: number;
  combo: number;
  progress: number;
  coinsEarned: number;
  shotsSinceDrop: number;
  /** Shots between ceiling drops for this level; 0 hides the countdown. */
  shotsPerDrop?: number;
  isGameOver?: boolean;
  isLevelComplete?: boolean;
  onPause?: () => void;
  onBack?: () => void;
}

// ─── Animated score counter ───────────────────────────────────────────────────
const AnimatedScore: React.FC<{ value: number }> = ({ value }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const prev  = useRef(value);

  useEffect(() => {
    if (prev.current !== value) {
      prev.current = value;
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.16, duration: 75, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, tension: 220, friction: 8, useNativeDriver: true }),
      ]).start();
    }
  }, [value]);

  return (
    <Animated.Text style={[styles.scoreText, { transform: [{ scale }] }]}>
      {value.toLocaleString()}
    </Animated.Text>
  );
};

// ─── Animated progress bar ────────────────────────────────────────────────────
const ProgressBar: React.FC<{ completion: number }> = ({ completion }) => {
  const width = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(width, {
      toValue: completion,
      duration: 440,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [completion]);

  const pct = completion * 100;
  const barColor = pct >= 80 ? '#FFD700' : pct >= 50 ? '#FF8C00' : '#C0392B';

  return (
    <View style={styles.progressTrack}>
      <Animated.View
        style={[
          styles.progressFillWrap,
          { width: width.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
        ]}
      >
        <LinearGradient
          colors={['#7B0000', barColor, '#FFD700']}
          style={styles.progressFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </Animated.View>
      {/* Glow tip */}
      <Animated.View
        style={[
          styles.progressGlowTip,
          { left: width.interpolate({ inputRange: [0, 1], outputRange: ['0%', '97%'] }) },
        ]}
      />
      {/* Progress label */}
      <Text style={styles.progressLabel}>{Math.round(pct)}%</Text>
    </View>
  );
};

// ─── Combo flash label ────────────────────────────────────────────────────────
const ComboLabel: React.FC<{ combo: number }> = ({ combo }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const prev  = useRef(combo);

  useEffect(() => {
    if (combo >= 2 && combo !== prev.current) {
      prev.current = combo;
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.3, tension: 290, friction: 6, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1,   tension: 200, friction: 8, useNativeDriver: true }),
      ]).start();
    } else if (combo < 2) {
      prev.current = combo;
    }
  }, [combo]);

  const label =
    combo >= 5 ? '🐉 RAMPAGE' :
    combo >= 3 ? '⚔️ FRENZY'  :
    combo >= 2 ? `×${combo} COMBO` : 'STEADY';

  const shadowStyle =
    combo >= 5 ? { textShadowColor: 'rgba(255,100,0,0.9)', textShadowRadius: 10 } :
    combo >= 3 ? { textShadowColor: 'rgba(255,215,0,0.9)', textShadowRadius: 8  } :
    combo >= 2 ? { textShadowColor: 'rgba(255,215,0,0.6)', textShadowRadius: 4  } : {};

  return (
    <Animated.Text
      style={[
        styles.statChip,
        combo >= 2 && styles.comboActive,
        shadowStyle,
        { transform: [{ scale }], textShadowOffset: { width: 0, height: 0 } },
      ]}
    >
      {label}
    </Animated.Text>
  );
};

// ─── Shots counter ────────────────────────────────────────────────────────────
const ShotsCounter: React.FC<{ value: number }> = ({ value }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const prev  = useRef(value);

  useEffect(() => {
    if (value !== prev.current) {
      prev.current = value;
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.22, duration: 65, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, tension: 210, friction: 7, useNativeDriver: true }),
      ]).start();
    }
  }, [value]);

  return (
    <Animated.View style={[styles.shotsWrap, value <= 5 && styles.shotsLowWrap, { transform: [{ scale }] }]}>
      <Text style={[styles.shotsIcon, value <= 5 && styles.shotsLowText]}>🏹</Text>
      <Text style={[styles.shotsNum, value <= 5 && styles.shotsLowText]}>{value}</Text>
    </Animated.View>
  );
};

// ─── Queue mini-bubble ────────────────────────────────────────────────────────
// ─── HUD ──────────────────────────────────────────────────────────────────────
export const HUD: React.FC<HUDProps> = ({
  score, highScore, level, shotsLeft, combo,
  progress, coinsEarned, shotsSinceDrop, shotsPerDrop = SHOTS_PER_DROP,
  isGameOver = false, isLevelComplete = false,
  onPause, onBack,
}) => {
  const completion     = Math.max(0, Math.min(1, progress));
  const dropsEnabled   = shotsPerDrop > 0;
  const shotsUntilDrop = Math.max(1, shotsPerDrop - shotsSinceDrop);
  const dropImminent   = shotsUntilDrop <= 2;
  const showDropPanel  = !isGameOver && !isLevelComplete;

  return (
    <View style={styles.shell} pointerEvents="box-none">
      {/* Dark stone banner background */}
      <LinearGradient
        colors={['rgba(4,1,16,0.99)', 'rgba(8,2,22,0.98)', 'rgba(10,3,20,0.88)']}
        style={styles.header}
      >
        {/* Stone texture SVG overlay */}
        <Svg
          width={SCREEN_WIDTH} height={GAME_HEADER_HEIGHT}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        >
          <Defs>
            <SvgLG id="hud_bottom" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0%"   stopColor="#B8860B" stopOpacity="0.1" />
              <Stop offset="40%"  stopColor="#FFD700" stopOpacity="0.6" />
              <Stop offset="60%"  stopColor="#FFD700" stopOpacity="0.6" />
              <Stop offset="100%" stopColor="#B8860B" stopOpacity="0.1" />
            </SvgLG>
          </Defs>
          {/* Top gold trim strip */}
          <Rect x={0} y={0} width={SCREEN_WIDTH} height={1.5} fill="#FFD700" opacity="0.45" />
          {/* Bottom decorative gold border */}
          <Rect x={0} y={GAME_HEADER_HEIGHT - 1.5} width={SCREEN_WIDTH} height={1.5} fill="url(#hud_bottom)" />
          <Rect x={0} y={GAME_HEADER_HEIGHT - 6}   width={SCREEN_WIDTH} height={5}   fill="#FFD700" opacity="0.055" />
        </Svg>

        {/* ── Row 1: Navigation + Score ── */}
        <View style={styles.row1}>
          {/* Back button */}
          <TouchableOpacity onPress={onBack} activeOpacity={0.8} style={styles.ctrlBtn}>
            <Text style={styles.ctrlBtnText}>‹</Text>
          </TouchableOpacity>

          {/* Battle badge */}
          <View style={styles.battleBadge}>
            <Text style={styles.battleIcon}>⚔️</Text>
            <Text style={styles.battleLabel}>BATTLE</Text>
            <Text style={styles.battleNum}>{level}</Text>
          </View>

          {/* Score (center) */}
          <View style={styles.scoreBlock}>
            <AnimatedScore value={score} />
            <View style={styles.gloryPill}>
              <Text style={styles.gloryText}>⚜️ {highScore.toLocaleString()}</Text>
            </View>
          </View>

          {/* Pause button */}
          <TouchableOpacity onPress={onPause} activeOpacity={0.8} style={[styles.ctrlBtn, styles.pauseBtn]}>
            <Text style={styles.pauseText}>Ⅱ</Text>
          </TouchableOpacity>
        </View>

        {/* ── Row 2: Gameplay stats ── */}
        <View style={styles.row2}>
          {/* Left: shots + combo + coins */}
          <View style={styles.statsCluster}>
            <ShotsCounter value={shotsLeft} />
            <ComboLabel combo={combo} />
            {coinsEarned > 0 && (
              <View style={styles.coinChip}>
                <Text style={styles.coinText}>🪙 {coinsEarned}</Text>
              </View>
            )}
          </View>

          {/* Center: progress bar */}
          <View style={styles.progressWrap}>
            <ProgressBar completion={completion} />
          </View>

          {/* Right: drop countdown — hidden when the game ended, and on levels
              where the ceiling never drops (otherwise it warns of a drop that
              is never coming) */}
          {showDropPanel && dropsEnabled && (
            <View style={[styles.dropPanel, dropImminent && styles.dropPanelAlert]}>
              <Text style={[styles.dropPanelNum, dropImminent && styles.dropPanelNumAlert]}>
                {shotsUntilDrop}
              </Text>
              <Text style={[styles.dropPanelLabel, dropImminent && styles.dropPanelLabelAlert]}>
                DROP
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  shell: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: GAME_HEADER_HEIGHT,
    zIndex: 20,
  },
  header: {
    flex: 1,
    paddingTop: 34,
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 7,
  },

  // ── Row 1 ──────────────────────────────────────────────────────────────────
  row1: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ctrlBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,215,0,0.08)',
    borderWidth: 1.5, borderColor: 'rgba(255,215,0,0.3)',
  },
  ctrlBtnText: { color: '#FFD700', fontSize: 30, lineHeight: 32, fontWeight: '700', marginTop: -2 },
  pauseBtn: {
    backgroundColor: 'rgba(80,0,0,0.55)',
    borderColor: 'rgba(255,215,0,0.45)',
  },
  pauseText: { color: '#FFD700', fontSize: 18, fontWeight: '900' },

  battleBadge: {
    alignItems: 'center',
    minWidth: 58, borderRadius: 10,
    paddingVertical: 4, paddingHorizontal: 7,
    backgroundColor: 'rgba(50,0,18,0.65)',
    borderWidth: 1.5, borderColor: 'rgba(255,215,0,0.38)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.22, shadowRadius: 8,
  },
  battleIcon:  { fontSize: 11, lineHeight: 13 },
  battleLabel: { color: 'rgba(255,215,0,0.6)', fontSize: 7, fontWeight: '900', letterSpacing: 1.8, marginTop: 1 },
  battleNum:   { color: '#FFD700', fontSize: 22, lineHeight: 24, fontWeight: '900' },

  scoreBlock: { flex: 1, alignItems: 'center' },
  scoreText: {
    color: '#ffffff',
    fontSize: 30, lineHeight: 34, fontWeight: '900',
    textShadowColor: 'rgba(255,215,0,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  gloryPill: {
    marginTop: 1,
    paddingHorizontal: 10, paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.18)',
  },
  gloryText: { color: '#FFD700', fontSize: 9, fontWeight: '900', letterSpacing: 0.6 },

  // ── Row 2 ──────────────────────────────────────────────────────────────────
  row2: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  statsCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 1,
  },
  shotsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(255,215,0,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.2)',
  },
  shotsLowWrap: {
    backgroundColor: 'rgba(255,50,50,0.15)',
    borderColor: 'rgba(255,80,80,0.4)',
  },
  shotsIcon:    { fontSize: 11, lineHeight: 13 },
  shotsNum:     { color: 'rgba(255,220,160,0.9)', fontSize: 12, fontWeight: '900' },
  shotsLowText: { color: '#FF6666' },

  statChip:   { color: 'rgba(255,220,160,0.75)', fontSize: 10, fontWeight: '900' },
  comboActive:{ color: '#FFD700' },

  coinChip:   { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6, backgroundColor: 'rgba(255,200,0,0.1)' },
  coinText:   { color: '#FFD700', fontSize: 10, fontWeight: '900' },

  progressWrap: { flex: 1 },
  progressTrack: {
    height: 11, borderRadius: 11,
    overflow: 'visible',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.2)',
    position: 'relative',
    justifyContent: 'center',
  },
  progressFillWrap: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    borderRadius: 11,
    overflow: 'hidden',
  },
  progressFill: { flex: 1 },
  progressGlowTip: {
    position: 'absolute',
    top: -2, bottom: -2,
    width: 8,
    backgroundColor: 'rgba(255,215,0,0.75)',
    borderRadius: 4,
    marginLeft: -4,
    zIndex: 2,
  },
  progressLabel: {
    position: 'absolute',
    right: 5,
    color: 'rgba(255,215,0,0.55)',
    fontSize: 7, fontWeight: '900',
    zIndex: 3,
  },

  // Drop countdown panel (right of row2)
  dropPanel: {
    alignItems: 'center',
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(20,4,40,0.6)',
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.22)',
    minWidth: 38,
  },
  dropPanelAlert: {
    backgroundColor: 'rgba(80,10,0,0.7)',
    borderColor: 'rgba(255,80,0,0.7)',
  },
  dropPanelNum: {
    color: 'rgba(255,215,0,0.85)',
    fontSize: 15, fontWeight: '900', lineHeight: 17,
  },
  dropPanelNumAlert: { color: '#FF6B35' },
  dropPanelLabel: {
    color: 'rgba(255,215,0,0.45)',
    fontSize: 6, fontWeight: '900', letterSpacing: 1,
  },
  dropPanelLabelAlert: { color: 'rgba(255,107,53,0.8)' },
});
