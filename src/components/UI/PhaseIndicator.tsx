import React from 'react';
import { useGame } from '../../state/GameContext';

const PHASES = [
  { id: 'play_card', label: 'Karta' },
  { id: 'activate_units', label: 'Aktivace' },
  { id: 'move', label: 'Pohyb' },
  { id: 'attack', label: 'Útok' },
];

export function PhaseIndicator() {
  const { state } = useGame();
  const current = state.currentPhase;

  // Map sub-phases to parent
  const effectivePhase =
    current === 'select_section' || current === 'discard_drawn'
      ? 'play_card'
      : current;

  return (
    <div className="flex items-center gap-1 text-[10px]">
      {PHASES.map((p, i) => {
        const isActive = p.id === effectivePhase;
        const isDone =
          PHASES.findIndex(ph => ph.id === effectivePhase) > i;

        return (
          <React.Fragment key={p.id}>
            <div
              className={`
                px-2 py-0.5 rounded-full font-bold transition-colors
                ${isActive ? 'bg-yellow-500 text-black' : ''}
                ${isDone ? 'bg-gray-600 text-gray-400' : ''}
                ${!isActive && !isDone ? 'bg-gray-700 text-gray-500' : ''}
              `}
            >
              {p.label}
            </div>
            {i < PHASES.length - 1 && (
              <span className={isDone ? 'text-gray-400' : 'text-gray-600'}>›</span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
