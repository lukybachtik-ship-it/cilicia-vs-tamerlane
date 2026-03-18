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
      // Strategy: FIRST move ALL units, THEN attack.
      // Attacking from move phase triggers a move→attack phase transition, so
      // the bot must finish all moves before making any attack (otherwise units
      // that haven't moved yet get stuck in attack phase with no move option).
      case 'move': {
        const selected = state.selectedUnitId
          ? state.units.find(u => u.id === state.selectedUnitId)
          : null;

        // Step A: a bot unit is currently selected
        if (selected && selected.faction === botPlayer) {
          // Try to move the unit (movement only — no attacking yet)
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

          // Can't (or chose not to) move this unit.
          // Attack ONLY if all other units are already moved/exhausted —
          // this is the trigger that transitions move→attack phase.
          const allMoved = nextUnitToMove(state, botPlayer, exhaustedInMoveRef.current) === null;
          if (allMoved && !selected.hasAttacked && state.validAttackTargets.length > 0) {
            const defenderId = chooseBotAttackTarget(state.validAttackTargets, state, botPlayer);
            if (defenderId) {
              timer = setTimeout(
                () => dispatch({ type: 'ATTACK_UNIT', attackerId: selected.id, defenderId }),
                DELAY_MS
              );
              break;
            }
          }

          // Nothing to do with this unit — mark exhausted so we don't loop.
          exhaustedInMoveRef.current.add(selected.id);
          timer = setTimeout(() => dispatch({ type: 'SELECT_UNIT', unitId: null }), 200);
          break;
        }

        // Step B: nothing selected — pick the next unit to work on
        // Priority 1: move unmoved units (skip exhausted ones)
        const moveId = nextUnitToMove(state, botPlayer, exhaustedInMoveRef.current);
        if (moveId) {
          timer = setTimeout(() => dispatch({ type: 'SELECT_UNIT', unitId: moveId }), DELAY_MS);
          break;
        }
        // Priority 2: all moves done — find a unit that can attack to trigger
        // the move→attack phase transition (remaining units attack in attack phase)
        const attackId = nextUnitToAttack(state, botPlayer);
        if (attackId) {
          timer = setTimeout(() => dispatch({ type: 'SELECT_UNIT', unitId: attackId }), DELAY_MS);
          break;
        }
        // No unit can do anything — end turn
        timer = setTimeout(() => dispatch({ type: 'END_TURN' }), DELAY_MS);
        break;
      }

      // ── Attack phase ──────────────────────────────────────────────────────────
      case 'attack': {
        if (isBotUnitSelected(state, botPlayer)) {
          const selected = state.units.find(u => u.id === state.selectedUnitId)!;
          if (!selected.hasAttacked && state.validAttackTargets.length > 0) {
            const defenderId = chooseBotAttackTarget(state.validAttackTargets, state, botPlayer);
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
    // Include unit move/attack flags so we react when a unit finishes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    state.units.map(u => `${u.hasMoved}${u.hasAttacked}${u.isActivated}`).join(''),
    state.victor,
    state.pendingReinforcement,
    botPlayer,
    dispatch,
  ]);
}
