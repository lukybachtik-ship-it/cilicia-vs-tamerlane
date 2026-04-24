/**
 * useBotPlayer — drives the AI bot's turn automatically.
 *
 * When it's the bot's turn, this hook fires one action at a time (with delays
 * so the human player can follow what's happening) until the turn ends.
 *
 * State machine: play_card → activate_units → move → attack → END_TURN
 */

import { useEffect, useRef } from 'react';
import { useGame } from '../state/GameContext';
import { useMultiplayer } from '../state/MultiplayerContext';
import {
  chooseBotCard,
  chooseBotNextActivation,
  chooseBotSection,
  chooseBotDiscardCard,
  chooseBotMoveTarget,
  chooseBotAttackTarget,
  chooseBotAbilityUnit,
  chooseBotBetrayalTarget,
  chooseBotTerrainAttackTarget,
  nextUnitToMove,
  nextUnitToAttack,
  isBotUnitSelected,
} from '../logic/bot';

const DELAY_MS = 700; // ms between bot actions (keep visible to human)

export function useBotPlayer() {
  const { state, dispatch } = useGame();
  const { mode, botPlayer } = useMultiplayer();

  const isBotTurn =
    mode === 'bot' &&
    botPlayer !== null &&
    state.currentPlayer === botPlayer &&
    !state.victor;

  // Deduplicate: track the last "state key" we acted on so we don't double-fire
  const lastKeyRef = useRef('');

  // Track units that have been selected in the move phase but had nothing to do
  // (no valid move targets and no valid attack targets). Without this, the bot
  // loops: select unit → nothing to do → deselect → nextUnitToMove returns same
  // unit → select again → infinite loop.
  const exhaustedInMoveRef = useRef<Set<string>>(new Set());
  const lastTurnRef = useRef(-1);

  useEffect(() => {
    if (!isBotTurn || !botPlayer) return;

    // Reset exhausted set when a new turn begins
    if (state.turnNumber !== lastTurnRef.current) {
      lastTurnRef.current = state.turnNumber;
      exhaustedInMoveRef.current.clear();
    }

    // Build a key that changes whenever meaningful state changes
    const unitStates = state.units
      .filter(u => u.faction === botPlayer)
      .map(u =>
        `${u.id}:${u.hasMoved ? 1 : 0}:${u.hasAttacked ? 1 : 0}:${u.isActivated ? 1 : 0}:${u.specialAbilityUsed ? 1 : 0}:${u.hp}`
      )
      .join(',');
    const key = [
      state.currentPhase,
      state.turnNumber,
      state.selectedUnitId ?? 'none',
      state.activatedUnitIds.length,
      state.activeScenarioEffects.length,
      state.activeModifiers.length,
      state.pendingBetrayalSourceId ?? 'none',
      unitStates,
    ].join('|');

    if (lastKeyRef.current === key) return;
    lastKeyRef.current = key;

    let timer: ReturnType<typeof setTimeout>;

    switch (state.currentPhase) {
      // ── Play a card ──────────────────────────────────────────────────────────
      case 'play_card': {
        const cardId = chooseBotCard(state, botPlayer);
        if (cardId) {
          timer = setTimeout(() => dispatch({ type: 'PLAY_CARD', cardInstanceId: cardId }), DELAY_MS);
        }
        break;
      }

      // ── Scout: discard one of two drawn cards ────────────────────────────────
      case 'discard_drawn': {
        const cardId = chooseBotDiscardCard(state, botPlayer);
        if (cardId) {
          timer = setTimeout(() => dispatch({ type: 'DISCARD_DRAWN_CARD', cardInstanceId: cardId }), DELAY_MS);
        }
        break;
      }

      // ── General Offensive: choose section ────────────────────────────────────
      case 'select_section': {
        const section = chooseBotSection(state, botPlayer);
        timer = setTimeout(() => dispatch({ type: 'SELECT_GENERAL_OFFENSIVE_SECTION', section }), DELAY_MS);
        break;
      }

      // ── Activate units one by one, then confirm ───────────────────────────────
      case 'activate_units': {
        const nextId = chooseBotNextActivation(state, botPlayer);
        if (nextId) {
          timer = setTimeout(() => dispatch({ type: 'ACTIVATE_UNIT', unitId: nextId }), DELAY_MS);
        } else if (state.activatedUnitIds.length > 0) {
          timer = setTimeout(() => dispatch({ type: 'CONFIRM_ACTIVATIONS' }), DELAY_MS);
        } else {
          // No units can be activated (e.g. all sleeping) — skip to end turn
          timer = setTimeout(() => dispatch({ type: 'END_TURN' }), DELAY_MS);
        }
        break;
      }

      // ── Move phase ────────────────────────────────────────────────────────────
      // Strategy: move ALL units first, then dispatch CONFIRM_MOVEMENT to
      // transition to the attack phase. Attacks happen only in attack phase.
      case 'move': {
        const selected = state.selectedUnitId
          ? state.units.find(u => u.id === state.selectedUnitId)
          : null;

        // Step A: a bot unit is currently selected — try to move it
        if (selected && selected.faction === botPlayer) {
          if (!selected.hasMoved && !selected.directFireLocked && state.validMoveTargets.length > 0) {
            const moveTo = chooseBotMoveTarget(state.validMoveTargets, selected.id, state, botPlayer);
            if (moveTo) {
              timer = setTimeout(
                () => dispatch({ type: 'MOVE_UNIT', unitId: selected.id, targetPosition: moveTo }),
                DELAY_MS
              );
              break;
            }
          }
          // Nothing to do with this unit — mark exhausted so we don't loop
          exhaustedInMoveRef.current.add(selected.id);
          timer = setTimeout(() => dispatch({ type: 'SELECT_UNIT', unitId: null }), 200);
          break;
        }

        // Step B: nothing selected — pick the next unmoved unit
        const moveId = nextUnitToMove(state, botPlayer, exhaustedInMoveRef.current);
        if (moveId) {
          timer = setTimeout(() => dispatch({ type: 'SELECT_UNIT', unitId: moveId }), DELAY_MS);
          break;
        }
        // All units moved (or have nothing to move) — confirm movement to attack phase
        timer = setTimeout(() => dispatch({ type: 'CONFIRM_MOVEMENT' }), DELAY_MS);
        break;
      }

      // ── Attack phase ──────────────────────────────────────────────────────────
      case 'attack': {
        // Before attacking, try to activate a helpful ability (1× per game)
        const abilityUnit = chooseBotAbilityUnit(state, botPlayer);
        if (abilityUnit) {
          timer = setTimeout(() => dispatch({ type: 'ACTIVATE_ABILITY', unitId: abilityUnit }), DELAY_MS);
          break;
        }

        if (isBotUnitSelected(state, botPlayer)) {
          const selected = state.units.find(u => u.id === state.selectedUnitId)!;
          // Priority: shell walls if culverin/siege and wall is in range
          if (!selected.hasAttacked && state.validAttackTerrainTargets.length > 0) {
            const wallTarget = chooseBotTerrainAttackTarget(state, selected.id);
            if (wallTarget) {
              timer = setTimeout(
                () => dispatch({ type: 'ATTACK_TERRAIN', attackerId: selected.id, targetPosition: wallTarget }),
                DELAY_MS
              );
              break;
            }
          }
          if (!selected.hasAttacked && state.validAttackTargets.length > 0) {
            const defenderId = chooseBotAttackTarget(state.validAttackTargets, state, botPlayer, selected.position);
            if (defenderId) {
              timer = setTimeout(
                () => dispatch({ type: 'ATTACK_UNIT', attackerId: selected.id, defenderId }),
                DELAY_MS
              );
              break;
            }
          }
          timer = setTimeout(() => dispatch({ type: 'SELECT_UNIT', unitId: null }), 200);
          break;
        }

        const attackId = nextUnitToAttack(state, botPlayer);
        if (attackId) {
          timer = setTimeout(() => dispatch({ type: 'SELECT_UNIT', unitId: attackId }), DELAY_MS);
          break;
        }
        timer = setTimeout(() => dispatch({ type: 'END_TURN' }), DELAY_MS);
        break;
      }

      // ── Cesare's Betrayal: pick adjacent enemy condottiero ────────────────
      case 'select_betrayal_target': {
        const targetId = chooseBotBetrayalTarget(state);
        if (targetId) {
          timer = setTimeout(
            () => dispatch({ type: 'SELECT_BETRAYAL_TARGET', targetId }),
            DELAY_MS
          );
        } else {
          timer = setTimeout(() => dispatch({ type: 'CANCEL_BETRAYAL' }), DELAY_MS);
        }
        break;
      }

      // ── Reinforcement flank choice (Kilíkie scenario) ────────────────────────
      case 'choose_reinforcement_flank': {
        if (!state.pendingReinforcement) break;

        // Bot strategy: pick the flank where Tamerlane has fewest units
        // (spread out to cover more villages)
        const flanks: Array<'left' | 'center' | 'right'> = ['left', 'center', 'right'];
        const colRanges: Record<string, [number, number]> = {
          left: [1, 3], center: [4, 6], right: [7, 9],
        };

        let bestFlank: 'left' | 'center' | 'right' = 'center';
        let minTamerlaneUnits = Infinity;

        for (const flank of flanks) {
          const [colMin, colMax] = colRanges[flank];
          const unitsInFlank = state.units.filter(
            u => u.faction === 'tamerlane' && u.position.col >= colMin && u.position.col <= colMax
          ).length;
          if (unitsInFlank < minTamerlaneUnits) {
            minTamerlaneUnits = unitsInFlank;
            bestFlank = flank;
          }
        }

        timer = setTimeout(
          () => dispatch({ type: 'CHOOSE_REINFORCEMENT_FLANK', flank: bestFlank }),
          DELAY_MS
        );
        break;
      }
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [
    isBotTurn,
    state.currentPhase,
    state.turnNumber,
    state.selectedUnitId,
    state.activatedUnitIds.length,
    state.activeScenarioEffects.length,
    state.pendingBetrayalSourceId,
    // Include every bot-relevant unit flag so we react when ANYTHING changes
    // (fixes bot-stuck bug after ACTIVATE_ABILITY, which otherwise doesn't
    // update hasMoved/hasAttacked/isActivated).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    state.units.map(u =>
      `${u.hasMoved}${u.hasAttacked}${u.isActivated}${u.specialAbilityUsed}${u.hp}`
    ).join(''),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    state.activeModifiers.length,
    state.victor,
    state.pendingReinforcement,
    botPlayer,
    dispatch,
  ]);
}
