/**
 * Proves whether a ceiling drop preserves the hex lattice.
 *
 * getNeighbors() and getBubblePosition() both branch on `row % 2`. dropGrid()
 * moves every bubble from row r to r+1, which inverts the parity of the whole
 * board — so a drop is not a rigid translation of the stack.
 *
 * Run: npx tsx scripts/grid-drop-check.ts
 */
import { Bubble, BubbleColor } from '../src/types';
import { dropGrid, findFloatingBubbles, getNeighbors, getBubblePosition } from '../src/utils/gridUtils';

const COLS = 8;
const COLORS: BubbleColor[] = ['red', 'blue', 'green'];

function bubble(row: number, col: number): Bubble {
  const pos = getBubblePosition(row, col);
  return { id: `b-${row}-${col}`, color: 'red', kind: 'normal', row, col, x: pos.x, y: pos.y };
}

/** row 0 full, then a connected blob hanging beneath it */
function makeGrid(): (Bubble | null)[][] {
  const g: (Bubble | null)[][] = [];
  g.push(Array.from({ length: COLS }, (_, c) => bubble(0, c)));           // full ceiling row
  g.push(Array.from({ length: COLS }, (_, c) => (c < 5 ? bubble(1, c) : null)));
  g.push(Array.from({ length: COLS }, (_, c) => (c < 3 ? bubble(2, c) : null)));
  g.push(Array.from({ length: COLS }, (_, c) => (c < 2 ? bubble(3, c) : null)));
  return g;
}

function neighbourPairs(grid: (Bubble | null)[][]) {
  const pairs = new Set<string>();
  for (let r = 0; r < grid.length; r++)
    for (let c = 0; c < (grid[r]?.length ?? 0); c++) {
      const b = grid[r][c];
      if (!b) continue;
      for (const n of getNeighbors(r, c, grid)) {
        const nb = grid[n.row]?.[n.col];
        if (nb) pairs.add([b.id, nb.id].sort().join('|'));
      }
    }
  return pairs;
}

const before = makeGrid();
const floatBefore = findFloatingBubbles(before);
const pairsBefore = neighbourPairs(before);

const after = dropGrid(before, COLORS, COLS);
const floatAfter = findFloatingBubbles(after);
const pairsAfter = neighbourPairs(after);

// Which adjacencies among the ORIGINAL bubbles survived the drop?
const original = new Set<string>();
for (const row of before) for (const b of row) if (b) original.add(b.id);
const bothOriginal = (k: string) => k.split('|').every(id => original.has(id));

const lost = [...pairsBefore].filter(k => !pairsAfter.has(k));
const gained = [...pairsAfter].filter(k => bothOriginal(k) && !pairsBefore.has(k));

console.log(`grid rows            : ${before.length} -> ${after.length}`);
console.log(`floating before drop : ${floatBefore.length}`);
console.log(`floating after drop  : ${floatAfter.length}`);
console.log(`adjacencies lost     : ${lost.length}`);
console.log(`adjacencies invented : ${gained.length}`);

// A drop should slide the stack down intact: same neighbours, nothing detached.
const rigid = lost.length === 0 && gained.length === 0;
console.log('');
console.log(`drop preserves the lattice : ${rigid ? 'PASS' : 'FAIL'}`);
if (!rigid) {
  console.log('  lost     e.g.', lost.slice(0, 4));
  console.log('  invented e.g.', gained.slice(0, 4));
  // show the x-shear
  const b = before[1][0]!;
  const a = after[2][0]!;
  console.log(`  bubble b-1-0 x: ${b.x.toFixed(1)} -> ${a.x.toFixed(1)} (moved ${(a.x - b.x).toFixed(1)}px sideways)`);
}
process.exit(rigid ? 0 : 1);
