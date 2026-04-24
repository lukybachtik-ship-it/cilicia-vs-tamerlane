import type { Position } from '../types/unit';

// Default board bounds (used for standard 9×9 scenarios)
export const DEFAULT_GRID_ROWS = 9;
export const DEFAULT_GRID_COLS = 9;

export function onBoard(pos: Position, gridRows = DEFAULT_GRID_ROWS, gridCols = DEFAULT_GRID_COLS): boolean {
  return pos.row >= 1 && pos.row <= gridRows && pos.col >= 1 && pos.col <= gridCols;
}

// ── Constants ────────────────────────────────────────────────────────────────
export const HEX_SIZE = 36;                           // circumradius (center→vertex)
export const HEX_WIDTH = Math.sqrt(3) * HEX_SIZE;    // ≈ 62.35  (flat width for pointy-top)
export const HEX_HEIGHT = 2 * HEX_SIZE;              // 72       (vertex-to-vertex)
export const HEX_V_SPACING = HEX_HEIGHT * 0.75;      // 54       (row-to-row centre distance)
export const HEX_MARGIN = 40;                         // px padding around the board
export const SVG_WIDTH  = DEFAULT_GRID_COLS * HEX_WIDTH + 2 * HEX_MARGIN;
export const SVG_HEIGHT = (DEFAULT_GRID_ROWS - 1) * HEX_V_SPACING + 2 * HEX_SIZE + 2 * HEX_MARGIN;

/** Compute SVG canvas size for a given grid layout. */
export function getSvgSize(gridRows: number, gridCols: number): { width: number; height: number } {
  return {
    width:  gridCols * HEX_WIDTH + 2 * HEX_MARGIN,
    height: (gridRows - 1) * HEX_V_SPACING + 2 * HEX_SIZE + 2 * HEX_MARGIN,
  };
}

// ── Neighbour delta tables (odd-r offset, 1-indexed rows) ────────────────────
// Odd rows  (1,3,5,7,9) are shifted RIGHT by HEX_WIDTH/2.
const ODD_ROW_DELTAS:  [number, number][] = [[0,+1],[0,-1],[-1,+1],[-1, 0],[+1,+1],[+1, 0]];
// Even rows (2,4,6,8)   are NOT shifted.
const EVEN_ROW_DELTAS: [number, number][] = [[0,+1],[0,-1],[-1, 0],[-1,-1],[+1, 0],[+1,-1]];

// ── Neighbour enumeration ────────────────────────────────────────────────────
export function getHexNeighbors(pos: Position, gridRows = DEFAULT_GRID_ROWS, gridCols = DEFAULT_GRID_COLS): Position[] {
  const deltas = pos.row % 2 === 1 ? ODD_ROW_DELTAS : EVEN_ROW_DELTAS;
  return deltas
    .map(([dr, dc]) => ({ row: pos.row + dr, col: pos.col + dc }))
    .filter(p => onBoard(p, gridRows, gridCols));
}

// ── Cube coordinates (derived for 1-indexed rows with odd-row shift) ─────────
//   x = col − ⌊row/2⌋,   z = row,   y = −x − z
type Cube = { x: number; y: number; z: number };

export function offsetToCube(pos: Position): Cube {
  const x = pos.col - Math.floor(pos.row / 2);
  const z = pos.row;
  const y = -x - z;
  return { x, y, z };
}

export function cubeToOffset(c: Cube): Position {
  return { row: c.z, col: c.x + Math.floor(c.z / 2) };
}

// ── Hex distance ─────────────────────────────────────────────────────────────
export function hexDistance(a: Position, b: Position): number {
  const ca = offsetToCube(a);
  const cb = offsetToCube(b);
  return (
    Math.abs(ca.x - cb.x) +
    Math.abs(ca.y - cb.y) +
    Math.abs(ca.z - cb.z)
  ) / 2;
}

// ── Cube rounding (for line drawing) ────────────────────────────────────────
function cubeRound(x: number, y: number, z: number): Cube {
  let rx = Math.round(x);
  let ry = Math.round(y);
  let rz = Math.round(z);
  const dx = Math.abs(rx - x);
  const dy = Math.abs(ry - y);
  const dz = Math.abs(rz - z);
  if (dx > dy && dx > dz)      rx = -ry - rz;
  else if (dy > dz)            ry = -rx - rz;
  else                         rz = -rx - ry;
  return { x: rx, y: ry, z: rz };
}

// ── Hex line cells (for LOS) ─────────────────────────────────────────────────
// Returns intermediate hexes only (excludes start and end), matching Bresenham contract.
export function getHexLineCells(from: Position, to: Position): Position[] {
  const n = hexDistance(from, to);
  if (n === 0) return [];
  const ca = offsetToCube(from);
  const cb = offsetToCube(to);
  const cells: Position[] = [];
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const rounded = cubeRound(
      ca.x + (cb.x - ca.x) * t,
      ca.y + (cb.y - ca.y) * t,
      ca.z + (cb.z - ca.z) * t,
    );
    cells.push(cubeToOffset(rounded));
  }
  return cells;
}

// ── Pixel geometry ────────────────────────────────────────────────────────────
/** Returns the SVG pixel coordinates of the centre of a hex. */
export function hexCenter(pos: Position): { x: number; y: number } {
  const r = pos.row - 1;                                       // 0-indexed row
  const c = pos.col - 1;                                       // 0-indexed col
  const xShift = pos.row % 2 === 1 ? HEX_WIDTH / 2 : 0;       // odd rows shift right
  return {
    x: c * HEX_WIDTH + xShift + HEX_MARGIN,
    y: r * HEX_V_SPACING + HEX_SIZE + HEX_MARGIN,
  };
}

/** Returns the SVG `points` string for a pointy-top hex centred at (cx, cy). */
export function hexPolygonPoints(cx: number, cy: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30); // pointy-top: start at -30°
    pts.push(
      `${(cx + HEX_SIZE * Math.cos(angle)).toFixed(2)},${(cy + HEX_SIZE * Math.sin(angle)).toFixed(2)}`,
    );
  }
  return pts.join(' ');
}
