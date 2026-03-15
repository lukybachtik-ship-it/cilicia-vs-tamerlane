import { Board } from './Board/Board';
import { CardHand } from './Cards/CardHand';
import { TurnPanel } from './UI/TurnPanel';
import { CombatLog } from './UI/CombatLog';
import { PhaseIndicator } from './UI/PhaseIndicator';
import { VictoryModal } from './UI/VictoryModal';
import { useGame } from '../state/GameContext';

const PHASE_HINTS: Record<string, string> = {
  play_card: 'Vyber kartu ze své ruky.',
  select_section: 'Klikni na sekci pro Generální ofenzívu.',
  discard_drawn: 'Průzkum: klikni na kartu k zahození.',
  activate_units: 'Klikni na žlutě zvýrazněné jednotky k aktivaci.',
  move: 'Vyber aktivovanou jednotku → klikni na zelené pole k pohybu.',
  attack: 'Vyber aktivovanou jednotku → klikni na červeně označeného nepřítele.',
  game_over: '',
};

export function Game() {
  const { state, dispatch } = useGame();

  const inActivatePhase = state.currentPhase === 'activate_units';
  const canConfirm = inActivatePhase && state.activatedUnitIds.length > 0;
  const canEndTurn = state.currentPhase === 'move' || state.currentPhase === 'attack';

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-sm font-bold text-gray-200">
            ⚔ <span className="text-blue-400">Kilikie</span>
            {' '}vs{' '}
            <span className="text-red-400">Tamerlán</span>
          </h1>
          <div className="text-gray-500 text-[10px]">Taktická tahová válečná hra</div>
        </div>
        <PhaseIndicator />
        <div
          className={`text-xs font-bold px-3 py-1 rounded-full ${
            state.currentPlayer === 'cilicia'
              ? 'bg-blue-900 text-blue-300'
              : 'bg-red-900 text-red-300'
          }`}
        >
          {state.currentPlayer === 'cilicia' ? '🔵 Kilikie' : '🔴 Tamerlán'} na tahu
        </div>
      </header>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel: Card hand */}
        <aside className="w-72 bg-gray-850 border-r border-gray-700 p-3 overflow-y-auto flex-shrink-0"
          style={{ backgroundColor: '#1a1f2e' }}>
          <CardHand />
        </aside>

        {/* Center: Board */}
        <main className="flex-1 flex items-center justify-center p-4 overflow-auto">
          <Board />
        </main>

        {/* Right panel: Turn info + Combat log */}
        <aside
          className="w-64 border-l border-gray-700 p-3 flex flex-col gap-3 overflow-y-auto flex-shrink-0"
          style={{ backgroundColor: '#1a1f2e' }}
        >
          <TurnPanel />
          <div className="border-t border-gray-700 pt-3">
            <CombatLog />
          </div>
        </aside>
      </div>

      {/* Action bar */}
      {(inActivatePhase || canEndTurn) && (
        <div className="bg-gray-800 border-t border-gray-700 px-6 py-2 flex items-center gap-4 flex-shrink-0">
          <span className="text-gray-400 text-xs flex-1">{PHASE_HINTS[state.currentPhase]}</span>
          {inActivatePhase && (
            <button
              onClick={() => canConfirm && dispatch({ type: 'CONFIRM_ACTIVATIONS' })}
              disabled={!canConfirm}
              className={`px-5 py-1.5 rounded font-bold text-sm transition-colors ${
                canConfirm
                  ? 'bg-green-600 hover:bg-green-500 text-white'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              ✓ Potvrdit aktivaci{state.activatedUnitIds.length > 0 ? ` (${state.activatedUnitIds.length})` : ''}
            </button>
          )}
          {canEndTurn && (
            <button
              onClick={() => dispatch({ type: 'END_TURN' })}
              className="px-5 py-1.5 rounded font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white transition-colors"
            >
              ⏭ Konec tahu
            </button>
          )}
        </div>
      )}

      {/* Victory modal */}
      <VictoryModal />
    </div>
  );
}
