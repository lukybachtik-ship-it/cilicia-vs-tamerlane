import { supabase } from '../lib/supabase';
import type { GameState } from '../types/game';
import type { RealtimeChannel } from '@supabase/supabase-js';

function generateRoomCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function createRoom(scenarioId: string, initialState: GameState): Promise<string> {
  let roomCode = generateRoomCode();

  // Retry if code already exists
  for (let attempt = 0; attempt < 5; attempt++) {
    const { error } = await supabase.from('game_rooms').insert({
      id: roomCode,
      scenario_id: scenarioId,
      game_state: initialState,
      status: 'waiting',
    });

    if (!error) return roomCode;
    if (error.code !== '23505') throw new Error(error.message); // 23505 = unique violation
    roomCode = generateRoomCode();
  }

  throw new Error('Nepodařilo se vygenerovat unikátní kód místnosti');
}

export async function joinRoom(roomCode: string): Promise<GameState | null> {
  const code = roomCode.toUpperCase().trim();

  const { data, error } = await supabase
    .from('game_rooms')
    .select('game_state, status')
    .eq('id', code)
    .single();

  if (error || !data) return null;
  if (data.status === 'finished') return null;

  // Mark as playing
  await supabase.from('game_rooms').update({ status: 'playing' }).eq('id', code);

  return data.game_state as GameState;
}

export async function getRoomState(roomCode: string): Promise<GameState | null> {
  const { data, error } = await supabase
    .from('game_rooms')
    .select('game_state, status')
    .eq('id', roomCode)
    .single();

  if (error || !data) return null;
  return data.game_state as GameState;
}

export async function updateGameState(roomCode: string, state: GameState): Promise<void> {
  await supabase
    .from('game_rooms')
    .update({ game_state: state })
    .eq('id', roomCode);
}

export async function finishRoom(roomCode: string): Promise<void> {
  await supabase
    .from('game_rooms')
    .update({ status: 'finished' })
    .eq('id', roomCode);
}

export function subscribeToRoom(
  roomCode: string,
  onUpdate: (state: GameState) => void
): RealtimeChannel {
  return supabase
    .channel(`room:${roomCode}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'game_rooms',
        filter: `id=eq.${roomCode}`,
      },
      (payload) => {
        const newState = (payload.new as { game_state: GameState }).game_state;
        if (newState) onUpdate(newState);
      }
    )
    .subscribe();
}
