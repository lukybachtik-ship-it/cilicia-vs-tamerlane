import type { UnitInstance, FactionId } from '../types/unit';
import type { GameState } from '../types/game';
import { UNIT_DEFINITIONS } from '../constants/unitDefinitions';
import { chebyshevDistance } from '../utils/helpers';

/**
 * Returns true if the unit is hidden from the given viewer faction.
 * Currently: Germanic units in 'ambush_forest' are hidden from opposing faction
 * unless the viewer has any unit within 2 hexes, and only while the ambush_hidden
 * scenario effect is active.
 */
export function isHiddenFrom(
  unit: UnitInstance,
  viewerFaction: FactionId,
  state: GameState
): boolean {
  if (unit.faction === viewerFaction) return false;

  const ambushEffect = state.activeScenarioEffects.find(e => e.kind === 'ambush_hidden');
  if (!ambushEffect) return false;
  if (ambushEffect.affectedFaction && ambushEffect.affectedFaction !== unit.faction) return false;

  const def = UNIT_DEFINITIONS[unit.definitionType];
  if (!def.hiddenInForest) return false;

  // Only hidden if actually in an ambush_forest tile
  const cell = state.terrain.find(
    t => t.position.row === unit.position.row && t.position.col === unit.position.col
  );
  if (!cell || cell.terrain !== 'ambush_forest') return false;

  // Any viewer unit within 2 hexes reveals
  const viewerNearby = state.units.some(
    u => u.faction === viewerFaction && chebyshevDistance(u.position, unit.position) <= 2
  );
  return !viewerNearby;
}
