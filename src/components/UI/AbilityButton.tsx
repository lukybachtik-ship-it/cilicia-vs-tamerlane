import { useGame } from '../../state/GameContext';
import { useMultiplayer } from '../../state/MultiplayerContext';
import { UNIT_DEFINITIONS } from '../../constants/unitDefinitions';
import { hasAvailableAbility } from '../../logic/abilities';

const ABILITY_LABEL: Record<string, string> = {
  warcry:         'Válečný řev',
  pilum:          'Pilum salva',
  betrayal:       'Zrada',
  ambush_signal:  'Signál přepadu',
};

const ABILITY_HINT: Record<string, string> = {
  warcry:        '+2 kostky útoku a +1 pohyb v tomto kole',
  pilum:         'Vrhnout pilum: dosah 1–2, +2 kostky (místo běžného útoku)',
  betrayal:      'Obrátit sousedního kondotiéra na svou stranu do konce kola',
  ambush_signal: 'Odhalit všechny skryté germány; všichni germáni +1 kostka v tomto kole',
};

/**
 * Renders "Use ability" buttons for the currently-active player's activated units
 * that still have their 1×/game ability available.
 */
export function AbilityButton() {
  const { state, dispatch } = useGame();
  const { mode, myPlayer } = useMultiplayer();

  const isMyTurn = mode === 'local' || state.currentPlayer === myPlayer;
  if (!isMyTurn) return null;

  if (
    state.currentPhase !== 'activate_units' &&
    state.currentPhase !== 'move' &&
    state.currentPhase !== 'attack' &&
    state.currentPhase !== 'select_betrayal_target'
  ) {
    return null;
  }

  // Betrayal picker: show hint + cancel button
  if (state.currentPhase === 'select_betrayal_target') {
    return (
      <div className="flex items-center gap-2">
        <span className="text-yellow-300 text-xs font-bold animate-pulse">
          Zrada — klikni na sousedního nepřátelského kondotiéra
        </span>
        <button
          onClick={() => dispatch({ type: 'CANCEL_BETRAYAL' })}
          className="px-3 py-1 rounded text-xs bg-gray-700 hover:bg-gray-600 text-gray-200"
        >
          Zrušit
        </button>
      </div>
    );
  }

  // Find activated units (of current player) with available ability
  const activatedWithAbility = state.units.filter(
    u =>
      u.isActivated &&
      u.faction === state.currentPlayer &&
      hasAvailableAbility(u)
  );

  // Also: Arminius's ambush_signal doesn't require activation — once per game, anytime.
  const signalUnits = state.units.filter(
    u =>
      u.faction === state.currentPlayer &&
      hasAvailableAbility(u) &&
      UNIT_DEFINITIONS[u.definitionType].activatedAbility === 'ambush_signal'
  );
  const dedup = new Map<string, typeof activatedWithAbility[number]>();
  for (const u of [...activatedWithAbility, ...signalUnits]) dedup.set(u.id, u);
  const units = Array.from(dedup.values());

  if (units.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {units.map(u => {
        const kind = UNIT_DEFINITIONS[u.definitionType].activatedAbility!;
        return (
          <button
            key={u.id}
            onClick={() => dispatch({ type: 'ACTIVATE_ABILITY', unitId: u.id })}
            className="px-3 py-1 rounded text-xs font-bold bg-amber-700 hover:bg-amber-600 text-amber-100 border border-amber-400"
            title={`${UNIT_DEFINITIONS[u.definitionType].nameCs}: ${ABILITY_HINT[kind]}`}
          >
            {ABILITY_LABEL[kind]} <span className="opacity-70">({UNIT_DEFINITIONS[u.definitionType].abbrevCs})</span>
          </button>
        );
      })}
    </div>
  );
}
