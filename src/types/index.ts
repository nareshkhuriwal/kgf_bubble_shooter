export type BubbleColor =
  | 'red'
  | 'blue'
  | 'green'
  | 'yellow'
  | 'purple'
  | 'orange'
  | 'pink'
  | 'cyan';

export type BubbleKind = 'normal' | 'stone' | 'locked' | 'ice' | 'hidden' | 'blocker';

export type PowerUpKind =
  | 'bomb'
  | 'rainbow'
  | 'fire'
  | 'lightning'
  | 'freeze'
  | 'rocket';

export type GameMode = 'classic' | 'timed' | 'endless' | 'challenge';

export interface PlayBubble {
  color: BubbleColor;
  kind: BubbleKind;
  powerUp?: PowerUpKind;
}

export interface Bubble {
  id: string;
  color: BubbleColor;
  kind: BubbleKind;
  row: number;
  col: number;
  x: number;
  y: number;
  isPopping?: boolean;
  isFalling?: boolean;
}

export interface ProjectileBubble {
  color: BubbleColor;
  kind: BubbleKind;
  powerUp?: PowerUpKind;
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
  nextBubble: PlayBubble;
  bubblesRemaining: number;
  initialBubbleCount: number;
  coinsEarned: number;
  mode: GameMode;
  timeLeft?: number;
  freezeTicks: number;
}

export interface LevelConfig {
  level: number;
  world: number;
  name: string;
  rows: number;
  cols: number;
  colors: BubbleColor[];
  shotsAllowed: number;
  targetScore: number;
  obstacleRate?: number;
  powerUpRate?: number;
  movingRows?: boolean;
  rotatingLayout?: boolean;
  bubblePattern?: string[][];
}

// Global persistent progress across all 10 levels
export interface PlayerProgress {
  levelStars: number[];   // index = level-1, value = 0-3 stars
  totalStars: number;     // sum of all levelStars
  highScore: number;
  unlockedUpTo: number;   // highest level unlocked (1-based)
  coins: number;
  achievements: string[];
  lastDailyRewardAt?: string;
  dailyStreak: number;
  claimedDays: number;
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
