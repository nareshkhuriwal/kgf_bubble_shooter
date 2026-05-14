import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { Animated, BackHandler, View, StyleSheet, PanResponder, StatusBar } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Rect, Line, Circle } from 'react-native-svg';
import { useGameEngine } from '../hooks/useGameEngine';
import { useHaptics } from '../hooks/useHaptics';
import { useScorePopups } from '../hooks/useScorePopups';
import { Background } from '../components/game/Background';
import { BubbleGrid } from '../components/game/BubbleGrid';
import { BubbleView } from '../components/game/BubbleView';
import { Cannon } from '../components/game/Cannon';
import { AimLine } from '../components/game/AimLine';
import { HUD } from '../components/game/HUD';
import { ScorePopup } from '../components/game/ScorePopup';
import { GameOverlay } from '../components/game/GameOverlay';
import {
  BUBBLE_RADIUS, CANNON_Y, SCREEN_WIDTH, SCREEN_HEIGHT,
  GRID_OFFSET_Y, GAME_HEADER_HEIGHT, COLOR_GRADIENTS,
} from '../constants/gameConfig';
import { Bubble } from '../types';
import { useGameAudio } from '../systems/audio';

// ─── Arena frame: stone arch + crown banner above the grid ────────────────────
const ArenaFrame: React.FC = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id="af_banner" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%"   stopColor="#3a0800" stopOpacity="0" />
          <Stop offset="25%"  stopColor="#6a1800" stopOpacity="0.7" />
          <Stop offset="50%"  stopColor="#8a2000" stopOpacity="0.85" />
          <Stop offset="75%"  stopColor="#6a1800" stopOpacity="0.7" />
          <Stop offset="100%" stopColor="#3a0800" stopOpacity="0" />
        </LinearGradient>
      </Defs>

      {/* Stone arch lintel above the grid */}
      <Rect
        x={0} y={GAME_HEADER_HEIGHT}
        width={SCREEN_WIDTH} height={GRID_OFFSET_Y - GAME_HEADER_HEIGHT}
        fill="url(#af_banner)"
      />
      {/* Gold trim at arch base */}
      <Line
        x1={12} y1={GRID_OFFSET_Y - 2}
        x2={SCREEN_WIDTH - 12} y2={GRID_OFFSET_Y - 2}
        stroke="#FFD700" strokeWidth="1" opacity="0.35"
      />

      {/* Left pillar corner block */}
      <Rect x={0} y={GAME_HEADER_HEIGHT}    width={12} height={GRID_OFFSET_Y - GAME_HEADER_HEIGHT} fill="rgba(8,2,18,0.7)" />
      <Rect x={0} y={GAME_HEADER_HEIGHT}    width={3}  height={GRID_OFFSET_Y - GAME_HEADER_HEIGHT} fill="rgba(255,215,0,0.12)" />
      {/* Right pillar corner block */}
      <Rect x={SCREEN_WIDTH - 12} y={GAME_HEADER_HEIGHT} width={12} height={GRID_OFFSET_Y - GAME_HEADER_HEIGHT} fill="rgba(8,2,18,0.7)" />
      <Rect x={SCREEN_WIDTH - 3}  y={GAME_HEADER_HEIGHT} width={3}  height={GRID_OFFSET_Y - GAME_HEADER_HEIGHT} fill="rgba(255,215,0,0.12)" />
    </Svg>
  </View>
);

interface GameScreenProps {
  startLevel?: number;
  initialHighScore?: number;
  onHome: () => void;
  onLevelComplete: (level: number, stars: number, score: number) => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  startLevel = 1,
  initialHighScore = 0,
  onHome,
  onLevelComplete,
}) => {
  const { state, shoot, aimAt, reset, nextLevel, swapBubble } = useGameEngine(startLevel, initialHighScore);

  const haptics = useHaptics();
  const audio   = useGameAudio();
  const { popups, addPopup, removePopup } = useScorePopups();

  const [isAiming,   setIsAiming]   = useState(false);
  const [isPaused,   setIsPaused]   = useState(false);
  const [isAimValid, setIsAimValid] = useState(false);
  const aimValidRef = useRef(false); // always-current mirror of isAimValid for PanResponder
  const [blastSnapshot, setBlastSnapshot] = useState<Map<string, Bubble>>(new Map());

  // ── Screen shake ────────────────────────────────────────────────────────────
  const shakeX = useRef(new Animated.Value(0)).current;
  const shakeY = useRef(new Animated.Value(0)).current;

  // ── Cannon recoil trigger ───────────────────────────────────────────────────
  const [firedAt, setFiredAt] = useState<number | undefined>(undefined);

  // ── Impact flash ────────────────────────────────────────────────────────────
  const impactAnim    = useRef(new Animated.Value(0)).current;
  const impactPosRef  = useRef({ x: SCREEN_WIDTH / 2, y: GRID_OFFSET_Y + 60 });
  const impactColorRef = useRef('#FFD700');
  const [showImpact, setShowImpact] = useState(false);

  // ── Danger zone vignette ────────────────────────────────────────────────────
  const dangerAnim    = useRef(new Animated.Value(0)).current;
  const dangerLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const [dangerActive, setDangerActive] = useState(false);

  // ── Projectile trail (ref mutation — no state, avoids double re-renders) ───
  const trailRef = useRef<Array<{ x: number; y: number; op: number }>>([]);

  // Refs to track values across renders without triggering re-renders
  const prevScoreRef       = useRef(state.score);
  const prevGridRef        = useRef(state.grid);
  const reportedRef        = useRef(false);
  const prevMovingRef      = useRef(false);

  // Keep prevGridRef in sync on every grid change
  useEffect(() => {
    prevGridRef.current = state.grid;
  }, [state.grid]);

  // ── Shot fired / impact detection ─────────────────────────────────────────
  useEffect(() => {
    const isMoving = !!state.projectile?.isMoving;

    if (!prevMovingRef.current && isMoving) {
      // Projectile just started moving — fire recoil
      setFiredAt(Date.now());
      trailRef.current = [];
    }

    if (prevMovingRef.current && !isMoving && state.projectile) {
      // Projectile just stopped — impact flash
      impactPosRef.current  = { x: state.projectile.x, y: state.projectile.y };
      const [c1]            = COLOR_GRADIENTS[state.projectile.color];
      impactColorRef.current = c1;
      impactAnim.setValue(0);
      setShowImpact(true);
      Animated.sequence([
        Animated.timing(impactAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.timing(impactAnim, { toValue: 0, duration: 160, useNativeDriver: true }),
      ]).start(() => setShowImpact(false));
    }

    prevMovingRef.current = isMoving;
  }, [state.projectile?.isMoving]); // eslint-disable-line react-hooks/exhaustive-deps

  // Track trail during projectile flight (during render, safe ref mutation)
  if (state.projectile?.isMoving) {
    const { x, y } = state.projectile;
    const last = trailRef.current[trailRef.current.length - 1];
    if (!last || Math.hypot(x - last.x, y - last.y) > 6) {
      trailRef.current = [
        ...trailRef.current.slice(-10),
        { x, y, op: 1 },
      ];
    }
  } else if (!state.projectile?.isMoving) {
    trailRef.current = [];
  }

  // ── Blast effect: snapshot grid, haptics, audio, score popup, shake ────────
  useEffect(() => {
    const hasBlast = state.lastPoppedIds.length > 0 || state.lastFallingIds.length > 0;
    if (!hasBlast) {
      prevScoreRef.current = state.score;
      return;
    }

    const snap = new Map<string, Bubble>();
    for (const row of prevGridRef.current) {
      for (const b of row) {
        if (b) snap.set(b.id, b);
      }
    }
    setBlastSnapshot(snap);

    haptics.pop();
    audio.play(state.combo >= 2 ? 'combo' : 'pop');
    if (state.combo >= 2) haptics.combo();

    // Screen shake on combo ≥ 3
    if (state.combo >= 3) {
      const mag = Math.min(14, 5 + state.combo * 2);
      shakeX.setValue(0);
      shakeY.setValue(0);
      Animated.sequence([
        Animated.parallel([
          Animated.timing(shakeX, { toValue:  mag, duration: 40, useNativeDriver: true }),
          Animated.timing(shakeY, { toValue: -mag * 0.5, duration: 40, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(shakeX, { toValue: -mag * 0.7, duration: 40, useNativeDriver: true }),
          Animated.timing(shakeY, { toValue:  mag * 0.4, duration: 40, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(shakeX, { toValue:  mag * 0.4, duration: 35, useNativeDriver: true }),
          Animated.timing(shakeY, { toValue: -mag * 0.3, duration: 35, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(shakeX, { toValue: 0, duration: 30, useNativeDriver: true }),
          Animated.timing(shakeY, { toValue: 0, duration: 30, useNativeDriver: true }),
        ]),
      ]).start();
    }

    const gained = state.score - prevScoreRef.current;
    if (gained > 0 && state.projectile) {
      addPopup(gained, state.projectile.x, state.projectile.y, state.combo);
    }
    prevScoreRef.current = state.score;

    const timer = setTimeout(() => setBlastSnapshot(new Map()), 400);
    return () => clearTimeout(timer);
  }, [state.lastPoppedIds, state.lastFallingIds]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Danger zone vignette ───────────────────────────────────────────────────
  useEffect(() => {
    const isDanger = state.shotsLeft <= 5 && !state.isGameOver && !state.isLevelComplete;
    setDangerActive(isDanger);

    if (isDanger) {
      dangerLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(dangerAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(dangerAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        ])
      );
      dangerLoopRef.current.start();
    } else {
      dangerLoopRef.current?.stop();
      dangerAnim.setValue(0);
    }
    return () => { dangerLoopRef.current?.stop(); };
  }, [state.shotsLeft, state.isGameOver, state.isLevelComplete]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Level complete ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (state.isLevelComplete && !reportedRef.current) {
      reportedRef.current = true;
      onLevelComplete(state.level, state.starsEarned, state.score);
      haptics.levelComplete();
      audio.play('victory');
    }
    if (!state.isLevelComplete) reportedRef.current = false;
  }, [state.isLevelComplete]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Game over ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!state.isGameOver) return;
    haptics.gameOver();
    audio.play('gameOver');
  }, [state.isGameOver]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Android hardware back button ───────────────────────────────────────────
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isPaused) { setIsPaused(false); return true; }
      onHome();
      return true;
    });
    return () => sub.remove();
  }, [isPaused, onHome]);

  const isValidAimTarget = useCallback(
    (y: number) => y < CANNON_Y - BUBBLE_RADIUS * 1.4,
    [],
  );

  const isBackSwipe = useCallback(
    (gs: { dx: number; dy: number; moveX: number }) =>
      gs.moveX < 86 && gs.dx > 58 && Math.abs(gs.dy) < 42,
    [],
  );

  const panResponder = useMemo(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,

      onPanResponderGrant: e => {
        const valid = isValidAimTarget(e.nativeEvent.locationY);
        aimValidRef.current = valid;
        setIsAiming(valid);
        setIsAimValid(valid);
        if (valid) aimAt(e.nativeEvent.locationX, e.nativeEvent.locationY);
      },

      onPanResponderMove: (e, gs) => {
        if (isBackSwipe(gs)) {
          aimValidRef.current = false;
          setIsAiming(false);
          setIsAimValid(false);
          return;
        }
        const valid = isValidAimTarget(e.nativeEvent.locationY);
        aimValidRef.current = valid;
        setIsAiming(valid);
        setIsAimValid(valid);
        if (valid) aimAt(e.nativeEvent.locationX, e.nativeEvent.locationY);
      },

      onPanResponderRelease: (e, gs) => {
        if (isBackSwipe(gs)) {
          aimValidRef.current = false;
          setIsAiming(false);
          setIsAimValid(false);
          onHome();
          return;
        }
        // Use the angle set by the last move event — NOT the finger lift position,
        // which can be slightly different and would silently redirect the shot.
        const wasAimValid = aimValidRef.current;
        aimValidRef.current = false;
        setIsAiming(false);
        setIsAimValid(false);
        if (!wasAimValid || state.projectile?.isMoving || state.isGameOver || state.isLevelComplete || isPaused) return;
        haptics.shoot();
        audio.play(state.nextBubble.powerUp ? 'explosion' : 'shoot');
        shoot();
      },

      onPanResponderTerminate: () => {
        aimValidRef.current = false;
        setIsAiming(false);
        setIsAimValid(false);
      },
    }),
    [aimAt, audio, haptics, isBackSwipe, isValidAimTarget, isPaused, onHome,
     shoot, state.isGameOver, state.isLevelComplete, state.nextBubble.powerUp,
     state.projectile?.isMoving, aimValidRef],
  );

  const poppingSet = useMemo(() => new Set(state.lastPoppedIds), [state.lastPoppedIds]);
  const fallingSet = useMemo(() => new Set(state.lastFallingIds), [state.lastFallingIds]);

  // ── Impact flash interpolations ────────────────────────────────────────────
  const impactScale   = impactAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 3.2] });
  const impactOpacity = impactAnim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.75, 0.45, 0] });

  // ── Danger vignette interpolation ─────────────────────────────────────────
  const dangerOpacity = dangerAnim.interpolate({ inputRange: [0, 1], outputRange: [0.0, 0.38] });

  return (
    <Animated.View
      style={[styles.container, { transform: [{ translateX: shakeX }, { translateY: shakeY }] }]}
    >
      <StatusBar barStyle="light-content" />
      <Background />
      <ArenaFrame />

      <View style={styles.touchArea} {...panResponder.panHandlers}>
        <BubbleGrid
          grid={state.grid}
          poppingIds={poppingSet}
          fallingIds={fallingSet}
          blastSnapshot={blastSnapshot}
        />

        <AimLine
          angle={state.cannonAngle}
          visible={isAiming && isAimValid && !state.projectile?.isMoving}
        />

        {/* ── Projectile trail ── */}
        {state.projectile?.isMoving && trailRef.current.length > 1 && (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
              {trailRef.current.map((dot, i) => {
                const frac = (i + 1) / trailRef.current.length;
                return (
                  <Circle
                    key={i}
                    cx={dot.x} cy={dot.y}
                    r={BUBBLE_RADIUS * 0.28 * frac}
                    fill={COLOR_GRADIENTS[state.projectile!.color][0]}
                    opacity={frac * 0.55}
                  />
                );
              })}
            </Svg>
          </View>
        )}

        {state.projectile?.isMoving && (
          <BubbleView
            color={state.projectile.color}
            kind={state.projectile.kind}
            powerUp={state.projectile.powerUp}
            x={state.projectile.x}
            y={state.projectile.y}
          />
        )}

        {/* ── Impact flash ring ── */}
        {showImpact && (
          <Animated.View
            pointerEvents="none"
            style={{
              position:        'absolute',
              left:            impactPosRef.current.x - BUBBLE_RADIUS,
              top:             impactPosRef.current.y - BUBBLE_RADIUS,
              width:           BUBBLE_RADIUS * 2,
              height:          BUBBLE_RADIUS * 2,
              borderRadius:    BUBBLE_RADIUS,
              borderWidth:     2.5,
              borderColor:     impactColorRef.current,
              opacity:         impactOpacity,
              transform:       [{ scale: impactScale }],
            }}
          />
        )}

        <Cannon
          angle={state.cannonAngle}
          currentColor={state.nextBubble.color}
          currentPowerUp={state.nextBubble.powerUp}
          isAiming={isAiming && isAimValid && !state.projectile?.isMoving}
          firedAt={firedAt}
        />

        {popups.map(p => (
          <ScorePopup key={p.id} score={p.score} x={p.x} y={p.y} combo={p.combo} onDone={() => removePopup(p.id)} />
        ))}
      </View>

      {/* ── Danger zone vignette (pulsing red edges when shots ≤ 5) ── */}
      {dangerActive && (
        <Animated.View style={[styles.dangerOverlay, { opacity: dangerOpacity }]} pointerEvents="none">
          <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
            <Defs>
              <RadialGradient id="dz_vignette" cx="50%" cy="50%" r="70%">
                <Stop offset="40%" stopColor="#8B0000" stopOpacity="0" />
                <Stop offset="100%" stopColor="#FF0000" stopOpacity="1" />
              </RadialGradient>
            </Defs>
            <Rect x={0} y={0} width={SCREEN_WIDTH} height={SCREEN_HEIGHT} fill="url(#dz_vignette)" />
          </Svg>
        </Animated.View>
      )}

      <HUD
        score={state.score}
        highScore={state.highScore}
        level={state.level}
        shotsLeft={state.shotsLeft}
        combo={state.combo}
        nextBubble={state.nextBubble}
        bubbleQueue={state.bubbleQueue}
        swapsLeft={state.swapsLeft}
        progress={state.initialBubbleCount > 0 ? 1 - state.bubblesRemaining / state.initialBubbleCount : 1}
        coinsEarned={state.coinsEarned}
        onPause={() => setIsPaused(p => !p)}
        onBack={onHome}
        onSwap={swapBubble}
      />

      {(state.isGameOver || state.isLevelComplete || isPaused) && (
        <GameOverlay
          type={isPaused ? 'pause' : state.isLevelComplete ? 'levelComplete' : 'gameOver'}
          score={state.score}
          level={state.level}
          starsEarned={state.starsEarned}
          highScore={state.highScore}
          onRestart={reset}
          onNextLevel={nextLevel}
          onHome={onHome}
          onResume={() => setIsPaused(false)}
        />
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#010010',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  touchArea: {
    position: 'absolute',
    top: 0, left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  dangerOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
