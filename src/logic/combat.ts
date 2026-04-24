import type { UnitInstance } from '../types/unit';
import type { GameState, CombatLogEntry } from '../types/game';
import { UNIT_DEFINITIONS } from '../constants/unitDefinitions';
import { rollDice } from '../utils/dice';
import { generateId, chebyshevDistance, isCavalryType, isHeavyCavalryType } from '../utils/helpers';
import { hasLOS } from './los';
import { getRetreatPosition, getPanicRetreatPosition } from './movement';
import { isChargingThisTurn, getVolleyBonus, hasPilumReadyMod } from './abilities';
import { hasHeatDebuff } from './scenarioEffects';
import { isHiddenFrom } from './visibility';
import { getAttackDiceBonus, getRangeBonus, defenderIgnoresRetreat } from './modifiers';

function getTerrainType(pos: { row: number; col: number }, state: GameState) {
  return (
    state.terrain.find(t => t.position.row === pos.row && t.position.col === pos.col)
      ?.terrain ?? 'plain'
  );
}

function getElevation(pos: { row: number; col: number }, state: GameState) {
  return (
    state.terrain.find(t => t.position.row === pos.row && t.position.col === pos.col)
      ?.elevation ?? 0
  );
}

export interface CombatResult {
  diceCount: number;
  diceResults: number[];
  hits: number;
  retreats: number;
  defenderDestroyed: boolean;
  defenderRetreated: boolean;
  defenderNewHp: number;
  defenderNewPosition: { row: number; col: number } | null;
  counterResult: CombatResult | null;
  logEntry: CombatLogEntry;
  // Special ability follow-ups
  hitAndRunPosition: { row: number; col: number } | null;
  breakthroughPosition: { row: number; col: number } | null;
  // Support system
  supportBlocked: boolean;
  // New: pike wall auto-hit on cavalry attacker
  pikeWallAutoHits: number;
  attackerNewHp: number;
  attackerDestroyedByPikeWall: boolean;
  // New: applies gunpowder panic to defender
  gunpowderPanicApplied: boolean;
  // New: pilum attack was consumed
  pilumConsumed: boolean;
  // New: defender was charged (for display/log)
  chargedAttack: boolean;
  volleyApplied: boolean;
}

/**
 * Core D6 combat resolution.
 */
export function resolveAttack(
  attacker: UnitInstance,
  defender: UnitInstance,
  state: GameState,
  isCounter: boolean = false
): CombatResult {
  const attackerDef = UNIT_DEFINITIONS[attacker.definitionType];
  const defenderDef = UNIT_DEFINITIONS[defender.definitionType];

  const attackerTerrain = getTerrainType(attacker.position, state);
  const defenderTerrain = getTerrainType(defender.position, state);
  const attackerElev = getElevation(attacker.position, state);
  const defenderElev = getElevation(defender.position, state);

  const range = chebyshevDistance(attacker.position, defender.position);

  // ── 0. Pike wall pre-check — cavalry attacking a pikeman in melee ──────────
  let pikeWallAutoHits = 0;
  let attackerNewHp = attacker.hp;
  let attackerDestroyedByPikeWall = false;
  if (
    !isCounter &&
    range === 1 &&
    defenderDef.pikeWall &&
    isCavalryType(attacker.definitionType)
  ) {
    pikeWallAutoHits = 1;
    attackerNewHp = attacker.hp - 1;
    if (attackerNewHp <= 0) {
      attackerNewHp = 0;
      attackerDestroyedByPikeWall = true;
    }
  }

  // If pike wall killed the attacker, end combat early.
  if (attackerDestroyedByPikeWall) {
    const logEntry: CombatLogEntry = {
      id: generateId('combat'),
      turn: state.turnNumber,
      attackerName: `${attackerDef.nameCs} (${attacker.faction === 'cilicia' ? 'Kilikie' : 'Tamerlán'})`,
      defenderName: `${defenderDef.nameCs} (${defender.faction === 'cilicia' ? 'Kilikie' : 'Tamerlán'})`,
      diceCount: 0,
      diceResults: [],
      hits: 0,
      retreats: 0,
      isCounter: false,
      outcome: 'no_effect',
    };
    return {
      diceCount: 0,
      diceResults: [],
      hits: 0,
      retreats: 0,
      defenderDestroyed: false,
      defenderRetreated: false,
      defenderNewHp: defender.hp,
      defenderNewPosition: defender.position,
      counterResult: null,
      logEntry,
      hitAndRunPosition: null,
      breakthroughPosition: null,
      supportBlocked: false,
      pikeWallAutoHits,
      attackerNewHp,
      attackerDestroyedByPikeWall: true,
      gunpowderPanicApplied: false,
      pilumConsumed: false,
      chargedAttack: false,
      volleyApplied: false,
    };
  }

  // ── 1. Base dice count ──────────────────────────────────────────────────────
  // Base = definition + card bonus + sum of all active modifiers
  // (warcry, pilum, ambush signal, commander death, heat, gunpowder panic, etc.)
  let diceCount = attackerDef.attack + attacker.attackBonus + getAttackDiceBonus(attacker, state);

  // Pilum signal — track for log/flag purposes; dice bonus already in modifier.
  const pilumConsumed = !isCounter && hasPilumReadyMod(attacker, state) && range >= 1 && range <= 2;

  // ── 2. Archer moved penalty (not for counter-attacks, not if using pilum) ──
  if (attackerDef.movedAttackPenalty && attacker.hasMoved && !isCounter && !pilumConsumed) {
    diceCount = 1;
  }

  // ── 2b. Melee attack penalty for ranged units attacking at dist=1 ──────────
  if (attackerDef.meleeAttackPenalty && range === 1 && !isCounter && !pilumConsumed) {
    diceCount = Math.max(1, diceCount - 1);
  }

  // ── 3. Reduced melee defense (archers/horse archers defending at melee) ────
  if (defenderDef.reducedMeleeDefense && range === 1 && isCounter) {
    diceCount = 1;
  }

  // ── 4. Terrain penalties (min 1 die total) ──────────────────────────────────
  let terrainPenalty = 0;
  if (defenderTerrain === 'forest' || defenderTerrain === 'ambush_forest') terrainPenalty += 1;
  if (defenderTerrain === 'fortress' || defenderTerrain === 'wagenburg') terrainPenalty += 1;
  if (defenderTerrain === 'trench') terrainPenalty += 1;
  if (defenderTerrain === 'hill' && attackerElev < defenderElev) terrainPenalty += 1;

  diceCount = Math.max(1, diceCount - terrainPenalty);

  // ── 4b. Siege bonus: +2 dice vs fortress/wagenburg/wall targets ────────────
  if (attackerDef.siegeBonus && !isCounter &&
      (defenderTerrain === 'fortress' || defenderTerrain === 'wagenburg')) {
    diceCount += 2;
  }

  // ── 4c. Charge bonus (Gendarm): +2 dice if moved 3+ hex in straight line ───
  const chargedAttack = !isCounter && isChargingThisTurn(attacker);
  if (chargedAttack) {
    diceCount += 2;
  }

  // ── 4d. Volley fire bonus (arquebusier formation) ───────────────────────────
  const volleyBonus = !isCounter ? getVolleyBonus(attacker, state) : 0;
  const volleyApplied = volleyBonus > 0;
  diceCount += volleyBonus;

  // ── 4e. Anti-heavy-cavalry (rodelero) +1 vs heavy cav ───────────────────────
  if (attackerDef.antiHeavyCavalry && !isCounter && isHeavyCavalryType(defender.definitionType)) {
    diceCount += 1;
  }

  // ── 4f. Crossbow penalty vs heavy armour (-1 die) ───────────────────────────
  if (attacker.definitionType === 'crossbowman' && !isCounter && defenderDef.unitClass === 'heavy') {
    diceCount = Math.max(1, diceCount - 1);
  }

  // ── 4g. Heat debuff (Vercellae) ─────────────────────────────────────────────
  // Kept as scenarioEffect (not dice modifier) so UI banner can show it
  // separately from the unit modifier list.
  if (hasHeatDebuff(attacker, state)) {
    diceCount = Math.max(1, diceCount - 1);
  }

  // ── 4h. Pike wall reduces cavalry attack by 1 (formation deflects blows) ───
  if (
    !isCounter &&
    range === 1 &&
    defenderDef.pikeWall &&
    isCavalryType(attacker.definitionType)
  ) {
    diceCount = Math.max(1, diceCount - 1);
  }

  // ── 5. Cilicia passive: counter from fortress/hill → +1 ─────────────────────
  if (isCounter && attacker.faction === 'cilicia') {
    if (attackerTerrain === 'fortress' || attackerTerrain === 'hill') {
      diceCount += 1;
    }
  }

  // ── 6. Roll dice ────────────────────────────────────────────────────────────
  const diceResults = rollDice(diceCount);

  // ── 7. Count hits and retreats based on DEFENDER's class ────────────────────
  const hitNumbers = defenderDef.unitClass === 'light'
    ? new Set([1, 2, 6])
    : new Set([3, 4, 6]);

  let hits = 0;
  let rawRetreats = 0;
  for (const d of diceResults) {
    if (d === 5) rawRetreats++;
    else if (hitNumbers.has(d)) hits++;
  }

  // ── 8a. Fortress defender ignores the first retreat result ──────────────────
  let retreats = rawRetreats;
  if ((defenderTerrain === 'fortress' || defenderTerrain === 'wagenburg') && retreats > 0) {
    retreats -= 1;
  }

  // ── 8b. Support: 2+ adjacent friendly units ignores 1 retreat ───────────────
  const adjacentAllies = state.units.filter(
    u =>
      u.id !== defender.id &&
      u.faction === defender.faction &&
      chebyshevDistance(u.position, defender.position) === 1
  ).length;
  const supportBlocked = adjacentAllies >= 2 && retreats > 0;
  if (supportBlocked) {
    retreats -= 1;
  }

  // ── 8c. Defender aura / modifier ignoresRetreat (Caterina) ──────────────────
  if (defenderIgnoresRetreat(defender, state) && retreats > 0) {
    retreats -= 1;
  }

  // ── 9. Apply damage ─────────────────────────────────────────────────────────
  let defenderNewHp = defender.hp - hits;
  let defenderDestroyed = defenderNewHp <= 0;
  let defenderRetreated = false;
  let defenderNewPosition: { row: number; col: number } | null = defender.position;

  if (!defenderDestroyed && retreats > 0) {
    const retreatPos = defenderDef.panicRetreat
      ? getPanicRetreatPosition(defender, state.units, state.gridRows, state.gridCols)
      : getRetreatPosition(defender, state.units, state.gridRows, state.gridCols);
    if (retreatPos) {
      defenderNewPosition = retreatPos;
      defenderRetreated = true;
    } else {
      defenderNewHp -= 1;
      if (defenderNewHp <= 0) defenderDestroyed = true;
    }
  }

  if (defenderDestroyed) {
    defenderNewHp = 0;
    defenderNewPosition = null;
  }

  // ── 10. Outcome ─────────────────────────────────────────────────────────────
  let outcome: CombatLogEntry['outcome'] = 'no_effect';
  if (defenderDestroyed) outcome = 'destroyed';
  else if (hits > 0) outcome = 'damage';
  else if (defenderRetreated) outcome = 'retreat';
  else if (retreats > 0 && !defenderRetreated) outcome = 'blocked_retreat_damage';

  const logEntry: CombatLogEntry = {
    id: generateId('combat'),
    turn: state.turnNumber,
    attackerName: `${attackerDef.nameCs} (${attacker.faction === 'cilicia' ? 'Kilikie' : 'Tamerlán'})`,
    defenderName: `${defenderDef.nameCs} (${defender.faction === 'cilicia' ? 'Kilikie' : 'Tamerlán'})`,
    diceCount,
    diceResults,
    hits,
    retreats: rawRetreats,
    isCounter,
    outcome,
  };

  // ── 11. Counter-attack ──────────────────────────────────────────────────────
  let counterResult: CombatResult | null = null;
  if (
    !isCounter &&
    range === 1 &&
    !defenderDestroyed &&
    !defenderRetreated
  ) {
    counterResult = resolveAttack(
      { ...defender, position: defenderNewPosition ?? defender.position, hp: defenderNewHp },
      { ...attacker, hp: attackerNewHp },
      state,
      true
    );
  }

  // ── 12. Special-ability follow-ups ──────────────────────────────────────────
  let hitAndRunPosition: { row: number; col: number } | null = null;
  let breakthroughPosition: { row: number; col: number } | null = null;

  if (!isCounter) {
    if (attackerDef.hitAndRun && range === 1 && !defenderDestroyed) {
      const retreatPos = getRetreatPosition(attacker, state.units, state.gridRows, state.gridCols);
      if (retreatPos) hitAndRunPosition = retreatPos;
    }

    if (attackerDef.breakthrough && (defenderDestroyed || defenderRetreated)) {
      breakthroughPosition = defender.position;
    }
  }

  // ── 13. Gunpowder panic applied? (hit + gunpowder weapon + defender alive) ─
  const gunpowderPanicApplied =
    !isCounter && attackerDef.gunpowderWeapon && hits > 0 && !defenderDestroyed;

  return {
    diceCount,
    diceResults,
    hits,
    retreats: rawRetreats,
    defenderDestroyed,
    defenderRetreated,
    defenderNewHp,
    defenderNewPosition,
    counterResult,
    logEntry,
    hitAndRunPosition,
    breakthroughPosition,
    supportBlocked,
    pikeWallAutoHits,
    attackerNewHp,
    attackerDestroyedByPikeWall: false,
    gunpowderPanicApplied,
    pilumConsumed,
    chargedAttack,
    volleyApplied,
  };
}

/**
 * Returns unit IDs of valid attack targets for the given attacker.
 * Excludes hidden enemies (ambush mechanic).
 */
export function getValidAttackTargets(
  attacker: UnitInstance,
  state: GameState
): string[] {
  const def = UNIT_DEFINITIONS[attacker.definitionType];

  // Setup required: cannot attack on a turn the unit has moved
  if (def.setupRequired && attacker.hasMoved) return [];

  // Range bonuses from modifiers (pilum +1 etc.) extend max range
  const bonusRange = getRangeBonus(attacker, state);
  const rangeMax = Math.max(def.rangeMax + bonusRange, def.rangeMax);

  const enemies = state.units.filter(u => u.faction !== attacker.faction);

  return enemies
    .filter(enemy => {
      // Hidden ambush: cannot target while hidden
      if (isHiddenFrom(enemy, attacker.faction, state)) return false;

      const dist = chebyshevDistance(attacker.position, enemy.position);
      if (dist < def.rangeMin || dist > rangeMax) return false;
      if (rangeMax > 1 && dist > 1) {
        return hasLOS(attacker, enemy, state);
      }
      return true;
    })
    .map(u => u.id);
}

/**
 * Returns wall / wagenburg positions the attacker can target (destroysWalls flag).
 */
export function getValidAttackTerrainTargets(
  attacker: UnitInstance,
  state: GameState
): { row: number; col: number }[] {
  const def = UNIT_DEFINITIONS[attacker.definitionType];
  if (!def.destroysWalls) return [];
  if (def.setupRequired && attacker.hasMoved) return [];

  const rangeMax = def.rangeMax;
  return state.terrain
    .filter(t =>
      (t.terrain === 'wall' || t.terrain === 'wagenburg') &&
      (t.structureHp ?? 0) > 0 &&
      !state.units.some(u => u.position.row === t.position.row && u.position.col === t.position.col) &&
      chebyshevDistance(attacker.position, t.position) >= def.rangeMin &&
      chebyshevDistance(attacker.position, t.position) <= rangeMax
    )
    .map(t => t.position);
}

/**
 * Resolve a structure attack (kulverina/siege machine shelling a wall).
 * Returns the number of hits dealt to the structure.
 */
export function resolveStructureAttack(
  attacker: UnitInstance,
  targetPos: { row: number; col: number },
  state: GameState
): { hits: number; diceResults: number[]; diceCount: number } {
  const def = UNIT_DEFINITIONS[attacker.definitionType];
  // Base + card bonus + all active modifiers (gunpowder panic, warcry, pilum…)
  let diceCount = def.attack + attacker.attackBonus + getAttackDiceBonus(attacker, state);
  if (def.movedAttackPenalty && attacker.hasMoved) diceCount = 1;

  const diceResults = rollDice(diceCount);
  // Walls are "heavy" structures: hits on 3,4,6
  const hitSet = new Set([3, 4, 6]);
  let hits = 0;
  for (const d of diceResults) if (hitSet.has(d)) hits++;
  // Use targetPos in a no-op to keep param used (may be needed for future terrain modifiers)
  void targetPos;
  return { hits, diceResults, diceCount };
}
