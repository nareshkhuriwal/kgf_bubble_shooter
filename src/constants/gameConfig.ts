import { Dimensions, Platform } from 'react-native';
import { BubbleColor, LevelConfig } from '../types';

const screen = Dimensions.get('window');

export const GAME_MAX_WIDTH = 400;
export const GAME_MAX_HEIGHT = 780;

export const SCREEN_WIDTH = Platform.OS === 'web'
  ? Math.min(screen.width, GAME_MAX_WIDTH)
  : screen.width;
export const SCREEN_HEIGHT = Platform.OS === 'web'
  ? Math.min(screen.height, GAME_MAX_HEIGHT)
  : screen.height;

export const COLS = 8;
export const ROWS = 10;

export const BUBBLE_RADIUS = Math.floor((SCREEN_WIDTH - 16) / (COLS * 2));
export const BUBBLE_DIAMETER = BUBBLE_RADIUS * 2;

export const GRID_OFFSET_X = (SCREEN_WIDTH - COLS * BUBBLE_DIAMETER) / 2;
export const GRID_OFFSET_Y = 80;

export const CANNON_X = SCREEN_WIDTH / 2;
export const CANNON_Y = SCREEN_HEIGHT - 110;
export const CANNON_LENGTH = 55;

export const PROJECTILE_SPEED = 480;
export const GRAVITY = 0;
export const HEX_OFFSET = BUBBLE_RADIUS;

export const COLORS: Record<BubbleColor, string> = {
  red: '#FF4757',
  blue: '#2F86EB',
  green: '#2ED573',
  yellow: '#FFD700',
  purple: '#9B59B6',
  orange: '#FF6B35',
  pink: '#FF69B4',
  cyan: '#00CEC9',
};

export const COLOR_GRADIENTS: Record<BubbleColor, [string, string]> = {
  red: ['#FF6B81', '#FF4757'],
  blue: ['#74B9FF', '#2F86EB'],
  green: ['#55EFC4', '#2ED573'],
  yellow: ['#FDCB6E', '#E17055'],
  purple: ['#C39BD3', '#9B59B6'],
  orange: ['#FFA07A', '#FF6B35'],
  pink: ['#FFB6C1', '#FF69B4'],
  cyan: ['#81ECEC', '#00CEC9'],
};

export const FACE_COLORS: Record<BubbleColor, string> = {
  red: '#C0392B',
  blue: '#1A5276',
  green: '#1E8449',
  yellow: '#B7950B',
  purple: '#6C3483',
  orange: '#A04000',
  pink: '#C0185E',
  cyan: '#148F77',
};

// 10 levels — progressively harder
export const LEVELS: LevelConfig[] = [
  { level: 1,  rows: 4, cols: COLS, colors: ['red','blue','green','yellow'],                               shotsAllowed: 30, targetScore: 300  },
  { level: 2,  rows: 5, cols: COLS, colors: ['red','blue','green','yellow'],                               shotsAllowed: 28, targetScore: 600  },
  { level: 3,  rows: 5, cols: COLS, colors: ['red','blue','green','yellow','purple'],                      shotsAllowed: 28, targetScore: 900  },
  { level: 4,  rows: 6, cols: COLS, colors: ['red','blue','green','yellow','purple'],                      shotsAllowed: 32, targetScore: 1200 },
  { level: 5,  rows: 6, cols: COLS, colors: ['red','blue','green','yellow','purple','orange'],             shotsAllowed: 32, targetScore: 1600 },
  { level: 6,  rows: 7, cols: COLS, colors: ['red','blue','green','yellow','purple','orange'],             shotsAllowed: 35, targetScore: 2000 },
  { level: 7,  rows: 7, cols: COLS, colors: ['red','blue','green','yellow','purple','orange','pink'],      shotsAllowed: 35, targetScore: 2500 },
  { level: 8,  rows: 8, cols: COLS, colors: ['red','blue','green','yellow','purple','orange','pink'],      shotsAllowed: 38, targetScore: 3000 },
  { level: 9,  rows: 8, cols: COLS, colors: ['red','blue','green','yellow','purple','orange','pink','cyan'], shotsAllowed: 38, targetScore: 3600 },
  { level: 10, rows: 9, cols: COLS, colors: ['red','blue','green','yellow','purple','orange','pink','cyan'], shotsAllowed: 40, targetScore: 4500 },
];

export const TOTAL_LEVELS = LEVELS.length; // 10

// Stars per level: 1 = cleared, 2 = cleared with score ≥ target, 3 = cleared with score ≥ 1.5×target
export function calcStars(score: number, levelNum: number): number {
  const cfg = LEVELS[Math.min(levelNum - 1, LEVELS.length - 1)];
  if (score <= 0) return 0;
  if (score >= cfg.targetScore * 1.5) return 3;
  if (score >= cfg.targetScore) return 2;
  return 1; // cleared but below target
}

export const MAX_STARS_TOTAL = TOTAL_LEVELS * 3; // 30

export const POINTS_PER_BUBBLE = 50;
export const COMBO_MULTIPLIER = 0.5;
export const FALL_BONUS = 30;
export const SHOT_BONUS = 20;
export const MIN_MATCH = 3;
export const ANGLE_MIN = 15;
export const ANGLE_MAX = 165;
