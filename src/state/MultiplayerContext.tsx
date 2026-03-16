import React, { createContext, useContext, useState, useCallback } from 'react';
import type { PlayerTurn } from '../types/game';

export type ConnectionStatus =
  | 'idle'
  | 'creating'
  | 'joining'
  | 'waiting'
  | 'connected'
  | 'error';

export interface MultiplayerState {
  mode: 'local' | 'online';
  roomCode: string | null;
  myPlayer: PlayerTurn | null;
  opponentConnected: boolean;
  connectionStatus: ConnectionStatus;
  error: string | null;
}

interface MultiplayerContextValue extends MultiplayerState {
  setMode: (mode: 'local' | 'online') => void;
  setRoomCode: (code: string) => void;
  setMyPlayer: (player: PlayerTurn) => void;
  setOpponentConnected: (val: boolean) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setError: (error: string | null) => void;
  leaveGame: () => void;
}

const MultiplayerContext = createContext<MultiplayerContextValue | null>(null);

const PLAYER_KEY = (roomCode: string) => `ctg_player_${roomCode}`;

export function MultiplayerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<MultiplayerState>({
    mode: 'local',
    roomCode: null,
    myPlayer: null,
    opponentConnected: false,
    connectionStatus: 'idle',
    error: null,
  });

  const setMode = useCallback((mode: 'local' | 'online') => {
    setState(s => ({ ...s, mode }));
  }, []);

  const setRoomCode = useCallback((code: string) => {
    setState(s => ({ ...s, roomCode: code }));
    // Persist identity
    const stored = localStorage.getItem(PLAYER_KEY(code));
    if (stored === 'cilicia' || stored === 'tamerlane') {
      setState(s => ({ ...s, myPlayer: stored as PlayerTurn }));
    }
  }, []);

  const setMyPlayer = useCallback((player: PlayerTurn) => {
    setState(s => {
      if (s.roomCode) localStorage.setItem(PLAYER_KEY(s.roomCode), player);
      return { ...s, myPlayer: player };
    });
  }, []);

  const setOpponentConnected = useCallback((val: boolean) => {
    setState(s => ({ ...s, opponentConnected: val }));
  }, []);

  const setConnectionStatus = useCallback((status: ConnectionStatus) => {
    setState(s => ({ ...s, connectionStatus: status }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(s => ({ ...s, error, connectionStatus: error ? 'error' : s.connectionStatus }));
  }, []);

  const leaveGame = useCallback(() => {
    setState({
      mode: 'local',
      roomCode: null,
      myPlayer: null,
      opponentConnected: false,
      connectionStatus: 'idle',
      error: null,
    });
  }, []);

  return (
    <MultiplayerContext.Provider
      value={{
        ...state,
        setMode,
        setRoomCode,
        setMyPlayer,
        setOpponentConnected,
        setConnectionStatus,
        setError,
        leaveGame,
      }}
    >
      {children}
    </MultiplayerContext.Provider>
  );
}

export function useMultiplayer(): MultiplayerContextValue {
  const ctx = useContext(MultiplayerContext);
  if (!ctx) throw new Error('useMultiplayer must be used inside <MultiplayerProvider>');
  return ctx;
}

export function getStoredPlayer(roomCode: string): PlayerTurn | null {
  const val = localStorage.getItem(PLAYER_KEY(roomCode));
  if (val === 'cilicia' || val === 'tamerlane') return val;
  return null;
}
