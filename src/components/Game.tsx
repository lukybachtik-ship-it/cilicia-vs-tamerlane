import { Board } from './Board/Board';
import { CardHand } from './Cards/CardHand';
import { TurnPanel } from './UI/TurnPanel';
import { CombatLog } from './UI/CombatLog';
import { PhaseIndicator } from './UI/PhaseIndicator';
import { VictoryModal } from './UI/VictoryModal';
import { UnitLegend } from './UI/UnitLegend';
import { ScenarioSelect } from './UI/ScenarioSelect';
import { TutorialHint } from './UI/TutorialHint';
import { ConnectionBadge } from './UI/ConnectionBadge';
import { useGame } from '../state/GameContext';
import { useMultiplayer } from '../state/MultiplayerContext';
import { playEndTurnSound } from '../utils/sounds';
import { ALL_SCENARIOS } from '../constants/scenarios';

const PHASE_HINTS: Record<string, string> = {
  play_card: 'Vyber kartu ze své ruky.',
  select_section: 'Klikni na sekci pro Generální ofenzívu.',
  discard_drawn: 'Průzkum: klikni na kartu k zahození.',
  activate_units: 'Klikni na žlutě zvýrazněné jednotky k aktivaci, pak "Potvrdit".',
  move: 'Vyber aktivovanou jednotku → klikni na zelené pole. Po pohybu můžeš zaútočit nebo ukončit tah.',
  attack: 'Vyber aktivovanou jednotku → klikni na červeně označeného nepřítele.',
  game_over: '',
};

const OPPONENT_PHASE_LABELS: Record<string, string> = {
  play_card:      '🃏 Vybírá kartu…',
  select_section: '🃏 Vybírá sekci ofenzívy…',
  discard_drawn:  '🃏 Zahodí průzkumnou kartu…',
  activate_units: '⚡ Aktivuje jednotky…',
  move:           '🚶 Pohybuje jednotkami…',
  attack:         '⚔️ Útočí…',
};

export function Game() {
  const { state, dispatch, undo, canUndo, showScenarioSelect, openScenarioSelect } = useGame();
  const { mode, myPlayer } = useMultiplayer();

  const scenario = ALL_SCENARIOS.find(s => s.id === state.scenarioId);
  const inActivatePhase = state.currentPhase === 'activate_units';
  const canConfirm = inActivatePhase && state.activatedUnitIds.length > 0;
  const canEndTurn = state.currentPhase === 'move' || state.currentPhase === 'attack';

  // In online mode: block all interactions when it's not our turn
  const isOnline = mode === 'online';
  const isMyTurn = !isOnline || state.currentPlayer === myPlayer;

  if (showScenarioSelect) {
    return <ScenarioSelect />;
  }

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
          {scenario && (
            <button
              onClick={openScenarioSelect}
              className="text-gray-600 hover:text-gray-400 text-[10px] transition-colors"
              title="Změnit scénář"
            >
              📋 {scenario.nameCs} ·  změnit
            </button>
          )}
        </div>
        <PhaseIndicator />
        <div className="flex items-center gap-3">
          <ConnectionBadge />
          <div
            className={`text-xs font-bold px-3 py-1 rounded-full ${
              state.currentPlayer === 'cilicia'
                ? 'bg-blue-900 text-blue-300'
                : 'bg-red-900 text-red-300'
            }`}
          >
            {state.currentPlayer === 'cilicia' ? '🔵 Kilikie' : '🔴 Tamerlán'} na tahu
          </div>
        </div>
      </header>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left panel: Card hand */}
        <aside className="w-72 bg-gray-850 border-r border-gray-700 p-3 overflow-y-auto flex-shrink-0"
          style={{ backgroundColor: '#1a1f2e' }}>
          <CardHand />
        </aside>

        {/* Center: Board + tutorial + legend */}
        <main className="flex-1 flex flex-col items-center justify-center p-4 overflow-auto gap-3">
          <Board />
          <TutorialHint />
          <UnitLegend />
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

        {/* Online multiplayer: overlay when it's the opponent's turn */}
        {isOnline && !isMyTurn && state.currentPhase !== 'game_over' && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-20 pointer-events-all">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl px-8 py-6 text-center shadow-2xl min-w-64">
              <div className="text-4xl mb-3 animate-pulse">⏳</div>
              <p className="text-gray-300 text-lg font-semibold">Čekám na soupeře…</p>
              <p className={`text-sm font-bold mt-1 ${state.currentPlayer === 'cilicia' ? 'text-blue-400' : 'text-red-400'}`}>
                {state.currentPlayer === 'cilicia' ? '🔵 Kilikie' : '🔴 Tamerlán'} hraje
              </p>
              {/* Show opponent's current phase */}
              <div className="mt-3 pt-3 border-t border-gray-700">
                <div className="text-gray-500 text-xs mb-1">Soupeř právě:</div>
                <div className="text-yellow-300 text-sm font-semibold">
                  {OPPONENT_PHASE_LABELS[state.currentPhase] ?? state.currentPhase}
                </div>
                {state.currentPhase === 'move' && state.activatedUnitIds.length > 0 && (
                  <div className="text-gray-500 text-xs mt-1">
                    Aktivováno {state.activatedUnitIds.length} jednotek
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action bar — always visible to show phase hint; buttons hidden when not our turn */}
      {state.currentPhase !== 'game_over' && (
        <div className="bg-gray-800 border-t border-gray-700 px-6 py-2 flex items-center gap-4 flex-shrink-0">
          <span className="text-gray-400 text-xs flex-1">{PHASE_HINTS[state.currentPhase]}</span>

          {/* Buttons only shown on our turn */}
          {isMyTurn && (
            <>
              {canUndo && (
                <button
                  onClick={undo}
                  className="px-4 py-1.5 rounded font-bold text-sm border border-gray-600
                             bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
                  title="Vzít zpět poslední akci (max 12 kroků)"
                >
                  ↩ Zpět
                </button>
              )}

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
                  onClick={() => { playEndTurnSound(); dispatch({ type: 'END_TURN' }); }}
                  className="px-5 py-1.5 rounded font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                >
                  ⏭ Konec tahu
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Victory modal */}
      <VictoryModal />
    </div>
  );
}
