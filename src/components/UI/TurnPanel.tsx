import { useState } from 'react';
import { useGame } from '../../state/GameContext';
import { UNIT_DEFINITIONS } from '../../constants/unitDefinitions';
import { CARD_DEFINITIONS } from '../../constants/cardDefinitions';
import { ALL_SCENARIOS } from '../../constants/scenarios';
import { RulesModal } from './RulesModal';

const PHASE_LABELS: Record<string, string> = {
  play_card: '1. Zahraj kartu',
  select_section: '1b. Vyber sekci',
  discard_drawn: '1c. Zahod kartu',
  activate_units: '2. Aktivuj jednotky',
  move: '3. Pohyb',
  attack: '4. Útok',
  end_turn: '5. Konec tahu',
  game_over: '🏆 Konec hry',
};

const PHASE_HINTS: Record<string, string> = {
  play_card: 'Vyber kartu ze své ruky.',
  select_section: 'Klikni na sekci pro Generální ofenzívu.',
  discard_drawn: 'Průzkum: klikni na kartu k zahození.',
  activate_units: 'Klikni na jednotky k aktivaci. Pak "Potvrdit aktivaci".',
  move: 'Vyber aktivovanou jednotku → klikni na zelené pole k pohybu. Pak zaútoč nebo "Konec tahu".',
  attack: 'Vyber aktivovanou jednotku → klikni na červeně označeného nepřítele.',
  game_over: '',
};

export function TurnPanel() {
  const { state, dispatch } = useGame();
  const [rulesOpen, setRulesOpen] = useState(false);

  const selectedUnit = state.selectedUnitId
    ? state.units.find(u => u.id === state.selectedUnitId)
    : null;

  const scenario = ALL_SCENARIOS.find(s => s.id === state.scenarioId);
  const ciliciaLosses = state.destroyedUnits.filter(u => u.faction === 'cilicia').length;
  const tamerlaneLosses = state.destroyedUnits.filter(u => u.faction === 'tamerlane').length;
  const turnsLeft = scenario?.turnLimit != null ? scenario.turnLimit - state.turnNumber : null;

  const inActivatePhase = state.currentPhase === 'activate_units';
  const canConfirm = inActivatePhase && state.activatedUnitIds.length > 0;
  const canEndTurn =
    state.currentPhase === 'move' || state.currentPhase === 'attack';

  return (
    <div className="flex flex-col gap-3 text-sm">
      {/* Rules modal */}
      {rulesOpen && <RulesModal onClose={() => setRulesOpen(false)} />}

      {/* Turn counter */}
      <div className="bg-gray-800 rounded-lg p-3 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div className="text-gray-400 text-xs">Tah</div>
          <button
            onClick={() => setRulesOpen(true)}
            className="text-gray-400 hover:text-yellow-300 text-[10px] border border-gray-600 hover:border-yellow-600 rounded px-1.5 py-0.5 transition-colors"
          >
            ? Pravidla
          </button>
        </div>
        <div className="text-white font-bold text-lg">#{state.turnNumber}</div>
        <div
          className={`font-bold text-base ${
            state.currentPlayer === 'cilicia' ? 'text-blue-400' : 'text-red-400'
          }`}
        >
          {state.currentPlayer === 'cilicia' ? '🔵 Kilikie' : '🔴 Tamerlán'} hraje
        </div>
        <div className="text-yellow-300 text-xs mt-1">
          {PHASE_LABELS[state.currentPhase]}
        </div>
        <div className="text-gray-400 text-[10px] leading-tight mt-0.5">
          {PHASE_HINTS[state.currentPhase]}
        </div>
      </div>

      {/* Turn countdown (only for scenarios with a turn limit) */}
      {turnsLeft !== null && (
        <div className={`rounded-lg p-2 text-center ${
          turnsLeft <= 2
            ? 'bg-red-950 border border-red-700'
            : turnsLeft <= 4
            ? 'bg-yellow-950 border border-yellow-700'
            : 'bg-gray-800'
        }`}>
          <div className="text-gray-400 text-[10px]">Zbývající tahy</div>
          <div className={`font-bold text-2xl ${
            turnsLeft <= 2 ? 'text-red-400' : turnsLeft <= 4 ? 'text-yellow-300' : 'text-white'
          }`}>
            {turnsLeft > 0 ? turnsLeft : '⚠ Poslední tah!'}
          </div>
          <div className="text-gray-500 text-[9px]">
            {scenario?.ciliciaLabel ?? 'Kilikie'} vyhrává přežitím
          </div>
        </div>
      )}

      {/* Score — each column shows how many enemy units that faction has KILLED */}
      <div className="bg-gray-800 rounded-lg p-3">
        <div className="text-gray-400 text-xs mb-2">Zabito nepřátel</div>
        <div className="flex justify-between">
          <div className="text-center">
            <div className="text-blue-400 text-xs">{scenario?.ciliciaLabel ?? 'Kilikie'}</div>
            <div className="text-white font-bold text-xl">
              {tamerlaneLosses}/{scenario?.killThresholdTamerlane ?? 5}
            </div>
          </div>
          <div className="text-gray-500 self-center">vs</div>
          <div className="text-center">
            <div className="text-red-400 text-xs">{scenario?.tamerlaneLabel ?? 'Tamerlán'}</div>
            <div className="text-white font-bold text-xl">
              {ciliciaLosses}/{scenario?.killThresholdCilicia ?? 5}
            </div>
          </div>
        </div>
        {/* Scenario objectives */}
        {scenario && (
          <div className="mt-2 pt-2 border-t border-gray-700 space-y-1">
            <div className="text-blue-300 text-[9px] leading-tight">
              🔵 {scenario.victoryObjectiveCiliciaCs}
            </div>
            <div className="text-red-300 text-[9px] leading-tight">
              🔴 {scenario.victoryObjectiveTamerlaneCs}
            </div>
          </div>
        )}
      </div>

      {/* Played card info */}
      {state.playedCard && (
        <div className="bg-gray-800 rounded-lg p-2">
          <div className="text-gray-400 text-[10px]">Zahrána karta:</div>
          <div className="text-white text-xs font-bold">
            {CARD_DEFINITIONS[state.playedCard.id].nameCs}
          </div>
          <div className="text-gray-400 text-[10px]">
            Aktivováno: {state.activatedUnitIds.length}/{
              Math.min(99, CARD_DEFINITIONS[state.playedCard.id].maxActivations)
            }
          </div>
        </div>
      )}

      {/* Selected unit info */}
      {selectedUnit && (
        <div className="bg-gray-800 rounded-lg p-2">
          <div className="text-gray-400 text-[10px]">Vybraná jednotka:</div>
          <div
            className={`text-xs font-bold ${
              selectedUnit.faction === 'cilicia' ? 'text-blue-400' : 'text-red-400'
            }`}
          >
            {UNIT_DEFINITIONS[selectedUnit.definitionType].nameCs}
          </div>
          <div className="text-gray-300 text-[10px] mt-0.5">
            HP: {selectedUnit.hp}/{UNIT_DEFINITIONS[selectedUnit.definitionType].maxHp} | Útok: {UNIT_DEFINITIONS[selectedUnit.definitionType].attack + selectedUnit.attackBonus}
          </div>
          <div className="text-gray-400 text-[10px]">
            Pohyb: {UNIT_DEFINITIONS[selectedUnit.definitionType].move + selectedUnit.moveBonus}
            {' '}| Dosah: {UNIT_DEFINITIONS[selectedUnit.definitionType].rangeMin}–{UNIT_DEFINITIONS[selectedUnit.definitionType].rangeMax}
          </div>
          {UNIT_DEFINITIONS[selectedUnit.definitionType].ignoresTerrainStop && (
            <div className="text-cyan-400 text-[10px]">🌲 Ignoruje terénní stop</div>
          )}
          {UNIT_DEFINITIONS[selectedUnit.definitionType].siegeBonus && (
            <div className="text-orange-400 text-[10px]">🏰 +2 kostky vs. pevnost</div>
          )}
          {selectedUnit.isActivated && (
            <div className="text-green-400 text-[10px]">✓ Aktivována</div>
          )}
          {selectedUnit.hasMoved && (
            <div className="text-orange-400 text-[10px]">↑ Pohybovala se</div>
          )}
          {selectedUnit.hasAttacked && (
            <div className="text-purple-400 text-[10px]">⚔ Zaútočila</div>
          )}
        </div>
      )}

      {/* General Offensive section selector */}
      {state.currentPhase === 'select_section' && (
        <div className="bg-gray-800 rounded-lg p-2 flex flex-col gap-1">
          <div className="text-yellow-300 text-xs font-bold">Generální ofenzíva</div>
          <div className="text-gray-400 text-[10px]">Vyber sekci:</div>
          {(['left', 'center', 'right'] as const).map(s => {
            const labels = { left: 'Levé křídlo', center: 'Střed', right: 'Pravé křídlo' };
            const colors = {
              left: 'bg-orange-700 hover:bg-orange-600',
              center: 'bg-green-700 hover:bg-green-600',
              right: 'bg-purple-700 hover:bg-purple-600',
            };
            return (
              <button
                key={s}
                onClick={() => dispatch({ type: 'SELECT_GENERAL_OFFENSIVE_SECTION', section: s })}
                className={`${colors[s]} text-white text-xs py-1 rounded font-bold`}
              >
                {labels[s]}
              </button>
            );
          })}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-2">
        {inActivatePhase && (
          <button
            onClick={() => canConfirm && dispatch({ type: 'CONFIRM_ACTIVATIONS' })}
            disabled={!canConfirm}
            className={`text-white text-sm py-2 rounded font-bold transition-colors ${
              canConfirm
                ? 'bg-green-700 hover:bg-green-600'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            ✓ Potvrdit aktivaci {state.activatedUnitIds.length > 0 ? `(${state.activatedUnitIds.length})` : ''}
          </button>
        )}
        {canEndTurn && (
          <button
            onClick={() => dispatch({ type: 'END_TURN' })}
            className="bg-blue-700 hover:bg-blue-600 text-white text-sm py-2 rounded font-bold"
          >
            ⏭ Konec tahu
          </button>
        )}
      </div>
    </div>
  );
}
