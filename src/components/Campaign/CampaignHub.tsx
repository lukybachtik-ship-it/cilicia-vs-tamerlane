import { useState } from 'react';
import { useCampaign } from '../../state/CampaignContext';
import { favorText, computeBuceliariiLevel } from '../../types/campaign';
import {
  ALL_CAMPAIGN_SCENARIOS,
  CAMPAIGN_SCENARIO_SEQUENCE,
  getCurrentCampaignScenario,
} from '../../constants/campaignScenarios';
import { MediterraneanMap } from './MediterraneanMap';

interface Props {
  onStartScenario: () => void;
  onExitCampaign: () => void;
}

/**
 * Kampaňový hub — hlavní obrazovka mezi scénáři. Ukazuje Středomořskou
 * mapu s piny, stavy ekonomiky a tlačítko k pokračování.
 */
export function CampaignHub({ onStartScenario, onExitCampaign }: Props) {
  const { campaign, isLoading, startNew, reset, isCampaignFinished, dispatch } = useCampaign();
  const [debugOpen, setDebugOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-300">
        <div className="animate-pulse">Načítám kampaň…</div>
      </div>
    );
  }

  // No active campaign: show intro + start button
  if (!campaign) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-gray-200">
        <h1 className="text-3xl font-bold text-center mb-3">Belisariova kampaň</h1>
        <p className="text-gray-400 text-sm text-center mb-6 max-w-2xl mx-auto leading-relaxed">
          Hraj za Flavia Belisaria, nejslavnějšího generála východořímské říše.
          Sedm propojených bitev s perzistentní ekonomikou, rostoucí elitní jízdou
          (Bukelárii) a tajnými cíli.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => void startNew()}
            className="px-6 py-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold transition-colors"
          >
            Začít novou kampaň
          </button>
          <button
            onClick={onExitCampaign}
            className="px-6 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 font-semibold transition-colors"
          >
            Zpět do menu
          </button>
        </div>
      </div>
    );
  }

  const currentScenario = getCurrentCampaignScenario({
    currentScenarioIndex: campaign.currentScenarioIndex,
    completedScenarios: campaign.completedScenarios,
    favor: campaign.favor,
    buceliarii: campaign.buceliarii,
  });
  const completed = campaign.completedScenarios.map(r => r.scenarioId);
  const finished = isCampaignFinished();

  const buc = campaign.buceliarii;
  const bucStatus = buc.permanentlyLost
    ? 'Trvale ztraceni — nahrazeni těžkou jízdou'
    : buc.inRecovery
      ? `V rekonvalescenci (${buc.recoveryScenariosRemaining} scénář)`
      : buc.alive
        ? `Aktivní — úroveň ${buc.level}, ${buc.xp} XP, ${buc.figurineCount}/4 figurek`
        : 'Padli (vrátí se příští scénář)';

  return (
    <div className="max-w-6xl mx-auto p-4 text-gray-200 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Belisariova kampaň</h1>
          <p className="text-gray-500 text-xs">
            Scénář {campaign.completedScenarios.filter(r => r.victory).length + 1}
            {' '}z cca 8
            {' '}·  Přízeň {campaign.favor} {campaign.favor >= 4 ? '→ Ravenna' : '→ Kalábrie'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onExitCampaign}
            className="px-3 py-1.5 rounded text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 transition-colors"
          >
            Menu
          </button>
          <button
            onClick={() => {
              if (confirm('Opravdu smazat kampaň a začít znovu?')) void reset();
            }}
            className="px-3 py-1.5 rounded text-xs bg-red-900 hover:bg-red-800 text-red-200 transition-colors"
          >
            Začít znovu
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="mb-4">
        <MediterraneanMap
          currentScenarioIndex={campaign.currentScenarioIndex}
          completedScenarios={completed}
        />
      </div>

      {/* Stats panel */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <StatCard
          title="Přízeň Justiniána"
          primary={favorText(campaign.favor)}
          secondary={`Přízeň: ${campaign.favor} / 6`}
          accent="text-amber-300"
        />
        <StatCard
          title="Zásoby"
          primary={`${campaign.supplyTokens} / 10`}
          secondary={`Příjem +${1 + Math.floor(campaign.favor / 3)} mezi scénáři`}
          accent="text-emerald-300"
        />
        <StatCard
          title="Bukelárii"
          primary={buc.permanentlyLost ? '— Ztraceni —' : `Úroveň ${buc.level}`}
          secondary={bucStatus}
          accent={buc.permanentlyLost ? 'text-red-400' : 'text-blue-300'}
        />
      </div>

      {/* Global flags */}
      {(campaign.katafraktiUnlocked || campaign.gelimerWounded) && (
        <div className="mb-4 p-3 bg-gray-900 border border-gray-700 rounded-lg text-xs text-gray-300 space-y-1">
          {campaign.katafraktiUnlocked && <div>✓ Katafrakti odemčeni (lze nasadit přes Radu za 3 zásoby, nebo zdarma při Přízni 6).</div>}
          {campaign.gelimerWounded && <div>✓ Gelimer byl zraněn v Ad Decimum — v Tricamaru začne s 3 figurkami místo 4.</div>}
        </div>
      )}

      {/* Current scenario CTA */}
      {finished ? (
        <div className="text-center p-6 bg-green-900/30 border border-green-700 rounded-lg">
          <div className="text-xl font-bold text-green-300 mb-2">Kampaň dokončena!</div>
          <div className="text-sm text-gray-300 mb-4">Všech {CAMPAIGN_SCENARIO_SEQUENCE.length} scénářů za tebou.</div>
          <button
            onClick={onExitCampaign}
            className="px-5 py-2 rounded bg-gray-700 hover:bg-gray-600 text-gray-200 font-bold transition-colors"
          >
            Zpět do menu
          </button>
        </div>
      ) : currentScenario ? (
        <div className="bg-gray-900 border border-amber-700 rounded-lg p-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="text-amber-300 text-xs font-bold uppercase tracking-wide mb-1">
                Další bitva
              </div>
              <h2 className="text-xl font-bold mb-2">{currentScenario.nameCs}</h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-2">
                {currentScenario.contextCs}
              </p>
              <div className="text-gray-500 text-xs italic">
                {currentScenario.chronicleCs}
              </div>
            </div>
            <button
              onClick={onStartScenario}
              className="px-6 py-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold transition-colors whitespace-nowrap"
            >
              Do velitelské rady →
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 text-sm p-4">
          Scénář zatím není implementován (Fáze 2+).
        </div>
      )}

      {/* Debug menu (skrytý panel pro testery) */}
      <div className="mt-6 border border-gray-800 rounded p-2 bg-gray-900/40">
        <button
          onClick={() => setDebugOpen(v => !v)}
          className="text-[10px] text-gray-600 hover:text-gray-400 uppercase tracking-widest"
        >
          {debugOpen ? '▼ Debug (skrýt)' : '▶ Debug (pro testery)'}
        </button>
        {debugOpen && (
          <div className="mt-2 space-y-2 text-xs">
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-gray-500">Skok na scénář:</span>
              {/* Debug: synteticky předvyplní completedScenarios + index, aby resolver
                   nabídl požadovaný scénář. */}
              {[
                'dara', 'nika', 'ad_decimum', 'tricamarum', 'neapol',
                'roma_6a', 'roma_6b', 'ravenna', 'calabria', 'epilog_a',
              ].map((sid, idx) => {
                const def = ALL_CAMPAIGN_SCENARIOS.find(s => s.id === sid);
                return (
                  <button
                    key={sid}
                    onClick={() => {
                      // Vytvoř fake completion history pro všechny predchozí scénáře
                      // ve standardní sekvenci (kampaň tak "pokročí" k target).
                      const baseSeq = ['dara', 'nika', 'ad_decimum', 'tricamarum', 'neapol', 'roma_6a', 'roma_6b'];
                      let prereqs: string[];
                      if (baseSeq.includes(sid)) {
                        const targetIdx = baseSeq.indexOf(sid);
                        prereqs = baseSeq.slice(0, targetIdx);
                      } else {
                        // 7A/7B/epilog — completni celou base sekvenci
                        prereqs = [...baseSeq];
                        if (sid === 'epilog_a') prereqs.push(campaign.favor >= 4 ? 'ravenna' : 'calabria');
                      }
                      const fakeCompleted = prereqs.map(id => ({
                        scenarioId: id,
                        victory: true,
                        secretGoalChosen: null,
                        secretGoalAchieved: false,
                        rewardChosen: null,
                        buceliariiSurvived: true,
                        buceliariiXpEarned: 0,
                        enemiesDestroyed: 0,
                        lossesSuffered: 0,
                        endedAt: new Date().toISOString(),
                      }));
                      dispatch({
                        type: 'HYDRATE',
                        state: {
                          ...campaign,
                          completedScenarios: fakeCompleted,
                          currentScenarioIndex: prereqs.length,
                          currentSecretGoal: null,
                          currentPurchases: [],
                        },
                      });
                    }}
                    className="px-2 py-0.5 rounded text-[10px] bg-gray-800 text-gray-300 hover:bg-gray-700"
                  >
                    {idx + 1}. {def?.mapLabel ?? sid}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-gray-500">Přízeň:</span>
              {[0, 2, 4, 6].map(f => (
                <button
                  key={f}
                  onClick={() => dispatch({ type: 'HYDRATE', state: { ...campaign, favor: f } })}
                  className="px-2 py-0.5 rounded text-[10px] bg-gray-800 hover:bg-gray-700 text-amber-300"
                >
                  {f}
                </button>
              ))}
              <span className="text-gray-500 ml-2">Zásoby:</span>
              {[2, 5, 8, 10].map(s => (
                <button
                  key={s}
                  onClick={() => dispatch({ type: 'HYDRATE', state: { ...campaign, supplyTokens: s } })}
                  className="px-2 py-0.5 rounded text-[10px] bg-gray-800 hover:bg-gray-700 text-emerald-300"
                >
                  {s}
                </button>
              ))}
              <span className="text-gray-500 ml-2">Bukelárii XP:</span>
              {[0, 2, 4, 7].map(xp => (
                <button
                  key={xp}
                  onClick={() =>
                    dispatch({
                      type: 'HYDRATE',
                      state: {
                        ...campaign,
                        buceliarii: {
                          ...campaign.buceliarii,
                          xp,
                          level: computeBuceliariiLevel(xp),
                        },
                      },
                    })
                  }
                  className="px-2 py-0.5 rounded text-[10px] bg-gray-800 hover:bg-gray-700 text-sky-300"
                >
                  {xp} (L{computeBuceliariiLevel(xp)})
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <button
                onClick={() => dispatch({ type: 'UNLOCK_KATAFRAKTI' })}
                className="px-2 py-0.5 rounded text-[10px] bg-gray-800 hover:bg-gray-700 text-gray-300"
                disabled={campaign.katafraktiUnlocked}
              >
                {campaign.katafraktiUnlocked ? '✓ Katafrakti odemčeni' : 'Odemknout Katafrakty'}
              </button>
              <button
                onClick={() => dispatch({ type: 'SET_GELIMER_WOUNDED', wounded: !campaign.gelimerWounded })}
                className="px-2 py-0.5 rounded text-[10px] bg-gray-800 hover:bg-gray-700 text-gray-300"
              >
                Gelimer zraněn: {campaign.gelimerWounded ? 'ANO' : 'NE'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* History */}
      {campaign.completedScenarios.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-2">
            Kronika
          </h3>
          <div className="space-y-2">
            {campaign.completedScenarios.map(r => {
              const def = ALL_CAMPAIGN_SCENARIOS.find(s => s.id === r.scenarioId);
              return (
                <div
                  key={r.scenarioId + r.endedAt}
                  className={`p-3 rounded border text-xs ${r.victory ? 'bg-green-900/20 border-green-800' : 'bg-red-900/20 border-red-800'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-200">{def?.nameCs ?? r.scenarioId}</span>
                    <span className={r.victory ? 'text-green-400' : 'text-red-400'}>
                      {r.victory ? 'Vítězství' : 'Porážka'}
                    </span>
                  </div>
                  <div className="text-gray-500 mt-1">
                    Tajný cíl ({r.secretGoalChosen === 'glory' ? 'Sláva' : r.secretGoalChosen === 'pragma' ? 'Zisk' : '—'}):{' '}
                    {r.secretGoalAchieved ? '✓ splněn' : '✗ nesplněn'}
                    {r.rewardChosen && (
                      <>
                        {' · Odměna: '}
                        {r.rewardChosen === 'favor' ? '+2 Přízeň' : r.rewardChosen === 'supply' ? '+3 Zásoby' : '+1 XP'}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  primary,
  secondary,
  accent,
}: {
  title: string;
  primary: string;
  secondary: string;
  accent: string;
}) {
  return (
    <div className="p-3 bg-gray-900 border border-gray-700 rounded-lg">
      <div className="text-gray-500 text-[10px] uppercase tracking-wide mb-1">{title}</div>
      <div className={`text-base font-bold ${accent}`}>{primary}</div>
      <div className="text-gray-400 text-[11px] mt-0.5">{secondary}</div>
    </div>
  );
}
