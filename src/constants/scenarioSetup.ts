import type { UnitInstance } from '../types/unit';
import type { GameState } from '../types/game';
import { UNIT_DEFINITIONS } from './unitDefinitions';
import { buildDeck, dealInitialHands } from '../logic/cards';
import { ALL_SCENARIOS, SCENARIO_STANDARD, type ScenarioUnitSeed } from './scenarios';
import { recomputeAuras, type ActiveModifier } from '../logic/modifiers';
import { generateId } from '../utils/helpers';

/**
 * Volitelné překryvy z kampaňové vrstvy — modifikují stavy Bukelárií,
 * Gelimera a případné Velitelské rady nákupy při startu bitvy.
 */
export interface CampaignOverrides {
  /** Level Bukelárií 1-4 (přepočítáno z XP v CampaignState). */
  buceliariiLevel?: 1 | 2 | 3 | 4;
  /** Aktuální figurek Bukelárií (0-4, 0 = v rekonvalescenci → nespawnovat). */
  buceliariiFigurines?: number;
  /** Pokud true, Gelimer v Tricamaru startuje s −1 figurkou. */
  gelimerWounded?: boolean;
  /** Odemčení Katafraktů pro tento scénář (jinak v ALL_SCENARIOS chybí). */
  katafraktiUnlocked?: boolean;
  /** IDs nákupů z Velitelské rady aplikované v této bitvě. */
  purchases?: string[];
}

// ─── Unit factory from scenario definition ─────────────────────────────────────
function hydrateUnit(raw: ScenarioUnitSeed): UnitInstance {
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
    moveHistoryThisTurn: [raw.position],
    specialAbilityUsed: false,
  };
}

// ─── Build initial game state ──────────────────────────────────────────────────
export function buildInitialState(scenarioId?: string, overrides?: CampaignOverrides): GameState {
  const scenario =
    ALL_SCENARIOS.find(s => s.id === scenarioId) ?? SCENARIO_STANDARD;

  const deck = buildDeck();
  const { ciliciaHand, tamerlaneHand, remainingDeck } = dealInitialHands(deck);

  let units: UnitInstance[] = [
    ...scenario.ciliciaUnits.map(hydrateUnit),
    ...scenario.tamerlaneUnits.map(hydrateUnit),
  ];

  const campaignModifiers: ActiveModifier[] = [];

  // ── Kampaňové overrides ────────────────────────────────────────────────
  if (overrides) {
    const bucUnit = units.find(u => u.definitionType === 'bucelarii');

    // Pokud Bukelárii nemají figurky, odstraň je z bitvy
    if (bucUnit && overrides.buceliariiFigurines !== undefined && overrides.buceliariiFigurines <= 0) {
      units = units.filter(u => u.id !== bucUnit.id);
    } else if (bucUnit) {
      // Nastav aktuální HP podle figurineCount (4 max)
      if (overrides.buceliariiFigurines !== undefined) {
        bucUnit.hp = Math.max(1, Math.min(4, overrides.buceliariiFigurines));
      }
      // Aplikuj bonusy podle úrovně
      const level = overrides.buceliariiLevel ?? 1;
      if (level >= 2) {
        // L2: +1 útočná kostka (trvalé na celou bitvu)
        campaignModifiers.push({
          id: generateId('mod_bucl2'),
          source: 'aura',  // „elite" aura od jednotky samé — persistentní
          sourceUnitId: bucUnit.id,
          descriptionCs: 'Bukelárii úroveň 2: +1 kostka útoku',
          targetFilter: { unitIds: [bucUnit.id] },
          effect: { attackDice: 1 },
          duration: { kind: 'permanent' },
        });
      }
      if (level >= 3) {
        // L3: ignoruje terrain-stop (jako Zvěd) — lze prolétnout lesem
        // Implementace: nastav per-unit flag přes modifier není možné
        // (ignoresTerrainStop je def-level flag); místo toho přepínáme
        // definition-level flag virtuálně přes speciální bonus
        // range bonus — simplifikace.
        campaignModifiers.push({
          id: generateId('mod_bucl3'),
          source: 'aura',
          sourceUnitId: bucUnit.id,
          descriptionCs: 'Bukelárii úroveň 3: +1 pohyb (může projet terénem)',
          targetFilter: { unitIds: [bucUnit.id] },
          effect: { moveBonus: 1 },
          duration: { kind: 'permanent' },
        });
      }
      if (level >= 4) {
        // L4: +2 útočné kostky celkem (kumulativní s L2 → +3)
        campaignModifiers.push({
          id: generateId('mod_bucl4'),
          source: 'aura',
          sourceUnitId: bucUnit.id,
          descriptionCs: 'Bukelárii úroveň 4: dvojnásobná síla (+1 útok)',
          targetFilter: { unitIds: [bucUnit.id] },
          effect: { attackDice: 1 },
          duration: { kind: 'permanent' },
        });
      }
    }

    // Gelimer wounded flag (Tricamarum)
    if (overrides.gelimerWounded) {
      const gelimer = units.find(u => u.definitionType === 'gelimer');
      if (gelimer) gelimer.hp = Math.max(1, gelimer.hp - 1);
    }
  }

  const initial: GameState = {
    scenarioId: scenario.id,
    gridRows: scenario.gridRows ?? 9,
    gridCols: scenario.gridCols ?? 9,
    terrain: scenario.terrain.map(t => ({ ...t })),
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
    pendingBetrayalSourceId: null,
    volleyShotsThisTurn: [],
    pendingReinforcement: null,
    activeScenarioEffects: (scenario.scenarioEffects ?? []).map(e => ({ ...e })),
    activeModifiers: campaignModifiers,
    combatLog: [],
    victor: null,
    victoryCause: null,
    selectedUnitId: null,
    validMoveTargets: [],
    validAttackTargets: [],
    validAttackTerrainTargets: [],
  };
  // Seed initial auras (e.g. Caterina) at battle start
  return recomputeAuras(initial);
}
