import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Easing, Image,
} from 'react-native';
import { useGameAudio } from '../systems/audio';
import { LinearGradient } from 'expo-linear-gradient';
import {
  SCREEN_WIDTH as W,
  MAX_STARS_TOTAL,
} from '../constants/gameConfig';
import { isDailyRewardAvailable } from '../systems/rewards';
import { PlayerProgress } from '../types';

// ─── Palette ──────────────────────────────────────────────────────────────────
const GOLD = '#FFD700';

/**
 * Type scale against a 400pt reference width, so the wordmark and CTA don't run
 * edge-to-edge on small handsets or balloon on tablets.
 */
const S = Math.min(1, Math.max(0.8, W / 400));

const SIDE = W * 0.055;

/**
 * Fit the splash art to the full width rather than cover-cropping it. The
 * logo lockup spans nearly the whole painting, so cropping to fill height
 * slices the wordmark off on narrow handsets. Fitting by width keeps the
 * brand mark intact; the shortfall at the bottom is continued with a
 * gradient sampled from the art's own bottom edge (#3e1e45), and the
 * controls sit over it.
 * Source art is 941x1672.
 */
const ART_RATIO = 941 / 1672;
const ART_W = W;
const ART_H = ART_W / ART_RATIO;
const ART_FOOT = '#3e1e45';

// ──────────────────────────────────────────────────────────────────────────────
//  HUD
//  Deliberately chrome-less. The artwork is the screen; these two readouts sit
//  on it rather than in boxes competing with it.
// ──────────────────────────────────────────────────────────────────────────────
const Hud: React.FC<{ stars: number; max: number; coins: number }> = ({ stars, max, coins }) => {
  const op = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(op, { toValue: 1, duration: 500, delay: 180, useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View pointerEvents="none" style={[styles.hud, { opacity: op }]}>
      <View style={styles.hudGroup}>
        <Text style={styles.hudIcon}>👑</Text>
        <Text style={styles.hudValue}>{stars}</Text>
        <Text style={styles.hudMuted}>/{max}</Text>
      </View>
      <View style={styles.hudGroup}>
        <Text style={styles.hudIcon}>🪙</Text>
        <Text style={styles.hudValue}>{coins.toLocaleString()}</Text>
      </View>
    </Animated.View>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
//  BATTLE BUTTON
// ──────────────────────────────────────────────────────────────────────────────
const BattleButton: React.FC<{
  onPress: () => void;
  pulseAnim: Animated.Value;
  entranceAnim: Animated.Value;
}> = ({ onPress, pulseAnim, entranceAnim }) => (
  <Animated.View style={[styles.battleWrap, {
    transform: [{ scale: Animated.multiply(entranceAnim, pulseAnim) }],
  }]}>
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.88}
      style={styles.battleOuter}
      accessibilityRole="button"
      accessibilityLabel="Battle"
    >
      <LinearGradient
        colors={['#f2543c', '#d8341f', '#a81d10']}
        style={styles.battleBtn}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
      >
        <View style={styles.battleSheen} />
        <Text style={styles.battleText}>⚔️  BATTLE</Text>
      </LinearGradient>
    </TouchableOpacity>
  </Animated.View>
);

// ──────────────────────────────────────────────────────────────────────────────
//  BOTTOM NAV
// ──────────────────────────────────────────────────────────────────────────────
const NotifyDot: React.FC = () => {
  const pulse = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const anim = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1,   duration: 850, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0.4, duration: 850, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    anim.start();
    return () => anim.stop();
  }, []);
  return <Animated.View pointerEvents="none" style={[styles.notifyDot, { opacity: pulse }]} />;
};

const BottomNav: React.FC<{
  onMap: () => void;
  onDaily: () => void;
  onLocked: (what: string) => void;
  dailyAvailable: boolean;
  entrance: Animated.Value;
}> = ({ onMap, onDaily, onLocked, dailyAvailable, entrance }) => {
  const items = [
    { icon: '🏰', label: 'Castle',   active: true,  onPress: undefined as (() => void) | undefined, notify: false },
    { icon: '🗺️', label: 'Map',      active: false, onPress: onMap,   notify: false },
    { icon: '🪙', label: 'Treasury', active: false, onPress: onDaily, notify: dailyAvailable },
    { icon: '🏆', label: 'Trophies', active: false, onPress: () => onLocked('Trophies'), notify: false },
    { icon: '⚙️', label: 'Settings', active: false, onPress: () => onLocked('Settings'), notify: false },
  ];
  return (
    <Animated.View style={[styles.navBar, {
      opacity: entrance,
      transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [26, 0] }) }],
    }]}>
      {items.map((item, i) => (
        <TouchableOpacity
          key={i}
          style={styles.navItem}
          onPress={item.onPress}
          disabled={!item.onPress}
          activeOpacity={0.6}
          accessibilityRole="button"
          accessibilityLabel={item.label}
          accessibilityState={{ selected: item.active }}
        >
          <View>
            <Text style={[styles.navIcon, item.active && styles.navIconActive]}>{item.icon}</Text>
            {item.notify && <NotifyDot />}
          </View>
        </TouchableOpacity>
      ))}
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
  const audio = useGameAudio();

  const handlePlay        = useCallback(() => { audio.play('button'); onPlay(); },        [audio, onPlay]);
  const handleSelectLevel = useCallback(() => { audio.play('button'); onSelectLevel(); }, [audio, onSelectLevel]);

  const btnSc    = useRef(new Animated.Value(0)).current;
  const pulse    = useRef(new Animated.Value(1)).current;
  const navEnter = useRef(new Animated.Value(0)).current;

  const [toast, setToast] = useState<string | null>(null);
  const toastOp = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(btnSc,    { toValue: 1, tension: 50, friction: 8, delay: 220, useNativeDriver: true }),
      Animated.timing(navEnter, { toValue: 1, duration: 420, delay: 320, useNativeDriver: true }),
    ]).start(() => {
      Animated.loop(Animated.sequence([
        Animated.timing(pulse, { toValue: 1.04, duration: 950, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 950, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])).start();
    });
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    toastOp.setValue(0);
    Animated.sequence([
      Animated.timing(toastOp, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1600),
      Animated.timing(toastOp, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setToast(null));
  };

  const handleDaily = () => {
    audio.play('button');
    const r = onClaimDaily();
    showToast(r.claimed ? `⚜️  +${r.reward} gold claimed!` : '⚜️  Already claimed today');
  };

  // Trophies and Settings have no screens yet. Say so rather than leaving a
  // button that silently does nothing.
  const handleLocked = (what: string) => {
    audio.play('button');
    showToast(`🔒  ${what} coming soon`);
  };

  return (
    <View style={styles.root}>

      {/* The kingdom itself — full bleed, no chrome over it */}
      {/* Continues the art's own ground colour into any shortfall below it,
          darkening with depth so it reads as the path receding, not a band */}
      <LinearGradient
        colors={[ART_FOOT, '#2a1330', '#160a1e']}
        style={styles.artFoot}
        pointerEvents="none"
      />

      <Image
        source={require('../../assets/kgf-orbito-splash-master.png')}
        style={styles.art}
        resizeMode="stretch"
      />

      {/* Readability scrims: just enough to seat the HUD and the controls */}
      <LinearGradient
        colors={['rgba(6,2,16,0.55)', 'transparent']}
        style={styles.topScrim}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['transparent', 'rgba(6,2,16,0.35)', 'rgba(6,2,16,0.82)']}
        style={styles.bottomScrim}
        pointerEvents="none"
      />

      <Hud stars={progress.totalStars} max={MAX_STARS_TOTAL} coins={progress.coins} />

      <View style={styles.controls}>
        <BattleButton onPress={handlePlay} pulseAnim={pulse} entranceAnim={btnSc} />
        <BottomNav
          onMap={handleSelectLevel}
          onDaily={handleDaily}
          onLocked={handleLocked}
          dailyAvailable={isDailyRewardAvailable(progress)}
          entrance={navEnter}
        />
      </View>

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
  root: { flex: 1, backgroundColor: '#0d0514', overflow: 'hidden' },

  art: {
    position: 'absolute',
    width: ART_W,
    height: ART_H,
    left: 0,
    top: 0,
  },
  artFoot: {
    position: 'absolute',
    left: 0, right: 0,
    top: Math.max(0, ART_H - 2),
    bottom: 0,
  },

  topScrim: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 110,
  },
  bottomScrim: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 260,
  },

  // ── HUD ──
  hud: {
    position: 'absolute', top: 16, left: SIDE, right: SIDE,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    zIndex: 20,
  },
  hudGroup: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  hudIcon: { fontSize: 15 * S },
  hudValue: {
    color: GOLD, fontSize: 14 * S, fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  hudMuted: {
    color: 'rgba(255,255,255,0.62)', fontSize: 12 * S, fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },

  // ── Controls stack ──
  controls: {
    position: 'absolute', left: SIDE, right: SIDE, bottom: 16,
    gap: 10, zIndex: 20,
  },

  // ── Battle button ──
  battleWrap: {
    shadowColor: '#8b1a0a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55, shadowRadius: 16, elevation: 10,
  },
  battleOuter: {
    borderRadius: 30, overflow: 'hidden',
    borderWidth: 1.5, borderColor: 'rgba(255,190,120,0.5)',
  },
  battleBtn: {
    height: 56, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  battleSheen: {
    position: 'absolute', top: 0, left: 0, right: 0, height: '48%',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  battleText: {
    color: '#fff', fontSize: 21 * S, fontWeight: '900', letterSpacing: 2.4 * S,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 5,
  },

  // ── Bottom nav ──
  navBar: {
    flexDirection: 'row', alignItems: 'center',
    height: 50, borderRadius: 25,
    backgroundColor: 'rgba(12,5,26,0.82)',
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.16)',
  },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navIcon: { fontSize: 19 * S, opacity: 0.5 },
  navIconActive: { opacity: 1 },
  notifyDot: {
    position: 'absolute', top: -1, right: -5,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: GOLD,
    borderWidth: 1, borderColor: 'rgba(40,12,0,0.9)',
  },

  // ── Toast ──
  toast: {
    position: 'absolute', bottom: 92, alignSelf: 'center',
    backgroundColor: 'rgba(50,10,4,0.95)',
    borderRadius: 20, paddingHorizontal: 20, paddingVertical: 11,
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.45)', zIndex: 50,
  },
  toastText: { color: GOLD, fontSize: 13.5 * S, fontWeight: '900', letterSpacing: 0.4 },
});
