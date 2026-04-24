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
    case 'tricamarum':
      return evaluateTricamarumGoal(goal, gameState, _campaign, baseXp);
    case 'neapol':
      return evaluateNeapolGoal(goal, gameState, _campaign, baseXp);
    case 'roma_6a':
      return evaluateRoma6aGoal(goal, gameState, baseXp);
    case 'roma_6b':
      return evaluateRoma6bGoal(goal, gameState, baseXp);
    case 'ravenna':
      return evaluateRavennaGoal(goal, gameState, _campaign, baseXp);
    case 'calabria':
      return evaluateCalabriaGoal(goal, gameState, _campaign, baseXp);
    case 'epilog_a':
      return evaluateEpilogAGoal(goal, gameState, baseXp);
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

// ─── Tricamarum ──────────────────────────────────────────────────────────────

function evaluateTricamarumGoal(
  goal: SecretGoalKind,
  gameState: GameState,
  _campaign: CampaignState,
  baseXp: number
): GoalEvaluation {
  if (goal === 'glory') {
    // Tzazon padl dříve než Gelimer — zkontrolujeme pořadí v destroyedUnits
    const tzazonIdx = gameState.destroyedUnits.findIndex(u => u.definitionType === 'tzazon');
    const gelimerIdx = gameState.destroyedUnits.findIndex(u => u.definitionType === 'gelimer');
    const tzazonDead = tzazonIdx >= 0;
    const gelimerDead = gelimerIdx >= 0;
    const tzazonFirst = tzazonDead && (!gelimerDead || tzazonIdx < gelimerIdx);
    return { achieved: tzazonFirst, buceliariiXpEarned: baseXp };
  }
  // pragma: Bukelárii ≥ 3 figurek na konci bitvy
  const buc = gameState.units.find(u => u.definitionType === 'bucelarii');
  return { achieved: !!buc && buc.hp >= 3, buceliariiXpEarned: baseXp };
}

// ─── Neapol ──────────────────────────────────────────────────────────────────

function evaluateNeapolGoal(
  goal: SecretGoalKind,
  gameState: GameState,
  _campaign: CampaignState,
  baseXp: number
): GoalEvaluation {
  if (goal === 'glory') {
    // Prolom hradbu do konce 5. kola: libovolný wall/gate hex destruct. a turn ≤ 5
    const hadWalls = gameState.terrain.some(
      t => t.terrain === 'plain' && (t.structureHp === 0 || t.structureHp === undefined)
    );
    // Simpler: count how many original wall/gate hexes ještě stojí
    // Use: if any former wall was destroyed AND turn ≤ 5 při victory
    // Approximation: check turnNumber ≤ 5 AND at least one wall/gate has structureHp = 0 or terrain = plain
    // For now we only have „all walls with structureHp>0". Let's say achieved if turn ≤ 5 when victory hit.
    return { achieved: gameState.turnNumber <= 5 && hadWalls, buceliariiXpEarned: baseXp };
  }
  // pragma: objev akvadukt — lehká pěchota stála na aqueduct_surface hexu
  // (approximace: libovolná hráčova jednotka byla na hexu v moveHistoryThisTurn nebo aktuálně)
  const aqueduct = gameState.terrain.find(t => t.terrain === 'aqueduct_surface');
  if (!aqueduct) return { achieved: false, buceliariiXpEarned: baseXp };
  const onAqueduct = gameState.units.some(
    u =>
      u.faction === 'cilicia' &&
      u.position.row === aqueduct.position.row &&
      u.position.col === aqueduct.position.col
  );
  return { achieved: onAqueduct, buceliariiXpEarned: baseXp };
}

// ─── Roma 6a ─────────────────────────────────────────────────────────────────

function evaluateRoma6aGoal(goal: SecretGoalKind, gameState: GameState, baseXp: number): GoalEvaluation {
  if (goal === 'glory') {
    // Zničit alespoň 1 gotickou obléhací věž (siege_tower)
    const towerKilled = gameState.destroyedUnits.some(
      u => u.faction === 'tamerlane' && u.definitionType === 'siege_tower'
    );
    return { achieved: towerKilled, buceliariiXpEarned: baseXp };
  }
  // pragma: Bukelárii na 4 figurkách
  const buc = gameState.units.find(u => u.definitionType === 'bucelarii');
  return { achieved: !!buc && buc.hp >= 4, buceliariiXpEarned: baseXp };
}

// ─── Roma 6b ─────────────────────────────────────────────────────────────────

function evaluateRoma6bGoal(goal: SecretGoalKind, gameState: GameState, baseXp: number): GoalEvaluation {
  if (goal === 'glory') {
    // Zabij Witigese
    const witigesDead = gameState.destroyedUnits.some(u => u.definitionType === 'witiges');
    return { achieved: witigesDead, buceliariiXpEarned: baseXp };
  }
  // pragma: ukonči s aspoň 3 byzantskými jednotkami naživu
  const survivors = gameState.units.filter(u => u.faction === 'cilicia').length;
  return { achieved: survivors >= 3, buceliariiXpEarned: baseXp };
}

// ─── Ravenna ─────────────────────────────────────────────────────────────────

function evaluateRavennaGoal(
  goal: SecretGoalKind,
  gameState: GameState,
  _campaign: CampaignState,
  baseXp: number
): GoalEvaluation {
  if (goal === 'glory') {
    // Diplomatické vítězství
    const gothicFallen = gameState.destroyedUnits.filter(u => u.faction === 'tamerlane').length;
    const belisarius = gameState.units.find(u => u.definitionType === 'belisarius' && u.faction === 'cilicia');
    if (!belisarius) return { achieved: false, buceliariiXpEarned: baseXp };
    const onPlaza = gameState.terrain.some(
      t => t.terrain === 'village' &&
           t.position.row === belisarius.position.row &&
           t.position.col === belisarius.position.col
    );
    return { achieved: onPlaza && gothicFallen <= 5, buceliariiXpEarned: baseXp };
  }
  // pragma: obsaď pokladnici (fortress)
  const treasury = gameState.terrain.find(t => t.terrain === 'fortress');
  if (!treasury) return { achieved: false, buceliariiXpEarned: baseXp };
  const onTreasury = gameState.units.some(
    u => u.faction === 'cilicia' &&
         u.position.row === treasury.position.row &&
         u.position.col === treasury.position.col
  );
  return { achieved: onTreasury, buceliariiXpEarned: baseXp };
}

// ─── Kalábrie ────────────────────────────────────────────────────────────────

function evaluateCalabriaGoal(
  goal: SecretGoalKind,
  gameState: GameState,
  _campaign: CampaignState,
  baseXp: number
): GoalEvaluation {
  if (goal === 'glory') {
    const totilaDead = gameState.destroyedUnits.some(u => u.definitionType === 'totila');
    return { achieved: totilaDead, buceliariiXpEarned: baseXp };
  }
  // pragma: žádná Bukelárska figurka nepadne — check via destroyedUnits & HP
  const bucAlive = gameState.units.find(u => u.definitionType === 'bucelarii');
  // Start HP 4, any loss means some figurine fell
  return { achieved: !!bucAlive && bucAlive.hp === 4, buceliariiXpEarned: baseXp };
}

// ─── Epilog A ────────────────────────────────────────────────────────────────

function evaluateEpilogAGoal(goal: SecretGoalKind, gameState: GameState, baseXp: number): GoalEvaluation {
  if (goal === 'glory') {
    // Vyhraj bez jediné ztráty
    const noLosses = gameState.destroyedUnits.filter(u => u.faction === 'cilicia').length === 0;
    return { achieved: noLosses, buceliariiXpEarned: baseXp };
  }
  const zaberganDead = gameState.destroyedUnits.some(u => u.definitionType === 'zabergan');
  return { achieved: zaberganDead, buceliariiXpEarned: baseXp };
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
