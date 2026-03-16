import { useGame } from '../../state/GameContext';
import { playSelectSound } from '../../utils/sounds';

export function VictoryModal() {
  const { state, openScenarioSelect } = useGame();
  if (!state.victor) return null;

  const isCilicia = state.victor === 'cilicia';

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div
        className={`
          rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl border-4
          ${isCilicia ? 'bg-blue-950 border-blue-500' : 'bg-red-950 border-red-500'}
        `}
      >
        <div className="text-5xl mb-4">{isCilicia ? '🏰' : '⚔️'}</div>
        <h2 className={`text-2xl font-bold mb-2 ${isCilicia ? 'text-blue-300' : 'text-red-300'}`}>
          {isCilicia ? 'Kilikie vítězí!' : 'Tamerlán vítězí!'}
        </h2>
        <p className="text-gray-300 text-sm mb-6">{state.victoryCause}</p>
        <div className="text-gray-400 text-xs mb-4">
          Tah #{state.turnNumber} •{' '}
          Kilikie ztráty: {state.destroyedUnits.filter(u => u.faction === 'cilicia').length} •{' '}
          Tamerlán ztráty: {state.destroyedUnits.filter(u => u.faction === 'tamerlane').length}
        </div>
        <button
          onClick={() => { playSelectSound(); openScenarioSelect(); }}
          className="bg-white text-black font-bold px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Hrát znovu
        </button>
      </div>
    </div>
  );
}
