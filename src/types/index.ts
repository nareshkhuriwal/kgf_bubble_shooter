export type BubbleColor =
  | 'red'
  | 'blue'
  | 'green'
  | 'yellow'
  | 'purple'
  | 'orange'
  | 'pink'
  | 'cyan';

export interface Bubble {
  id: string;
  color: BubbleColor;
  row: number;
  col: number;
  x: number;
  y: number;
  isPopping?: boolean;
  isFalling?: boolean;
}

export interface ProjectileBubble {
  color: BubbleColor;
  x: number;
  y: number;
  vx: number;
  vy: number;
  isMoving: boolean;
}

export interface GameState {
  grid: (Bubble | null)[][];
  projectile: ProjectileBubble | null;
  nextColor: BubbleColor;
  score: number;
  level: number;
  shotsLeft: number;
  isGameOver: boolean;
  isLevelComplete: boolean;
  cannonAngle: number;
  combo: number;
  highScore: number;
  starsEarned: number;
  lastPoppedIds: string[];   // ids that just matched & blasted this tick
  lastFallingIds: string[];  // ids that became unconnected this tick
}

export interface LevelConfig {
  level: number;
  rows: number;
  cols: number;
  colors: BubbleColor[];
  shotsAllowed: number;
  targetScore: number;
  bubblePattern?: string[][];
}

// Global persistent progress across all 10 levels
export interface PlayerProgress {
  levelStars: number[];   // index = level-1, value = 0-3 stars
  totalStars: number;     // sum of all levelStars
  highScore: number;
  unlockedUpTo: number;   // highest level unlocked (1-based)
}

export type GameAction =
  | { type: 'SHOOT'; angle: number }
  | { type: 'TICK'; dt: number }
  | { type: 'AIM'; angle: number }
  | { type: 'RESET_LEVEL' }
  | { type: 'NEXT_LEVEL' }
  | { type: 'POP_BUBBLES'; ids: string[] }
  | { type: 'SETTLE_PROJECTILE'; row: number; col: number }
  | { type: 'SET_HIGH_SCORE'; score: number };
