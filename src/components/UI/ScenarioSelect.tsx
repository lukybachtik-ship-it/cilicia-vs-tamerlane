import { useGame } from '../../state/GameContext';
import { ALL_SCENARIOS } from '../../constants/scenarios';

const SCENARIO_ICONS: Record<string, string> = {
  standard:     '⚔️',
  ankara:       '🏇',
  breakthrough: '🏰',
};

export function ScenarioSelect() {
  const { dispatch } = useGame();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #0d1117 0%, #161b22 50%, #0d1117 100%)' }}
    >
      {/* Background texture */}
      <div className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)',
          backgroundSize: '20px 20px',
        }}
      />

      <div className="relative w-full max-w-3xl mx-4">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-1 tracking-wide">
            ⚔ <span className="text-blue-400">Kilikie</span>
            <span className="text-gray-500 text-2xl mx-3">vs</span>
            <span className="text-red-400">Tamerlán</span>
          </h1>
          <p className="text-gray-500 text-sm">Taktická tahová válečná hra • Vyberte scénář</p>
        </div>

        {/* Scenario cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {ALL_SCENARIOS.map(scenario => (
            <button
              key={scenario.id}
              onClick={() => dispatch({ type: 'RESTART_GAME', scenarioId: scenario.id })}
              className="group relative flex flex-col gap-3 p-5 rounded-2xl border transition-all duration-200 text-left
                         border-gray-700 bg-gray-900 hover:border-blue-500 hover:bg-gray-800
                         hover:shadow-[0_0_24px_rgba(59,130,246,0.2)]"
            >
              {/* Icon + name */}
              <div className="flex items-center gap-3">
                <span className="text-4xl">{SCENARIO_ICONS[scenario.id] ?? '🗡'}</span>
                <div>
                  <div className="text-white font-bold text-base leading-tight">{scenario.nameCs}</div>
                  <div className="text-xs mt-0.5">{scenario.difficultyCs}</div>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {scenario.tags.map(tag => (
                  <span key={tag}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 border border-gray-700 text-gray-400">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Description */}
              <p className="text-gray-400 text-xs leading-relaxed">
                {scenario.descriptionCs}
              </p>

              {/* Flavour text */}
              <p className="text-gray-600 text-[10px] italic leading-relaxed border-t border-gray-800 pt-2">
                {scenario.flavourCs}
              </p>

              {/* Unit counts */}
              <div className="flex justify-between text-[10px] text-gray-500">
                <span>🔵 {scenario.ciliciaLabel}: {scenario.ciliciaUnits.length} j.</span>
                <span>🔴 {scenario.tamerlaneLabel}: {scenario.tamerlaneUnits.length} j.</span>
              </div>

              {/* Play button */}
              <div className="mt-1 w-full text-center py-2 rounded-lg text-sm font-bold
                              bg-gray-800 group-hover:bg-blue-600 text-gray-400 group-hover:text-white
                              border border-gray-700 group-hover:border-blue-500 transition-all duration-200">
                Hrát tento scénář →
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <p className="text-center text-gray-700 text-xs mt-6">
          Command &amp; Colors inspired · Hex-based tactics · Czech UI
        </p>
      </div>
    </div>
  );
}
