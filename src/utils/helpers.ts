import type { Position } from '../types/unit';

let idCounter = 0;
export function generateId(prefix = 'id'): string {
  return `${prefix}_${++idCounter}_${Date.now()}`;
}

/** Fisher-Yates shuffle — returns a new shuffled array. */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i] as T;
    a[i] = a[j] as T;
    a[j] = tmp;
  }
  return a;
}

export function isOnBoard(pos: Position): boolean {
  return pos.row >= 1 && pos.row <= 9 && pos.col >= 1 && pos.col <= 9;
}

/** Chebyshev distance: diagonal counts as 1. */
export function chebyshevDistance(a: Position, b: Position): number {
  return Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col));
}

export function posKey(pos: Position): string {
  return `${pos.row},${pos.col}`;
}

export function posEqual(a: Position, b: Position): boolean {
  return a.row === b.row && a.col === b.col;
}

/** Column → section name. */
export function getZone(col: number): 'left' | 'center' | 'right' {
  if (col <= 3) return 'left';
  if (col <= 6) return 'center';
  return 'right';
}

/** Get all 8 neighbors of a position (including diagonals). */
export function getNeighbors(pos: Position): Position[] {
  const neighbors: Position[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      neighbors.push({ row: pos.row + dr, col: pos.col + dc });
    }
  }
  return neighbors.filter(isOnBoard);
}
