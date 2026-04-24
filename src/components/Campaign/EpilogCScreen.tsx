import { useCampaign } from '../../state/CampaignContext';
import { ALL_CAMPAIGN_SCENARIOS } from '../../constants/campaignScenarios';

/**
 * Epilog C — Titulky. Narativní shrnutí kampaně. Zobrazí statistiky:
 * kolik bitev vyhrál, tajných cílů splněno, stav Bukelárií, finální
 * Přízeň. Motivace k další hře.
 */

interface Props {
  onFinish: () => void;
}

export function EpilogCScreen({ onFinish }: Props) {
  const { campaign, dispatch } = useCampaign();
  if (!campaign) return null;

  const totalBattles = campaign.completedScenarios.filter(r => r.victory).length;
  const goalsAchieved = campaign.completedScenarios.filter(
    r => r.victory && r.secretGoalAchieved
  ).length;
  const glorySplněno = campaign.completedScenarios.filter(
    r => r.victory && r.secretGoalChosen === 'glory' && r.secretGoalAchieved
  ).length;
  const ziskSplněno = campaign.completedScenarios.filter(
    r => r.victory && r.secretGoalChosen === 'pragma' && r.secretGoalAchieved
  ).length;
  const totalDestroyed = campaign.completedScenarios.reduce((s, r) => s + r.enemiesDestroyed, 0);
  const totalLosses = campaign.completedScenarios.reduce((s, r) => s + r.lossesSuffered, 0);

  const buc = campaign.buceliarii;
  const bucEnding = buc.permanentlyLost
    ? 'Bukelárii padli nadobro. Na mramorovou desku Belisariova paláce byla vepsána jejich jména.'
    : buc.level === 4
      ? 'Bukelárii dosáhli vrcholu slávy. Jejich mramorové pomníky stojí v Hippodromu.'
      : buc.level === 3
        ? 'Bukelárii, zocelení bitvami, slouží nové generaci generálů.'
        : 'Bukelárii, stále věrní, zůstávají v Belisariově družině.';

  const favorEnding = campaign.favor === 6
    ? 'Justinián si tě cenil nade vše. Tvé jméno zůstalo v análech jako vzor věrnosti.'
    : campaign.favor >= 4
      ? 'Císař ti důvěřoval. Říše stála, dokud jsi žil.'
      : campaign.favor >= 2
        ? 'Justinián tě toleroval. V exile jsi dožil klidně.'
        : 'Justinián ti nikdy nedůvěřoval. Historie si to zapamatovala.';

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        <div className="text-amber-300 text-xs uppercase tracking-widest mb-2 text-center">
          Konec Kampaně
        </div>
        <h1 className="text-3xl font-bold text-center mb-6">
          Belisariova cesta
        </h1>

        {/* Narativní shrnutí */}
        <div className="bg-amber-950/20 border border-amber-800/40 rounded-lg p-6 mb-6 space-y-3">
          <p className="text-amber-100 text-base leading-relaxed italic">
            {favorEnding}
          </p>
          <p className="text-amber-100 text-base leading-relaxed italic">
            {bucEnding}
          </p>
          <p className="text-amber-200 text-sm leading-relaxed italic mt-4 border-t border-amber-800/40 pt-3">
            „Vše pomine. Říše, generálové, císaři. Zůstane jen vzpomínka na čest a věrnost."
            {' '}<span className="text-amber-400/70">— Prokopios z Kaisareie</span>
          </p>
        </div>

        {/* Statistiky */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatBox label="Vyhraných bitev" value={totalBattles.toString()} />
          <StatBox label="Tajných cílů" value={`${goalsAchieved} / ${campaign.completedScenarios.length}`} />
          <StatBox label="Zabito nepřátel" value={totalDestroyed.toString()} />
          <StatBox label="Ztracených jednotek" value={totalLosses.toString()} />
          <StatBox label="Finální Přízeň" value={`${campaign.favor} / 6`} accent="text-amber-300" />
          <StatBox label="Finální Zásoby" value={`${campaign.supplyTokens} / 10`} accent="text-emerald-300" />
          <StatBox
            label="Bukelárii"
            value={buc.permanentlyLost ? 'Padlí' : `Úroveň ${buc.level}`}
            accent={buc.permanentlyLost ? 'text-red-400' : 'text-sky-300'}
          />
          <StatBox
            label="Sláva / Zisk splněno"
            value={`${glorySplněno} / ${ziskSplněno}`}
            accent="text-gray-200"
          />
        </div>

        {/* Kronika scénářů */}
        <div className="mb-6">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-2">
            Kronika
          </h2>
          <div className="space-y-2">
            {campaign.completedScenarios.map(r => {
              const def = ALL_CAMPAIGN_SCENARIOS.find(s => s.id === r.scenarioId);
              return (
                <div
                  key={r.scenarioId + r.endedAt}
                  className={`p-2 rounded text-xs ${r.victory ? 'bg-green-900/20 border-green-800' : 'bg-red-900/20 border-red-800'} border`}
                >
                  <span className="font-semibold text-gray-200">{def?.nameCs ?? r.scenarioId}</span>
                  {' — '}
                  <span className={r.victory ? 'text-green-400' : 'text-red-400'}>
                    {r.victory ? '✓ Vítězství' : '✗ Porážka'}
                  </span>
                  {r.secretGoalAchieved && (
                    <span className="text-amber-300 ml-2">
                      · {r.secretGoalChosen === 'glory' ? 'Sláva' : 'Zisk'} splněn
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => {
              // Record epilog C completion
              dispatch({
                type: 'COMPLETE_SCENARIO',
                result: {
                  scenarioId: 'epilog_c',
                  victory: true,
                  secretGoalChosen: null,
                  secretGoalAchieved: false,
                  rewardChosen: null,
                  buceliariiSurvived: !buc.permanentlyLost,
                  buceliariiXpEarned: 0,
                  enemiesDestroyed: 0,
                  lossesSuffered: 0,
                },
              });
              onFinish();
            }}
            className="px-8 py-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold transition-colors"
          >
            Dokončit kampaň →
          </button>
        </div>
      </div>
    </div>
  );
}

function StatBox({
  label, value, accent = 'text-gray-100',
}: { label: string; value: string; accent?: string }) {
  return (
    <div className="p-3 bg-gray-900 border border-gray-700 rounded">
      <div className="text-[10px] uppercase tracking-wide text-gray-500 mb-0.5">{label}</div>
      <div className={`text-lg font-bold ${accent}`}>{value}</div>
    </div>
  );
}
