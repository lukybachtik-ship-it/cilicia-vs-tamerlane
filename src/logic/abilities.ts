import type { GameState } from '../types/game';
import type { UnitInstance, FactionId } from '../types/unit';
import { UNIT_DEFINITIONS } from '../constants/unitDefinitions';
import { chebyshevDistance } from '../utils/helpers';
import { offsetToCube } from '../utils/hexGrid';

/**
 * Returns true if this unit has an activated ability currently available.
 */
export function hasAvailableAbility(unit: UnitInstance): boolean {
  const def = UNIT_DEFINITIONS[unit.definitionType];
  return !!def.activatedAbility && !unit.specialAbilityUsed;
}

/**
 * Returns true if the charge (3+ hex straight line this turn) is active for the unit.
 * Only meaningful for units with chargeRequires3Hex.
 * Uses cube-coord check: start and end must be on a straight hex line >=3 hexes apart.
 */
export function isChargingThisTurn(unit: UnitInstance): boolean {
  const def = UNIT_DEFINITIONS[unit.definitionType];
  if (!def.chargeRequires3Hex) return false;
  if (!unit.hasMoved) return false;
  const start = unit.moveHistoryThisTurn[0];
  if (!start) return false;
  const end = unit.position;
  const ca = offsetToCube(start);
  const cb = offsetToCube(end);
  const dx = cb.x - ca.x;
  const dy = cb.y - ca.y;
  const dz = cb.z - ca.z;
  const dist = (Math.abs(dx) + Math.abs(dy) + Math.abs(dz)) / 2;
  if (dist < 3) return false;
  // Straight hex line: exactly one cube axis unchanged
  return [dx, dy, dz].filter(d => d === 0).length === 1;
}

/**
 * Volley fire: for arquebusier attacks, count other same-faction arquebusiers in the same row.
 * If 3+ arquebusiers of the same faction share the attacker's row, each gains +1 die.
 */
export function getVolleyBonus(attacker: UnitInstance, state: GameState): number {
  const def = UNIT_DEFINITIONS[attacker.definitionType];
  if (!def.volleyFireBonus) return 0;
  const same = state.units.filter(
    u =>
      u.faction === attacker.faction &&
      UNIT_DEFINITIONS[u.definitionType].volleyFireBonus &&
      u.position.row === attacker.position.row
  ).length;
  return same >= 3 ? 1 : 0;
}

/** True if this unit currently suffers gunpowder panic (-1 attack die). */
export function hasGunpowderPanic(unit: UnitInstance, state: GameState): boolean {
  return (
    unit.gunpowderPanicUntilTurn !== undefined &&
    unit.gunpowderPanicUntilTurn >= state.turnNumber
  );
}

/**
 * Apply Warcry activation to a germanic warrior.
 * +2 attack bonus & +1 move bonus for this turn; mark ability used; mark warcryActive.
 */
export function applyWarcry(unit: UnitInstance): UnitInstance {
  return {
    ...unit,
    attackBonus: unit.attackBonus + 2,
    moveBonus: unit.moveBonus + 1,
    warcryActive: true,
    specialAbilityUsed: true,
  };
}

/**
 * Apply Pilum activation — sets pilumReady so next attack can be ranged 1–2 with +2 dice.
 */
export function applyPilumReady(unit: UnitInstance): UnitInstance {
  return {
    ...unit,
    pilumReady: true,
    specialAbilityUsed: true,
  };
}

/**
 * Apply Ambush Signal: mark ability used, all same-faction units get +1 attackBonus this turn.
 * Also removes the 'ambush_hidden' scenario effect permanently (ambush is sprung).
 */
export function applyAmbushSignal(state: GameState, source: UnitInstance): GameState {
  const faction = source.faction;
  const newUnits = state.units.map(u => {
    if (u.id === source.id) {
      return { ...u, specialAbilityUsed: true, attackBonus: u.attackBonus + 1 };
    }
    if (u.faction === faction) {
      return { ...u, attackBonus: u.attackBonus + 1 };
    }
    return u;
  });
  const newEffects = state.activeScenarioEffects.filter(e => e.kind !== 'ambush_hidden');
  return { ...state, units: newUnits, activeScenarioEffects: newEffects };
}

/**
 * Apply Betrayal: flip target condottiero to source's faction until end of source's turn.
 * Stores originalFaction via gunpowderPanicUntilTurn field is wrong — we use betrayedUntilTurn
 * and store origin via a parallel mechanism (in reducer we handle revert).
 */
export function applyBetrayal(
  state: GameState,
  source: UnitInstance,
  target: UnitInstance
): GameState {
  const originalFaction: FactionId = target.faction;
  const newUnits = state.units.map(u =>
    u.id === target.id
      ? {
          ...u,
          faction: source.faction,
          betrayedUntilTurn: state.turnNumber,
          betrayedOriginalFaction: originalFaction,
        }
      : u.id === source.id
        ? { ...u, specialAbilityUsed: true }
        : u
  );
  return { ...state, units: newUnits };
}

/**
 * True if target is a valid adjacent enemy condottiero for Cesare's betrayal.
 */
export function canBetray(source: UnitInstance, target: UnitInstance): boolean {
  return (
    target.faction !== source.faction &&
    target.definitionType === 'condottiero' &&
    chebyshevDistance(source.position, target.position) === 1
  );
}

/** List of valid betrayal targets from the given Cesare unit. */
export function getBetrayalTargets(source: UnitInstance, state: GameState): UnitInstance[] {
  return state.units.filter(u => canBetray(source, u));
}

/**
 * Revert any condottieri whose betrayal has expired.
 * Called at the start of each turn (in END_TURN handler before resetting per-turn fields).
 */
export function revertExpiredBetrayals(state: GameState): GameState {
  const newUnits = state.units.map(u => {
    if (u.betrayedUntilTurn === undefined) return u;
    if (u.betrayedUntilTurn < state.turnNumber) {
      const original = u.betrayedOriginalFaction ?? (u.faction === 'cilicia' ? 'tamerlane' : 'cilicia');
      const { betrayedUntilTurn: _bt, betrayedOriginalFaction: _bof, ...rest } = u;
      return { ...rest, faction: original } as UnitInstance;
    }
    return u;
  });
  return { ...state, units: newUnits };
}

