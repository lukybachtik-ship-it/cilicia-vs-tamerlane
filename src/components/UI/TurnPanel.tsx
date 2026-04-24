import { useState } from 'react';
import { useGame } from '../../state/GameContext';
import { UNIT_DEFINITIONS } from '../../constants/unitDefinitions';
import { CARD_DEFINITIONS } from '../../constants/cardDefinitions';
import { ALL_SCENARIOS } from '../../constants/scenarios';
import { RulesModal } from './RulesModal';

function formatKillThreshold(n: number): string {
  return n >= 99 ? '–' : String(n);
}

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
  const inMovePhase = state.currentPhase === 'move';
  const inAttackPhase = state.currentPhase === 'attack';
  const canConfirm = inActivatePhase && state.activatedUnitIds.length > 0;

  return (
    <div className="flex flex-col gap-2 text-sm">
      {/* Rules modal */}
      {rulesOpen && <RulesModal onClose={() => setRulesOpen(false)} />}

      {/* Turn counter */}
      <div className="bg-gray-800 rounded-lg p-2 flex flex-col gap-0.5">
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-xs">Tah <span className="text-white font-bold">#{state.turnNumber}</span></span>
          <button
            onClick={() => setRulesOpen(true)}
            className="text-gray-400 hover:text-yellow-300 text-[10px] border border-gray-600 hover:border-yellow-600 rounded px-1.5 py-0.5 transition-colors"
          >
            ? Pravidla
          </button>
        </div>
        <div
          className={`font-bold text-sm ${
            state.currentPlayer === 'cilicia' ? 'text-blue-400' : 'text-red-400'
          }`}
        >
          {state.currentPlayer === 'cilicia'
            ? (scenario?.ciliciaLabel ?? 'Kilikie')
            : (scenario?.tamerlaneLabel ?? 'Tamerlán')} hraje
        </div>
        <div className="text-yellow-300 text-xs">
          {PHASE_LABELS[state.currentPhase]}
        </div>
      </div>

      {/* Turn countdown — shown inline when turn limit is active */}
      {turnsLeft !== null && (
        <div className={`rounded px-2 py-1 flex items-center justify-between ${
          turnsLeft <= 2
            ? 'bg-red-950 border border-red-700'
            : turnsLeft <= 4
            ? 'bg-yellow-950 border border-yellow-700'
            : 'bg-gray-800'
        }`}>
          <span className="text-gray-400 text-[10px]">Zbývající tahy:</span>
          <span className={`font-bold text-base ml-2 ${
            turnsLeft <= 2 ? 'text-red-400' : turnsLeft <= 4 ? 'text-yellow-300' : 'text-white'
          }`}>
            {turnsLeft > 0 ? turnsLeft : '⚠!'}
          </span>
        </div>
      )}

      {/* Score + objectives */}
      <div className="bg-gray-800 rounded-lg p-2">
        <div className="flex justify-between items-center mb-1">
          <span className="text-gray-400 text-[10px]">Zabito nepřátel</span>
        </div>
        <div className="flex justify-between text-center">
          <div>
            <div className="text-blue-400 text-[10px]">{scenario?.ciliciaLabel ?? 'Kilikie'}</div>
            <div className="text-white font-bold text-lg leading-tight">
              {tamerlaneLosses}/{formatKillThreshold(scenario?.killThresholdTamerlane ?? 5)}
            </div>
          </div>
          <div className="text-gray-500 self-center text-xs">vs</div>
          <div>
            <div className="text-red-400 text-[10px]">{scenario?.tamerlaneLabel ?? 'Tamerlán'}</div>
            <div className="text-white font-bold text-lg leading-tight">
              {ciliciaLosses}/{formatKillThreshold(scenario?.killThresholdCilicia ?? 5)}
            </div>
          </div>
        </div>
        {scenario && (
          <div className="mt-1.5 pt-1.5 border-t border-gray-700 space-y-0.5">
            <div className="text-blue-300 text-[9px] leading-tight">🔵 {scenario.victoryObjectiveCiliciaCs}</div>
            <div className="text-red-300 text-[9px] leading-tight">🔴 {scenario.victoryObjectiveTamerlaneCs}</div>
          </div>
        )}
      </div>

      {/* Reinforcement schedule */}
      {scenario?.reinforcementWaves && scenario.reinforcementWaves.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-2">
          <div className="text-orange-400 text-[10px] font-bold mb-1">
            ⚔️ Posily {scenario.tamerlaneLabel}
          </div>
          {scenario.reinforcementWaves.map((wave, i) => {
            const arrived = state.turnNumber > wave.triggerAfterTurn;
            return (
              <div key={i} className={`text-[9px] leading-tight ${arrived ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                Po tahu {wave.triggerAfterTurn}: {wave.count}× {UNIT_DEFINITIONS[wave.unitType].nameCs}
                {arrived && ' ✓'}
              </div>
            );
          })}
        </div>
      )}

      {/* Ascalon: sleeping unit wake-up schedule */}
      {state.scenarioId === 'ascalon' && (() => {
        const wakeGroups: Record<number, string[]> = {};
        // Collect from both current units and destroyed units (to show all waves)
        const allUnits = [...state.units, ...state.destroyedUnits];
        for (const u of allUnits) {
          if (u.faction === 'tamerlane' && u.sleepsUntilTurn !== undefined) {
            const t = u.sleepsUntilTurn;
            if (!wakeGroups[t]) wakeGroups[t] = [];
            const name = UNIT_DEFINITIONS[u.definitionType].nameCs;
            if (!wakeGroups[t].includes(name)) wakeGroups[t].push(name);
          }
        }
        const turns = Object.keys(wakeGroups).map(Number).sort((a, b) => a - b);
        if (turns.length === 0) return null;
        return (
          <div className="bg-gray-800 rounded-lg p-2">
            <div className="text-orange-400 text-[10px] font-bold mb-1">
              🔔 Turecké posily (probuzení)
            </div>
            {turns.map(t => {
              const arrived = state.turnNumber >= t;
              return (
                <div key={t} className={`text-[9px] leading-tight ${arrived ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                  Kolo {t}: {wakeGroups[t].join(', ')}
                  {arrived && ' ✓'}
                </div>
              );
            })}
          </div>
        );
      })()}

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
        {inMovePhase && (
          <button
            onClick={() => dispatch({ type: 'CONFIRM_MOVEMENT' })}
            className="bg-yellow-700 hover:bg-yellow-600 text-white text-sm py-2 rounded font-bold"
          >
            ✓ Potvrdit pohyb
          </button>
        )}
        {inAttackPhase && (
          <button
            onClick={() => dispatch({ type: 'END_TURN' })}
            className="bg-blue-700 hover:bg-blue-600 text-white text-sm py-2 rounded font-bold"
          >
            ⏭ Ukončit kolo
          </button>
        )}
      </div>
    </div>
  );
}
