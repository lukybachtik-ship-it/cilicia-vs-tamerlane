import type { Position } from '../types/unit';
import type { GameState } from '../types/game';
import type { UnitInstance } from '../types/unit';
import { posKey } from '../utils/helpers';
import { getHexLineCells } from '../utils/hexGrid';

/**
 * Hex line — returns all INTERMEDIATE cells between from and to
 * (neither the start nor the end cell).
 */
export function getLineCells(from: Position, to: Position): Position[] {
  return getHexLineCells(from, to);
}

function getTerrainAt(pos: Position, state: GameState) {
  return state.terrain.find(
    t => t.position.row === pos.row && t.position.col === pos.col
  );
}

/**
 * Returns true if the attacker has line of sight to the defender.
 *
 * Rules:
 * - Forest: blocks LOS *through* it (can shoot into/from but not through).
 * - Fortress: blocks LOS through it.
 * - Hill: blocks LOS for units at lower elevation looking through the hill.
 *   A unit ON the hill can see over other lowland units/terrain.
 */
export function hasLOS(
  attacker: UnitInstance,
  defender: UnitInstance,
  state: GameState
): boolean {
  const intermediate = getLineCells(attacker.position, defender.position);

  const attackerTerrain = getTerrainAt(attacker.position, state);
  const attackerElevation = attackerTerrain?.elevation ?? 0;

  for (const cell of intermediate) {
    const t = getTerrainAt(cell, state);
    if (!t) continue; // plain terrain — no block

    if (
      t.terrain === 'forest' ||
      t.terrain === 'ambush_forest' ||
      t.terrain === 'fortress' ||
      t.terrain === 'wagenburg'
    ) {
      return false;
    }

    if (t.terrain === 'wall' && (t.structureHp ?? 0) > 0) {
      return false;
    }

    if (t.terrain === 'hill') {
      // A hill blocks LOS for those below it
      if (attackerElevation < t.elevation) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Build a Set of occupied positions (by unit IDs) for quick lookup.
 */
export function buildOccupancyMap(units: UnitInstance[]): Map<string, UnitInstance> {
  const map = new Map<string, UnitInstance>();
  for (const u of units) {
    map.set(posKey(u.position), u);
  }
  return map;
}
