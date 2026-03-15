import type { UnitInstance, Position } from '../types/unit';
import type { TerrainCell } from '../types/terrain';
import type { GameState } from '../types/game';
import { buildDeck, dealInitialHands } from '../logic/cards';

// ─── Terrain ─────────────────────────────────────────────────────────────────
// Row 1 = Cilicia home (top of screen), Row 9 = Tamerlane home (bottom)

const TERRAIN: TerrainCell[] = [
  { position: { row: 3, col: 5 }, terrain: 'fortress', elevation: 0 },
  { position: { row: 4, col: 2 }, terrain: 'hill',     elevation: 1 },
  { position: { row: 3, col: 8 }, terrain: 'hill',     elevation: 1 },
  { position: { row: 5, col: 7 }, terrain: 'hill',     elevation: 1 },
  { position: { row: 6, col: 3 }, terrain: 'forest',   elevation: 0 },
  { position: { row: 6, col: 4 }, terrain: 'forest',   elevation: 0 },
  { position: { row: 7, col: 6 }, terrain: 'forest',   elevation: 0 },
];

// ─── Unit factory ─────────────────────────────────────────────────────────────
function makeUnit(
  id: string,
  definitionType: UnitInstance['definitionType'],
  faction: UnitInstance['faction'],
  position: Position
): UnitInstance {
  return {
    id,
    definitionType,
    faction,
    hp: 3,
    position,
    hasMoved: false,
    hasAttacked: false,
    isActivated: false,
    attackBonus: 0,
    moveBonus: 0,
    directFireLocked: false,
    parthianPhase: 'none',
  };
}

// ─── Cilicia starting units (rows 1–3, home side = row 1) ────────────────────
const CILICIA_UNITS: UnitInstance[] = [
  makeUnit('cil_li_1', 'light_infantry', 'cilicia', { row: 2, col: 2 }),
  makeUnit('cil_li_2', 'light_infantry', 'cilicia', { row: 2, col: 4 }),
  makeUnit('cil_li_3', 'light_infantry', 'cilicia', { row: 2, col: 6 }),
  makeUnit('cil_li_4', 'light_infantry', 'cilicia', { row: 2, col: 8 }),
  makeUnit('cil_hi_1', 'heavy_infantry',  'cilicia', { row: 2, col: 5 }),
  makeUnit('cil_ar_1', 'archers',          'cilicia', { row: 1, col: 3 }),
  makeUnit('cil_ar_2', 'archers',          'cilicia', { row: 1, col: 5 }),
  makeUnit('cil_ar_3', 'archers',          'cilicia', { row: 1, col: 7 }),
  makeUnit('cil_lc_1', 'light_cavalry',    'cilicia', { row: 2, col: 1 }),
  makeUnit('cil_lc_2', 'light_cavalry',    'cilicia', { row: 2, col: 9 }),
];

// ─── Tamerlane starting units (rows 7–9, home side = row 9) ──────────────────
const TAMERLANE_UNITS: UnitInstance[] = [
  makeUnit('tam_hi_1', 'heavy_infantry',  'tamerlane', { row: 8, col: 4 }),
  makeUnit('tam_hi_2', 'heavy_infantry',  'tamerlane', { row: 8, col: 5 }),
  makeUnit('tam_hi_3', 'heavy_infantry',  'tamerlane', { row: 8, col: 6 }),
  makeUnit('tam_li_1', 'light_infantry',  'tamerlane', { row: 8, col: 2 }),
  makeUnit('tam_li_2', 'light_infantry',  'tamerlane', { row: 8, col: 8 }),
  makeUnit('tam_ha_1', 'horse_archers',   'tamerlane', { row: 7, col: 1 }),
  makeUnit('tam_ha_2', 'horse_archers',   'tamerlane', { row: 7, col: 3 }),
  makeUnit('tam_ha_3', 'horse_archers',   'tamerlane', { row: 7, col: 7 }),
  makeUnit('tam_ha_4', 'horse_archers',   'tamerlane', { row: 7, col: 9 }),
  makeUnit('tam_hc_1', 'heavy_cavalry',   'tamerlane', { row: 9, col: 3 }),
  makeUnit('tam_hc_2', 'heavy_cavalry',   'tamerlane', { row: 9, col: 7 }),
];

// ─── Build initial game state ─────────────────────────────────────────────────
export function buildInitialState(): GameState {
  const deck = buildDeck();
  const { ciliciaHand, tamerlaneHand, remainingDeck } = dealInitialHands(deck);

  return {
    terrain: TERRAIN,
    units: [...CILICIA_UNITS, ...TAMERLANE_UNITS],
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
    combatLog: [],
    victor: null,
    victoryCause: null,
    selectedUnitId: null,
    validMoveTargets: [],
    validAttackTargets: [],
  };
}
