import type { GameState } from '../types/game';
import type { CampaignState, SecretGoalKind } from '../types/campaign';

/**
 * Per-scénářový vyhodnocovač tajných cílů.
 * Volá se z post-victory flow; vrací zda byl cíl splněn + případný bonus XP.
 */

export interface GoalEvaluation {
  achieved: boolean;
  /** Bonus XP dodatečný k těm z úspěšných útoků. */
  buceliariiXpEarned?: number;
}

export function evaluateSecretGoal(
  scenarioId: string,
  goal: SecretGoalKind,
  gameState: GameState,
  _campaign: CampaignState
): GoalEvaluation {
  const xpFromAttacks = countSuccessfulBuceliariiAttacks(gameState);
  const baseXp = Math.floor(xpFromAttacks / 2); // 1 XP per 2 successful attacks

  switch (scenarioId) {
    case 'dara':
      return evaluateDaraGoal(goal, gameState, baseXp);
    case 'nika':
      return evaluateNikaGoal(goal, gameState, baseXp);
    case 'ad_decimum':
      return evaluateAdDecimumGoal(goal, gameState, baseXp);
    default:
      return { achieved: false, buceliariiXpEarned: baseXp };
  }
}

// ─── Dara ────────────────────────────────────────────────────────────────────

function evaluateDaraGoal(
  goal: SecretGoalKind,
  gameState: GameState,
  baseXp: number
): GoalEvaluation {
  if (goal === 'glory') {
    // Firouz padl
    const firouzDead = gameState.destroyedUnits.some(u => u.definitionType === 'firouz');
    return { achieved: firouzDead, buceliariiXpEarned: baseXp };
  }
  // pragma: žádný nepřítel nestoupil na fortress hex
  const fortresses = gameState.terrain.filter(t => t.terrain === 'fortress');
  const enemyOnFortress = gameState.units.some(
    u =>
      u.faction === 'tamerlane' &&
      fortresses.some(f => f.position.row === u.position.row && f.position.col === u.position.col)
  );
  // Also check destroyed units — if any enemy was ever on a fortress hex, it counts as breached
  // (approximation — we don't have movement history of destroyed units)
  return { achieved: !enemyOnFortress, buceliariiXpEarned: baseXp };
}

// ─── Nika ────────────────────────────────────────────────────────────────────

function evaluateNikaGoal(
  goal: SecretGoalKind,
  gameState: GameState,
  baseXp: number
): GoalEvaluation {
  if (goal === 'glory') {
    const hypatiusDead = gameState.destroyedUnits.some(u => u.definitionType === 'hypatius');
    const pompeiusDead = gameState.destroyedUnits.some(u => u.definitionType === 'pompeius');
    return { achieved: hypatiusDead && pompeiusDead, buceliariiXpEarned: baseXp };
  }
  // pragma: žádný nepřítel se nikdy nedostal sousedně s palácem (jen approximate: current check)
  const palace = gameState.terrain.find(t => t.terrain === 'fortress'); // palác = fortress marker
  if (!palace) return { achieved: true, buceliariiXpEarned: baseXp };
  const enemyNearPalace = gameState.units.some(u => {
    if (u.faction !== 'tamerlane') return false;
    const dr = Math.abs(u.position.row - palace.position.row);
    const dc = Math.abs(u.position.col - palace.position.col);
    return Math.max(dr, dc) <= 1;
  });
  return { achieved: !enemyNearPalace, buceliariiXpEarned: baseXp };
}

// ─── Ad Decimum ──────────────────────────────────────────────────────────────

function evaluateAdDecimumGoal(
  goal: SecretGoalKind,
  gameState: GameState,
  baseXp: number
): GoalEvaluation {
  if (goal === 'glory') {
    // Ammatas padl do konce 3. kola (přibližně: padl a jsme v kole ≤ 3 při konci bitvy)
    const ammatasDead = gameState.destroyedUnits.some(u => u.definitionType === 'ammatas');
    return {
      achieved: ammatasDead && gameState.turnNumber <= 3,
      buceliariiXpEarned: baseXp,
    };
  }
  // pragma: obsadit vesnici Ad Decimum
  const village = gameState.terrain.find(t => t.terrain === 'village');
  if (!village) return { achieved: false, buceliariiXpEarned: baseXp };
  const onVillage = gameState.units.some(
    u => u.faction === 'cilicia' && u.position.row === village.position.row && u.position.col === village.position.col
  );
  return { achieved: onVillage, buceliariiXpEarned: baseXp };
}

// ─── Bukelárii XP helper ─────────────────────────────────────────────────────

function countSuccessfulBuceliariiAttacks(gameState: GameState): number {
  return gameState.combatLog.filter(
    entry =>
      entry.attackerName.includes('Bukelárii') &&
      entry.hits > 0 &&
      !entry.isCounter
  ).length;
}
