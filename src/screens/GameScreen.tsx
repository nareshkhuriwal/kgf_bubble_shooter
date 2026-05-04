import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, PanResponder, StatusBar } from 'react-native';
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
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../constants/gameConfig';
import { Bubble } from '../types';

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
  const { popups, addPopup, removePopup } = useScorePopups();

  const [isAiming, setIsAiming]   = useState(false);
  const [isPaused, setIsPaused]   = useState(false);

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
    }
    if (!state.isLevelComplete) reportedRef.current = false;
  }, [state.isLevelComplete, state.level]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant:   e => { setIsAiming(true);  aimAt(e.nativeEvent.locationX, e.nativeEvent.locationY); },
      onPanResponderMove:    e => { aimAt(e.nativeEvent.locationX, e.nativeEvent.locationY); },
      onPanResponderRelease: e => {
        aimAt(e.nativeEvent.locationX, e.nativeEvent.locationY);
        setIsAiming(false);
        haptics.shoot();
        shoot();
      },
      onPanResponderTerminate: () => setIsAiming(false),
    })
  ).current;

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

        <AimLine angle={state.cannonAngle} visible={isAiming && !state.projectile?.isMoving} />

        {state.projectile && (
          <BubbleView
            color={state.projectile.color}
            x={state.projectile.x}
            y={state.projectile.y}
          />
        )}

        <Cannon
          angle={state.cannonAngle}
          currentColor={state.nextColor}
          nextColor={state.nextColor}
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
        onPause={() => setIsPaused(p => !p)}
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
