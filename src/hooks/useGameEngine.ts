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
  const nextBubble = randomPlayBubble(playableColors, config.powerUpRate ?? 0);
  const initialBubbleCount = countBubbles(grid);
  return {
    grid,
    projectile: null,
    nextColor: nextBubble.color,
    nextBubble,
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
  };
}

type EngineAction =
  | { type: 'AIM_AT'; x: number; y: number }
  | { type: 'SHOOT' }
  | { type: 'TICK'; dt: number }
  | { type: 'RESET' }
  | { type: 'NEXT_LEVEL' }
  | { type: 'GO_TO_LEVEL'; level: number };

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
      return {
        ...state,
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
        shotsLeft: state.shotsLeft - 1,
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
          isGameOver: state.shotsLeft === 0,
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
        return { ...state, projectile: { ...moved, isMoving: false }, lastPoppedIds: [], lastFallingIds: [] };
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
      const colorsInGrid = getColorsInGrid(newGrid);
      const config = getLevelConfig(state.level);
      const nextBubble = randomPlayBubble(colorsInGrid.length > 0 ? colorsInGrid : config.colors, config.powerUpRate ?? 0);
      const nextColor = nextBubble.color;
      const isGameOver = !isLevelComplete && state.shotsLeft === 0 && totalBubbles > 0;
      const coinsEarned = isLevelComplete ? starsEarned * 25 + Math.floor(newScore / 1000) : state.coinsEarned;

      return {
        ...state,
        grid: newGrid,
        projectile: { ...moved, isMoving: false },
        nextColor,
        nextBubble,
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
      };
    }

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

export function useGameEngine(startLevel = 1) {
  const [state, dispatch] = useReducer(
    gameReducer,
    undefined,
    () => buildInitialState(startLevel, 0)
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

  useEffect(() => {
    if (state.projectile?.isMoving && !running.current) {
      running.current = true;
      lastTimeRef.current = performance.now();
      rafRef.current = requestAnimationFrame(tick);
    } else if (!state.projectile?.isMoving && running.current) {
      running.current = false;
      cancelAnimationFrame(rafRef.current);
    }
  }, [state.projectile?.isMoving, tick]);

  useEffect(() => () => { running.current = false; cancelAnimationFrame(rafRef.current); }, []);

  const shoot    = useCallback(() => dispatch({ type: 'SHOOT' }), []);
  const aimAt    = useCallback((x: number, y: number) => dispatch({ type: 'AIM_AT', x, y }), []);
  const reset    = useCallback(() => dispatch({ type: 'RESET' }), []);
  const nextLevel = useCallback(() => dispatch({ type: 'NEXT_LEVEL' }), []);
  const goToLevel = useCallback((level: number) => dispatch({ type: 'GO_TO_LEVEL', level }), []);

  return { state, shoot, aimAt, reset, nextLevel, goToLevel };
}
