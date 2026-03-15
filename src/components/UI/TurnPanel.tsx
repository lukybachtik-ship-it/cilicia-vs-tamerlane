import { useGame } from '../../state/GameContext';
import { UNIT_DEFINITIONS } from '../../constants/unitDefinitions';
import { CARD_DEFINITIONS } from '../../constants/cardDefinitions';

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

  const selectedUnit = state.selectedUnitId
    ? state.units.find(u => u.id === state.selectedUnitId)
    : null;

  const ciliciaLosses = state.destroyedUnits.filter(u => u.faction === 'cilicia').length;
  const tamerlaneLosses = state.destroyedUnits.filter(u => u.faction === 'tamerlane').length;

  const inActivatePhase = state.currentPhase === 'activate_units';
  const canConfirm = inActivatePhase && state.activatedUnitIds.length > 0;
  const canEndTurn =
    state.currentPhase === 'move' || state.currentPhase === 'attack';

  return (
    <div className="flex flex-col gap-3 text-sm">
      {/* Turn counter */}
      <div className="bg-gray-800 rounded-lg p-3 flex flex-col gap-1">
        <div className="text-gray-400 text-xs">Tah</div>
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

      {/* Score */}
      <div className="bg-gray-800 rounded-lg p-3">
        <div className="text-gray-400 text-xs mb-2">Ztráty (cíl: 5)</div>
        <div className="flex justify-between">
          <div className="text-center">
            <div className="text-blue-400 text-xs">Kilikie</div>
            <div className="text-white font-bold text-xl">{ciliciaLosses}/5</div>
          </div>
          <div className="text-gray-500 self-center">vs</div>
          <div className="text-center">
            <div className="text-red-400 text-xs">Tamerlán</div>
            <div className="text-white font-bold text-xl">{tamerlaneLosses}/5</div>
          </div>
        </div>
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
            HP: {selectedUnit.hp}/3 | Útok: {UNIT_DEFINITIONS[selectedUnit.definitionType].attack + selectedUnit.attackBonus}
          </div>
          <div className="text-gray-400 text-[10px]">
            Pohyb: {UNIT_DEFINITIONS[selectedUnit.definitionType].move + selectedUnit.moveBonus}
            {' '}| Dosah: {UNIT_DEFINITIONS[selectedUnit.definitionType].rangeMin}–{UNIT_DEFINITIONS[selectedUnit.definitionType].rangeMax}
          </div>
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
