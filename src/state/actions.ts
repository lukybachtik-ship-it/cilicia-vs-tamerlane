import type { Position } from '../types/unit';
import type { GameState } from '../types/game';

export type GameAction =
  | { type: 'PLAY_CARD'; cardInstanceId: string }
  | { type: 'SELECT_GENERAL_OFFENSIVE_SECTION'; section: 'left' | 'center' | 'right' }
  | { type: 'DISCARD_DRAWN_CARD'; cardInstanceId: string }
  | { type: 'ACTIVATE_UNIT'; unitId: string }
  | { type: 'DEACTIVATE_UNIT'; unitId: string }
  | { type: 'CONFIRM_ACTIVATIONS' }
  | { type: 'CONFIRM_MOVEMENT' }
  | { type: 'SELECT_UNIT'; unitId: string | null }
  | { type: 'MOVE_UNIT'; unitId: string; targetPosition: Position }
  | { type: 'ATTACK_UNIT'; attackerId: string; defenderId: string }
  | { type: 'ATTACK_TERRAIN'; attackerId: string; targetPosition: Position }
  | { type: 'ACTIVATE_ABILITY'; unitId: string }
  | { type: 'SELECT_BETRAYAL_TARGET'; targetId: string }
  | { type: 'CANCEL_BETRAYAL' }
  | { type: 'END_TURN' }
  | { type: 'CHOOSE_REINFORCEMENT_FLANK'; flank: 'left' | 'center' | 'right' }
  | { type: 'RESTART_GAME'; scenarioId?: string }
  | { type: 'SET_STATE'; state: GameState };
