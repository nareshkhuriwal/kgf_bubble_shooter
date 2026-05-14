import { Dimensions, Platform } from 'react-native';
import { BubbleColor, LevelConfig, PowerUpKind } from '../types';
import { LEVELS as RICH_LEVELS } from '../data/levels';

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
export const GAME_HEADER_HEIGHT = Platform.OS === 'web' ? 132 : Math.max(126, Math.min(152, Math.floor(SCREEN_HEIGHT * 0.17)));

export const BUBBLE_RADIUS = Math.floor((SCREEN_WIDTH - 16) / (COLS * 2));
export const BUBBLE_DIAMETER = BUBBLE_RADIUS * 2;

export const GRID_OFFSET_X = (SCREEN_WIDTH - COLS * BUBBLE_DIAMETER) / 2;
export const GRID_OFFSET_Y = GAME_HEADER_HEIGHT + 18;

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

export const LEVELS: LevelConfig[] = RICH_LEVELS;

export const TOTAL_LEVELS = LEVELS.length;

// Stars per level: 1 = cleared, 2 = cleared with score ≥ target, 3 = cleared with score ≥ 1.5×target
export function calcStars(score: number, levelNum: number): number {
  const cfg = LEVELS[Math.min(levelNum - 1, LEVELS.length - 1)];
  if (score <= 0) return 0;
  if (score >= cfg.targetScore * 1.5) return 3;
  if (score >= cfg.targetScore) return 2;
  return 1; // cleared but below target
}

export const MAX_STARS_TOTAL = TOTAL_LEVELS * 3;

export const POINTS_PER_BUBBLE = 50;
export const COMBO_MULTIPLIER = 0.5;
export const FALL_BONUS = 30;
export const SHOT_BONUS = 20;
export const POWERUP_BONUS = 125;
export const COINS_PER_STAR = 25;
export const MIN_MATCH = 3;
export const ANGLE_MIN = 15;
export const ANGLE_MAX = 165;

export const POWER_UPS: PowerUpKind[] = ['bomb', 'rainbow', 'fire', 'lightning', 'freeze', 'rocket', 'meteor', 'star'];

export const POWER_UP_EMOJI: Record<PowerUpKind, string> = {
  bomb:      '⚔️',
  rainbow:   '🔮',
  fire:      '🔥',
  lightning: '⚡',
  freeze:    '❄️',
  rocket:    '🏹',
  meteor:    '☄️',
  star:      '💫',
};

// Swap feature
export const SWAPS_PER_LEVEL = 2;
