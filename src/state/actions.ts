import type { Position } from '../types/unit';

export type GameAction =
  | { type: 'PLAY_CARD'; cardInstanceId: string }
  | { type: 'SELECT_GENERAL_OFFENSIVE_SECTION'; section: 'left' | 'center' | 'right' }
  | { type: 'DISCARD_DRAWN_CARD'; cardInstanceId: string }
  | { type: 'ACTIVATE_UNIT'; unitId: string }
  | { type: 'DEACTIVATE_UNIT'; unitId: string }
  | { type: 'CONFIRM_ACTIVATIONS' }
  | { type: 'SELECT_UNIT'; unitId: string | null }
  | { type: 'MOVE_UNIT'; unitId: string; targetPosition: Position }
  | { type: 'ATTACK_UNIT'; attackerId: string; defenderId: string }
  | { type: 'END_TURN' }
  | { type: 'RESTART_GAME' };
