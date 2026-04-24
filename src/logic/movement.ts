import type { Position, UnitInstance } from '../types/unit';
import type { GameState } from '../types/game';
import { UNIT_DEFINITIONS } from '../constants/unitDefinitions';
import { posKey, isOnBoard, getNeighbors, isCavalryType } from '../utils/helpers';
import { getMoveBonus, cannotMove as modCannotMove } from './modifiers';

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

/** Jednotný check — deleguje na utils/helpers.isCavalryType. */
function isCavalry(unit: UnitInstance): boolean {
  return isCavalryType(unit.definitionType);
}

/** True if the given terrain blocks all movement (like a wall or intact wagenburg).
 *  Siege tower exception: wall adjacent to a same-faction siege_tower is
 *  passable for non-cavalry (infantry) units (simulates escalade via tower).
 */
function isBlockingTerrain(
  terrainType: string,
  structureHp: number | undefined,
  pos: Position,
  unit: UnitInstance,
  state: GameState
): boolean {
  if (terrainType === 'wall' && (structureHp ?? 1) > 0) {
    // Check siege tower escalade
    const hasAllyTowerAdjacent = state.units.some(
      u =>
        u.faction === unit.faction &&
        u.definitionType === 'siege_tower' &&
        Math.max(
          Math.abs(u.position.row - pos.row),
          Math.abs(u.position.col - pos.col)
        ) === 1
    );
    const isInfantry = !isCavalry(unit);
    if (hasAllyTowerAdjacent && isInfantry) return false;
    return true;
  }
  if (terrainType === 'gate' && (structureHp ?? 1) > 0) return true;
  return false;
}

/** True if entering this terrain forces the unit to stop (forest-style). */
function forcesStop(terrainType: string): boolean {
  return (
    terrainType === 'forest' ||
    terrainType === 'ambush_forest' ||
    terrainType === 'fortress' ||
    terrainType === 'vineyard' ||
    terrainType === 'wagenburg' ||
    terrainType === 'stream'
  );
}

/**
 * BFS flood-fill for valid move destinations.
 */
export function getValidMoves(unit: UnitInstance, state: GameState): Position[] {
  if (modCannotMove(unit, state)) return [];
  const def = UNIT_DEFINITIONS[unit.definitionType];
  const ignoresStop = def.ignoresTerrainStop;
  // Base move + card moveBonus + all active modifier bonuses (warcry etc.)
  const maxMove = def.move + unit.moveBonus + getMoveBonus(unit, state);
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
      const structureHp = terrain?.structureHp;

      // Walls block (unless siege tower adjacent)
      if (isBlockingTerrain(terrainType, structureHp, next, unit, state)) continue;

      // Cavalry cannot enter fortress / wagenburg (tight quarters)
      if (isCavalry(unit) && (terrainType === 'fortress' || terrainType === 'wagenburg')) continue;

      const nextSteps = steps + 1;
      const prevBest = visited.get(posKey(next));
      if (prevBest !== undefined && prevBest <= nextSteps) continue;

      visited.set(posKey(next), nextSteps);

      const mustStop = !ignoresStop && forcesStop(terrainType);
      queue.push({ pos: next, steps: nextSteps, stopped: mustStop });
    }
  }

  // ── Aqueduct teleport: light unit on aqueduct_surface gets aqueduct_exit as
  // a special "teleport" valid move (1× per battle, handled by caller).
  const currentTerrain = getTerrainAt(unit.position, state);
  if (currentTerrain?.terrain === 'aqueduct_surface' && !isCavalry(unit)) {
    const exitHex = state.terrain.find(t => t.terrain === 'aqueduct_exit');
    if (exitHex) {
      const exitOccupied = isOccupied(exitHex.position, state.units, unit.id);
      if (!exitOccupied) {
        // Add exit as reachable (unique)
        const already = reachable.some(p =>
          p.row === exitHex.position.row && p.col === exitHex.position.col
        );
        if (!already) reachable.push(exitHex.position);
      }
    }
  }

  return reachable;
}

/**
 * Get retreat position (one step toward home row).
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
 * Panic retreat for militia: tries 2 hexes toward home row.
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

  const step1Valid = isOnBoard(step1, gridRows, gridCols) && !isOccupied(step1, units, unit.id);
  const step2Valid = isOnBoard(step2, gridRows, gridCols) && !isOccupied(step2, units, unit.id);

  if (step1Valid && step2Valid) return step2;
  if (step1Valid) return step1;
  return null;
}
