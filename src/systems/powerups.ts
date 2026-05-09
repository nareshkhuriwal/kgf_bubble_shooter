import { Bubble, PowerUpKind } from '../types';
import { getNeighbors } from '../utils/gridUtils';

type Grid = (Bubble | null)[][];

function collectCell(grid: Grid, row: number, col: number, ids: Set<string>) {
  const bubble = grid[row]?.[col];
  if (bubble) ids.add(bubble.id);
}

export function resolvePowerUp(
  kind: PowerUpKind,
  row: number,
  col: number,
  grid: Grid
): { clearedIds: string[]; freezeTicks: number } {
  const ids = new Set<string>();
  collectCell(grid, row, col, ids);

  if (kind === 'bomb') {
    getNeighbors(row, col, grid).forEach(n => collectCell(grid, n.row, n.col, ids));
    getNeighbors(row, col, grid).forEach(n => {
      getNeighbors(n.row, n.col, grid).forEach(nn => {
        if (Math.abs(nn.row - row) <= 2) collectCell(grid, nn.row, nn.col, ids);
      });
    });
  }

  if (kind === 'fire') {
    for (let c = 0; c < (grid[row]?.length ?? 0); c++) collectCell(grid, row, c, ids);
  }

  if (kind === 'rocket') {
    for (let r = 0; r < grid.length; r++) collectCell(grid, r, col, ids);
  }

  if (kind === 'lightning') {
    const filled = grid.flat().filter(Boolean) as Bubble[];
    filled
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(9, filled.length))
      .forEach(b => ids.add(b.id));
  }

  if (kind === 'rainbow') {
    const neighbors = getNeighbors(row, col, grid)
      .map(n => grid[n.row]?.[n.col])
      .filter(Boolean) as Bubble[];
    const color = neighbors.find(b => b.kind === 'normal' || b.kind === 'ice')?.color;
    if (color) {
      for (const line of grid) {
        for (const bubble of line) {
          if (bubble?.color === color && bubble.kind !== 'stone' && bubble.kind !== 'blocker') {
            ids.add(bubble.id);
          }
        }
      }
    }
  }

  if (kind === 'freeze') {
    getNeighbors(row, col, grid).forEach(n => collectCell(grid, n.row, n.col, ids));
  }

  return {
    clearedIds: Array.from(ids),
    freezeTicks: kind === 'freeze' ? 2 : 0,
  };
}
