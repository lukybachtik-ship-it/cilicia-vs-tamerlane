import type { GameState } from '../types/game';
import type { UnitInstance } from '../types/unit';
import type { GameAction } from './actions';
import { CARD_DEFINITIONS } from '../constants/cardDefinitions';
import { UNIT_DEFINITIONS } from '../constants/unitDefinitions';
import { buildInitialState } from '../constants/scenarioSetup';
import { getValidMoves } from '../logic/movement';
import { resolveAttack, getValidAttackTargets } from '../logic/combat';
import { drawCards, canCardActivateUnit } from '../logic/cards';
import { checkVictory } from '../logic/victory';
import { getZone, posEqual } from '../utils/helpers';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getUnit(state: GameState, id: string): UnitInstance | undefined {
  return state.units.find(u => u.id === id);
}

function updateUnit(
  units: UnitInstance[],
  id: string,
  patch: Partial<UnitInstance>
): UnitInstance[] {
  return units.map(u => (u.id === id ? { ...u, ...patch } : u));
}

function resetUnitForTurn(u: UnitInstance): UnitInstance {
  return {
    ...u,
    hasMoved: false,
    hasAttacked: false,
    isActivated: false,
    attackBonus: 0,
    moveBonus: 0,
    directFireLocked: false,
    parthianPhase: 'none',
  };
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

export function gameReducer(state: GameState, action: GameAction): GameState {
  if (state.victor && action.type !== 'RESTART_GAME' && action.type !== 'SET_STATE') return state;

  switch (action.type) {

    // ── Restore snapshot (undo) ──────────────────────────────────────────────
    case 'SET_STATE':
      return action.state;

    // ── Restart ─────────────────────────────────────────────────────────────
    case 'RESTART_GAME':
      return buildInitialState(action.scenarioId);

    // ── Play a card ──────────────────────────────────────────────────────────
    case 'PLAY_CARD': {
      const hand =
        state.currentPlayer === 'cilicia' ? state.ciliciaHand : state.tamerlaneHand;
      const cardInst = hand.find(c => c.instanceId === action.cardInstanceId);
      if (!cardInst) return state;

      const cardDef = CARD_DEFINITIONS[cardInst.id];

      // Remove from hand, add to discard
      const newHand = hand.filter(c => c.instanceId !== action.cardInstanceId);
      const newDiscard = [...state.discardPile, cardInst];

      let nextState: GameState = {
        ...state,
        discardPile: newDiscard,
        ...(state.currentPlayer === 'cilicia'
          ? { ciliciaHand: newHand }
          : { tamerlaneHand: newHand }),
        playedCard: cardInst,
        activatedUnitIds: [],
        selectedUnitId: null,
        validMoveTargets: [],
        validAttackTargets: [],
      };

      if (cardDef.scoutDraw) {
        // Draw 2 cards, then player must discard 1
        const { drawn, newDeck, newDiscard: nd } = drawCards(
          nextState.deck,
          nextState.discardPile,
          2
        );
        nextState = {
          ...nextState,
          deck: newDeck,
          discardPile: nd,
          pendingDrawnCards: drawn,
          currentPhase: 'discard_drawn',
        };
      } else if (cardDef.generalOffensive) {
        nextState = { ...nextState, currentPhase: 'select_section' };
      } else {
        nextState = { ...nextState, currentPhase: 'activate_units' };
      }

      return nextState;
    }

    // ── Scout: discard one of two drawn cards ────────────────────────────────
    case 'DISCARD_DRAWN_CARD': {
      const kept = state.pendingDrawnCards.filter(
        c => c.instanceId !== action.cardInstanceId
      );
      const discarded = state.pendingDrawnCards.find(
        c => c.instanceId === action.cardInstanceId
      );
      if (!discarded) return state;

      const hand =
        state.currentPlayer === 'cilicia' ? state.ciliciaHand : state.tamerlaneHand;
      const newHand = [...hand, ...kept];

      return {
        ...state,
        ...(state.currentPlayer === 'cilicia'
          ? { ciliciaHand: newHand }
          : { tamerlaneHand: newHand }),
        discardPile: [...state.discardPile, discarded],
        pendingDrawnCards: [],
        currentPhase: 'activate_units',
      };
    }

    // ── General Offensive: choose section ────────────────────────────────────
    case 'SELECT_GENERAL_OFFENSIVE_SECTION': {
      if (!state.playedCard) return state;

      // Auto-activate all current-player units in that section with move capped to 1
      const eligibleUnits = state.units.filter(
        u =>
          u.faction === state.currentPlayer &&
          getZone(u.position.col) === action.section
      );

      const activatedIds = eligibleUnits.map(u => u.id);
      const newUnits = state.units.map(u => {
        if (!activatedIds.includes(u.id)) return u;
        return {
          ...u,
          isActivated: true,
          moveBonus: -(UNIT_DEFINITIONS[u.definitionType].move - 1), // cap at move=1
        };
      });

      return {
        ...state,
        units: newUnits,
        generalOffensiveSection: action.section,
        activatedUnitIds: activatedIds,
        currentPhase: 'move',
        selectedUnitId: null,
        validMoveTargets: [],
        validAttackTargets: [],
      };
    }

    // ── Activate a unit ──────────────────────────────────────────────────────
    case 'ACTIVATE_UNIT': {
      if (!state.playedCard) return state;
      const unit = getUnit(state, action.unitId);
      if (!unit || unit.faction !== state.currentPlayer) return state;

      if (!canCardActivateUnit(state.playedCard, unit, state.activatedUnitIds, state)) {
        return state;
      }

      const cardDef = CARD_DEFINITIONS[state.playedCard.id];

      const newUnits = updateUnit(state.units, action.unitId, {
        isActivated: true,
        attackBonus: cardDef.attackBonus,
        moveBonus: cardDef.moveBonus,
        directFireLocked: cardDef.noMoveAllowed,
      });

      return {
        ...state,
        units: newUnits,
        activatedUnitIds: [...state.activatedUnitIds, action.unitId],
      };
    }

    // ── Deactivate a unit (undo activation) ──────────────────────────────────
    case 'DEACTIVATE_UNIT': {
      if (!state.activatedUnitIds.includes(action.unitId)) return state;
      const newUnits = updateUnit(state.units, action.unitId, {
        isActivated: false,
        attackBonus: 0,
        moveBonus: 0,
        directFireLocked: false,
      });
      return {
        ...state,
        units: newUnits,
        activatedUnitIds: state.activatedUnitIds.filter(id => id !== action.unitId),
      };
    }

    // ── Confirm activations → move phase ─────────────────────────────────────
    case 'CONFIRM_ACTIVATIONS': {
      if (state.activatedUnitIds.length === 0) return state;
      return {
        ...state,
        currentPhase: 'move',
        selectedUnitId: null,
        validMoveTargets: [],
        validAttackTargets: [],
      };
    }

    // ── Select a unit ────────────────────────────────────────────────────────
    case 'SELECT_UNIT': {
      if (action.unitId === null) {
        return {
          ...state,
          selectedUnitId: null,
          validMoveTargets: [],
          validAttackTargets: [],
        };
      }

      const unit = getUnit(state, action.unitId);
      if (!unit) return state;

      let validMoveTargets = state.validMoveTargets;
      let validAttackTargets = state.validAttackTargets;

      if (
        state.currentPhase === 'move' &&
        unit.isActivated &&
        !unit.hasMoved &&
        !unit.directFireLocked &&
        unit.faction === state.currentPlayer
      ) {
        validMoveTargets = getValidMoves(unit, state);
      } else {
        validMoveTargets = [];
      }

      if (
        state.currentPhase === 'attack' &&
        unit.isActivated &&
        !unit.hasAttacked &&
        unit.faction === state.currentPlayer
      ) {
        validAttackTargets = getValidAttackTargets(unit, state);
      } else if (
        state.currentPhase === 'move' &&
        unit.isActivated &&
        unit.faction === state.currentPlayer
      ) {
        // Show attack targets in move phase too (for planning)
        validAttackTargets = getValidAttackTargets(unit, state);
      } else {
        validAttackTargets = [];
      }

      return {
        ...state,
        selectedUnitId: action.unitId,
        validMoveTargets,
        validAttackTargets,
      };
    }

    // ── Move a unit ──────────────────────────────────────────────────────────
    case 'MOVE_UNIT': {
      const unit = getUnit(state, action.unitId);
      if (!unit || !unit.isActivated || unit.hasMoved || unit.directFireLocked) {
        return state;
      }
      if (unit.faction !== state.currentPlayer) return state;

      const isValidTarget = state.validMoveTargets.some(p =>
        posEqual(p, action.targetPosition)
      );
      if (!isValidTarget) return state;

      const newUnits = updateUnit(state.units, action.unitId, {
        position: action.targetPosition,
        hasMoved: true,
      });

      // Recalculate attack targets for the moved unit
      const movedUnit = { ...unit, position: action.targetPosition, hasMoved: true };
      const newAttackTargets = getValidAttackTargets(movedUnit, {
        ...state,
        units: newUnits,
      });

      return {
        ...state,
        units: newUnits,
        selectedUnitId: action.unitId,
        validMoveTargets: [],
        validAttackTargets: newAttackTargets,
      };
    }

    // ── Attack ───────────────────────────────────────────────────────────────
    case 'ATTACK_UNIT': {
      if (state.currentPhase !== 'attack' && state.currentPhase !== 'move') return state;

      const attacker = getUnit(state, action.attackerId);
      const defender = getUnit(state, action.defenderId);
      if (!attacker || !defender) return state;
      if (!attacker.isActivated || attacker.hasAttacked) return state;
      if (attacker.faction !== state.currentPlayer) return state;
      if (defender.faction === state.currentPlayer) return state;

      const result = resolveAttack(attacker, defender, state);

      let newUnits = [...state.units];
      let newDestroyed = [...state.destroyedUnits];
      const newLog = [...state.combatLog, result.logEntry];

      // Apply damage to defender
      if (result.defenderDestroyed) {
        newUnits = newUnits.filter(u => u.id !== defender.id);
        newDestroyed = [...newDestroyed, { ...defender, hp: 0 }];
      } else {
        newUnits = updateUnit(newUnits, defender.id, {
          hp: result.defenderNewHp,
          position: result.defenderNewPosition ?? defender.position,
        });
      }

      // Apply counter-attack damage to attacker
      if (result.counterResult) {
        const cr = result.counterResult;
        if (cr.logEntry) {
          newLog.push(cr.logEntry);
        }
        if (cr.defenderDestroyed) {
          // In the counter, defender = original attacker
          newUnits = newUnits.filter(u => u.id !== attacker.id);
          newDestroyed = [...newDestroyed, { ...attacker, hp: 0 }];
        } else {
          newUnits = updateUnit(newUnits, attacker.id, {
            hp: cr.defenderNewHp,
            position: cr.defenderNewPosition ?? attacker.position,
          });
        }
      }

      // Mark attacker as attacked
      newUnits = updateUnit(newUnits, attacker.id, { hasAttacked: true });

      // Hit-and-run: light cavalry free retreat
      if (result.hitAndRunPosition && newUnits.find(u => u.id === attacker.id)) {
        newUnits = updateUnit(newUnits, attacker.id, {
          position: result.hitAndRunPosition,
        });
      }

      // Breakthrough: heavy cavalry moves to vacated square
      if (result.breakthroughPosition && newUnits.find(u => u.id === attacker.id)) {
        const targetOccupied = newUnits.some(
          u =>
            u.id !== attacker.id &&
            u.position.row === result.breakthroughPosition!.row &&
            u.position.col === result.breakthroughPosition!.col
        );
        if (!targetOccupied) {
          newUnits = updateUnit(newUnits, attacker.id, {
            position: result.breakthroughPosition,
          });
        }
      }

      // Switch to attack phase if still in move phase
      const nextPhase =
        state.currentPhase === 'move' ? 'attack' : state.currentPhase;

      // Check victory
      const tmpState: GameState = {
        ...state,
        units: newUnits,
        destroyedUnits: newDestroyed,
        combatLog: newLog,
        currentPhase: nextPhase,
      };
      const { victor, cause } = checkVictory(tmpState);

      // Recompute attack targets for selected unit
      const currentAttacker = newUnits.find(u => u.id === action.attackerId);
      const newAttackTargets = currentAttacker
        ? getValidAttackTargets(currentAttacker, { ...tmpState, units: newUnits })
        : [];

      return {
        ...tmpState,
        victor,
        victoryCause: cause,
        currentPhase: victor ? 'game_over' : nextPhase,
        validMoveTargets: [],
        validAttackTargets: newAttackTargets,
        selectedUnitId: action.attackerId,
      };
    }

    // ── End Turn ─────────────────────────────────────────────────────────────
    case 'END_TURN': {
      if (state.currentPhase === 'play_card') return state; // can't end before playing

      // Check victory at end of turn (includes turn-limit survival check)
      const { victor, cause } = checkVictory(state, true);
      if (victor) {
        return { ...state, victor, victoryCause: cause, currentPhase: 'game_over' };
      }

      // Reset all units for next turn
      const resetUnits = state.units.map(resetUnitForTurn);

      // Switch player
      const nextPlayer: GameState['currentPlayer'] =
        state.currentPlayer === 'cilicia' ? 'tamerlane' : 'cilicia';

      // Draw 1 card for the player who just ended (refill to 4)
      const hand =
        state.currentPlayer === 'cilicia' ? state.ciliciaHand : state.tamerlaneHand;
      const cardsNeeded = Math.max(0, 4 - hand.length);

      const { drawn, newDeck, newDiscard } = drawCards(
        state.deck,
        state.discardPile,
        cardsNeeded
      );

      const newHand = [...hand, ...drawn];

      return {
        ...state,
        units: resetUnits,
        deck: newDeck,
        discardPile: newDiscard,
        ...(state.currentPlayer === 'cilicia'
          ? { ciliciaHand: newHand }
          : { tamerlaneHand: newHand }),
        currentPlayer: nextPlayer,
        currentPhase: 'play_card',
        turnNumber: state.currentPlayer === 'tamerlane'
          ? state.turnNumber + 1
          : state.turnNumber,
        playedCard: null,
        activatedUnitIds: [],
        pendingDrawnCards: [],
        generalOffensiveSection: null,
        selectedUnitId: null,
        validMoveTargets: [],
        validAttackTargets: [],
      };
    }

    default:
      return state;
  }
}
