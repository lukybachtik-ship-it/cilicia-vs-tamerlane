/**
 * Invisible component that synchronizes game state with Supabase in multiplayer mode.
 * Must be rendered inside both <MultiplayerProvider> and <GameProvider>.
 */
import { useEffect, useRef } from 'react';
import { useMultiplayer } from '../../state/MultiplayerContext';
import { useGame } from '../../state/GameContext';
import { updateGameState, subscribeToRoom } from '../../services/multiplayerService';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function MultiplayerSync() {
  const { mode, roomCode, myPlayer, setOpponentConnected, setConnectionStatus } = useMultiplayer();
  const { state, dispatch } = useGame();

  // Prevents echo loop: when we apply a remote state, skip the next upload
  const isRemoteUpdate = useRef(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const prevStateRef = useRef(state);

  // Subscribe to Supabase Realtime when online mode is active
  useEffect(() => {
    if (mode !== 'online' || !roomCode) return;

    setConnectionStatus('connected');

    const channel = subscribeToRoom(roomCode, (remoteState) => {
      // Ignore if the update is from ourselves (same currentPlayer turn just synced)
      isRemoteUpdate.current = true;
      dispatch({ type: 'SET_STATE', state: remoteState });
      setOpponentConnected(true);
    });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [mode, roomCode, dispatch, setOpponentConnected, setConnectionStatus]);

  // Upload state to Supabase whenever state changes due to a LOCAL action
  useEffect(() => {
    if (mode !== 'online' || !roomCode || !myPlayer) return;

    // Skip if this change was triggered by a remote update
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      prevStateRef.current = state;
      return;
    }

    // Skip if state hasn't actually changed (same reference)
    if (state === prevStateRef.current) return;
    prevStateRef.current = state;

    // Only upload when it was our turn (we made the action)
    updateGameState(roomCode, state).catch(console.error);
  }, [state, mode, roomCode, myPlayer]);

  return null;
}
