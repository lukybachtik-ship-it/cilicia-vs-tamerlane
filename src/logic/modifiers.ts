import type { GameState } from '../types/game';
import type { UnitInstance, UnitType, FactionId, Position, UnitClass } from '../types/unit';
import { UNIT_DEFINITIONS } from '../constants/unitDefinitions';
import { chebyshevDistance, generateId } from '../utils/helpers';

/**
 * Central Event/Modifier system.
 *
 * Replaces scattered flags (unit.warcryActive, unit.pilumReady,
 * unit.gunpowderPanicUntilTurn, activeScenarioEffects.heat_debuff,
 * Caterina aura hardcode, named hero bonuses, commander death effects).
 *
 * A modifier has a SOURCE, a TARGET FILTER, an EFFECT payload, and a
 * DURATION. combat.ts / movement.ts query this list instead of chasing
 * individual flags.
 *
 * Terrain bonuses (trench, hill elevation, forest cover) are NOT modifiers
 * — they are computed on-the-fly per (attacker, defender, position) pair
 * because they depend on the attack context, not on unit state.
 */

export type ModifierSource =
  | 'commander_death' // a named commander died; faction debuffed
  | 'ability'         // activated ability (warcry / pilum / ambush_signal)
  | 'scenario'        // scenario-wide effect (heat debuff)
  | 'aura'            // positional aura from a unit (Caterina, Totila)
  | 'card'            // command-card effect (not currently used, reserved)
  | 'status';         // status effect on a unit (gunpowder panic)

export interface ModifierTargetFilter {
  faction?: FactionId;
  exceptFaction?: FactionId;
  unitIds?: string[];
  unitTypes?: UnitType[];
  unitClass?: UnitClass;
  isCavalry?: boolean;
  /** Positional: only units within this radius of the given center qualify. */
  withinRadiusOf?: { position: Position; radius: number };
  /** Used by auras so the aura source doesn't modify itself. */
  excludeSourceUnit?: boolean;
}

export interface ModifierEffect {
  /** Added/subtracted to the unit's attack dice count. */
  attackDice?: number;
  /** Added/subtracted to defense/counter-attack dice (not currently used
   *  but reserved — defense is typically the attacker's dice vs a class). */
  defenseDice?: number;
  moveBonus?: number;
  rangeBonus?: number;
  cannotMove?: boolean;
  cannotAttack?: boolean;
  /** Defender ignores a retreat result (used by aura / terrain rules). */
  ignoresRetreat?: boolean;
}

export type ModifierDurationKind =
  | 'turns'            // expires after N turns (decrement at end-of-turn)
  | 'until_turn'       // expires when state.turnNumber > untilTurn
  | 'permanent'        // never expires (removed only when source fact removed)
  | 'single_attack'    // consumed on next attack by the source unit
  | 'recompute_each_turn'; // rebuilt at start of each turn (auras)

export interface ModifierDuration {
  kind: ModifierDurationKind;
  remainingTurns?: number;
  untilTurn?: number;
  consumed?: boolean;
}

export interface ActiveModifier {
  id: string;
  source: ModifierSource;
  sourceUnitId?: string;
  /** Diegetic, Czech; shown in UI. */
  descriptionCs: string;
  targetFilter: ModifierTargetFilter;
  effect: ModifierEffect;
  duration: ModifierDuration;
}

// ─── Query helpers ────────────────────────────────────────────────────────────

/** True if this modifier currently applies to this unit. */
export function modifierApplies(
  mod: ActiveModifier,
  unit: UnitInstance,
  _state: GameState
): boolean {
  // Consumed single-attack mods no longer apply.
  if (mod.duration.kind === 'single_attack' && mod.duration.consumed) return false;

  const f = mod.targetFilter;

  if (f.faction && unit.faction !== f.faction) return false;
  if (f.exceptFaction && unit.faction === f.exceptFaction) return false;
  if (f.unitIds && !f.unitIds.includes(unit.id)) return false;
  if (f.unitTypes && !f.unitTypes.includes(unit.definitionType)) return false;
  const def = UNIT_DEFINITIONS[unit.definitionType];
  if (f.unitClass && def.unitClass !== f.unitClass) return false;

  if (f.isCavalry !== undefined) {
    const cavType = (
      unit.definitionType === 'light_cavalry' ||
      unit.definitionType === 'heavy_cavalry' ||
      unit.definitionType === 'horse_archers' ||
      unit.definitionType === 'gendarme' ||
      unit.definitionType === 'stradiot' ||
      unit.definitionType === 'condottiero' ||
      unit.definitionType === 'equites'
    );
    if (f.isCavalry !== cavType) return false;
  }

  if (f.withinRadiusOf) {
    if (chebyshevDistance(unit.position, f.withinRadiusOf.position) > f.withinRadiusOf.radius) {
      return false;
    }
  }

  if (f.excludeSourceUnit && mod.sourceUnitId === unit.id) return false;

  return true;
}

/** Sum the effect field across all applicable modifiers. */
export function sumModifierEffect(
  unit: UnitInstance,
  state: GameState,
  field: keyof ModifierEffect
): number {
  let total = 0;
  for (const mod of state.activeModifiers) {
    if (!modifierApplies(mod, unit, state)) continue;
    const val = mod.effect[field];
    if (typeof val === 'number') total += val;
  }
  return total;
}

/** True if ANY applicable modifier sets the given boolean effect. */
export function anyModifierFlag(
  unit: UnitInstance,
  state: GameState,
  field: 'cannotMove' | 'cannotAttack' | 'ignoresRetreat'
): boolean {
  for (const mod of state.activeModifiers) {
    if (!modifierApplies(mod, unit, state)) continue;
    if (mod.effect[field]) return true;
  }
  return false;
}

// ─── Convenience accessors (used by combat.ts / movement.ts) ─────────────────

export function getAttackDiceBonus(unit: UnitInstance, state: GameState): number {
  return sumModifierEffect(unit, state, 'attackDice');
}
export function getMoveBonus(unit: UnitInstance, state: GameState): number {
  return sumModifierEffect(unit, state, 'moveBonus');
}
export function getRangeBonus(unit: UnitInstance, state: GameState): number {
  return sumModifierEffect(unit, state, 'rangeBonus');
}
export function cannotMove(unit: UnitInstance, state: GameState): boolean {
  return anyModifierFlag(unit, state, 'cannotMove');
}
export function cannotAttack(unit: UnitInstance, state: GameState): boolean {
  return anyModifierFlag(unit, state, 'cannotAttack');
}
export function defenderIgnoresRetreat(
  defender: UnitInstance,
  state: GameState
): boolean {
  return anyModifierFlag(defender, state, 'ignoresRetreat');
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

/** Called at end of turn: decrements `turns` counters, clears expired mods. */
export function advanceModifiers(state: GameState): GameState {
  const turnNum = state.turnNumber;
  const nextMods: ActiveModifier[] = [];
  for (const mod of state.activeModifiers) {
    switch (mod.duration.kind) {
      case 'turns': {
        const r = (mod.duration.remainingTurns ?? 1) - 1;
        if (r > 0) {
          nextMods.push({ ...mod, duration: { ...mod.duration, remainingTurns: r } });
        }
        // else: expired, drop
        break;
      }
      case 'until_turn': {
        if ((mod.duration.untilTurn ?? turnNum) >= turnNum) {
          nextMods.push(mod);
        }
        break;
      }
      case 'single_attack': {
        if (!mod.duration.consumed) nextMods.push(mod);
        break;
      }
      case 'recompute_each_turn': {
        // Auras: dropped here; will be rebuilt by recomputeAuras() at start of next turn
        break;
      }
      case 'permanent':
      default:
        nextMods.push(mod);
        break;
    }
  }
  return { ...state, activeModifiers: nextMods };
}

/** Mark any `single_attack` modifiers for this unit as consumed after its attack. */
export function consumeSingleAttackMods(state: GameState, attackerId: string): GameState {
  let changed = false;
  const nextMods = state.activeModifiers.map(m => {
    if (
      m.duration.kind === 'single_attack' &&
      !m.duration.consumed &&
      m.sourceUnitId === attackerId
    ) {
      changed = true;
      return { ...m, duration: { ...m.duration, consumed: true } };
    }
    return m;
  });
  return changed ? { ...state, activeModifiers: nextMods } : state;
}

/** After movement, auras may need re-evaluation (positional dependence). */
export function recomputeAuras(state: GameState): GameState {
  // Drop old aura modifiers
  const nonAura = state.activeModifiers.filter(m => m.source !== 'aura');
  // Regenerate from each unit's auraEffect spec
  const newAuras: ActiveModifier[] = [];
  for (const unit of state.units) {
    const def = UNIT_DEFINITIONS[unit.definitionType];
    const spec = def.auraEffect;
    if (!spec) continue;
    newAuras.push({
      id: `aura_${unit.id}`,
      source: 'aura',
      sourceUnitId: unit.id,
      descriptionCs: spec.descriptionCs,
      targetFilter: {
        ...spec.targetFilter,
        withinRadiusOf: { position: unit.position, radius: spec.radius },
      },
      effect: spec.effect,
      duration: { kind: 'recompute_each_turn' },
    });
  }
  return { ...state, activeModifiers: [...nonAura, ...newAuras] };
}

// ─── Modifier factories (used by abilities, commander death, etc.) ────────────

export function makeWarcryModifier(sourceUnit: UnitInstance): ActiveModifier {
  return {
    id: generateId('mod_warcry'),
    source: 'ability',
    sourceUnitId: sourceUnit.id,
    descriptionCs: 'Válečný řev: +2 kostky útoku, +1 pohyb',
    targetFilter: { unitIds: [sourceUnit.id] },
    effect: { attackDice: 2, moveBonus: 1 },
    duration: { kind: 'turns', remainingTurns: 1 },
  };
}

export function makePilumReadyModifier(sourceUnit: UnitInstance): ActiveModifier {
  return {
    id: generateId('mod_pilum'),
    source: 'ability',
    sourceUnitId: sourceUnit.id,
    descriptionCs: 'Pilum salva: +2 kostky útoku, rozšířený dostřel',
    targetFilter: { unitIds: [sourceUnit.id] },
    effect: { attackDice: 2, rangeBonus: 1 },
    duration: { kind: 'single_attack' },
  };
}

/** Ambush signal: +1 attack to all same-faction units, for this turn only. */
export function makeAmbushSignalModifier(sourceUnit: UnitInstance): ActiveModifier {
  return {
    id: generateId('mod_ambush'),
    source: 'ability',
    sourceUnitId: sourceUnit.id,
    descriptionCs: 'Signál přepadu: +1 útočná kostka',
    targetFilter: { faction: sourceUnit.faction },
    effect: { attackDice: 1 },
    duration: { kind: 'turns', remainingTurns: 1 },
  };
}

export function makeGunpowderPanicModifier(
  target: UnitInstance,
  untilTurn: number
): ActiveModifier {
  return {
    id: generateId('mod_gp_panic'),
    source: 'status',
    sourceUnitId: target.id,
    descriptionCs: 'Prachová panika: −1 útočná kostka',
    targetFilter: { unitIds: [target.id] },
    effect: { attackDice: -1 },
    duration: { kind: 'until_turn', untilTurn },
  };
}

export function makeCommanderDeathModifier(
  commander: UnitInstance,
  spec: CommanderDeathSpec
): ActiveModifier {
  return {
    id: generateId('mod_cmdr_death'),
    source: 'commander_death',
    sourceUnitId: commander.id,
    descriptionCs: spec.descriptionCs,
    targetFilter: {
      faction: spec.affectFaction ?? commander.faction,
      unitTypes: spec.affectUnitTypes,
    },
    effect: spec.effect,
    duration: { kind: 'turns', remainingTurns: spec.durationTurns },
  };
}

// ─── Supporting spec types (referenced from UNIT_DEFINITIONS) ─────────────────

export interface CommanderDeathSpec {
  descriptionCs: string;
  /** Which faction's units are debuffed — defaults to commander's own faction. */
  affectFaction?: FactionId;
  affectUnitTypes?: UnitType[];
  effect: ModifierEffect;
  durationTurns: number;
}

export interface AuraSpec {
  descriptionCs: string;
  radius: number;
  /** Filter applied IN ADDITION to the withinRadiusOf (which is set dynamically). */
  targetFilter: Omit<ModifierTargetFilter, 'withinRadiusOf'>;
  effect: ModifierEffect;
}
