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
  /** Obtížnost bota: easy = bez bonusů, normal = +1 lehká jednotka,
   *  hard = +1 lehká jednotka + +1 attack die modifier celou frakci. */
  difficulty?: 'easy' | 'normal' | 'hard';
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

    // ── Pre-battle nákupy z Velitelské rady (hráč = cilicia) ─────────────
    // Reinforcement: spawn 1 light_infantry v druhé řadě (týl)
    if (overrides.purchases?.includes('reinforcement')) {
      const spawnRow = 2;
      const occupiedCols = units
        .filter(u => u.position.row === spawnRow)
        .map(u => u.position.col);
      const terrainBlockedCols = (scenario.terrain ?? [])
        .filter(t => t.position.row === spawnRow &&
          ['wall', 'gate', 'fortress'].includes(t.terrain))
        .map(t => t.position.col);
      let spawnCol: number | null = null;
      const centerStart = Math.floor((scenario.gridCols ?? 9) / 2);
      // Preferuj hexy blíže středu (spíš podpoří centrum fronty)
      const tryOrder: number[] = [];
      for (let off = 0; off <= (scenario.gridCols ?? 9); off++) {
        if (centerStart - off >= 1) tryOrder.push(centerStart - off);
        if (off > 0 && centerStart + off <= (scenario.gridCols ?? 9)) tryOrder.push(centerStart + off);
      }
      for (const c of tryOrder) {
        if (!occupiedCols.includes(c) && !terrainBlockedCols.includes(c)) {
          spawnCol = c; break;
        }
      }
      if (spawnCol !== null) {
        const def = UNIT_DEFINITIONS.light_infantry;
        units.push({
          id: generateId('purchase_reinf'),
          definitionType: 'light_infantry',
          faction: 'cilicia',
          hp: def.maxHp,
          position: { row: spawnRow, col: spawnCol },
          hasMoved: false,
          hasAttacked: false,
          isActivated: false,
          attackBonus: 0,
          moveBonus: 0,
          directFireLocked: false,
          parthianPhase: 'none',
          moveHistoryThisTurn: [{ row: spawnRow, col: spawnCol }],
          specialAbilityUsed: false,
        });
      }
    }

    // Katafrakti (odemčeno přes Favor 6 nebo scénářový unlock po Tricamaru)
    if (overrides.purchases?.includes('katafrakti')) {
      const spawnRow = 2;
      const occupiedCols = units
        .filter(u => u.position.row === spawnRow)
        .map(u => u.position.col);
      const centerStart = Math.floor((scenario.gridCols ?? 9) / 2);
      let spawnCol: number | null = null;
      for (let off = 0; off <= (scenario.gridCols ?? 9); off++) {
        if (centerStart - off >= 1 && !occupiedCols.includes(centerStart - off)) {
          spawnCol = centerStart - off; break;
        }
        if (off > 0 && centerStart + off <= (scenario.gridCols ?? 9) && !occupiedCols.includes(centerStart + off)) {
          spawnCol = centerStart + off; break;
        }
      }
      if (spawnCol !== null) {
        const def = UNIT_DEFINITIONS.cataphract;
        units.push({
          id: generateId('purchase_katafr'),
          definitionType: 'cataphract',
          faction: 'cilicia',
          hp: def.maxHp,
          position: { row: spawnRow, col: spawnCol },
          hasMoved: false,
          hasAttacked: false,
          isActivated: false,
          attackBonus: 0,
          moveBonus: 0,
          directFireLocked: false,
          parthianPhase: 'none',
          moveHistoryThisTurn: [{ row: spawnRow, col: spawnCol }],
          specialAbilityUsed: false,
        });
      }
    }

    // Volba sektoru: Belisarius získá +1 pohyb první kolo (reprezentuje lepší startovní pozici)
    // Skutečnou volbu sektoru hráčem odkládáme na pozdější iteraci (vyžadovala by UI)
    if (overrides.purchases?.includes('sector_choice')) {
      const belisarius = units.find(u => u.definitionType === 'belisarius');
      if (belisarius) {
        campaignModifiers.push({
          id: generateId('mod_sector'),
          source: 'ability',
          sourceUnitId: belisarius.id,
          descriptionCs: 'Volba sektoru: Belisarius +1 pohyb první kolo',
          targetFilter: { unitIds: [belisarius.id] },
          effect: { moveBonus: 1 },
          duration: { kind: 'turns', remainingTurns: 1 },
        });
      }
    }

    // Průzkum (1 zás.): informativní — reveal pozic; v MVP jen tooltip ve SupplyPanelu
    // Špion (3 zás.): odemkne free Peek (handled in SupplyPanel by checking purchases)
    // Buried_archers (Dara 2 zás.), legionary_devotion (5 zás.): jednorázové bitevní akce
    // — zatím neimplementováno, zobrazuje se jen jako "✓ zakoupeno" bez efektu

    // Difficulty bonus pro bota (tamerlane faction):
    //   easy: žádný bonus
    //   normal: spawn 1 light_infantry navíc v řadě bota
    //   hard: +1 light_infantry + permanent +1 attackDice modifier všem bot jednotkám
    const diff = overrides.difficulty ?? 'normal';
    if (diff === 'normal' || diff === 'hard') {
      const botRow = scenario.gridRows ?? 9; // poslední řada = bot home
      let spawnCol: number | null = null;
      const occupiedCols = units
        .filter(u => u.position.row === botRow)
        .map(u => u.position.col);
      for (let c = 1; c <= (scenario.gridCols ?? 9); c++) {
        if (!occupiedCols.includes(c)) { spawnCol = c; break; }
      }
      if (spawnCol !== null) {
        const def = UNIT_DEFINITIONS.light_infantry;
        units.push({
          id: generateId('diff_bot_bonus'),
          definitionType: 'light_infantry',
          faction: 'tamerlane',
          hp: def.maxHp,
          position: { row: botRow, col: spawnCol },
          hasMoved: false,
          hasAttacked: false,
          isActivated: false,
          attackBonus: 0,
          moveBonus: 0,
          directFireLocked: false,
          parthianPhase: 'none',
          moveHistoryThisTurn: [{ row: botRow, col: spawnCol }],
          specialAbilityUsed: false,
        });
      }
    }
    if (diff === 'hard') {
      campaignModifiers.push({
        id: generateId('mod_hard_bot'),
        source: 'scenario',
        descriptionCs: 'Vyšší obtížnost: bot má +1 kostku útoku',
        targetFilter: { faction: 'tamerlane' },
        effect: { attackDice: 1 },
        duration: { kind: 'permanent' },
      });
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
