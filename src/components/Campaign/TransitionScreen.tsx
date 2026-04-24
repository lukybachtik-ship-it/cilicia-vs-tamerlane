import { useEffect, useState } from 'react';
import { useCampaign } from '../../state/CampaignContext';
import {
  ALL_CAMPAIGN_SCENARIOS,
  CAMPAIGN_SCENARIO_SEQUENCE,
} from '../../constants/campaignScenarios';
import { MediterraneanMap } from './MediterraneanMap';

interface Props {
  /** Cílový scénář (pro zobrazení příchozího pinu animovaně). */
  onFinished: () => void;
}

/**
 * Krátká obrazovka mezi scénáři. Zobrazí:
 * - Animaci pohybu po Středomořské mapě
 * - Dobový citát z chroniky
 * - Shrnutí aktuálních stavů
 * - Tlačítko „Pokračovat" (skip enabled po 3 s)
 */
export function TransitionScreen({ onFinished }: Props) {
  const { campaign } = useCampaign();
  const [skipEnabled, setSkipEnabled] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSkipEnabled(true), 3000);
    return () => clearTimeout(t);
  }, []);

  if (!campaign) return null;

  const scenario = ALL_CAMPAIGN_SCENARIOS.find(
    s => s.id === CAMPAIGN_SCENARIO_SEQUENCE[campaign.currentScenarioIndex]
  );

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 flex flex-col items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-4">
          <div className="text-xs text-gray-500 uppercase tracking-widest">Cesta pokračuje</div>
          {scenario && (
            <h1 className="text-2xl font-bold text-amber-300 mt-1">
              Směr: {scenario.mapLabel}
            </h1>
          )}
        </div>

        <div className="mb-4">
          <MediterraneanMap
            currentScenarioIndex={campaign.currentScenarioIndex}
            completedScenarios={campaign.completedScenarios.map(r => r.scenarioId)}
          />
        </div>

        {/* Chronicle quote */}
        {scenario && (
          <div className="bg-amber-950/30 border border-amber-800 rounded-lg p-4 text-center mb-4">
            <p className="text-amber-100 text-sm italic leading-relaxed">{scenario.chronicleCs}</p>
            {scenario.chronicleLat && (
              <p className="text-amber-400/70 text-[11px] italic mt-1">{scenario.chronicleLat}</p>
            )}
          </div>
        )}

        {/* Status summary */}
        <div className="grid grid-cols-3 gap-2 mb-4 text-center text-xs">
          <div className="p-2 bg-gray-900 border border-gray-700 rounded">
            <div className="text-amber-300 font-bold text-sm">{campaign.favor}</div>
            <div className="text-gray-500">Favor</div>
          </div>
          <div className="p-2 bg-gray-900 border border-gray-700 rounded">
            <div className="text-emerald-300 font-bold text-sm">{campaign.supplyTokens}</div>
            <div className="text-gray-500">Supply</div>
          </div>
          <div className="p-2 bg-gray-900 border border-gray-700 rounded">
            <div className="text-sky-300 font-bold text-sm">úroveň {campaign.buceliarii.level}</div>
            <div className="text-gray-500">Bukelárii ({campaign.buceliarii.xp} XP)</div>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={onFinished}
            disabled={!skipEnabled}
            className={`px-8 py-3 rounded-lg font-bold text-sm transition-all ${
              skipEnabled
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            {skipEnabled ? 'Pokračovat →' : 'Pokračovat za 3 s…'}
          </button>
        </div>
      </div>
    </div>
  );
}
