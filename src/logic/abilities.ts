import type { GameState } from '../types/game';
import type { UnitInstance, FactionId } from '../types/unit';
import { UNIT_DEFINITIONS } from '../constants/unitDefinitions';
import { chebyshevDistance } from '../utils/helpers';
import {
  makeWarcryModifier,
  makePilumReadyModifier,
  makeAmbushSignalModifier,
  modifierApplies,
  getMoveBonus,
} from './modifiers';

/**
 * Returns true if this unit has an activated ability currently available.
 */
export function hasAvailableAbility(unit: UnitInstance): boolean {
  const def = UNIT_DEFINITIONS[unit.definitionType];
  return !!def.activatedAbility && !unit.specialAbilityUsed;
}

/**
 * Nárazový útok (charge): active when a charge-capable unit ended its move
 * displaced by its FULL movement — i.e. it ran the whole distance toward the
 * enemy in one clean gallop. Simpler and more intuitive than the old
 * "3+ hexes in a straight line" rule.
 *
 * Note: this checks net displacement (straight-line hex distance from start
 * to end), not movement-points spent — a full-move run around obstacles that
 * ends closer than maxMove does not count, which is intended: a charge is a
 * straight run at full speed. Only meaningful for units with chargeRequires3Hex.
 */
export function isChargingThisTurn(unit: UnitInstance, state: GameState): boolean {
  const def = UNIT_DEFINITIONS[unit.definitionType];
  if (!def.chargeRequires3Hex) return false;
  if (!unit.hasMoved) return false;
  const start = unit.moveHistoryThisTurn[0];
  if (!start) return false;
  // Effective movement this turn (base + card bonus + active modifiers),
  // matching how getValidMoves computes reachable range.
  const maxMove = def.move + unit.moveBonus + getMoveBonus(unit, state);
  if (maxMove < 2) return false; // no real "charge" from a single hex
  // Displaced the full distance = ended up maxMove hexes away in a straight run.
  return chebyshevDistance(start, unit.position) >= maxMove;
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

/** True if this unit currently suffers gunpowder panic (-1 attack die).
 *  Implemented via the central modifier ledger. */
export function hasGunpowderPanic(unit: UnitInstance, state: GameState): boolean {
  return state.activeModifiers.some(m => {
    if (m.source !== 'status') return false;
    if (!modifierApplies(m, unit, state)) return false;
    return (m.effect.attackDice ?? 0) < 0;
  });
}

/** True if this unit currently has a pilum-ready (single-attack) modifier. */
export function hasPilumReadyMod(unit: UnitInstance, state: GameState): boolean {
  return state.activeModifiers.some(m =>
    m.source === 'ability' &&
    m.duration.kind === 'single_attack' &&
    !m.duration.consumed &&
    m.sourceUnitId === unit.id
  );
}

/**
 * Warcry activation — emits a modifier for the source unit.
 * Returns the updated state with the new modifier and the unit marked
 * as having used its ability.
 */
export function applyWarcry(state: GameState, sourceUnit: UnitInstance): GameState {
  const units = state.units.map(u =>
    u.id === sourceUnit.id ? { ...u, specialAbilityUsed: true } : u
  );
  const newMod = makeWarcryModifier(sourceUnit);
  return { ...state, units, activeModifiers: [...state.activeModifiers, newMod] };
}

/** Pilum activation — emits a single-attack modifier (+2 dice, +1 range). */
export function applyPilumReady(state: GameState, sourceUnit: UnitInstance): GameState {
  const units = state.units.map(u =>
    u.id === sourceUnit.id ? { ...u, specialAbilityUsed: true } : u
  );
  const newMod = makePilumReadyModifier(sourceUnit);
  return { ...state, units, activeModifiers: [...state.activeModifiers, newMod] };
}

/**
 * Ambush Signal: mark ability used; emit faction-wide +1 attack modifier
 * for the rest of this turn; drop the 'ambush_hidden' scenario effect
 * (ambush is sprung permanently).
 */
export function applyAmbushSignal(state: GameState, source: UnitInstance): GameState {
  const units = state.units.map(u =>
    u.id === source.id ? { ...u, specialAbilityUsed: true } : u
  );
  const newMod = makeAmbushSignalModifier(source);
  const newEffects = state.activeScenarioEffects.filter(e => e.kind !== 'ambush_hidden');
  return {
    ...state,
    units,
    activeScenarioEffects: newEffects,
    activeModifiers: [...state.activeModifiers, newMod],
  };
}

/**
 * Apply Betrayal: flip target condottiero to source's faction until end of source's turn.
 * Pure faction swap — not a dice modifier, so no ActiveModifier emission needed.
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

/** True if target is a valid adjacent enemy condottiero for Cesare's betrayal. */
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
