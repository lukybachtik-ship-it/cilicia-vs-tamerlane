import { useState } from 'react';
import { useGame } from '../../state/GameContext';
import { getVisibleScenarios } from '../../constants/scenarios';
import { APP_TITLE, APP_SUBTITLE, isAdminUnlocked } from '../../constants/branding';
import { HowToContent } from './HowToContent';
import { ScenarioMiniMap, DifficultyPennant, difficultyText } from './ScenarioMiniMap';

type Tab = 'scenarios' | 'howto';

export function ScenarioSelect() {
  const { dispatch } = useGame();
  const [tab, setTab] = useState<Tab>('scenarios');

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

      <div className="relative w-full max-w-3xl mx-4 flex flex-col max-h-screen py-6">
        {/* Title */}
        <div className="text-center mb-5 flex-shrink-0">
          <h1 className="text-4xl font-bold text-white mb-1 tracking-wide">
            ⚔ <span className="text-amber-300">{APP_TITLE}</span>
          </h1>
          <p className="text-gray-500 text-sm">{APP_SUBTITLE}</p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-1 mb-4 flex-shrink-0">
          {([
            { id: 'scenarios', label: 'Scénáře' },
            { id: 'howto',     label: 'Jak hrát' },
          ] as { id: Tab; label: string }[]).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                tab === t.id
                  ? 'bg-blue-700 text-white shadow-lg'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Scenarios tab ── */}
        {tab === 'scenarios' && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 overflow-y-auto">
            {getVisibleScenarios(isAdminUnlocked()).map(scenario => (
              <button
                key={scenario.id}
                onClick={() => dispatch({ type: 'RESTART_GAME', scenarioId: scenario.id })}
                className="group relative flex flex-col gap-3 p-5 rounded-2xl border transition-all duration-200 text-left
                           border-gray-700 bg-gray-900 hover:border-blue-500 hover:bg-gray-800
                           hover:shadow-[0_0_24px_rgba(59,130,246,0.2)]"
              >
                <ScenarioMiniMap scenario={scenario} />
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-white font-bold text-base leading-tight">{scenario.nameCs}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{difficultyText(scenario.difficultyCs)}</div>
                  </div>
                  <DifficultyPennant difficultyCs={scenario.difficultyCs} />
                </div>
                <div className="flex flex-wrap gap-1">
                  {scenario.tags.map(tag => (
                    <span key={tag}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 border border-gray-700 text-gray-400">
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-gray-400 text-xs leading-relaxed">{scenario.descriptionCs}</p>
                <p className="text-gray-600 text-[10px] italic leading-relaxed border-t border-gray-800 pt-2">
                  {scenario.flavourCs}
                </p>
                <div className="flex justify-between text-[10px]">
                  <span style={{ color: '#60a5fa' }}>{scenario.ciliciaLabel}: {scenario.ciliciaUnits.length} j.</span>
                  <span style={{ color: '#f87171' }}>{scenario.tamerlaneLabel}: {scenario.tamerlaneUnits.length} j.</span>
                </div>
                <div className="mt-1 w-full text-center py-2 rounded-lg text-sm font-bold
                                bg-gray-800 group-hover:bg-blue-600 text-gray-400 group-hover:text-white
                                border border-gray-700 group-hover:border-blue-500 transition-all duration-200">
                  Hrát tento scénář →
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── How to play tab ── */}
        {tab === 'howto' && (
          <div className="overflow-y-auto flex-1 rounded-2xl border border-gray-700 bg-gray-900 p-6">
            <HowToContent />
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-gray-700 text-xs mt-4 flex-shrink-0">
          Command &amp; Colors inspired · Hex-based tactics · Czech UI
        </p>
      </div>
    </div>
  );
}
