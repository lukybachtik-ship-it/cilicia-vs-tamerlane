import type { Position } from '../types/unit';
import { hexDistance, getHexNeighbors } from './hexGrid';

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

/** Hex distance (replaces Chebyshev — now delegates to hexDistance). */
export function chebyshevDistance(a: Position, b: Position): number {
  return hexDistance(a, b);
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

/** Get all 6 hex neighbours of a position (delegates to getHexNeighbors). */
export function getNeighbors(pos: Position): Position[] {
  return getHexNeighbors(pos);
}
