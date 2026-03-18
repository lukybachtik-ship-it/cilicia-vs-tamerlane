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
import { getValidAttackTargets } from './combat';
import { hexDistance } from '../utils/hexGrid';

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

  for (const card of hand) {
    const def = CARD_DEFINITIONS[card.id];
    const activatable = state.units.filter(
      u => u.faction === botFaction && canCardActivateUnit(card, u, [], state)
    );
    let score = activatable.length * 10;
    score += def.attackBonus * 5;
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
    u => u.faction === botFaction && canCardActivateUnit(card, u, state.activatedUnitIds, state)
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
): string | null {
  if (validTargetIds.length === 0) return null;

  const scored = validTargetIds.map(id => {
    const target = state.units.find(u => u.id === id);
    if (!target) return { id, score: 0 };
    let score = (4 - target.hp) * 10; // prefer low-HP targets (almost dead)
    // Prefer targets on fortresses (block victory / clear objectives)
    const onFortress = state.terrain.some(
      t => t.terrain === 'fortress' &&
           t.position.row === target.position.row &&
           t.position.col === target.position.col
    );
    if (onFortress) score += 30;
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
      getValidAttackTargets(u, state).length > 0
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
