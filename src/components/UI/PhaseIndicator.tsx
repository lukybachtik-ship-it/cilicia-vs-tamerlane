import React from 'react';
import { useGame } from '../../state/GameContext';

const PHASES = [
  { id: 'play_card',      icon: '🃏', label: 'Karta' },
  { id: 'activate_units', icon: '⚡', label: 'Aktivace' },
  { id: 'move',           icon: '🚶', label: 'Pohyb' },
  { id: 'attack',         icon: '⚔️',  label: 'Útok' },
];

const PHASE_DESCRIPTIONS: Record<string, string> = {
  play_card:      'Vyber kartu ze své ruky',
  select_section: 'Vyber sekci pro Generální ofenzívu',
  discard_drawn:  'Průzkum: zahod 1 ze 2 karet',
  activate_units: 'Klikni na žluté jednotky k aktivaci',
  move:           'Vyber jednotku → pohyb na zelené pole',
  attack:         'Vyber jednotku → zaútoč na červeného nepřítele',
  game_over:      'Hra skončila',
};

export function PhaseIndicator() {
  const { state } = useGame();
  const current = state.currentPhase;

  const effectivePhase =
    current === 'select_section' || current === 'discard_drawn'
      ? 'play_card'
      : current;

  const activeIndex = PHASES.findIndex(p => p.id === effectivePhase);

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Step pills */}
      <div className="flex items-center gap-0.5 text-[10px]">
        {PHASES.map((p, i) => {
          const isActive = p.id === effectivePhase;
          const isDone = activeIndex > i;

          return (
            <React.Fragment key={p.id}>
              <div
                className={`
                  flex items-center gap-1 px-2 py-0.5 rounded-full font-bold transition-all duration-300
                  ${isActive ? 'bg-yellow-400 text-black scale-105 shadow-[0_0_8px_rgba(250,204,21,0.5)]' : ''}
                  ${isDone ? 'bg-gray-600 text-gray-300' : ''}
                  ${!isActive && !isDone ? 'bg-gray-800 text-gray-600' : ''}
                `}
              >
                <span>{p.icon}</span>
                <span>{p.label}</span>
              </div>
              {i < PHASES.length - 1 && (
                <span className={isDone ? 'text-gray-400 mx-0.5' : 'text-gray-700 mx-0.5'}>›</span>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Current action hint */}
      <div className="text-[10px] text-gray-400 italic">
        {PHASE_DESCRIPTIONS[current] ?? ''}
      </div>
    </div>
  );
}
