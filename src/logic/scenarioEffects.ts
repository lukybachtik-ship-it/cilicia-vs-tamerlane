import type { GameState, ScenarioEffect } from '../types/game';
import type { UnitInstance } from '../types/unit';

/**
 * Returns true if the heat debuff applies to this unit at the current turn.
 */
export function hasHeatDebuff(unit: UnitInstance, state: GameState): ScenarioEffect | undefined {
  return state.activeScenarioEffects.find(e => {
    if (e.kind !== 'heat_debuff') return false;
    if (state.turnNumber < e.fromTurn) return false;
    if (e.toTurn !== undefined && state.turnNumber > e.toTurn) return false;
    if (e.affectedFaction && e.affectedFaction !== unit.faction) return false;
    if (e.affectedUnitTypes && !e.affectedUnitTypes.includes(unit.definitionType)) return false;
    return true;
  });
}

/** Return all scenario effects currently active (by turn bounds). */
export function getActiveEffects(state: GameState): ScenarioEffect[] {
  return state.activeScenarioEffects.filter(e => {
    if (state.turnNumber < e.fromTurn) return false;
    if (e.toTurn !== undefined && state.turnNumber > e.toTurn) return false;
    return true;
  });
}
