import { useState } from 'react';
import { useCampaign } from '../../state/CampaignContext';
import { getCurrentCampaignScenario } from '../../constants/campaignScenarios';
import type { RewardKind, ScenarioResult } from '../../types/campaign';

interface Props {
  /** Výsledek zrovna dohrané bitvy — volána z Game komponenty po výhře. */
  result: Omit<ScenarioResult, 'endedAt' | 'rewardChosen'>;
  /** Vítězný flow pokračuje do Transition screen → CampaignHub. */
  onContinue: () => void;
  /** Při porážce nelze vybrat odměnu; hráč se vrátí do hubu. */
  onRetry: () => void;
}

export function PostVictoryScreen({ result, onContinue, onRetry }: Props) {
  const { campaign, dispatch } = useCampaign();
  const [chosen, setChosen] = useState<RewardKind | null>(null);

  if (!campaign) return null;
  const scenario = getCurrentCampaignScenario({
    currentScenarioIndex: campaign.currentScenarioIndex,
    completedScenarios: campaign.completedScenarios,
    favor: campaign.favor,
    buceliarii: campaign.buceliarii,
  });
  if (!scenario) return null;

  // Submit the completion result (must happen before reward selection,
  // because CHOOSE_REWARD expects a "current" result in completedScenarios).
  const needsRecord = !campaign.completedScenarios.some(
    r => r.scenarioId === result.scenarioId && r.endedAt >= (campaign.updatedAt ?? '')
  );

  if (needsRecord) {
    dispatch({
      type: 'COMPLETE_SCENARIO',
      result: { ...result, rewardChosen: null },
    });
  }

  if (!result.victory) {
    const isHardcore = campaign.hardcoreMode;
    return (
      <div className="min-h-screen bg-gray-950 text-gray-200 flex items-center justify-center p-6">
        <div className="max-w-xl w-full text-center">
          <div className="text-3xl font-bold text-red-400 mb-3">
            {isHardcore ? 'Konec kampaně' : 'Porážka'}
          </div>
          <p className="text-gray-400 text-sm mb-6">
            {isHardcore
              ? `${scenario.nameCs} skončila neúspěchem. V čestném módu je kampaň uzamčena. Uložená kampaň bude smazána.`
              : `${scenario.nameCs} skončila neúspěchem. Justinián ztrácí trpělivost (−1 Přízeň).`}
          </p>
          <p className="text-gray-500 text-xs mb-6 italic">
            {isHardcore
              ? 'V čestném módu každá prohra znamená nový začátek — historie je tvrdá.'
              : 'Kampaň není rogue-like — můžeš zkusit scénář znovu, dokud se nepovede.'}
          </p>
          <button
            onClick={onRetry}
            className={`px-6 py-3 rounded-lg font-bold transition-colors ${
              isHardcore
                ? 'bg-red-700 hover:bg-red-600 text-white'
                : 'bg-amber-600 hover:bg-amber-500 text-white'
            }`}
          >
            {isHardcore ? 'Smazat kampaň a zpět' : 'Zkusit znovu'}
          </button>
        </div>
      </div>
    );
  }

  const applyReward = (reward: RewardKind) => {
    setChosen(reward);
    dispatch({ type: 'CHOOSE_REWARD', reward });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 p-6 overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Vítězství</div>
          <h1 className="text-3xl font-bold text-green-400 mt-1">{scenario.nameCs}</h1>
        </div>

        {/* Battle summary */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-5">
          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <SummaryStat label="Zničené jednotky" value={result.enemiesDestroyed.toString()} />
            <SummaryStat label="Vlastní ztráty" value={result.lossesSuffered.toString()} />
            <SummaryStat label="Bukelárii XP" value={`+${result.buceliariiXpEarned}`} />
          </div>
          <div className="mt-3 pt-3 border-t border-gray-800 text-center text-sm">
            <span className="text-gray-400">Tajný cíl </span>
            <span className="text-gray-200 font-semibold">
              ({result.secretGoalChosen === 'glory' ? 'Sláva' : 'Zisk'})
            </span>
            {': '}
            {result.secretGoalAchieved ? (
              <span className="text-green-400 font-bold">
                ✓ splněn ({result.secretGoalChosen === 'glory' ? '+1 Přízeň' : '+2 Zásoby'})
              </span>
            ) : (
              <span className="text-red-400">✗ nesplněn</span>
            )}
          </div>
        </div>

        {/* Chronicle */}
        <div className="bg-amber-950/30 border border-amber-800 rounded-lg p-4 mb-5">
          <div className="text-amber-300 text-xs font-bold uppercase tracking-wide mb-2">
            Kronika
          </div>
          <p className="text-amber-100 text-sm italic mb-1">{scenario.chronicleCs}</p>
          {scenario.chronicleLat && (
            <p className="text-amber-400/70 text-xs italic">{scenario.chronicleLat}</p>
          )}
        </div>

        {/* Reward choice */}
        {!chosen ? (
          <>
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3">
              Odměna za vítězství
            </h2>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <RewardCard
                label="+2 Přízeň"
                desc="Justinián je spokojen"
                accent="amber"
                onClick={() => applyReward('favor')}
              />
              <RewardCard
                label="+3 Zásoby"
                desc="Logistika zajištěna"
                accent="emerald"
                onClick={() => applyReward('supply')}
              />
              <RewardCard
                label="+1 Bukelárii XP"
                desc="Elitní výcvik pokračuje"
                accent="sky"
                onClick={() => applyReward('bukelarii_xp')}
              />
            </div>
          </>
        ) : (
          <div className="text-center mb-6">
            <div className="text-emerald-300 text-base font-bold">
              Odměna přijata.
            </div>
            <button
              onClick={onContinue}
              className="mt-4 px-6 py-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold transition-colors"
            >
              Pokračovat do další bitvy →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-gray-500 text-[10px] uppercase tracking-wide">{label}</div>
      <div className="text-xl font-bold text-gray-100 mt-1">{value}</div>
    </div>
  );
}

const REWARD_ACCENTS = {
  amber: 'border-amber-700 hover:border-amber-500 text-amber-300 bg-amber-950/20',
  emerald: 'border-emerald-700 hover:border-emerald-500 text-emerald-300 bg-emerald-950/20',
  sky: 'border-sky-700 hover:border-sky-500 text-sky-300 bg-sky-950/20',
} as const;

function RewardCard({
  label,
  desc,
  accent,
  onClick,
}: {
  label: string;
  desc: string;
  accent: keyof typeof REWARD_ACCENTS;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-lg border-2 transition-all ${REWARD_ACCENTS[accent]}`}
    >
      <div className="text-base font-bold mb-1">{label}</div>
      <div className="text-xs text-gray-300">{desc}</div>
    </button>
  );
}
