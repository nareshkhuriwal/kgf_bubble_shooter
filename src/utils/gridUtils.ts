import { Bubble, BubbleColor } from '../types';
import {
  BUBBLE_RADIUS,
  BUBBLE_DIAMETER,
  COLS,
  GRID_OFFSET_X,
  GRID_OFFSET_Y,
  HEX_OFFSET,
  MIN_MATCH,
} from '../constants/gameConfig';

// ─── Position ─────────────────────────────────────────────────────────────────
export function getBubblePosition(row: number, col: number): { x: number; y: number } {
  const isOddRow = row % 2 === 1;
  const x = GRID_OFFSET_X + BUBBLE_RADIUS + col * BUBBLE_DIAMETER + (isOddRow ? HEX_OFFSET : 0);
  const y = GRID_OFFSET_Y + BUBBLE_RADIUS + row * (BUBBLE_DIAMETER * 0.866);
  return { x, y };
}

export function getGridCell(x: number, y: number): { row: number; col: number } | null {
  const relY = y - GRID_OFFSET_Y;
  const rowHeight = BUBBLE_DIAMETER * 0.866;
  const row = Math.round(relY / rowHeight);
  if (row < 0) return null;

  const isOddRow = row % 2 === 1;
  const relX = x - GRID_OFFSET_X - (isOddRow ? HEX_OFFSET : 0);
  const col = Math.round((relX - BUBBLE_RADIUS) / BUBBLE_DIAMETER);

  const maxCols = isOddRow ? COLS - 1 : COLS;
  if (col < 0 || col >= maxCols) return null;

  return { row, col };
}

// ─── Hex neighbours ──────────────────────────────────────────────────────────
// In a hex grid with offset rows, the 6 neighbours depend on whether the
// current row is even or odd.
//
//  Even row:          Odd row:
//  TL=(-1,-1)  TR=(-1,0)    TL=(-1,0)  TR=(-1,+1)
//  L =(0, -1)  R =(0, +1)   L =(0, -1) R =(0, +1)
//  BL=(+1,-1)  BR=(+1, 0)   BL=(+1,0)  BR=(+1,+1)
//
export function getNeighbors(
  row: number,
  col: number,
  grid: (Bubble | null)[][]
): { row: number; col: number }[] {
  const isOddRow = row % 2 === 1;

  const offsets = isOddRow
    ? [ [-1,  0], [-1, +1], [0, -1], [0, +1], [+1,  0], [+1, +1] ]
    : [ [-1, -1], [-1,  0], [0, -1], [0, +1], [+1, -1], [+1,  0] ];

  const result: { row: number; col: number }[] = [];
  for (const [dr, dc] of offsets) {
    const nr = row + dr;
    const nc = col + dc;
    if (nr >= 0 && nr < grid.length && nc >= 0 && nc < (grid[nr]?.length ?? 0)) {
      result.push({ row: nr, col: nc });
    }
  }
  return result;
}

// ─── BFS match (same colour connected group) ────────────────────────────────
export function findMatches(
  row: number,
  col: number,
  color: BubbleColor,
  grid: (Bubble | null)[][]
): string[] {
  const visited = new Set<string>();
  const ids: string[] = [];

  const stack: { row: number; col: number }[] = [{ row, col }];

  while (stack.length > 0) {
    const cur = stack.pop()!;
    const key = `${cur.row}-${cur.col}`;
    if (visited.has(key)) continue;
    const cell = grid[cur.row]?.[cur.col];
    if (!cell || cell.color !== color) continue;
    visited.add(key);
    ids.push(cell.id);
    for (const n of getNeighbors(cur.row, cur.col, grid)) {
      if (!visited.has(`${n.row}-${n.col}`)) stack.push(n);
    }
  }

  return ids.length >= MIN_MATCH ? ids : [];
}

// ─── BFS floating-bubble detection ──────────────────────────────────────────
export function findFloatingBubbles(grid: (Bubble | null)[][]): string[] {
  const connected = new Set<string>();
  const queue: { row: number; col: number }[] = [];

  // Seed from every filled cell in row 0
  const topLen = grid[0]?.length ?? 0;
  for (let c = 0; c < topLen; c++) {
    if (grid[0]?.[c]) {
      queue.push({ row: 0, col: c });
      connected.add(`0-${c}`);
    }
  }

  while (queue.length > 0) {
    const cur = queue.shift()!;
    for (const n of getNeighbors(cur.row, cur.col, grid)) {
      const key = `${n.row}-${n.col}`;
      if (!connected.has(key) && grid[n.row]?.[n.col]) {
        connected.add(key);
        queue.push(n);
      }
    }
  }

  const floating: string[] = [];
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < (grid[r]?.length ?? 0); c++) {
      const b = grid[r][c];
      if (b && !connected.has(`${r}-${c}`)) floating.push(b.id);
    }
  }
  return floating;
}

// ─── Grid factory helpers ────────────────────────────────────────────────────
export function createEmptyGrid(rows: number, cols: number): (Bubble | null)[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(null));
}

export function generateInitialGrid(
  rows: number,
  cols: number,
  colors: BubbleColor[]
): (Bubble | null)[][] {
  // Extra empty rows below for the shooter to work in
  const grid = createEmptyGrid(rows + 5, cols);
  for (let r = 0; r < rows; r++) {
    const colCount = r % 2 === 1 ? cols - 1 : cols;
    for (let c = 0; c < colCount; c++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const pos = getBubblePosition(r, c);
      grid[r][c] = {
        id: `${r}-${c}-${Date.now()}-${Math.random()}`,
        color,
        row: r,
        col: c,
        x: pos.x,
        y: pos.y,
      };
    }
  }
  return grid;
}

export function randomColor(colors: BubbleColor[]): BubbleColor {
  return colors[Math.floor(Math.random() * colors.length)];
}

export function getColorsInGrid(grid: (Bubble | null)[][]): BubbleColor[] {
  const s = new Set<BubbleColor>();
  for (const row of grid) for (const b of row) if (b) s.add(b.color);
  return Array.from(s);
}

export function countBubbles(grid: (Bubble | null)[][]): number {
  let n = 0;
  for (const row of grid) for (const b of row) if (b) n++;
  return n;
}
