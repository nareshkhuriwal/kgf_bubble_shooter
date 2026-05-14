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

  // ☄️ Meteor — entire row + entire column (cross blast)
  if (kind === 'meteor') {
    const cols = grid[row]?.length ?? 0;
    for (let c = 0; c < cols; c++) collectCell(grid, row, c, ids);
    for (let r = 0; r < grid.length; r++) collectCell(grid, r, col, ids);
    // Also clear adjacent rows for the devastating effect
    if (row > 0) {
      const aboveCols = grid[row - 1]?.length ?? 0;
      for (let c = 0; c < aboveCols; c++) collectCell(grid, row - 1, c, ids);
    }
    if (row + 1 < grid.length) {
      const belowCols = grid[row + 1]?.length ?? 0;
      for (let c = 0; c < belowCols; c++) collectCell(grid, row + 1, c, ids);
    }
  }

  // 💫 Star — all bubbles within 3 hex-cell radius (massive area blast)
  if (kind === 'star') {
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < (grid[r]?.length ?? 0); c++) {
        const dr = Math.abs(r - row);
        const dc = Math.abs(c - col);
        // Approximate hex distance ≤ 3
        if (dr <= 3 && dc <= 3 && dr + dc <= 5) {
          collectCell(grid, r, c, ids);
        }
      }
    }
  }

  // Filter out indestructible steel bubbles (only power-ups clear them, not matches)
  // Steel is already clearable by ALL power-ups — filter stone/blocker only
  const result = Array.from(ids).filter(id => {
    for (const rowArr of grid) {
      for (const b of rowArr) {
        if (b?.id === id && (b.kind === 'stone' || b.kind === 'blocker')) return false;
      }
    }
    return true;
  });

  return {
    clearedIds: result,
    freezeTicks: kind === 'freeze' ? 2 : 0,
  };
}
