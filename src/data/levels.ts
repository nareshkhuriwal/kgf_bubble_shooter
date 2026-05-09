import { BubbleColor, LevelConfig } from '../types';

const COLS = 8;

const palettes: BubbleColor[][] = [
  ['red', 'blue', 'green', 'yellow'],
  ['red', 'blue', 'green', 'yellow', 'purple'],
  ['red', 'blue', 'green', 'yellow', 'purple', 'orange'],
  ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink'],
  ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan'],
];

const WORLD_NAMES = ['Sunny Pop', 'Neon Garden', 'Crystal Rush', 'Expert Orbit'];

function makePattern(level: number, rows: number): string[][] {
  const pattern: string[][] = [];
  for (let r = 0; r < rows; r++) {
    const cols = r % 2 === 1 ? COLS - 1 : COLS;
    const row: string[] = [];
    for (let c = 0; c < cols; c++) {
      const edge = c === 0 || c === cols - 1;
      const checker = (r + c + level) % 5 === 0;
      const lane = c === Math.floor(cols / 2) && level % 4 === 0;
      if (level > 24 && checker) row.push('L');
      else if (level > 18 && lane) row.push('I');
      else if (level > 11 && edge && r > 1 && r % 3 === 0) row.push('S');
      else row.push('.');
    }
    pattern.push(row);
  }
  return pattern;
}

export const LEVELS: LevelConfig[] = Array.from({ length: 32 }, (_, index) => {
  const level = index + 1;
  const world = Math.ceil(level / 8);
  const rows = Math.min(9, 4 + Math.floor(index / 3));
  const colors = palettes[Math.min(palettes.length - 1, Math.floor(index / 5))];
  const difficulty = index / 31;

  return {
    level,
    world,
    name: `${WORLD_NAMES[world - 1]} ${((level - 1) % 8) + 1}`,
    rows,
    cols: COLS,
    colors,
    shotsAllowed: Math.max(22, 34 + world * 2 - Math.floor(index * 0.45)),
    targetScore: 300 + level * 260 + Math.floor(level * level * 10),
    obstacleRate: level < 7 ? 0 : Math.min(0.18, 0.035 + difficulty * 0.15),
    powerUpRate: Math.min(0.16, 0.04 + difficulty * 0.1),
    movingRows: level >= 13 && level % 4 === 0,
    rotatingLayout: level >= 21 && level % 5 === 0,
    bubblePattern: makePattern(level, rows),
  };
});

export const WORLDS = [
  { id: 1, name: 'World 1', label: 'Easy', levelRange: [1, 8] as const, colors: ['#1a1a4e', '#2ED573'] as const },
  { id: 2, name: 'World 2', label: 'Medium', levelRange: [9, 16] as const, colors: ['#2a1a6e', '#2F86EB'] as const },
  { id: 3, name: 'World 3', label: 'Hard', levelRange: [17, 24] as const, colors: ['#3a144d', '#FF6B35'] as const },
  { id: 4, name: 'World 4', label: 'Expert', levelRange: [25, 32] as const, colors: ['#1b102f', '#FF4757'] as const },
];
