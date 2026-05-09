import { ProjectileBubble, Bubble } from '../types';
import {
  BUBBLE_RADIUS,
  BUBBLE_DIAMETER,
  SCREEN_WIDTH,
  GRID_OFFSET_Y,
  PROJECTILE_SPEED,
  ANGLE_MIN,
  ANGLE_MAX,
  COLS,
  GRID_OFFSET_X,
  HEX_OFFSET,
} from '../constants/gameConfig';

// ─── Angle helpers ────────────────────────────────────────────────────────────
export function clampAngle(a: number): number {
  return Math.max(ANGLE_MIN, Math.min(ANGLE_MAX, a));
}

export function aimAngle(cx: number, cy: number, tx: number, ty: number): number {
  const dx = tx - cx;
  const dy = ty - cy;
  // atan2(dx, -dy) gives angle from upward vertical, in radians
  const deg = Math.atan2(dx, -dy) * (180 / Math.PI) + 90;
  return clampAngle(deg);
}

export function angleToVector(deg: number): { vx: number; vy: number } {
  const rad = (deg * Math.PI) / 180;
  return {
    vx: -Math.cos(rad) * PROJECTILE_SPEED,
    vy: -Math.sin(rad) * PROJECTILE_SPEED,
  };
}

export function angleToUnitVector(deg: number): { x: number; y: number } {
  const rad = (deg * Math.PI) / 180;
  return {
    x: -Math.cos(rad),
    y: -Math.sin(rad),
  };
}

// ─── Step projectile one frame ────────────────────────────────────────────────
export function stepProjectile(p: ProjectileBubble, dt: number): ProjectileBubble {
  if (!p.isMoving) return p;
  let { x, y, vx, vy } = p;
  x += vx * dt;
  y += vy * dt;

  // Wall bounce
  if (x - BUBBLE_RADIUS < 0) { x = BUBBLE_RADIUS; vx = Math.abs(vx); }
  else if (x + BUBBLE_RADIUS > SCREEN_WIDTH) { x = SCREEN_WIDTH - BUBBLE_RADIUS; vx = -Math.abs(vx); }

  return { ...p, x, y, vx, vy };
}

// ─── Collision detection ──────────────────────────────────────────────────────
// Returns the grid cell where the projectile should be placed, or null if still flying.
export function checkCollision(
  p: ProjectileBubble,
  grid: (Bubble | null)[][]
): { row: number; col: number } | null {

  // 1. Hit the ceiling
  if (p.y - BUBBLE_RADIUS <= GRID_OFFSET_Y) {
    return snapToGrid(p.x, GRID_OFFSET_Y + BUBBLE_RADIUS, grid);
  }

  // 2. Overlaps an existing bubble
  const collisionDist = BUBBLE_DIAMETER * 0.95; // slightly under 2r to be forgiving
  for (let r = 0; r < grid.length; r++) {
    const row = grid[r];
    if (!row) continue;
    for (let c = 0; c < row.length; c++) {
      const b = row[c];
      if (!b) continue;
      const dx = p.x - b.x;
      const dy = p.y - b.y;
      if (dx * dx + dy * dy < collisionDist * collisionDist) {
        return bestEmptyNeighbour(p.x, p.y, r, c, grid);
      }
    }
  }

  return null;
}

// ─── Find best empty slot near collision point ────────────────────────────────
function snapToGrid(
  x: number,
  y: number,
  grid: (Bubble | null)[][]
): { row: number; col: number } | null {
  // Estimate row from y
  const rowHeight = BUBBLE_DIAMETER * 0.866;
  const row = Math.max(0, Math.round((y - GRID_OFFSET_Y - BUBBLE_RADIUS) / rowHeight));

  // Try estimated row and one above
  for (const r of [row, row - 1, row + 1]) {
    if (r < 0 || r >= grid.length) continue;
    const isOdd = r % 2 === 1;
    const maxC = isOdd ? COLS - 1 : COLS;
    // Find nearest empty col in this row
    let best: { row: number; col: number } | null = null;
    let bestDist = Infinity;
    for (let c = 0; c < maxC; c++) {
      if (grid[r]?.[c]) continue;
      const bx = GRID_OFFSET_X + BUBBLE_RADIUS + c * BUBBLE_DIAMETER + (isOdd ? HEX_OFFSET : 0);
      const d = Math.abs(bx - x);
      if (d < bestDist) { bestDist = d; best = { row: r, col: c }; }
    }
    if (best) return best;
  }
  return null;
}

function bestEmptyNeighbour(
  px: number,
  py: number,
  hitRow: number,
  hitCol: number,
  grid: (Bubble | null)[][]
): { row: number; col: number } | null {
  const isOdd = hitRow % 2 === 1;
  const offsets = isOdd
    ? [ [-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1] ]
    : [ [-1,-1], [-1, 0], [0, -1], [0, 1], [1,-1], [1, 0] ];

  let best: { row: number; col: number } | null = null;
  let bestDist = Infinity;

  for (const [dr, dc] of offsets) {
    const nr = hitRow + dr;
    const nc = hitCol + dc;
    if (nr < 0 || nr >= grid.length || nc < 0 || nc >= (grid[nr]?.length ?? 0)) continue;
    if (grid[nr][nc]) continue; // occupied
    // Compute position of that slot
    const isOddR = nr % 2 === 1;
    const bx = GRID_OFFSET_X + BUBBLE_RADIUS + nc * BUBBLE_DIAMETER + (isOddR ? HEX_OFFSET : 0);
    const by = GRID_OFFSET_Y + BUBBLE_RADIUS + nr * (BUBBLE_DIAMETER * 0.866);
    const d = Math.sqrt((px - bx) ** 2 + (py - by) ** 2);
    if (d < bestDist) { bestDist = d; best = { row: nr, col: nc }; }
  }

  // Fallback: use geometric snap
  if (!best) return snapToGrid(px, py, grid);
  return best;
}
