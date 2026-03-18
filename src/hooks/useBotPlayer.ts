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
      .map(u => `${u.id}:${u.hasMoved ? 1 : 0}:${u.hasAttacked ? 1 : 0}:${u.isActivated ? 1 : 0}`)
      .join(',');
    const key = [
      state.currentPhase,
      state.turnNumber,
      state.selectedUnitId ?? 'none',
      state.activatedUnitIds.length,
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
        }
        break;
      }

      // ── Move phase ────────────────────────────────────────────────────────────
      case 'move': {
        // Clear exhausted list at the start of move phase (when nothing selected)
        if (!state.selectedUnitId) {
          // Only clear if the set was populated from a previous attempt
          // (we check by seeing if the turn matches — already handled above)
        }

        const selected = state.selectedUnitId
          ? state.units.find(u => u.id === state.selectedUnitId)
          : null;

        // Step A: a bot unit is already selected
        if (selected && selected.faction === botPlayer) {
          // Try to move it
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
          // Try to attack from move phase
          if (!selected.hasAttacked && state.validAttackTargets.length > 0) {
            const defenderId = chooseBotAttackTarget(state.validAttackTargets, state);
            if (defenderId) {
              timer = setTimeout(
                () => dispatch({ type: 'ATTACK_UNIT', attackerId: selected.id, defenderId }),
                DELAY_MS
              );
              break;
            }
          }
          // Nothing to do with this unit — mark exhausted and deselect
          // so we don't loop by re-selecting it on the next tick.
          exhaustedInMoveRef.current.add(selected.id);
          timer = setTimeout(() => dispatch({ type: 'SELECT_UNIT', unitId: null }), 200);
          break;
        }

        // Step B: nothing selected — find next unit to work on (skip exhausted units)
        const moveId = nextUnitToMove(state, botPlayer, exhaustedInMoveRef.current);
        if (moveId) {
          timer = setTimeout(() => dispatch({ type: 'SELECT_UNIT', unitId: moveId }), DELAY_MS);
          break;
        }
        // Then look for units that can actually attack (nextUnitToAttack already filters by valid targets)
        const attackId = nextUnitToAttack(state, botPlayer);
        if (attackId) {
          timer = setTimeout(() => dispatch({ type: 'SELECT_UNIT', unitId: attackId }), DELAY_MS);
          break;
        }
        // Nothing left — end turn
        timer = setTimeout(() => dispatch({ type: 'END_TURN' }), DELAY_MS);
        break;
      }

      // ── Attack phase ──────────────────────────────────────────────────────────
      case 'attack': {
        if (isBotUnitSelected(state, botPlayer)) {
          const selected = state.units.find(u => u.id === state.selectedUnitId)!;
          if (!selected.hasAttacked && state.validAttackTargets.length > 0) {
            const defenderId = chooseBotAttackTarget(state.validAttackTargets, state);
            if (defenderId) {
              timer = setTimeout(
                () => dispatch({ type: 'ATTACK_UNIT', attackerId: selected.id, defenderId }),
                DELAY_MS
              );
              break;
            }
          }
          // Already attacked or no targets — deselect and move to next unit
          timer = setTimeout(() => dispatch({ type: 'SELECT_UNIT', unitId: null }), 200);
          break;
        }

        // Find next unit to attack. nextUnitToAttack only returns units with
        // actual valid targets, so when it returns null we can safely end turn.
        const attackId = nextUnitToAttack(state, botPlayer);
        if (attackId) {
          timer = setTimeout(() => dispatch({ type: 'SELECT_UNIT', unitId: attackId }), DELAY_MS);
          break;
        }
        // All units have attacked or have no valid targets — end turn
        timer = setTimeout(() => dispatch({ type: 'END_TURN' }), DELAY_MS);
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
    // Include unit move/attack flags so we react when a unit finishes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    state.units.map(u => `${u.hasMoved}${u.hasAttacked}${u.isActivated}`).join(''),
    state.victor,
    botPlayer,
    dispatch,
  ]);
}
