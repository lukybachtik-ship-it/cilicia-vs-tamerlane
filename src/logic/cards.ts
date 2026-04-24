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

  // Section restriction
  if (def.sectionRestricted) {
    const cardSection = def.generalOffensive
      ? state.generalOffensiveSection
      : def.section;
    if (cardSection && cardSection !== 'any') {
      if (getZone(unit.position.col) !== cardSection) return false;
    }
  }

  // Unit type filter — single source of truth v utils/helpers.ts
  // (Karta „Jízdní zteč" aktivuje všechny jezdce včetně Belisaria, Bukelárií,
  //  gendarmů, stradiotů, perské/vandalské/gotské jízdy a hunské hordy.)
  if (def.unitTypeFilter === 'cavalry') {
    if (!isCavalryType(unit.definitionType)) return false;
  }
  if (def.unitTypeFilter === 'ranged') {
    if (!isRangedType(unit.definitionType)) return false;
  }
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

  // Unit must belong to current player
  if (unit.faction !== state.currentPlayer) return false;

  // Unit must not already be activated
  if (activatedIds.includes(unit.id)) return false;

  return true;
}
