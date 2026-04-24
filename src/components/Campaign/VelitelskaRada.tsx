import { useState } from 'react';
import { useCampaign } from '../../state/CampaignContext';
import {
  getCurrentCampaignScenario,
  STANDARD_COUNCIL_OPTIONS,
  katafraktiFreeAtFavor,
} from '../../constants/campaignScenarios';
import type { CouncilOption } from '../../constants/campaignScenarios';
import type { SecretGoalKind, PurchasedOption } from '../../types/campaign';

interface Props {
  onConfirm: () => void;
  onBack: () => void;
}

/**
 * Pre-battle obrazovka:
 * 1. Představí scénář a historický kontext
 * 2. Hráč volí jeden ze 2 tajných cílů (Glory vs Pragma)
 * 3. Hráč může nakoupit volby z Velitelské rady (standardní + exkluzivní)
 * 4. Tlačítko "Zahájit bitvu" → onConfirm
 */
export function VelitelskaRada({ onConfirm, onBack }: Props) {
  const { campaign, dispatch } = useCampaign();
  const [goalHint, setGoalHint] = useState<SecretGoalKind | null>(null);

  if (!campaign) return null;
  const scenario = getCurrentCampaignScenario({
    currentScenarioIndex: campaign.currentScenarioIndex,
    completedScenarios: campaign.completedScenarios,
    favor: campaign.favor,
    buceliarii: campaign.buceliarii,
  });
  if (!scenario) return null;

  const selectedGoal = campaign.currentSecretGoal;
  const purchased = campaign.currentPurchases;
  const canStart = !!selectedGoal;

  // Build list of council options (standard + scenario exclusive)
  const options: CouncilOption[] = [
    ...STANDARD_COUNCIL_OPTIONS.filter(
      o => !o.requires || o.requires({ katafraktiUnlocked: campaign.katafraktiUnlocked, favor: campaign.favor })
    ),
  ];
  if (scenario.exclusiveOption) {
    options.push({
      id: scenario.exclusiveOption.id,
      nameCs: `${scenario.exclusiveOption.nameCs} (scénářová)`,
      cost: scenario.exclusiveOption.cost,
      descriptionCs: scenario.exclusiveOption.descriptionCs,
    });
  }

  const isPurchased = (id: string) => purchased.some(p => p.id === id);

  const adjustedCost = (opt: CouncilOption): number => {
    if (opt.id === 'katafrakti' && katafraktiFreeAtFavor(campaign.favor)) return 0;
    return opt.cost;
  };

  const buy = (opt: CouncilOption) => {
    if (isPurchased(opt.id)) return;
    const cost = adjustedCost(opt);
    if (campaign.supplyTokens < cost) return;
    const purchase: PurchasedOption = { id: opt.id, costPaid: cost };
    dispatch({ type: 'ADD_PURCHASE', purchase });
  };

  const remove = (id: string) => {
    dispatch({ type: 'REMOVE_PURCHASE', purchaseId: id });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-5">
          <button
            onClick={onBack}
            className="text-gray-500 hover:text-gray-300 text-xs mb-2 transition-colors"
          >
            ← Zpět do hubu
          </button>
          <h1 className="text-2xl font-bold text-amber-300">Velitelská rada</h1>
          <div className="text-gray-400 text-sm mt-1">{scenario.nameCs}</div>
        </div>

        {/* Scenario context */}
        <div className="mb-6 p-4 bg-gray-900 border border-gray-700 rounded-lg">
          <div className="text-amber-300 text-xs font-bold uppercase tracking-wide mb-2">
            Historický kontext
          </div>
          <p className="text-gray-300 text-sm leading-relaxed">{scenario.contextCs}</p>
        </div>

        {/* Secret goal picker */}
        <div className="mb-6">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-2">
            Volba tajného cíle
          </h2>
          <p className="text-gray-500 text-xs mb-3 italic">
            Cíl zůstane skrytý pro bota. Splnění ti v bitvě přinese bonus odměnu.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <GoalCard
              title="Sláva"
              subtitle="+1 Přízeň"
              descriptionCs={scenario.goals.glory.descriptionCs}
              selected={selectedGoal === 'glory'}
              hinted={goalHint === 'glory'}
              onHover={() => setGoalHint('glory')}
              onLeave={() => setGoalHint(null)}
              onClick={() => dispatch({ type: 'SET_SECRET_GOAL', goal: 'glory' })}
              accent="text-amber-300 border-amber-700 hover:border-amber-500"
              selectedAccent="border-amber-400 bg-amber-950/40 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
            />
            <GoalCard
              title="Zisk"
              subtitle="+2 Zásoby"
              descriptionCs={scenario.goals.pragma.descriptionCs}
              selected={selectedGoal === 'pragma'}
              hinted={goalHint === 'pragma'}
              onHover={() => setGoalHint('pragma')}
              onLeave={() => setGoalHint(null)}
              onClick={() => dispatch({ type: 'SET_SECRET_GOAL', goal: 'pragma' })}
              accent="text-emerald-300 border-emerald-700 hover:border-emerald-500"
              selectedAccent="border-emerald-400 bg-emerald-950/40 shadow-[0_0_12px_rgba(52,211,153,0.25)]"
            />
          </div>
        </div>

        {/* Council options */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide">
              Velitelská rada
            </h2>
            <div className="text-emerald-300 text-sm font-bold">
              Zásoby: {campaign.supplyTokens} / 10
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {options.map(opt => {
              const bought = isPurchased(opt.id);
              const cost = adjustedCost(opt);
              const canAfford = campaign.supplyTokens >= cost;
              const freeKatafrakti = opt.id === 'katafrakti' && cost === 0;
              return (
                <button
                  key={opt.id}
                  onClick={() => (bought ? remove(opt.id) : buy(opt))}
                  disabled={!bought && !canAfford}
                  className={`text-left p-3 rounded-lg border transition-colors ${
                    bought
                      ? 'border-emerald-500 bg-emerald-950/40'
                      : canAfford
                        ? 'border-gray-700 bg-gray-900 hover:border-amber-500'
                        : 'border-gray-800 bg-gray-900/50 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-bold text-gray-100">{opt.nameCs}</div>
                    <div className={`text-xs font-bold ${bought ? 'text-emerald-300' : 'text-amber-300'}`}>
                      {bought ? '✓ Zakoupeno' : freeKatafrakti ? 'ZDARMA' : `${cost} zásob`}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 leading-tight">{opt.descriptionCs}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Confirm */}
        <div className="flex justify-end gap-3">
          <button
            onClick={() => dispatch({ type: 'CLEAR_PURCHASES' })}
            disabled={purchased.length === 0}
            className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm disabled:opacity-40 transition-colors"
          >
            Zrušit všechny nákupy
          </button>
          <button
            onClick={onConfirm}
            disabled={!canStart}
            className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-colors ${
              canStart
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            {canStart ? 'Zahájit bitvu →' : 'Vyber nejdřív tajný cíl'}
          </button>
        </div>
      </div>
    </div>
  );
}

function GoalCard({
  title,
  subtitle,
  descriptionCs,
  selected,
  onClick,
  onHover,
  onLeave,
  accent,
  selectedAccent,
}: {
  title: string;
  subtitle: string;
  descriptionCs: string;
  selected: boolean;
  hinted: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
  accent: string;
  selectedAccent: string;
}) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={`text-left p-4 rounded-lg border-2 transition-all ${accent} ${
        selected ? selectedAccent : ''
      }`}
    >
      <div className="flex items-baseline justify-between mb-2">
        <div className="text-lg font-bold">{title}</div>
        <div className="text-xs font-bold opacity-80">{subtitle}</div>
      </div>
      <p className="text-xs text-gray-300 leading-snug">{descriptionCs}</p>
    </button>
  );
}
