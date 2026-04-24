/**
 * Heuristic AI bot — single difficulty level.
 *
 * All functions are pure and return the chosen action given the current state.
 * The useBotPlayer hook calls these to drive the bot's turn.
 */

import type { GameState, PlayerTurn } from '../types/game';
import type { Position } from '../types/unit';
import { CARD_DEFINITIONS } from '../constants/cardDefinitions';
import { UNIT_DEFINITIONS } from '../constants/unitDefinitions';
import { canCardActivateUnit } from './cards';
import { getValidAttackTargets, getValidAttackTerrainTargets } from './combat';
import { hasAvailableAbility, canBetray } from './abilities';
import { hexDistance } from '../utils/hexGrid';

// ── Scenario-specific helpers ──────────────────────────────────────────────────

const ASCALON_TENT: Position = { row: 9, col: 5 };

const KILICIE_VILLAGES: Position[] = [
  { row: 3, col: 2 },
  { row: 3, col: 8 },
  { row: 6, col: 5 },
  { row: 9, col: 2 },
  { row: 9, col: 8 },
];

const FORLI_CITADEL: Position = { row: 2, col: 5 };

/** Returns true if the given position is occupied by any unit. */
function isOccupied(pos: Position, state: GameState): boolean {
  return state.units.some(u => u.position.row === pos.row && u.position.col === pos.col);
}

/** Count how many Tamerlane units stand on village hexes. */
function tamerlaneVillageCount(state: GameState): number {
  return state.units.filter(u =>
    u.faction === 'tamerlane' &&
    KILICIE_VILLAGES.some(v => v.row === u.position.row && v.col === u.position.col)
  ).length;
}

// ── Card selection ─────────────────────────────────────────────────────────────

/**
 * Pick the card that can activate the most bot units, with bonuses as tie-breakers.
 * Returns the instanceId of the chosen card, or null if no cards available.
 */
export function chooseBotCard(state: GameState, botFaction: PlayerTurn): string | null {
  const hand = botFaction === 'cilicia' ? state.ciliciaHand : state.tamerlaneHand;
  if (hand.length === 0) return null;

  let bestCard = hand[0];
  let bestScore = -Infinity;

  // Kilíkie: when Tamerlane holds ≥2 villages already, prioritise attack bonus
  // cards to clear defending militia faster
  const kilicieAggression =
    state.scenarioId === 'kilicie_uprising' &&
    botFaction === 'tamerlane' &&
    tamerlaneVillageCount(state) >= 2;

  for (const card of hand) {
    const def = CARD_DEFINITIONS[card.id];
    const activatable = state.units.filter(
      u => u.faction === botFaction &&
           canCardActivateUnit(card, u, [], state) &&
           !(u.sleepsUntilTurn !== undefined && state.turnNumber < u.sleepsUntilTurn)
    );
    let score = activatable.length * 10;
    score += def.attackBonus * (kilicieAggression ? 10 : 5);
    score += def.moveBonus * 3;
    // Cavalry Raid / General Offensive cards are high value
    if (def.maxActivations >= 99) score += 8;

    if (score > bestScore) {
      bestScore = score;
      bestCard = card;
    }
  }

  return bestCard.instanceId;
}

// ── Unit activation ────────────────────────────────────────────────────────────

/**
 * Returns the ID of the single best next unit to activate (or null if at max/none eligible).
 * The hook calls this repeatedly until null is returned, then confirms.
 */
export function chooseBotNextActivation(state: GameState, botFaction: PlayerTurn): string | null {
  const card = state.playedCard;
  if (!card) return null;

  const eligible = state.units.filter(
    u => u.faction === botFaction &&
         canCardActivateUnit(card, u, state.activatedUnitIds, state) &&
         !(u.sleepsUntilTurn !== undefined && state.turnNumber < u.sleepsUntilTurn)
  );
  if (eligible.length === 0) return null;

  const enemies = state.units.filter(u => u.faction !== botFaction);

  const scored = eligible.map(unit => {
    let score = 0;
    // Units that can already attack get highest priority
    const attacks = getValidAttackTargets(unit, state);
    if (attacks.length > 0) score += 100;
    // Prefer units close to an enemy
    const minEnemyDist = enemies.reduce(
      (min, e) => Math.min(min, hexDistance(unit.position, e.position)),
      99
    );
    score += Math.max(0, 10 - minEnemyDist);
    // Prefer units with higher HP (more useful alive)
    score += unit.hp * 2;

    // ── Scenario: Aškelon ──────────────────────────────────────────────────
    if (state.scenarioId === 'ascalon' && botFaction === 'cilicia') {
      // Crusaders: prioritize units closer to tent
      const distToTent = hexDistance(unit.position, ASCALON_TENT);
      score += Math.max(0, 15 - distToTent) * 3;
    }
    if (state.scenarioId === 'ascalon' && botFaction === 'tamerlane') {
      // Turks: prioritize units near tent to block it
      const distToTent = hexDistance(unit.position, ASCALON_TENT);
      score += Math.max(0, 8 - distToTent) * 3;
    }

    // ── Scenario: Kilíkie ──────────────────────────────────────────────────
    if (state.scenarioId === 'kilicie_uprising' && botFaction === 'tamerlane') {
      // Tamerlane: prioritize units closest to any village
      const minVillageDist = KILICIE_VILLAGES.reduce(
        (min, v) => Math.min(min, hexDistance(unit.position, v)), 99
      );
      score += Math.max(0, 10 - minVillageDist) * 2;
    }

    return { unit, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].unit.id;
}

// ── Section selection (General Offensive) ─────────────────────────────────────

/** Pick the section with the most bot units. */
export function chooseBotSection(state: GameState, botFaction: PlayerTurn): 'left' | 'center' | 'right' {
  const counts = { left: 0, center: 0, right: 0 };
  for (const u of state.units) {
    if (u.faction !== botFaction) continue;
    if (u.position.col <= 3)      counts.left++;
    else if (u.position.col <= 6) counts.center++;
    else                          counts.right++;
  }
  if (counts.left >= counts.center && counts.left >= counts.right) return 'left';
  if (counts.center >= counts.right) return 'center';
  return 'right';
}

// ── Scout card: discard one of two drawn cards ────────────────────────────────

/** Keep the card with better activation potential; discard the other. */
export function chooseBotDiscardCard(state: GameState, botFaction: PlayerTurn): string | null {
  const pending = state.pendingDrawnCards;
  if (pending.length < 2) return null;

  const scores = pending.map(card => {
    const def = CARD_DEFINITIONS[card.id];
    const activatable = state.units.filter(
      u => u.faction === botFaction && canCardActivateUnit(card, u, [], state)
    ).length;
    return { card, score: activatable * 10 + def.attackBonus * 5 + def.moveBonus * 3 };
  });

  scores.sort((a, b) => a.score - b.score); // ascending → discard lowest scored
  return scores[0].card.instanceId;
}

// ── Move target selection ──────────────────────────────────────────────────────

/**
 * Given already-computed valid move targets for the selected unit,
 * return the best hex to move to (or null to skip movement).
 */
export function chooseBotMoveTarget(
  validTargets: Position[],
  unitId: string,
  state: GameState,
  botFaction: PlayerTurn
): Position | null {
  if (validTargets.length === 0) return null;

  const unit = state.units.find(u => u.id === unitId);
  if (!unit) return null;

  const def = UNIT_DEFINITIONS[unit.definitionType];
  const enemies = state.units.filter(u => u.faction !== botFaction);

  // ── Scenario: Aškelon ────────────────────────────────────────────────────────
  if (state.scenarioId === 'ascalon') {
    if (botFaction === 'cilicia') {
      // Crusaders: rush toward tent at (row 9, col 5)
      return validTargets.reduce((best, pos) => {
        const distToTent = hexDistance(pos, ASCALON_TENT);
        const bestDistToTent = hexDistance(best, ASCALON_TENT);
        // Bonus if we land exactly on the tent (victory!)
        if (distToTent === 0) return pos;
        if (bestDistToTent === 0) return best;
        return distToTent < bestDistToTent ? pos : best;
      }, validTargets[0]);
    } else {
      // Tamerlane: block path to tent — park units adjacent to tent or between
      // Crusaders and tent (minimize distance to tent for blocking position,
      // but also keep enemies at bay)
      return validTargets.reduce((best, pos) => {
        const distToTent = hexDistance(pos, ASCALON_TENT);
        const bestDistToTent = hexDistance(best, ASCALON_TENT);
        // Prefer being close to tent to block
        let score = -distToTent * 10;
        let bestScore = -bestDistToTent * 10;
        // Secondary: also prefer being adjacent to enemies (to slow them down)
        if (enemies.length > 0) {
          const minEnemyDist = enemies.reduce((min, e) => Math.min(min, hexDistance(pos, e.position)), 99);
          const bestMinEnemyDist = enemies.reduce((min, e) => Math.min(min, hexDistance(best, e.position)), 99);
          score -= minEnemyDist * 2;
          bestScore -= bestMinEnemyDist * 2;
        }
        return score > bestScore ? pos : best;
      }, validTargets[0]);
    }
  }

  // ── Scenario: Kilíkie Uprising ───────────────────────────────────────────────
  if (state.scenarioId === 'kilicie_uprising') {
    if (botFaction === 'tamerlane') {
      // Tamerlane: capture villages — move to unoccupied villages or reinforce held ones
      const unoccupiedVillages = KILICIE_VILLAGES.filter(v => !isOccupied(v, state));
      const targetVillages = unoccupiedVillages.length > 0 ? unoccupiedVillages : KILICIE_VILLAGES;

      return validTargets.reduce((best, pos) => {
        const minDistToVillage = targetVillages.reduce(
          (min, v) => Math.min(min, hexDistance(pos, v)), 99
        );
        const bestMinDistToVillage = targetVillages.reduce(
          (min, v) => Math.min(min, hexDistance(best, v)), 99
        );
        // Large bonus for landing on a village
        const onVillage = targetVillages.some(v => v.row === pos.row && v.col === pos.col);
        const bestOnVillage = targetVillages.some(v => v.row === best.row && v.col === best.col);
        const score = (onVillage ? 50 : 0) - minDistToVillage;
        const bestScore = (bestOnVillage ? 50 : 0) - bestMinDistToVillage;
        return score > bestScore ? pos : best;
      }, validTargets[0]);
    } else {
      // Cilicia (militia): intercept Tamerlane units heading to villages
      // Prefer hexes near villages that Tamerlane is approaching
      const threatVillages = KILICIE_VILLAGES.filter(v => {
        // Consider a village threatened if any Tamerlane unit is within 4 hexes
        return enemies.some(e => hexDistance(e.position, v) <= 4);
      });
      const guardTargets = threatVillages.length > 0 ? threatVillages : KILICIE_VILLAGES;

      return validTargets.reduce((best, pos) => {
        const minDistToGuard = guardTargets.reduce(
          (min, v) => Math.min(min, hexDistance(pos, v)), 99
        );
        const bestMinDistToGuard = guardTargets.reduce(
          (min, v) => Math.min(min, hexDistance(best, v)), 99
        );
        // Also consider being between enemies and villages
        const minDistToEnemy = enemies.length > 0
          ? enemies.reduce((min, e) => Math.min(min, hexDistance(pos, e.position)), 99)
          : 99;
        const bestMinDistToEnemy = enemies.length > 0
          ? enemies.reduce((min, e) => Math.min(min, hexDistance(best, e.position)), 99)
          : 99;
        // Prefer being close to threatened villages, secondarily close to enemies
        const score = -minDistToGuard * 5 - minDistToEnemy;
        const bestScore = -bestMinDistToGuard * 5 - bestMinDistToEnemy;
        return score > bestScore ? pos : best;
      }, validTargets[0]);
    }
  }

  // ── New scenarios (Teutoburg/Vercellae/Forli/Cerignola) ──────────────────
  const scenarioChoice = chooseBotMoveTargetForScenario(validTargets, unitId, state, botFaction);
  if (scenarioChoice !== null) return scenarioChoice;

  // ── Default: generic heuristic ───────────────────────────────────────────────
  if (enemies.length === 0) return null;

  // Ranged units: don't move if already in range (movement causes attack penalty)
  if (def.rangeMax > 1) {
    const alreadyInRange = enemies.some(e => {
      const d = hexDistance(unit.position, e.position);
      return d >= def.rangeMin && d <= def.rangeMax;
    });
    if (alreadyInRange) return null; // stay put

    // Otherwise move to get closest to rangeMax distance from nearest enemy
    return validTargets.reduce((best, pos) => {
      const minDist = enemies.reduce((min, e) => Math.min(min, hexDistance(pos, e.position)), 99);
      const bestMinDist = enemies.reduce((min, e) => Math.min(min, hexDistance(best, e.position)), 99);
      return Math.abs(minDist - def.rangeMax) < Math.abs(bestMinDist - def.rangeMax) ? pos : best;
    }, validTargets[0]);
  }

  // Melee: move toward nearest enemy; prefer positions from which we can attack
  return validTargets.reduce((best, pos) => {
    const minDistToEnemy = enemies.reduce((min, e) => Math.min(min, hexDistance(pos, e.position)), 99);
    const bestDist = enemies.reduce((min, e) => Math.min(min, hexDistance(best, e.position)), 99);
    // Bonus if we can attack from this position
    const tempUnit = { ...unit, position: pos };
    const canAttack = getValidAttackTargets(tempUnit, {
      ...state,
      units: state.units.map(u => (u.id === unitId ? tempUnit : u)),
    }).length > 0;
    const score = (canAttack ? 20 : 0) - minDistToEnemy;
    const bestScore = (getValidAttackTargets({ ...unit, position: best }, {
      ...state,
      units: state.units.map(u => (u.id === unitId ? { ...unit, position: best } : u)),
    }).length > 0 ? 20 : 0) - bestDist;
    return score > bestScore ? pos : best;
  }, validTargets[0]);
}

// ── Attack target selection ────────────────────────────────────────────────────

/**
 * Given already-computed valid attack target IDs for the selected unit,
 * return the best defender ID (or null if none).
 */
export function chooseBotAttackTarget(
  validTargetIds: string[],
  state: GameState,
  botFaction?: PlayerTurn,
  attackerPosition?: Position,
): string | null {
  if (validTargetIds.length === 0) return null;

  // Campaign scenarios use "nearest threat" priority:
  // prefer targets close to the attacker over high-value distant ones.
  // This prevents the bot from metagaming focus-fire on Bukelárii.
  const isCampaign = ['dara', 'nika', 'ad_decimum', 'tricamarum', 'neapol', 'roma_6a', 'roma_6b', 'ravenna', 'calabria'].includes(state.scenarioId);

  const scored = validTargetIds.map(id => {
    const target = state.units.find(u => u.id === id);
    if (!target) return { id, score: 0 };
    let score = (4 - target.hp) * 10; // prefer low-HP targets (almost dead)

    // Campaign: strong preference for geographically nearest threat
    if (isCampaign && attackerPosition) {
      const dist = hexDistance(attackerPosition, target.position);
      score += Math.max(0, 8 - dist) * 8; // +56 at dist=1, decays to 0 at dist=8
      // De-prioritize extra-high-HP elite units so bot doesn't meta-hunt Bukelárii
      if (target.hp >= 4) score -= 15;
    }

    // Prefer targets on fortresses (block victory / clear objectives)
    const onFortress = state.terrain.some(
      t => t.terrain === 'fortress' &&
           t.position.row === target.position.row &&
           t.position.col === target.position.col
    );
    if (onFortress) score += 30;

    // ── Scenario: Aškelon ────────────────────────────────────────────────────
    if (state.scenarioId === 'ascalon' && botFaction === 'cilicia') {
      // Crusaders: prioritize killing units blocking the path to tent
      const distToTent = hexDistance(target.position, ASCALON_TENT);
      score += Math.max(0, 10 - distToTent) * 5; // closer to tent = higher priority
    }
    if (state.scenarioId === 'ascalon' && botFaction === 'tamerlane') {
      // Turks: kill the Crusader closest to tent (most dangerous)
      const distToTent = hexDistance(target.position, ASCALON_TENT);
      score += Math.max(0, 10 - distToTent) * 8;
    }

    // ── Scenario: Kilíkie ────────────────────────────────────────────────────
    if (state.scenarioId === 'kilicie_uprising' && botFaction === 'tamerlane') {
      // Tamerlane: kill militia guarding villages
      const nearVillage = KILICIE_VILLAGES.some(v => hexDistance(target.position, v) <= 2);
      if (nearVillage) score += 25;
    }
    if (state.scenarioId === 'kilicie_uprising' && botFaction === 'cilicia') {
      // Cilicia: attack units that are on or approaching villages
      const onVillage = KILICIE_VILLAGES.some(
        v => v.row === target.position.row && v.col === target.position.col
      );
      if (onVillage) score += 40;
      const nearVillage = KILICIE_VILLAGES.some(v => hexDistance(target.position, v) <= 2);
      if (nearVillage) score += 15;
    }

    return { id, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.id ?? null;
}

// ── Helpers used by the hook ───────────────────────────────────────────────────

/**
 * Returns the ID of the first activated bot unit that hasn't moved yet
 * (excluding directFireLocked units and units already marked exhausted by the hook).
 */
export function nextUnitToMove(
  state: GameState,
  botFaction: PlayerTurn,
  skip?: Set<string>
): string | null {
  const unit = state.units.find(
    u =>
      u.faction === botFaction &&
      u.isActivated &&
      !u.hasMoved &&
      !u.directFireLocked &&
      (!skip || !skip.has(u.id))
  );
  return unit?.id ?? null;
}

/**
 * Returns the ID of the first activated bot unit that hasn't attacked yet
 * AND actually has valid attack targets from its current position.
 * Using getValidAttackTargets avoids infinite select→no-targets→deselect loops.
 */
export function nextUnitToAttack(state: GameState, botFaction: PlayerTurn): string | null {
  const unit = state.units.find(
    u =>
      u.faction === botFaction &&
      u.isActivated &&
      !u.hasAttacked &&
      (getValidAttackTargets(u, state).length > 0 ||
       getValidAttackTerrainTargets(u, state).length > 0)
  );
  return unit?.id ?? null;
}

/**
 * Check if a unit is a bot unit currently selected.
 */
export function isBotUnitSelected(state: GameState, botFaction: PlayerTurn): boolean {
  if (!state.selectedUnitId) return false;
  const unit = state.units.find(u => u.id === state.selectedUnitId);
  return !!unit && unit.faction === botFaction;
}

// ── Activated abilities ───────────────────────────────────────────────────────

/**
 * Decide whether to use an activated ability (1× per game).
 * Returns the unitId to activate, or null if bot should skip abilities this step.
 */
export function chooseBotAbilityUnit(
  state: GameState,
  botFaction: PlayerTurn
): string | null {
  // Only use abilities when it's about to pay off
  const enemies = state.units.filter(u => u.faction !== botFaction);

  for (const unit of state.units) {
    if (unit.faction !== botFaction) continue;
    if (!hasAvailableAbility(unit)) continue;
    const def = UNIT_DEFINITIONS[unit.definitionType];
    const kind = def.activatedAbility;
    if (!kind) continue;

    if (kind === 'warcry') {
      // Use warcry when activated AND about to attack an adjacent enemy
      if (!unit.isActivated) continue;
      const adjacentEnemy = enemies.some(e => hexDistance(unit.position, e.position) === 1);
      if (adjacentEnemy) return unit.id;
    }
    if (kind === 'pilum') {
      // Use pilum when activated AND enemy in range 1-2
      if (!unit.isActivated) continue;
      const enemyInRange = enemies.some(e => {
        const d = hexDistance(unit.position, e.position);
        return d >= 1 && d <= 2;
      });
      if (enemyInRange) return unit.id;
    }
    if (kind === 'betrayal') {
      // Use betrayal when activated AND an enemy condottiero is adjacent
      if (!unit.isActivated) continue;
      const hasTarget = enemies.some(e => canBetray(unit, e));
      if (hasTarget) return unit.id;
    }
    if (kind === 'ambush_signal') {
      // Use once germans have units close enough to strike
      const germansInStrikeRange = state.units.filter(
        u => u.faction === botFaction &&
             enemies.some(e => hexDistance(u.position, e.position) <= 2)
      ).length;
      if (germansInStrikeRange >= 2) return unit.id;
    }
  }
  return null;
}

/**
 * Cesare betrayal: pick the adjacent enemy condottiero.
 */
export function chooseBotBetrayalTarget(state: GameState): string | null {
  const sourceId = state.pendingBetrayalSourceId;
  if (!sourceId) return null;
  const source = state.units.find(u => u.id === sourceId);
  if (!source) return null;
  const candidates = state.units.filter(u => canBetray(source, u));
  if (candidates.length === 0) return null;
  return candidates[0].id;
}

/**
 * Return an ATTACK_TERRAIN target (wall/wagenburg position) if the selected unit
 * has one available. Siege/culverin bots prefer shelling walls over unit attacks.
 */
export function chooseBotTerrainAttackTarget(
  state: GameState,
  unitId: string
): Position | null {
  const unit = state.units.find(u => u.id === unitId);
  if (!unit) return null;
  const targets = getValidAttackTerrainTargets(unit, state);
  if (targets.length === 0) return null;
  // Prefer the lowest-HP wall (finish it off)
  let bestPos = targets[0];
  let bestHp = Infinity;
  for (const t of targets) {
    const cell = state.terrain.find(c => c.position.row === t.row && c.position.col === t.col);
    const hp = cell?.structureHp ?? 999;
    if (hp < bestHp) { bestHp = hp; bestPos = t; }
  }
  return bestPos;
}

// ── New-scenario helpers used by chooseBotMoveTarget / chooseBotAttackTarget ──

/** Custom move target scoring for the 4 new scenarios. */
export function chooseBotMoveTargetForScenario(
  validTargets: Position[],
  unitId: string,
  state: GameState,
  botFaction: PlayerTurn
): Position | null {
  if (validTargets.length === 0) return null;
  const unit = state.units.find(u => u.id === unitId);
  if (!unit) return null;

  // Teutoburg: Romans rush south; Germans stay in forest and attack
  if (state.scenarioId === 'teutoburg') {
    if (botFaction === 'cilicia') {
      // Romans: prefer moving south (higher row)
      return validTargets.reduce((best, pos) =>
        pos.row > best.row ? pos : best, validTargets[0]);
    } else {
      // Germans: close on nearest roman
      const enemies = state.units.filter(u => u.faction === 'cilicia');
      if (enemies.length === 0) return null;
      return validTargets.reduce((best, pos) => {
        const d = enemies.reduce((m, e) => Math.min(m, hexDistance(pos, e.position)), 99);
        const bd = enemies.reduce((m, e) => Math.min(m, hexDistance(best, e.position)), 99);
        return d < bd ? pos : best;
      }, validTargets[0]);
    }
  }

  // Vercellae: Romans attack wagenburg; Kimbri push forward
  if (state.scenarioId === 'vercellae') {
    const wagenburg = state.terrain.find(t => t.terrain === 'wagenburg');
    if (wagenburg && botFaction === 'cilicia') {
      return validTargets.reduce((best, pos) => {
        const d = hexDistance(pos, wagenburg.position);
        const bd = hexDistance(best, wagenburg.position);
        return d < bd ? pos : best;
      }, validTargets[0]);
    }
    // Kimbri default: move toward nearest Roman (handled by generic)
  }

  // Forli: Cesare pushes infantry to citadel; Caterina's units chase culverins
  if (state.scenarioId === 'forli') {
    if (botFaction === 'tamerlane') {
      const def = UNIT_DEFINITIONS[unit.definitionType];
      if (def.activatedAbility || unit.definitionType === 'pikeman' ||
          unit.definitionType === 'rodelero' || unit.definitionType === 'cesare_borgia') {
        return validTargets.reduce((best, pos) => {
          const d = hexDistance(pos, FORLI_CITADEL);
          const bd = hexDistance(best, FORLI_CITADEL);
          return d < bd ? pos : best;
        }, validTargets[0]);
      }
      // Culverins stay put (setup required)
      if (unit.definitionType === 'culverin') return null;
    } else {
      // Caterina's defenders: move toward culverins
      const culverins = state.units.filter(u => u.faction === 'tamerlane' && u.definitionType === 'culverin');
      if (culverins.length > 0) {
        return validTargets.reduce((best, pos) => {
          const d = culverins.reduce((m, c) => Math.min(m, hexDistance(pos, c.position)), 99);
          const bd = culverins.reduce((m, c) => Math.min(m, hexDistance(best, c.position)), 99);
          return d < bd ? pos : best;
        }, validTargets[0]);
      }
    }
  }

  // Cerignola: French rush south for breakthrough; Spanish hold trenches
  if (state.scenarioId === 'cerignola') {
    if (botFaction === 'cilicia') {
      // Rush south to row 9
      return validTargets.reduce((best, pos) =>
        pos.row > best.row ? pos : best, validTargets[0]);
    }
    // Spanish: stay put for arquebusiers; rodeleros & pikemen stay near trenches
    const def = UNIT_DEFINITIONS[unit.definitionType];
    if (def.volleyFireBonus || unit.definitionType === 'culverin') return null;
  }

  return null; // fall through to generic logic
}
