import type { Position } from '../types/unit';
import { hexDistance, getHexNeighbors, DEFAULT_GRID_ROWS, DEFAULT_GRID_COLS } from './hexGrid';

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

/** Grid-aware board boundary check. */
export function isOnBoard(
  pos: Position,
  gridRows = DEFAULT_GRID_ROWS,
  gridCols = DEFAULT_GRID_COLS
): boolean {
  return pos.row >= 1 && pos.row <= gridRows && pos.col >= 1 && pos.col <= gridCols;
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

/**
 * Všechny jezdecké jednotky — single source of truth pro:
 *   • card filter 'cavalry' (Jízdní zteč)
 *   • pike wall check (+1 auto-hit, −1 kostka útoku při melee)
 *   • combat charge bonus (skrz isChargingThisTurn)
 *   • victory conditions (Ankara encirclement)
 *
 * Pokud přidáváš novou jednotku na koni, PŘIDEJ ji sem.
 */
const CAVALRY_TYPES = new Set<string>([
  // Generické
  'light_cavalry', 'heavy_cavalry', 'horse_archers',
  // Antický Řím
  'equites',
  // Renesance / Borgia
  'gendarme', 'stradiot', 'condottiero',
  // Byzanc (kampaň)
  'belisarius', 'bucelarii', 'cataphract', 'mauri_spearmen',
  // Peršané
  'persian_cavalry', 'firouz',
  // Vandalové
  'vandal_cavalry', 'ammatas', 'gelimer', 'tzazon',
  // Gótové + byzantští velitelé
  'jan_armenian', 'gothic_knight', 'witiges', 'totila',
  // Hunové
  'hunnic_horde', 'zabergan',
]);

/** True if unit type is a cavalry variant (for pike-wall / anti-cavalry checks). */
export function isCavalryType(type: string): boolean {
  return CAVALRY_TYPES.has(type);
}

/**
 * Všechny střelecké jednotky (rangeMax ≥ 2 bez jezdeckých skirmisherů).
 * Používá se pro card filter 'ranged' (Přímá palba — nemůžou se pohnout, +1 kostka).
 *
 * Cavalry skirmisheři (stradiot, mauri_spearmen) sem NEPATŘÍ — kdyby byli,
 * karta Přímá palba by jim zamkla pohyb, což je popře jejich identitu.
 * horse_archers a hunnic_horde jsou výjimka — jsou primárně střelci.
 */
const RANGED_TYPES = new Set<string>([
  // Pěší střelci
  'archers', 'sagittarii', 'gothic_archers',
  // Renesanční střelné zbraně
  'arquebusier', 'crossbowman',
  // Obléhací / dělostřelectvo
  'siege_machine', 'scorpio', 'culverin',
  // Oštěpníci / vrhači
  'framea_thrower', 'stone_throwing_mob',
  // Jízdní lukostřelci (explicitně v textu karty „střelce nebo jízdní lukostřelce")
  'horse_archers', 'hunnic_horde',
]);

/** True if unit is eligible for the 'ranged' card filter (Přímá palba). */
export function isRangedType(type: string): boolean {
  return RANGED_TYPES.has(type);
}

/** True if unit type is a "heavy armour" target for crossbow penalty / rodelero bonus. */
export function isHeavyCavalryType(type: string): boolean {
  return (
    type === 'heavy_cavalry' ||
    type === 'gendarme' ||
    type === 'condottiero'
  );
}

/** Get all 6 hex neighbours of a position (grid-aware). */
export function getNeighbors(
  pos: Position,
  gridRows = DEFAULT_GRID_ROWS,
  gridCols = DEFAULT_GRID_COLS
): Position[] {
  return getHexNeighbors(pos, gridRows, gridCols);
}
