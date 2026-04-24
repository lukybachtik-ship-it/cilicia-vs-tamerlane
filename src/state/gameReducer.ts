import type { GameState } from '../types/game';
import type { UnitInstance } from '../types/unit';
import type { GameAction } from './actions';
import { CARD_DEFINITIONS } from '../constants/cardDefinitions';
import { UNIT_DEFINITIONS } from '../constants/unitDefinitions';
import { ALL_SCENARIOS } from '../constants/scenarios';
import { buildInitialState } from '../constants/scenarioSetup';
import { getValidMoves } from '../logic/movement';
import {
  resolveAttack,
  getValidAttackTargets,
  getValidAttackTerrainTargets,
  resolveStructureAttack,
} from '../logic/combat';
import { drawCards, canCardActivateUnit } from '../logic/cards';
import { checkVictory } from '../logic/victory';
import {
  applyWarcry,
  applyPilumReady,
  applyAmbushSignal,
  applyBetrayal,
  canBetray,
  revertExpiredBetrayals,
  hasAvailableAbility,
} from '../logic/abilities';
import {
  advanceModifiers,
  consumeSingleAttackMods,
  recomputeAuras,
  makeGunpowderPanicModifier,
  makeCommanderDeathModifier,
} from '../logic/modifiers';
import { getZone, posEqual, generateId } from '../utils/helpers';

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
    moveHistoryThisTurn: [u.position],
  };
}

/** True if this unit is still sleeping (cannot be activated). */
function isSleeping(unit: UnitInstance, turnNumber: number): boolean {
  return unit.sleepsUntilTurn !== undefined && turnNumber < unit.sleepsUntilTurn;
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
      return buildInitialState(action.scenarioId, action.campaignOverrides);

    // ── Play a card ──────────────────────────────────────────────────────────
    case 'PLAY_CARD': {
      const hand =
        state.currentPlayer === 'cilicia' ? state.ciliciaHand : state.tamerlaneHand;
      const cardInst = hand.find(c => c.instanceId === action.cardInstanceId);
      if (!cardInst) return state;

      const cardDef = CARD_DEFINITIONS[cardInst.id];

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
        validAttackTerrainTargets: [],
      };

      if (cardDef.scoutDraw) {
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

      const eligibleUnits = state.units.filter(
        u =>
          u.faction === state.currentPlayer &&
          getZone(u.position.col) === action.section &&
          !isSleeping(u, state.turnNumber)
      );

      const activatedIds = eligibleUnits.map(u => u.id);
      const newUnits = state.units.map(u => {
        if (!activatedIds.includes(u.id)) return u;
        return {
          ...u,
          isActivated: true,
          moveBonus: -(UNIT_DEFINITIONS[u.definitionType].move - 1),
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
        validAttackTerrainTargets: [],
      };
    }

    // ── Activate a unit ──────────────────────────────────────────────────────
    case 'ACTIVATE_UNIT': {
      if (!state.playedCard) return state;
      const unit = getUnit(state, action.unitId);
      if (!unit || unit.faction !== state.currentPlayer) return state;
      if (isSleeping(unit, state.turnNumber)) return state;

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

    // ── Deactivate a unit ────────────────────────────────────────────────────
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
        validAttackTerrainTargets: [],
      };
    }

    // ── Confirm movement → attack phase ──────────────────────────────────────
    case 'CONFIRM_MOVEMENT': {
      if (state.currentPhase !== 'move') return state;
      return {
        ...state,
        currentPhase: 'attack',
        selectedUnitId: null,
        validMoveTargets: [],
        validAttackTargets: [],
        validAttackTerrainTargets: [],
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
          validAttackTerrainTargets: [],
        };
      }

      const unit = getUnit(state, action.unitId);
      if (!unit) return state;

      let validMoveTargets = state.validMoveTargets;
      let validAttackTargets = state.validAttackTargets;
      let validAttackTerrainTargets = state.validAttackTerrainTargets;

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
        validAttackTerrainTargets = getValidAttackTerrainTargets(unit, state);
      } else {
        validAttackTargets = [];
        validAttackTerrainTargets = [];
      }

      return {
        ...state,
        selectedUnitId: action.unitId,
        validMoveTargets,
        validAttackTargets,
        validAttackTerrainTargets,
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

      const newMoveHistory = [...unit.moveHistoryThisTurn, action.targetPosition];

      // Stream crossing: if any intermediate hex (not final) is stream,
      // emit cannotAttack modifier for this turn.
      const crossedStream = newMoveHistory.slice(0, -1).some(pos => {
        const cell = state.terrain.find(
          t => t.position.row === pos.row && t.position.col === pos.col
        );
        return cell?.terrain === 'stream';
      });

      const newUnits = updateUnit(state.units, action.unitId, {
        position: action.targetPosition,
        hasMoved: true,
        moveHistoryThisTurn: newMoveHistory,
      });

      const movedUnit = {
        ...unit,
        position: action.targetPosition,
        hasMoved: true,
        moveHistoryThisTurn: newMoveHistory,
      };
      const newAttackTargets = getValidAttackTargets(movedUnit, {
        ...state,
        units: newUnits,
      });
      const newTerrainTargets = getValidAttackTerrainTargets(movedUnit, {
        ...state,
        units: newUnits,
      });

      const afterMove: GameState = {
        ...state,
        units: newUnits,
        selectedUnitId: action.unitId,
        validMoveTargets: [],
        validAttackTargets: crossedStream ? [] : newAttackTargets,
        validAttackTerrainTargets: crossedStream ? [] : newTerrainTargets,
        activeModifiers: crossedStream
          ? [
              ...state.activeModifiers,
              {
                id: generateId('mod_stream'),
                source: 'status' as const,
                sourceUnitId: action.unitId,
                descriptionCs: 'Přechod potoka: nelze útočit v tomto kole',
                targetFilter: { unitIds: [action.unitId] },
                effect: { cannotAttack: true },
                duration: { kind: 'turns' as const, remainingTurns: 1 },
              },
            ]
          : state.activeModifiers,
      };
      // Auras depend on positions — rebuild
      return recomputeAuras(afterMove);
    }

    // ── Attack a unit ────────────────────────────────────────────────────────
    case 'ATTACK_UNIT': {
      if (state.currentPhase !== 'attack') return state;

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

      // Pike wall auto-hit kills attacker — defender untouched
      if (result.attackerDestroyedByPikeWall) {
        newUnits = newUnits.filter(u => u.id !== attacker.id);
        newDestroyed = [...newDestroyed, { ...attacker, hp: 0 }];

        const tmpState: GameState = {
          ...state,
          units: newUnits,
          destroyedUnits: newDestroyed,
          combatLog: newLog,
        };
        const { victor, cause } = checkVictory(tmpState);
        return {
          ...tmpState,
          victor,
          victoryCause: cause,
          currentPhase: victor ? 'game_over' : state.currentPhase,
          validMoveTargets: [],
          validAttackTargets: [],
          validAttackTerrainTargets: [],
          selectedUnitId: null,
        };
      }

      // Normal defender damage
      let gunpowderModToAdd: ReturnType<typeof makeGunpowderPanicModifier> | null = null;
      if (result.defenderDestroyed) {
        newUnits = newUnits.filter(u => u.id !== defender.id);
        newDestroyed = [...newDestroyed, { ...defender, hp: 0 }];
      } else {
        newUnits = updateUnit(newUnits, defender.id, {
          hp: result.defenderNewHp,
          position: result.defenderNewPosition ?? defender.position,
        });
        if (result.gunpowderPanicApplied) {
          gunpowderModToAdd = makeGunpowderPanicModifier(defender, state.turnNumber + 1);
        }
      }

      // Counter-attack
      if (result.counterResult) {
        const cr = result.counterResult;
        if (cr.logEntry) newLog.push(cr.logEntry);
        if (cr.defenderDestroyed) {
          newUnits = newUnits.filter(u => u.id !== attacker.id);
          newDestroyed = [...newDestroyed, { ...attacker, hp: 0 }];
        } else {
          newUnits = updateUnit(newUnits, attacker.id, {
            hp: cr.defenderNewHp,
            position: cr.defenderNewPosition ?? attacker.position,
          });
        }
      }

      // Apply pike wall auto-hit (if attacker survived)
      if (result.pikeWallAutoHits > 0 && newUnits.find(u => u.id === attacker.id)) {
        const cur = newUnits.find(u => u.id === attacker.id)!;
        const newHp = cur.hp - result.pikeWallAutoHits;
        if (newHp <= 0) {
          newUnits = newUnits.filter(u => u.id !== attacker.id);
          newDestroyed = [...newDestroyed, { ...cur, hp: 0 }];
        } else {
          newUnits = updateUnit(newUnits, attacker.id, { hp: newHp });
        }
      }

      // Mark attacker as attacked
      if (newUnits.find(u => u.id === attacker.id)) {
        newUnits = updateUnit(newUnits, attacker.id, {
          hasAttacked: true,
        });
      }

      // Hit-and-run
      if (result.hitAndRunPosition && newUnits.find(u => u.id === attacker.id)) {
        newUnits = updateUnit(newUnits, attacker.id, {
          position: result.hitAndRunPosition,
        });
      }

      // Breakthrough
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

      const nextPhase = state.currentPhase;

      const nextModifiers = [
        ...state.activeModifiers,
        ...(gunpowderModToAdd ? [gunpowderModToAdd] : []),
      ];

      let tmpState: GameState = {
        ...state,
        units: newUnits,
        destroyedUnits: newDestroyed,
        combatLog: newLog,
        currentPhase: nextPhase,
        activeModifiers: nextModifiers,
      };

      // Consume single_attack mods (pilum) for this attacker
      tmpState = consumeSingleAttackMods(tmpState, attacker.id);

      // Commander death: if any destroyed unit was a commander, emit its death modifier
      const newlyDestroyedCommanders = newDestroyed.filter(
        d => !state.destroyedUnits.some(p => p.id === d.id)
      );
      for (const fallen of newlyDestroyedCommanders) {
        const def = UNIT_DEFINITIONS[fallen.definitionType];
        if (def.isCommander && def.commanderDeathEffect) {
          tmpState = {
            ...tmpState,
            activeModifiers: [
              ...tmpState.activeModifiers,
              makeCommanderDeathModifier(fallen, def.commanderDeathEffect),
            ],
          };
        }
      }

      // Rebuild auras (source unit may have died or moved)
      tmpState = recomputeAuras(tmpState);

      const { victor, cause } = checkVictory(tmpState);

      const currentAttacker = tmpState.units.find(u => u.id === action.attackerId);
      const newAttackTargets = currentAttacker
        ? getValidAttackTargets(currentAttacker, tmpState)
        : [];
      const newTerrainTargets = currentAttacker
        ? getValidAttackTerrainTargets(currentAttacker, tmpState)
        : [];

      return {
        ...tmpState,
        victor,
        victoryCause: cause,
        currentPhase: victor ? 'game_over' : nextPhase,
        validMoveTargets: [],
        validAttackTargets: newAttackTargets,
        validAttackTerrainTargets: newTerrainTargets,
        selectedUnitId: currentAttacker ? action.attackerId : null,
      };
    }

    // ── Attack terrain (wall / wagenburg) ────────────────────────────────────
    case 'ATTACK_TERRAIN': {
      if (state.currentPhase !== 'attack') return state;
      const attacker = getUnit(state, action.attackerId);
      if (!attacker || !attacker.isActivated || attacker.hasAttacked) return state;
      if (attacker.faction !== state.currentPlayer) return state;

      const isValid = state.validAttackTerrainTargets.some(p => posEqual(p, action.targetPosition));
      if (!isValid) return state;

      const cell = state.terrain.find(t => posEqual(t.position, action.targetPosition));
      if (!cell) return state;
      const { hits, diceResults, diceCount } = resolveStructureAttack(attacker, action.targetPosition, state);

      const currentHp = cell.structureHp ?? 3;
      const newHp = Math.max(0, currentHp - hits);

      const newTerrain = state.terrain.map(t => {
        if (!posEqual(t.position, action.targetPosition)) return t;
        if (newHp <= 0) {
          return { position: t.position, terrain: 'plain' as const, elevation: 0 };
        }
        return { ...t, structureHp: newHp };
      });

      const log = [
        ...state.combatLog,
        {
          id: generateId('combat'),
          turn: state.turnNumber,
          attackerName: `${UNIT_DEFINITIONS[attacker.definitionType].nameCs} (${attacker.faction === 'cilicia' ? 'Kilikie' : 'Tamerlán'})`,
          defenderName: newHp <= 0 ? '🏰 Hradba zbořena!' : `🏰 Hradba (HP ${currentHp}→${newHp})`,
          diceCount,
          diceResults,
          hits,
          retreats: 0,
          isCounter: false,
          outcome: (newHp <= 0 ? 'destroyed' : 'damage') as 'destroyed' | 'damage',
        },
      ];

      const newUnits = updateUnit(state.units, attacker.id, {
        hasAttacked: true,
      });

      let updated: GameState = {
        ...state,
        terrain: newTerrain,
        units: newUnits,
        combatLog: log,
      };
      // Consume pilum if this attacker had it
      updated = consumeSingleAttackMods(updated, attacker.id);

      const { victor, cause } = checkVictory(updated);

      return {
        ...updated,
        victor,
        victoryCause: cause,
        currentPhase: victor ? 'game_over' : state.currentPhase,
        validAttackTerrainTargets: getValidAttackTerrainTargets(
          { ...attacker, hasAttacked: true },
          updated
        ),
      };
    }

    // ── Activate special ability ─────────────────────────────────────────────
    case 'ACTIVATE_ABILITY': {
      const unit = getUnit(state, action.unitId);
      if (!unit) return state;
      if (unit.faction !== state.currentPlayer) return state;
      if (!hasAvailableAbility(unit)) return state;

      const def = UNIT_DEFINITIONS[unit.definitionType];
      switch (def.activatedAbility) {
        case 'warcry': {
          if (!unit.isActivated) return state;
          return applyWarcry(state, unit);
        }
        case 'pilum': {
          if (!unit.isActivated) return state;
          let nextState = applyPilumReady(state, unit);
          // Recompute valid attack targets if this unit is selected & in attack phase
          if (state.selectedUnitId === unit.id && state.currentPhase === 'attack') {
            const updatedUnit = nextState.units.find(u => u.id === unit.id)!;
            nextState = {
              ...nextState,
              validAttackTargets: getValidAttackTargets(updatedUnit, nextState),
            };
          }
          return nextState;
        }
        case 'ambush_signal': {
          return applyAmbushSignal(state, unit);
        }
        case 'betrayal': {
          if (!unit.isActivated) return state;
          return {
            ...state,
            currentPhase: 'select_betrayal_target',
            pendingBetrayalSourceId: unit.id,
            selectedUnitId: unit.id,
            validMoveTargets: [],
            validAttackTargets: [],
            validAttackTerrainTargets: [],
          };
        }
      }
      return state;
    }

    // ── Pick target for Cesare's Betrayal ────────────────────────────────────
    case 'SELECT_BETRAYAL_TARGET': {
      if (state.currentPhase !== 'select_betrayal_target') return state;
      const sourceId = state.pendingBetrayalSourceId;
      if (!sourceId) return state;
      const source = getUnit(state, sourceId);
      const target = getUnit(state, action.targetId);
      if (!source || !target || !canBetray(source, target)) return state;

      const after = applyBetrayal(state, source, target);
      return {
        ...after,
        currentPhase: 'attack',
        pendingBetrayalSourceId: null,
      };
    }

    case 'CANCEL_BETRAYAL': {
      if (state.currentPhase !== 'select_betrayal_target') return state;
      return {
        ...state,
        currentPhase: 'attack',
        pendingBetrayalSourceId: null,
      };
    }

    // ── Choose reinforcement flank (Kilíkie scenario) ─────────────────────────
    case 'CHOOSE_REINFORCEMENT_FLANK': {
      if (state.currentPhase !== 'choose_reinforcement_flank') return state;
      const pending = state.pendingReinforcement;
      if (!pending) return state;

      const spawnPoints = pending.spawnPositions[action.flank];
      const def = UNIT_DEFINITIONS[pending.unitType];

      const newUnits = [...state.units];
      let spawned = 0;
      for (const pos of spawnPoints) {
        if (spawned >= pending.count) break;
        const occupied = newUnits.some(u => u.position.row === pos.row && u.position.col === pos.col);
        if (!occupied) {
          newUnits.push({
            id: generateId('reinf'),
            definitionType: pending.unitType,
            faction: pending.faction,
            hp: def.maxHp,
            position: pos,
            hasMoved: false,
            hasAttacked: false,
            isActivated: false,
            attackBonus: 0,
            moveBonus: 0,
            directFireLocked: false,
            parthianPhase: 'none',
            moveHistoryThisTurn: [pos],
            specialAbilityUsed: false,
          });
          spawned++;
        }
      }

      return {
        ...state,
        units: newUnits,
        pendingReinforcement: null,
        currentPhase: 'play_card',
        currentPlayer: 'cilicia',
        selectedUnitId: null,
        validMoveTargets: [],
        validAttackTargets: [],
        validAttackTerrainTargets: [],
      };
    }

    // ── End Turn ─────────────────────────────────────────────────────────────
    case 'END_TURN': {
      if (state.currentPhase === 'play_card' || state.currentPhase === 'move') return state;

      const { victor, cause } = checkVictory(state, true);
      if (victor) {
        return { ...state, victor, victoryCause: cause, currentPhase: 'game_over' };
      }

      // Revert expired betrayals
      const afterRevert = revertExpiredBetrayals(state);

      // Advance (tick) all active modifiers — drops expired ones
      const afterModifierTick = advanceModifiers(afterRevert);

      // Reset all units for next turn
      const resetUnits = afterModifierTick.units.map(resetUnitForTurn);

      const nextPlayer: GameState['currentPlayer'] =
        state.currentPlayer === 'cilicia' ? 'tamerlane' : 'cilicia';

      const nextTurn = state.currentPlayer === 'tamerlane'
        ? state.turnNumber + 1
        : state.turnNumber;

      const hand =
        state.currentPlayer === 'cilicia' ? state.ciliciaHand : state.tamerlaneHand;
      const cardsNeeded = Math.max(0, 4 - hand.length);

      const { drawn, newDeck, newDiscard } = drawCards(
        state.deck,
        state.discardPile,
        cardsNeeded
      );

      const newHand = [...hand, ...drawn];

      // Compute separate hands so we can optionally inject event cards into opponent
      let updatedCiliciaHand = state.currentPlayer === 'cilicia' ? newHand : state.ciliciaHand;
      let updatedTamerlaneHand = state.currentPlayer === 'tamerlane' ? newHand : state.tamerlaneHand;

      // ── Event card: Theodora (Nika scénář, start 3. kola Cilicie) ──────────
      if (
        state.scenarioId === 'nika' &&
        state.currentPlayer === 'tamerlane' &&
        nextTurn === 3 &&
        !updatedCiliciaHand.some(c => c.id === 'theodora_event')
      ) {
        updatedCiliciaHand = [
          ...updatedCiliciaHand,
          { id: 'theodora_event', instanceId: generateId('theodora') },
        ];
      }

      // Reinforcement wave check
      let pendingReinforcement = state.pendingReinforcement;
      let nextPhase: GameState['currentPhase'] = 'play_card';
      let phasePlayer = nextPlayer;

      if (state.currentPlayer === 'tamerlane') {
        const scenario = ALL_SCENARIOS.find(s => s.id === state.scenarioId);
        const waves = scenario?.reinforcementWaves ?? [];
        const triggeredWave = waves.find(w => w.triggerAfterTurn === state.turnNumber);

        if (triggeredWave) {
          pendingReinforcement = {
            count: triggeredWave.count,
            unitType: triggeredWave.unitType,
            faction: triggeredWave.faction,
            spawnPositions: triggeredWave.spawnPositions,
          };
          nextPhase = 'choose_reinforcement_flank';
          phasePlayer = 'tamerlane';
        }
      }

      const afterReset: GameState = {
        ...state,
        units: resetUnits,
        activeModifiers: afterModifierTick.activeModifiers,
        deck: newDeck,
        discardPile: newDiscard,
        ciliciaHand: updatedCiliciaHand,
        tamerlaneHand: updatedTamerlaneHand,
        currentPlayer: phasePlayer,
        currentPhase: nextPhase,
        turnNumber: nextTurn,
        playedCard: null,
        activatedUnitIds: [],
        pendingDrawnCards: [],
        generalOffensiveSection: null,
        pendingBetrayalSourceId: null,
        volleyShotsThisTurn: [],
        pendingReinforcement,
        selectedUnitId: null,
        validMoveTargets: [],
        validAttackTargets: [],
        validAttackTerrainTargets: [],
      };
      // Rebuild positional auras for the new turn
      return recomputeAuras(afterReset);
    }

    default:
      return state;
  }
}
