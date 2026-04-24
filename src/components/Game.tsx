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
import { ScenarioEffectsBanner } from './UI/ScenarioEffectsBanner';
import { AbilityButton } from './UI/AbilityButton';
import { useGame } from '../state/GameContext';
import { useMultiplayer } from '../state/MultiplayerContext';
import { useBotPlayer } from '../hooks/useBotPlayer';
import { playEndTurnSound } from '../utils/sounds';
import { ALL_SCENARIOS } from '../constants/scenarios';
import { SupplyPanel } from './Campaign/SupplyPanel';

const PHASE_HINTS: Record<string, string> = {
  play_card: 'Vyber kartu ze své ruky.',
  select_section: 'Klikni na sekci pro Generální ofenzívu.',
  discard_drawn: 'Průzkum: klikni na kartu k zahození.',
  activate_units: 'Klikni na žlutě zvýrazněné jednotky k aktivaci, pak "Potvrdit".',
  move: 'Vyber aktivovanou jednotku → klikni na zelené pole. Pak klikni "Potvrdit pohyb" pro přechod k útoku.',
  attack: 'Vyber aktivovanou jednotku → klikni na červeně označeného nepřítele. Pak "Ukončit kolo".',
  choose_reinforcement_flank: 'Posily přicházejí! Vyber, na které křídlo dorazí.',
  select_betrayal_target: 'Zrada: klikni na sousedního nepřátelského kondotiéra, který přeběhne.',
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
  const { mode, myPlayer, botPlayer } = useMultiplayer();
  useBotPlayer();

  const scenario = ALL_SCENARIOS.find(s => s.id === state.scenarioId);
  const ciliciaLabel = scenario?.ciliciaLabel ?? 'Kilikie';
  const tamerlaneLabel = scenario?.tamerlaneLabel ?? 'Tamerlán';
  const currentLabel = state.currentPlayer === 'cilicia' ? ciliciaLabel : tamerlaneLabel;
  const inActivatePhase = state.currentPhase === 'activate_units';
  const inMovePhase = state.currentPhase === 'move';
  const inAttackPhase = state.currentPhase === 'attack';
  const canConfirm = inActivatePhase && state.activatedUnitIds.length > 0;

  // Block interactions when it's not our turn (online or bot mode)
  const isOnline = mode === 'online';
  const isBot = mode === 'bot' || mode === 'campaign';
  const isMyTurn = mode === 'local' || state.currentPlayer === myPlayer;

  if (showScenarioSelect) {
    return <ScenarioSelect />;
  }

  return (
    <div className="h-screen overflow-hidden bg-gray-900 text-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-1.5 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-sm font-bold text-gray-200">
            <span className="text-blue-400">{ciliciaLabel}</span>
            {' '}vs{' '}
            <span className="text-red-400">{tamerlaneLabel}</span>
          </h1>
          {scenario && (
            <button
              onClick={openScenarioSelect}
              className="text-gray-600 hover:text-gray-400 text-[10px] transition-colors"
              title="Změnit scénář"
            >
              {scenario.nameCs} · změnit
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
            {currentLabel} na tahu
          </div>
        </div>
      </header>

      <ScenarioEffectsBanner />

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left panel: Card hand */}
        <aside className="w-64 bg-gray-850 border-r border-gray-700 p-2 overflow-y-auto flex-shrink-0"
          style={{ backgroundColor: '#1a1f2e' }}>
          <CardHand />
        </aside>

        {/* Center: Board — scales to fill available space; hints below are scrollable */}
        <main className="flex-1 min-h-0 flex flex-col items-center justify-start p-2 overflow-y-auto gap-2">
          <Board />
          <TutorialHint />
          <UnitLegend />
        </main>

        {/* Right panel: Turn info + Combat log */}
        <aside
          className="w-60 border-l border-gray-700 p-2 flex flex-col gap-2 overflow-y-auto flex-shrink-0"
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
                {currentLabel} hraje
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

        {/* Bot mode: semi-transparent overlay while bot is thinking */}
        {isBot && state.currentPlayer === botPlayer && state.currentPhase !== 'game_over' && (
          <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center z-20 pointer-events-none">
            <div className="bg-gray-900 border border-purple-700 rounded-2xl px-8 py-5 text-center shadow-2xl min-w-56">
              <div className="text-3xl mb-2 animate-pulse">🤖</div>
              <p className="text-gray-300 text-base font-semibold">Bot přemýšlí…</p>
              <p className={`text-sm font-bold mt-1 ${state.currentPlayer === 'cilicia' ? 'text-blue-400' : 'text-red-400'}`}>
                {currentLabel}
              </p>
              <div className="text-purple-400 text-xs mt-2">
                {OPPONENT_PHASE_LABELS[state.currentPhase] ?? state.currentPhase}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reinforcement flank choice overlay */}
      {state.currentPhase === 'choose_reinforcement_flank' && state.pendingReinforcement && isMyTurn && (
        <div className="bg-gray-900 border-t-2 border-yellow-500 px-4 py-3 flex-shrink-0">
          <div className="text-yellow-400 font-bold text-sm mb-2 text-center">
            Posily přicházejí! — {state.pendingReinforcement.count}×{' '}
            {state.pendingReinforcement.unitType} pro {state.pendingReinforcement.faction === 'tamerlane' ? tamerlaneLabel : ciliciaLabel}
          </div>
          <div className="text-gray-300 text-xs mb-3 text-center">
            Vyber, na které křídlo posily dorazí:
          </div>
          <div className="flex gap-3 justify-center">
            {(['left', 'center', 'right'] as const).map(flank => (
              <button
                key={flank}
                onClick={() => dispatch({ type: 'CHOOSE_REINFORCEMENT_FLANK', flank })}
                className="px-6 py-2 rounded font-bold text-sm bg-yellow-600 hover:bg-yellow-500 text-white transition-colors"
              >
                {flank === 'left' ? '◀ Levé' : flank === 'center' ? '⬆ Střed' : 'Pravé ▶'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action bar — always visible to show phase hint; buttons hidden when not our turn */}
      {state.currentPhase !== 'game_over' && state.currentPhase !== 'choose_reinforcement_flank' && (
        <div className="bg-gray-800 border-t border-gray-700 px-4 py-1.5 flex items-center gap-3 flex-shrink-0">
          <span className="text-gray-400 text-xs flex-1">{PHASE_HINTS[state.currentPhase]}</span>

          {/* Ability buttons (1× per game special actions) */}
          <AbilityButton />

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
              {inMovePhase && (
                <button
                  onClick={() => dispatch({ type: 'CONFIRM_MOVEMENT' })}
                  className="px-5 py-1.5 rounded font-bold text-sm bg-yellow-600 hover:bg-yellow-500 text-white transition-colors"
                >
                  ✓ Potvrdit pohyb
                </button>
              )}
              {inAttackPhase && (
                <button
                  onClick={() => { playEndTurnSound(); dispatch({ type: 'END_TURN' }); }}
                  className="px-5 py-1.5 rounded font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                >
                  ⏭ Ukončit kolo
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Victory modal */}
      <VictoryModal />

      {/* Campaign-mode in-battle supply HUD */}
      {mode === 'campaign' && <SupplyPanel />}
    </div>
  );
}
