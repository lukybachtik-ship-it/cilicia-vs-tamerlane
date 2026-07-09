import type { CardInstance, CardId } from '../types/card';
import type { UnitInstance } from '../types/unit';
import type { GameState } from '../types/game';
import { CARD_DEFINITIONS, DECK_COMPOSITION } from '../constants/cardDefinitions';
import { shuffle, generateId, getZone, isCavalryType, isRangedType } from '../utils/helpers';

/** Build the full shared deck from DECK_COMPOSITION, shuffled. */
export function buildDeck(): CardInstance[] {
  const cards: CardInstance[] = [];
  for (const [id, count] of Object.entries(DECK_COMPOSITION)) {
    for (let i = 0; i < (count ?? 0); i++) {
      cards.push({ id: id as CardId, instanceId: generateId(id) });
    }
  }
  return shuffle(cards);
}

/** Deal 4 cards to each player from the deck. */
export function dealInitialHands(deck: CardInstance[]): {
  ciliciaHand: CardInstance[];
  tamerlaneHand: CardInstance[];
  remainingDeck: CardInstance[];
} {
  const d = [...deck];
  const ciliciaHand = d.splice(0, 4);
  const tamerlaneHand = d.splice(0, 4);
  return { ciliciaHand, tamerlaneHand, remainingDeck: d };
}

/**
 * Draw `count` cards for a player.
 * If draw pile is empty, reshuffle the discard pile.
 */
export function drawCards(
  deck: CardInstance[],
  discard: CardInstance[],
  count: number
): { drawn: CardInstance[]; newDeck: CardInstance[]; newDiscard: CardInstance[] } {
  let d = [...deck];
  let disc = [...discard];
  const drawn: CardInstance[] = [];

  for (let i = 0; i < count; i++) {
    if (d.length === 0) {
      if (disc.length === 0) break; // completely out of cards
      d = shuffle(disc);
      disc = [];
    }
    const card = d.shift()!;
    drawn.push(card);
  }

  return { drawn, newDeck: d, newDiscard: disc };
}

/** True if the unit is still asleep and cannot act this turn (Ascalon waves). */
function isSleepingUnit(unit: UnitInstance, state: GameState): boolean {
  return unit.sleepsUntilTurn !== undefined && state.turnNumber < unit.sleepsUntilTurn;
}

/**
 * Pure restriction check: does this unit satisfy the card's section and
 * unit-type limits? (Ignores maxActivations / already-activated state.)
 *
 * Unit type filter — single source of truth v utils/helpers.ts
 * (Karta „Jízdní zteč" aktivuje všechny jezdce včetně Belisaria, Bukelárií,
 *  rytířů, nájezdníků, perské/vandalské/gotské jízdy a hunské hordy.)
 */
function passesCardRestrictions(
  def: (typeof CARD_DEFINITIONS)[CardId],
  unit: UnitInstance,
  state: GameState
): boolean {
  if (isSleepingUnit(unit, state)) return false;

  // Section restriction
  if (def.sectionRestricted) {
    const cardSection = def.generalOffensive
      ? state.generalOffensiveSection
      : def.section;
    if (cardSection && cardSection !== 'any') {
      if (getZone(unit.position.col) !== cardSection) return false;
    }
  }

  if (def.unitTypeFilter === 'cavalry') {
    if (!isCavalryType(unit.definitionType)) return false;
  }
  if (def.unitTypeFilter === 'ranged') {
    if (!isRangedType(unit.definitionType)) return false;
  }
  if (def.unitTypeFilter === 'infantry') {
    // Pěší jednotky = vše, co není jízda ani střelec (kopiníci, šermíři,
    // lehká/těžká pěchota, garda, milice, zvěd…)
    if (isCavalryType(unit.definitionType) || isRangedType(unit.definitionType)) return false;
  }
  if (def.unitTypeFilter === 'flanks') {
    // Jen jednotky na křídlech (mimo střed)
    if (getZone(unit.position.col) === 'center') return false;
  }

  return true;
}

/**
 * Fallback pravidlo: pokud zahraná karta nemá ŽÁDNOU jednotku, která by
 * splnila její omezení (např. Jízdní zteč bez jediné jízdy, sekční karta
 * s prázdnou sekcí), hráč smí místo toho aktivovat 1 libovolnou jednotku
 * kdekoliv — karta tak nikdy nezasekne hru.
 */
export function isCardFallbackActive(playedCard: CardInstance, state: GameState): boolean {
  const def = CARD_DEFINITIONS[playedCard.id];
  return !state.units.some(
    u => u.faction === state.currentPlayer && passesCardRestrictions(def, u, state)
  );
}

/**
 * Kolik jednotek karta reálně dokáže aktivovat (pro bot skórování a UI).
 * Ve fallback režimu je to vždy 1.
 */
export function effectiveActivationCount(
  playedCard: CardInstance,
  state: GameState,
  faction: GameState['currentPlayer']
): number {
  const def = CARD_DEFINITIONS[playedCard.id];
  const eligible = state.units.filter(
    u => u.faction === faction && passesCardRestrictions(def, u, state)
  ).length;
  if (eligible === 0) return state.units.some(u => u.faction === faction) ? 1 : 0;
  return Math.min(eligible, def.maxActivations);
}

/**
 * Check whether the currently played card allows activating a given unit.
 */
export function canCardActivateUnit(
  playedCard: CardInstance,
  unit: UnitInstance,
  activatedIds: string[],
  state: GameState
): boolean {
  const def = CARD_DEFINITIONS[playedCard.id];

  // Unit must belong to current player and not be already activated/asleep
  if (unit.faction !== state.currentPlayer) return false;
  if (activatedIds.includes(unit.id)) return false;
  if (isSleepingUnit(unit, state)) return false;

  // Fallback: karta bez platných cílů → 1 libovolná jednotka kdekoliv
  if (isCardFallbackActive(playedCard, state)) {
    return activatedIds.length < 1;
  }

  if (!passesCardRestrictions(def, unit, state)) return false;

  if (def.unitTypeFilter === 'one_per_section') {
    // Coordinated Advance: at most 1 unit per section already activated
    const unitSection = getZone(unit.position.col);
    const alreadyActivatedInSection = activatedIds.some(id => {
      const u = state.units.find(u2 => u2.id === id);
      return u && getZone(u.position.col) === unitSection;
    });
    if (alreadyActivatedInSection) return false;
  }

  // Max activations check
  if (activatedIds.length >= def.maxActivations) return false;

  return true;
}
