import React, { useRef, useState, useEffect, useMemo } from 'react';
import { BackHandler, View, StyleSheet, PanResponder, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
import { BUBBLE_RADIUS, CANNON_Y, SCREEN_WIDTH, SCREEN_HEIGHT } from '../constants/gameConfig';
import { Bubble } from '../types';
import { useGameAudio } from '../systems/audio';

interface GameScreenProps {
  startLevel?: number;
  onHome: () => void;
  onLevelComplete: (level: number, stars: number, score: number) => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  startLevel = 1,
  onHome,
  onLevelComplete,
}) => {
  const { state, shoot, aimAt, reset, nextLevel } = useGameEngine(startLevel);
  const haptics = useHaptics();
  const audio = useGameAudio();
  const { popups, addPopup, removePopup } = useScorePopups();

  const [isAiming, setIsAiming]   = useState(false);
  const [isPaused, setIsPaused]   = useState(false);
  const [isAimValid, setIsAimValid] = useState(false);

  // Snapshot of ALL bubbles before a blast — so we can animate the ghosts
  const [blastSnapshot, setBlastSnapshot] = useState<Map<string, Bubble>>(new Map());

  const prevScoreRef  = useRef(state.score);
  const reportedRef   = useRef(false);
  const prevGridRef   = useRef(state.grid);

  // When a blast happens, capture the grid snapshot BEFORE bubbles disappear
  useEffect(() => {
    const hasBlast = state.lastPoppedIds.length > 0 || state.lastFallingIds.length > 0;
    if (hasBlast) {
      // Build a flat map of id → bubble from the PREVIOUS grid (before removal)
      const snap = new Map<string, Bubble>();
      for (const row of prevGridRef.current) {
        for (const b of row) {
          if (b) snap.set(b.id, b);
        }
      }
      setBlastSnapshot(snap);

      // Haptic + score popup
      haptics.pop();
      audio.play(state.combo >= 2 ? 'combo' : 'pop');
      if (state.combo >= 2) haptics.combo();
      const gained = state.score - prevScoreRef.current;
      if (gained > 0 && state.projectile) {
        addPopup(gained, state.projectile.x, state.projectile.y);
      }

      // Clear snapshot after animation (300 ms is enough for pop anim)
      const timer = setTimeout(() => setBlastSnapshot(new Map()), 400);
      return () => clearTimeout(timer);
    }
    // Keep tracking grid for next blast
    prevGridRef.current = state.grid;
    prevScoreRef.current = state.score;
  }, [state.lastPoppedIds, state.lastFallingIds]);

  // Score popup for non-blast score gain
  useEffect(() => {
    prevGridRef.current = state.grid;
  }, [state.grid]);

  // Report level complete to parent
  useEffect(() => {
    if (state.isLevelComplete && !reportedRef.current) {
      reportedRef.current = true;
      onLevelComplete(state.level, state.starsEarned, state.score);
      haptics.levelComplete();
      audio.play('victory');
    }
    if (!state.isLevelComplete) reportedRef.current = false;
  }, [state.isLevelComplete, state.level]);

  useEffect(() => {
    if (state.isGameOver) audio.play('gameOver');
  }, [state.isGameOver]);

  const isValidAimTarget = (y: number) => y < CANNON_Y - BUBBLE_RADIUS * 1.4;
  const isBackSwipe = (gestureState: { dx: number; dy: number; moveX: number }) =>
    gestureState.moveX < 86 && gestureState.dx > 58 && Math.abs(gestureState.dy) < 42;

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isPaused) {
        setIsPaused(false);
        return true;
      }
      onHome();
      return true;
    });
    return () => subscription.remove();
  }, [isPaused, onHome]);

  const panResponder = useMemo(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant: e => {
        const valid = isValidAimTarget(e.nativeEvent.locationY);
        setIsAiming(valid);
        setIsAimValid(valid);
        if (valid) aimAt(e.nativeEvent.locationX, e.nativeEvent.locationY);
      },
      onPanResponderMove: (e, gestureState) => {
        if (isBackSwipe(gestureState)) {
          setIsAiming(false);
          setIsAimValid(false);
          return;
        }
        const valid = isValidAimTarget(e.nativeEvent.locationY);
        setIsAiming(valid);
        setIsAimValid(valid);
        if (valid) aimAt(e.nativeEvent.locationX, e.nativeEvent.locationY);
      },
      onPanResponderRelease: (e, gestureState) => {
        if (isBackSwipe(gestureState)) {
          setIsAiming(false);
          setIsAimValid(false);
          onHome();
          return;
        }
        const valid = isValidAimTarget(e.nativeEvent.locationY);
        setIsAiming(false);
        setIsAimValid(false);
        if (!valid || state.projectile?.isMoving || state.isGameOver || state.isLevelComplete || isPaused) return;
        aimAt(e.nativeEvent.locationX, e.nativeEvent.locationY);
        haptics.shoot();
        audio.play(state.nextBubble.powerUp ? 'explosion' : 'shoot');
        shoot();
      },
      onPanResponderTerminate: () => {
        setIsAiming(false);
        setIsAimValid(false);
      },
    })
  , [aimAt, audio, haptics, isPaused, onHome, shoot, state.isGameOver, state.isLevelComplete, state.nextBubble.powerUp, state.projectile?.isMoving]);

  const poppingSet = new Set(state.lastPoppedIds);
  const fallingSet = new Set(state.lastFallingIds);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Background />

      <View style={styles.touchArea} {...panResponder.panHandlers}>

        <BubbleGrid
          grid={state.grid}
          poppingIds={poppingSet}
          fallingIds={fallingSet}
          blastSnapshot={blastSnapshot}
        />

        <AimLine angle={state.cannonAngle} visible={isAiming && isAimValid && !state.projectile?.isMoving} />

        {state.projectile && (
          <BubbleView
            color={state.projectile.color}
            kind={state.projectile.kind}
            powerUp={state.projectile.powerUp}
            x={state.projectile.x}
            y={state.projectile.y}
          />
        )}

        <Cannon
          angle={state.cannonAngle}
          currentColor={state.nextBubble.color}
          nextColor={state.nextBubble.color}
          currentPowerUp={state.nextBubble.powerUp}
          nextPowerUp={state.nextBubble.powerUp}
          isAiming={isAiming && isAimValid && !state.projectile?.isMoving}
        />

        {popups.map(p => (
          <ScorePopup key={p.id} score={p.score} x={p.x} y={p.y} onDone={() => removePopup(p.id)} />
        ))}
      </View>

      <HUD
        score={state.score}
        highScore={state.highScore}
        level={state.level}
        shotsLeft={state.shotsLeft}
        combo={state.combo}
        nextBubble={state.nextBubble}
        progress={state.initialBubbleCount > 0 ? 1 - state.bubblesRemaining / state.initialBubbleCount : 1}
        coinsEarned={state.coinsEarned}
        onPause={() => setIsPaused(p => !p)}
        onBack={onHome}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f2e',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  touchArea: {
    position: 'absolute',
    top: 0, left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
});
