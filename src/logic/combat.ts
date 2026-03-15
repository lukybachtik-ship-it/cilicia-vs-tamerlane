import type { UnitInstance } from '../types/unit';
import type { GameState, CombatLogEntry } from '../types/game';
import { UNIT_DEFINITIONS } from '../constants/unitDefinitions';
import { rollDice } from '../utils/dice';
import { generateId, chebyshevDistance } from '../utils/helpers';
import { hasLOS } from './los';
import { getRetreatPosition } from './movement';

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

  // 1. Base dice count
  let diceCount = attackerDef.attack + attacker.attackBonus;

  const range = chebyshevDistance(attacker.position, defender.position);

  // 2. Archer moved penalty (not for counter-attacks)
  if (attackerDef.movedAttackPenalty && attacker.hasMoved && !isCounter) {
    diceCount = 1;
  }

  // 2b. Melee attack penalty for ranged units attacking at dist=1
  if (attackerDef.meleeAttackPenalty && range === 1 && !isCounter) {
    diceCount = Math.max(1, diceCount - 1);
  }

  // 3. Reduced melee defense (archers/horse archers defending at melee range)
  if (defenderDef.reducedMeleeDefense && range === 1 && isCounter) {
    diceCount = 1;
  }

  // 4. Terrain penalties (min 1 die total)
  let terrainPenalty = 0;
  if (defenderTerrain === 'forest') terrainPenalty += 1;
  if (defenderTerrain === 'fortress') terrainPenalty += 1;
  if (defenderTerrain === 'hill' && attackerElev < defenderElev) terrainPenalty += 1;

  diceCount = Math.max(1, diceCount - terrainPenalty);

  // 5. Cilicia passive: if counter-attack AND attacker (Cilicia unit) is on fortress/hill → +1
  if (isCounter && attacker.faction === 'cilicia') {
    if (attackerTerrain === 'fortress' || attackerTerrain === 'hill') {
      diceCount += 1;
    }
  }

  // 6. Roll dice
  const diceResults = rollDice(diceCount);

  // 7. Count hits and retreats based on DEFENDER's class
  const hitNumbers = defenderDef.unitClass === 'light'
    ? new Set([1, 2, 6])
    : new Set([3, 4, 6]);

  let hits = 0;
  let rawRetreats = 0;
  for (const d of diceResults) {
    if (d === 5) rawRetreats++;
    else if (hitNumbers.has(d)) hits++;
  }

  // 8. Fortress defender ignores the first retreat result
  let retreats = rawRetreats;
  if (defenderTerrain === 'fortress' && retreats > 0) {
    retreats -= 1;
  }

  // 9. Apply damage
  let defenderNewHp = defender.hp - hits;
  let defenderDestroyed = defenderNewHp <= 0;
  let defenderRetreated = false;
  let defenderNewPosition: { row: number; col: number } | null = defender.position;

  if (!defenderDestroyed && retreats > 0) {
    const retreatPos = getRetreatPosition(defender, state.units);
    if (retreatPos) {
      defenderNewPosition = retreatPos;
      defenderRetreated = true;
    } else {
      // Blocked retreat → 1 extra damage
      defenderNewHp -= 1;
      if (defenderNewHp <= 0) defenderDestroyed = true;
    }
  }

  if (defenderDestroyed) {
    defenderNewHp = 0;
    defenderNewPosition = null;
  }

  // 10. Determine outcome for log
  let outcome: CombatLogEntry['outcome'] = 'no_effect';
  if (defenderDestroyed) outcome = 'destroyed';
  else if (hits > 0) outcome = 'damage';
  else if (defenderRetreated) outcome = 'retreat';
  else if (retreats > 0 && !defenderRetreated) outcome = 'blocked_retreat_damage';

  const logEntry: CombatLogEntry = {
    id: generateId('combat'),
    turn: state.turnNumber,
    attackerName: `${UNIT_DEFINITIONS[attacker.definitionType].nameCs} (${attacker.faction === 'cilicia' ? 'Kilikie' : 'Tamerlán'})`,
    defenderName: `${UNIT_DEFINITIONS[defender.definitionType].nameCs} (${defender.faction === 'cilicia' ? 'Kilikie' : 'Tamerlán'})`,
    diceCount,
    diceResults,
    hits,
    retreats: rawRetreats,
    isCounter,
    outcome,
  };

  // 11. Counter-attack (only for initial attacks, not counters)
  let counterResult: CombatResult | null = null;
  if (
    !isCounter &&
    range === 1 && // melee
    !defenderDestroyed &&
    !defenderRetreated
  ) {
    // Build a temporary state reflecting damage to attacker so far
    // (for simplicity, use the attacker as-is; damage comes after)
    counterResult = resolveAttack(
      { ...defender, position: defenderNewPosition ?? defender.position },
      attacker,
      state,
      true
    );
  }

  // 12. Special ability positions
  let hitAndRunPosition: { row: number; col: number } | null = null;
  let breakthroughPosition: { row: number; col: number } | null = null;

  if (!isCounter) {
    const attackerDef2 = UNIT_DEFINITIONS[attacker.definitionType];

    if (attackerDef2.hitAndRun && range === 1 && !defenderDestroyed) {
      // Light cavalry: free 1-step retreat for attacker after attack
      const retreatPos = getRetreatPosition(attacker, state.units);
      if (retreatPos) hitAndRunPosition = retreatPos;
    }

    if (attackerDef2.breakthrough && (defenderDestroyed || defenderRetreated)) {
      // Heavy cavalry: move to the now-vacated square
      breakthroughPosition = defender.position;
    }
  }

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
  };
}

/**
 * Returns unit IDs of valid attack targets for the given attacker.
 */
export function getValidAttackTargets(
  attacker: UnitInstance,
  state: GameState
): string[] {
  const def = UNIT_DEFINITIONS[attacker.definitionType];
  const enemies = state.units.filter(u => u.faction !== attacker.faction);

  return enemies
    .filter(enemy => {
      const dist = chebyshevDistance(attacker.position, enemy.position);
      if (dist < def.rangeMin || dist > def.rangeMax) return false;
      // Ranged attacks require LOS
      if (def.rangeMax > 1) {
        return hasLOS(attacker, enemy, state);
      }
      return true; // melee: adjacent is always valid (no LOS required)
    })
    .map(u => u.id);
}
