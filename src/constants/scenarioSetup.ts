import type { UnitInstance } from '../types/unit';
import type { GameState } from '../types/game';
import { UNIT_DEFINITIONS } from './unitDefinitions';
import { buildDeck, dealInitialHands } from '../logic/cards';
import { ALL_SCENARIOS, SCENARIO_STANDARD } from './scenarios';

// ─── Unit factory from scenario definition ─────────────────────────────────────
function hydrateUnit(
  raw: Omit<UnitInstance, 'hp' | 'hasMoved' | 'hasAttacked' | 'isActivated' | 'attackBonus' | 'moveBonus' | 'directFireLocked' | 'parthianPhase'>
): UnitInstance {
  const def = UNIT_DEFINITIONS[raw.definitionType];
  return {
    ...raw,
    hp: def.maxHp, // use definition's maxHp (e.g. militia has 2)
    hasMoved: false,
    hasAttacked: false,
    isActivated: false,
    attackBonus: 0,
    moveBonus: 0,
    directFireLocked: false,
    parthianPhase: 'none',
  };
}

// ─── Build initial game state ──────────────────────────────────────────────────
export function buildInitialState(scenarioId?: string): GameState {
  const scenario =
    ALL_SCENARIOS.find(s => s.id === scenarioId) ?? SCENARIO_STANDARD;

  const deck = buildDeck();
  const { ciliciaHand, tamerlaneHand, remainingDeck } = dealInitialHands(deck);

  const units: UnitInstance[] = [
    ...scenario.ciliciaUnits.map(hydrateUnit),
    ...scenario.tamerlaneUnits.map(hydrateUnit),
  ];

  return {
    scenarioId: scenario.id,
    gridRows: scenario.gridRows ?? 9,
    gridCols: scenario.gridCols ?? 9,
    terrain: scenario.terrain,
    units,
    destroyedUnits: [],
    deck: remainingDeck,
    discardPile: [],
    ciliciaHand,
    tamerlaneHand,
    currentPlayer: 'cilicia',
    currentPhase: 'play_card',
    turnNumber: 1,
    playedCard: null,
    activatedUnitIds: [],
    pendingDrawnCards: [],
    generalOffensiveSection: null,
    pendingReinforcement: null,
    combatLog: [],
    victor: null,
    victoryCause: null,
    selectedUnitId: null,
    validMoveTargets: [],
    validAttackTargets: [],
  };
}
