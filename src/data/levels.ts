import { BubbleColor, LevelConfig } from '../types';

const COLS = 8;

const palettes: BubbleColor[][] = [
  ['red', 'blue', 'green', 'yellow'],
  ['red', 'blue', 'green', 'yellow', 'purple'],
  ['red', 'blue', 'green', 'yellow', 'purple', 'orange'],
  ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink'],
  ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan'],
];

const WORLD_NAMES = ['The Village', 'The Fortress', 'The Citadel', "Dragon's Keep"];

function makePattern(level: number, rows: number): string[][] {
  const pattern: string[][] = [];
  for (let r = 0; r < rows; r++) {
    const cols = r % 2 === 1 ? COLS - 1 : COLS;
    const row: string[] = [];
    for (let c = 0; c < cols; c++) {
      const edge = c === 0 || c === cols - 1;
      const checker = (r + c + level) % 5 === 0;
      const lane = c === Math.floor(cols / 2) && level % 4 === 0;
      // Steel: columns 2 and cols-3, every 3rd row from row 2 — interior pillars
      const steelPillar = !edge && r > 1 && r % 3 === 1 && (c === 2 || c === cols - 3);
      if      (level > 24 && checker) row.push('L');
      else if (level > 18 && lane)    row.push('I');
      else if (level > 15 && steelPillar) row.push('T');
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
  { id: 1, name: 'The Village',    label: 'Peasant',     levelRange: [1,  8]  as const, colors: ['#1a3a0a', '#4a7c2f'] as const },
  { id: 2, name: 'The Fortress',   label: 'Knight',      levelRange: [9,  16] as const, colors: ['#2a1a0e', '#8B4513'] as const },
  { id: 3, name: 'The Citadel',    label: 'Baron',       levelRange: [17, 24] as const, colors: ['#3a0a0a', '#C0392B'] as const },
  { id: 4, name: "Dragon's Keep",  label: 'Dragon Lord', levelRange: [25, 32] as const, colors: ['#1a0a2e', '#7B0000'] as const },
];
