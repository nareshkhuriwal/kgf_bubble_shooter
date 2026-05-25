import { useReducer, useCallback, useRef, useEffect } from 'react';
import { GameState, Bubble } from '../types';
import {
  LEVELS,
  TOTAL_LEVELS,
  POINTS_PER_BUBBLE,
  COMBO_MULTIPLIER,
  FALL_BONUS,
  SHOT_BONUS,
  POWERUP_BONUS,
  BUBBLE_RADIUS,
  CANNON_LENGTH,
  CANNON_X,
  CANNON_Y,
  SWAPS_PER_LEVEL,
  SHOTS_PER_DROP,
  DANGER_Y,
  calcStars,
} from '../constants/gameConfig';
import {
  generateInitialGrid,
  getBubblePosition,
  findMatches,
  findFloatingBubbles,
  randomPlayBubble,
  getColorsInGrid,
  countBubbles,
  dropGrid,
} from '../utils/gridUtils';
import {
  stepProjectile,
  checkCollision,
  angleToVector,
  angleToUnitVector,
  aimAngle as calcAimAngle,
  clampAngle,
} from '../utils/physics';
import { resolvePowerUp } from '../systems/powerups';

function getLevelConfig(level: number) {
  return LEVELS[Math.min(level - 1, LEVELS.length - 1)];
}

function buildInitialState(level: number, highScore: number): GameState {
  const config = getLevelConfig(level);
  const grid = generateInitialGrid(config.rows, config.cols, config.colors, config);
  const colorsInGrid = getColorsInGrid(grid);
  const playableColors = colorsInGrid.length > 0 ? colorsInGrid : config.colors;
  const rate = config.powerUpRate ?? 0;
  const nextBubble   = randomPlayBubble(playableColors, rate);
  const bubbleQueue  = [
    randomPlayBubble(playableColors, rate),
    randomPlayBubble(playableColors, rate),
  ];
  const initialBubbleCount = countBubbles(grid);
  return {
    grid,
    projectile: null,
    nextColor: nextBubble.color,
    nextBubble,
    bubbleQueue,
    score: 0,
    level,
    shotsLeft: config.shotsAllowed,
    isGameOver: false,
    isLevelComplete: false,
    cannonAngle: 90,
    combo: 0,
    highScore,
    starsEarned: 0,
    lastPoppedIds: [],
    lastFallingIds: [],
    bubblesRemaining: initialBubbleCount,
    initialBubbleCount,
    coinsEarned: 0,
    mode: 'classic',
    freezeTicks: 0,
    swapsLeft: SWAPS_PER_LEVEL,
    shotsSinceDrop: 0,
  };
}

type EngineAction =
  | { type: 'AIM_AT'; x: number; y: number }
  | { type: 'SHOOT' }
  | { type: 'TICK'; dt: number }
  | { type: 'RESET' }
  | { type: 'NEXT_LEVEL' }
  | { type: 'GO_TO_LEVEL'; level: number }
  | { type: 'SWAP_BUBBLE' }
  | { type: 'CLEAR_PROJECTILE' };

function gameReducer(state: GameState, action: EngineAction): GameState {
  switch (action.type) {

    case 'AIM_AT': {
      return { ...state, cannonAngle: clampAngle(calcAimAngle(CANNON_X, CANNON_Y, action.x, action.y)) };
    }

    case 'SHOOT': {
      if (state.projectile?.isMoving || state.isGameOver || state.isLevelComplete || state.shotsLeft <= 0)
        return state;
      const { vx, vy } = angleToVector(state.cannonAngle);
      const unit = angleToUnitVector(state.cannonAngle);
      const muzzleOffset = CANNON_LENGTH + BUBBLE_RADIUS * 0.35;
      const config = getLevelConfig(state.level);

      // Ceiling drop: every SHOTS_PER_DROP shots, shift grid down one row
      const newShotsSinceDrop = state.shotsSinceDrop + 1;
      const shouldDrop = newShotsSinceDrop >= SHOTS_PER_DROP;
      let droppedGrid = state.grid;
      if (shouldDrop) {
        const liveColors = getColorsInGrid(state.grid);
        const dropColors = liveColors.length > 0 ? liveColors : config.colors;
        droppedGrid = dropGrid(state.grid, dropColors, config.cols);
      }

      // Check if any bubble now crosses the danger line (game over)
      const ceilingGameOver = droppedGrid.some(row =>
        row.some(b => b !== null && b.y + BUBBLE_RADIUS >= DANGER_Y)
      );

      const colorsInGrid = getColorsInGrid(droppedGrid);
      const playableColors = colorsInGrid.length > 0 ? colorsInGrid : config.colors;
      const [upcomingNext, ...rest] = state.bubbleQueue;
      const newQueued = randomPlayBubble(playableColors, config.powerUpRate ?? 0);

      return {
        ...state,
        grid: droppedGrid,
        lastPoppedIds: [],
        lastFallingIds: [],
        projectile: {
          color: state.nextBubble.color,
          kind: state.nextBubble.kind,
          powerUp: state.nextBubble.powerUp,
          x: CANNON_X + unit.x * muzzleOffset,
          y: CANNON_Y + unit.y * muzzleOffset,
          vx,
          vy,
          isMoving: true,
        },
        nextBubble: upcomingNext ?? state.nextBubble,
        nextColor: (upcomingNext ?? state.nextBubble).color,
        bubbleQueue: [...rest, newQueued],
        shotsLeft: state.shotsLeft - 1,
        shotsSinceDrop: shouldDrop ? 0 : newShotsSinceDrop,
        isGameOver: ceilingGameOver,
      };
    }

    case 'SWAP_BUBBLE': {
      if (state.projectile?.isMoving) return state;
      const [first, ...remaining] = state.bubbleQueue;
      return {
        ...state,
        nextBubble: first,
        nextColor: first.color,
        bubbleQueue: [state.nextBubble, ...remaining],
      };
    }

    case 'TICK': {
      if (!state.projectile?.isMoving) return state;

      const moved = stepProjectile(state.projectile, action.dt);

      // ── Off the bottom ──
      if (moved.y > CANNON_Y + 50) {
        return {
          ...state,
          projectile: { ...moved, isMoving: false },
          isGameOver: state.isGameOver || state.shotsLeft === 0,
          lastPoppedIds: [],
          lastFallingIds: [],
        };
      }

      // ── Check collision ──
      const slot = checkCollision(moved, state.grid);

      if (!slot) {
        // Still flying — clear any stale animation ids
        return {
          ...state,
          projectile: moved,
          lastPoppedIds: [],
          lastFallingIds: [],
        };
      }

      // ── Settle: place bubble in grid ──
      const { row, col } = slot;
      if (
        row < 0 || row >= state.grid.length ||
        col < 0 || col >= (state.grid[row]?.length ?? 0) ||
        state.grid[row][col] !== null  // already occupied — skip
      ) {
        return {
          ...state,
          projectile: { ...moved, isMoving: false },
          isGameOver: state.isGameOver || state.shotsLeft === 0,
          lastPoppedIds: [],
          lastFallingIds: [],
        };
      }

      const pos = getBubblePosition(row, col);
      const newBubble: Bubble = {
        id: `b-${row}-${col}-${Date.now()}`,
        color: state.projectile.color,
        kind: state.projectile.kind,
        row, col,
        x: pos.x, y: pos.y,
      };

      // Clone grid with new bubble inserted
      const newGrid = state.grid.map(r => [...r]);
      newGrid[row][col] = newBubble;

      // ── Match check: ≥3 connected same-colour → BLAST ──
      const powerUpResult = state.projectile.powerUp
        ? resolvePowerUp(state.projectile.powerUp, row, col, newGrid)
        : null;
      const matched = powerUpResult
        ? powerUpResult.clearedIds
        : findMatches(row, col, state.projectile.color, newGrid);
      let scoreGain = 0;
      let newCombo = state.combo;
      let poppedIds: string[] = [];
      let fallingIds: string[] = [];

      if (matched.length >= 3 || powerUpResult) {
        newCombo += 1;
        const mult = 1 + newCombo * COMBO_MULTIPLIER;
        scoreGain += Math.round(matched.length * POINTS_PER_BUBBLE * mult);
        if (powerUpResult) scoreGain += POWERUP_BONUS;
        poppedIds = [...matched];

        // Remove matched bubbles
        const matchSet = new Set(matched);
        for (let r = 0; r < newGrid.length; r++)
          for (let c = 0; c < (newGrid[r]?.length ?? 0); c++)
            if (newGrid[r][c] && matchSet.has(newGrid[r][c]!.id))
              newGrid[r][c] = null;

        // Detect and remove floating bubbles
        const floating = findFloatingBubbles(newGrid);
        if (floating.length > 0) {
          scoreGain += floating.length * FALL_BONUS;
          fallingIds = [...floating];
          const floatSet = new Set(floating);
          for (let r = 0; r < newGrid.length; r++)
            for (let c = 0; c < (newGrid[r]?.length ?? 0); c++)
              if (newGrid[r][c] && floatSet.has(newGrid[r][c]!.id))
                newGrid[r][c] = null;
        }
      } else {
        newCombo = 0;
      }

      const totalBubbles = countBubbles(newGrid);
      const isLevelComplete = totalBubbles === 0;
      const shotsBonus = isLevelComplete ? state.shotsLeft * SHOT_BONUS : 0;
      const newScore = state.score + scoreGain + shotsBonus;
      const starsEarned = isLevelComplete ? calcStars(newScore, state.level) : 0;
      // Preserve ceiling game-over that was set during SHOOT (ceiling drop), or detect normal game over
      const isGameOver = !isLevelComplete && (state.isGameOver || (state.shotsLeft === 0 && totalBubbles > 0));
      const coinsEarned = isLevelComplete ? starsEarned * 25 + Math.floor(newScore / 1000) : state.coinsEarned;

      // Sanitize queue: replace any color no longer present in the grid
      const liveColors = getColorsInGrid(newGrid);
      const fallbackColors = liveColors.length > 0 ? liveColors : getLevelConfig(state.level).colors;
      const sanitize = (b: typeof state.nextBubble) =>
        liveColors.length === 0 || liveColors.includes(b.color)
          ? b
          : randomPlayBubble(fallbackColors, getLevelConfig(state.level).powerUpRate ?? 0);
      const sanitizedNext  = sanitize(state.nextBubble);
      const sanitizedQueue = state.bubbleQueue.map(sanitize);

      return {
        ...state,
        grid: newGrid,
        projectile: { ...moved, isMoving: false },
        score: newScore,
        highScore: Math.max(state.highScore, newScore),
        combo: newCombo,
        isLevelComplete,
        isGameOver,
        starsEarned,
        lastPoppedIds: poppedIds,
        lastFallingIds: fallingIds,
        bubblesRemaining: totalBubbles,
        coinsEarned,
        freezeTicks: Math.max(0, state.freezeTicks - 1) + (powerUpResult?.freezeTicks ?? 0),
        nextBubble: sanitizedNext,
        nextColor: sanitizedNext.color,
        bubbleQueue: sanitizedQueue,
      };
    }

    case 'CLEAR_PROJECTILE':
      return { ...state, projectile: null };

    case 'RESET':
      return buildInitialState(state.level, state.highScore);

    case 'NEXT_LEVEL': {
      const next = state.level >= TOTAL_LEVELS ? 1 : state.level + 1;
      return buildInitialState(next, state.highScore);
    }

    case 'GO_TO_LEVEL':
      return buildInitialState(action.level, state.highScore);

    default:
      return state;
  }
}

export function useGameEngine(startLevel = 1, initialHighScore = 0) {
  const [state, dispatch] = useReducer(
    gameReducer,
    undefined,
    () => buildInitialState(startLevel, initialHighScore)
  );

  const rafRef      = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const running     = useRef(false);

  const tick = useCallback((ts: number) => {
    if (!running.current) return;
    const dt = Math.min((ts - lastTimeRef.current) / 1000, 0.05);
    lastTimeRef.current = ts;
    dispatch({ type: 'TICK', dt });
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const startLoop = useCallback(() => {
    if (running.current) return;
    running.current = true;
    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const stopLoop = useCallback(() => {
    running.current = false;
    cancelAnimationFrame(rafRef.current);
  }, []);

  // Stop loop when projectile is no longer moving (landing or off-screen)
  useEffect(() => {
    if (!state.projectile?.isMoving && running.current) {
      stopLoop();
    }
  }, [state.projectile?.isMoving, stopLoop]);

  useEffect(() => () => { stopLoop(); }, [stopLoop]);

  const shoot = useCallback(() => {
    dispatch({ type: 'SHOOT' });
    startLoop();
  }, [startLoop]);

  const aimAt          = useCallback((x: number, y: number) => dispatch({ type: 'AIM_AT', x, y }), []);
  const reset          = useCallback(() => dispatch({ type: 'RESET' }), []);
  const nextLevel      = useCallback(() => dispatch({ type: 'NEXT_LEVEL' }), []);
  const goToLevel      = useCallback((level: number) => dispatch({ type: 'GO_TO_LEVEL', level }), []);
  const swapBubble     = useCallback(() => dispatch({ type: 'SWAP_BUBBLE' }), []);
  const clearProjectile = useCallback(() => dispatch({ type: 'CLEAR_PROJECTILE' }), []);

  return { state, shoot, aimAt, reset, nextLevel, goToLevel, swapBubble, clearProjectile };
}
