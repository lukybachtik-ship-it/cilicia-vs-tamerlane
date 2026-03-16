import React, { createContext, useContext, useReducer, useState, useCallback } from 'react';
import type { GameState } from '../types/game';
import type { GameAction } from './actions';
import { gameReducer } from './gameReducer';
import { buildInitialState } from '../constants/scenarioSetup';

const MAX_HISTORY = 12; // max undo steps

interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  // Undo
  undo: () => void;
  canUndo: boolean;
  // Scenario selection
  showScenarioSelect: boolean;
  openScenarioSelect: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, rawDispatch] = useReducer(gameReducer, undefined, buildInitialState);
  const [history, setHistory] = useState<GameState[]>([]);
  const [showScenarioSelect, setShowScenarioSelect] = useState(true); // shown on first load

  const openScenarioSelect = useCallback(() => {
    setShowScenarioSelect(true);
  }, []);

  // Undo: restore previous snapshot
  const undo = useCallback(() => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    rawDispatch({ type: 'SET_STATE', state: prev });
  }, [history]);

  // Dispatch wrapper: save history snapshot + handle scenario select transitions
  const dispatch = useCallback(
    (action: GameAction) => {
      if (action.type === 'SET_STATE') {
        // Direct state restore — no history push
        rawDispatch(action);
        return;
      }
      if (action.type === 'RESTART_GAME' && action.scenarioId !== undefined) {
        // Scenario chosen: hide select screen and clear history
        setShowScenarioSelect(false);
        setHistory([]);
        rawDispatch(action);
        return;
      }
      // Normal action: push current state to history then dispatch
      setHistory(prev => [...prev.slice(-(MAX_HISTORY - 1)), state]);
      rawDispatch(action);
    },
    [state]
  );

  return (
    <GameContext.Provider
      value={{
        state,
        dispatch,
        undo,
        canUndo: history.length > 0,
        showScenarioSelect,
        openScenarioSelect,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside <GameProvider>');
  return ctx;
}
