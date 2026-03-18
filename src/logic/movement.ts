import type { Position, UnitInstance } from '../types/unit';
import type { GameState } from '../types/game';
import { UNIT_DEFINITIONS } from '../constants/unitDefinitions';
import { posKey, isOnBoard, getNeighbors } from '../utils/helpers';

function getTerrainAt(pos: Position, state: GameState) {
  return state.terrain.find(
    t => t.position.row === pos.row && t.position.col === pos.col
  );
}

function isOccupied(pos: Position, units: UnitInstance[], excludeId?: string): boolean {
  return units.some(
    u => u.id !== excludeId && u.position.row === pos.row && u.position.col === pos.col
  );
}

function isCavalry(unit: UnitInstance): boolean {
  return (
    unit.definitionType === 'light_cavalry' ||
    unit.definitionType === 'heavy_cavalry' ||
    unit.definitionType === 'horse_archers'
  );
}

/**
 * BFS flood-fill for valid move destinations.
 *
 * Rules:
 * - Chebyshev distance (diagonal = 1 step)
 * - Cannot move through or onto squares occupied by any unit
 * - Cavalry cannot enter fortress squares
 * - Forest and Fortress: unit must stop upon entering (cannot continue moving)
 */
export function getValidMoves(unit: UnitInstance, state: GameState): Position[] {
  const def = UNIT_DEFINITIONS[unit.definitionType];
  const ignoresStop = def.ignoresTerrainStop;
  const maxMove = def.move + unit.moveBonus;
  const { gridRows, gridCols } = state;

  const reachable: Position[] = [];
  const visited = new Map<string, number>();

  const queue: Array<{ pos: Position; steps: number; stopped: boolean }> = [
    { pos: unit.position, steps: 0, stopped: false },
  ];

  visited.set(posKey(unit.position), 0);

  while (queue.length > 0) {
    const item = queue.shift()!;
    const { pos, steps, stopped } = item;

    if (stopped && steps > 0) {
      reachable.push(pos);
      continue;
    }

    if (steps > 0) {
      reachable.push(pos);
    }

    if (steps >= maxMove) continue;

    for (const next of getNeighbors(pos, gridRows, gridCols)) {
      if (isOccupied(next, state.units, unit.id)) continue;

      const terrain = getTerrainAt(next, state);
      const terrainType = terrain?.terrain ?? 'plain';

      // Cavalry cannot enter fortress
      if (isCavalry(unit) && terrainType === 'fortress') continue;

      const nextSteps = steps + 1;
      const prevBest = visited.get(posKey(next));
      if (prevBest !== undefined && prevBest <= nextSteps) continue;

      visited.set(posKey(next), nextSteps);

      const mustStop = !ignoresStop && (terrainType === 'forest' || terrainType === 'fortress');
      queue.push({ pos: next, steps: nextSteps, stopped: mustStop });
    }
  }

  return reachable;
}

/**
 * Get the retreat position for a unit (one step toward its home row).
 * Cilicia retreats toward row 1, Tamerlane toward the last row (gridRows).
 * Returns null if blocked by board edge or another unit.
 */
export function getRetreatPosition(
  unit: UnitInstance,
  units: UnitInstance[],
  gridRows = 9,
  gridCols = 9
): Position | null {
  const direction = unit.faction === 'cilicia' ? -1 : 1;
  const candidate: Position = {
    row: unit.position.row + direction,
    col: unit.position.col,
  };

  if (!isOnBoard(candidate, gridRows, gridCols)) return null;
  if (isOccupied(candidate, units, unit.id)) return null;
  return candidate;
}

/**
 * Panic retreat for militia: tries to flee 2 hexes toward home row.
 * Falls back to 1 hex if 2nd hex is blocked.
 */
export function getPanicRetreatPosition(
  unit: UnitInstance,
  units: UnitInstance[],
  gridRows = 9,
  gridCols = 9
): Position | null {
  const direction = unit.faction === 'cilicia' ? -1 : 1;
  const step1: Position = { row: unit.position.row + direction, col: unit.position.col };
  const step2: Position = { row: unit.position.row + 2 * direction, col: unit.position.col };

  // Try to flee 2 steps
  const step1Valid = isOnBoard(step1, gridRows, gridCols) && !isOccupied(step1, units, unit.id);
  const step2Valid = isOnBoard(step2, gridRows, gridCols) && !isOccupied(step2, units, unit.id);

  if (step1Valid && step2Valid) return step2;
  if (step1Valid) return step1;
  return null; // blocked → takes damage (handled by caller)
}
