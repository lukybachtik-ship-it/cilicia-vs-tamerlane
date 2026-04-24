import { useState, useEffect, useRef } from 'react';
import { useCampaign } from '../../state/CampaignContext';
import { useGame } from '../../state/GameContext';
import { getCurrentCampaignScenario, STANDARD_COUNCIL_OPTIONS } from '../../constants/campaignScenarios';

/**
 * In-battle Supply panel — zobrazuje aktuální SP a umožňuje utrácet je
 * v průběhu bitvy. Dostupné akce závisí i na pre-battle nákupech
 * (Špion → druhý Peek, Obětavost/Pohřbení/Partyzán → scénářové tlačítko).
 */
export function SupplyPanel() {
  const { campaign, dispatch: campaignDispatch } = useCampaign();
  const { state, dispatch: gameDispatch } = useGame();

  // Stavy akcí: počítáme použití
  const [peekCount, setPeekCount] = useState(0);
  const [bonusUsed, setBonusUsed] = useState(false);
  const [reinfUsed, setReinfUsed] = useState(false);
  const [devotionUsed, setDevotionUsed] = useState(false);
  const [buriedUsed, setBuriedUsed] = useState(false);
  const [guerrillaUsed, setGuerrillaUsed] = useState(false);
  const [peekingUntil, setPeekingUntil] = useState<number | null>(null);
  const secretEnvoyShownRef = useRef(false);

  // Reset action availability on new battle (turn 1)
  useEffect(() => {
    if (state.turnNumber === 1 && state.currentPhase === 'play_card') {
      setPeekCount(0);
      setBonusUsed(false);
      setReinfUsed(false);
      setDevotionUsed(false);
      setBuriedUsed(false);
      setGuerrillaUsed(false);
      secretEnvoyShownRef.current = false;
    }
  }, [state.scenarioId, state.turnNumber === 1]);

  // Auto-hide peek overlay after 6 seconds
  useEffect(() => {
    if (peekingUntil === null) return;
    const t = setTimeout(() => setPeekingUntil(null), 6000);
    return () => clearTimeout(t);
  }, [peekingUntil]);

  if (!campaign) return null;

  const sp = campaign.supplyTokens;
  const gameOver = state.currentPhase === 'game_over';

  // Pre-battle purchases odemykají extra sloty / scénářová tlačítka
  const hasSpy = campaign.currentPurchases.some(p => p.id === 'spy');
  const hasDevotion = campaign.currentPurchases.some(p => p.id === 'legionary_devotion');
  const hasBuriedArchers = campaign.currentPurchases.some(p => p.id === 'buried_archers');
  const hasGuerrilla = campaign.currentPurchases.some(p => p.id === 'guerrilla_network');
  const hasSecretEnvoy = campaign.currentPurchases.some(p => p.id === 'secret_envoy');

  const peekLimit = hasSpy ? 2 : 1;
  const canPeek = peekCount < peekLimit && sp >= 3 && !gameOver;
  const canBonus = !bonusUsed && sp >= 1 && !gameOver;
  const canReinf = !reinfUsed && sp >= 2 && !gameOver;
  const canDevotion = hasDevotion && !devotionUsed && !gameOver;
  const canBuriedArchers = hasBuriedArchers && !buriedUsed && !gameOver && state.scenarioId === 'dara';
  const canGuerrilla = hasGuerrilla && !guerrillaUsed && !gameOver && state.scenarioId === 'calabria';

  // Tajný posel (Ravenna) — auto-peek na začátku bitvy (jednorázově)
  useEffect(() => {
    if (!hasSecretEnvoy) return;
    if (secretEnvoyShownRef.current) return;
    if (state.turnNumber !== 1 || state.currentPhase !== 'play_card') return;
    if (state.scenarioId !== 'ravenna') return;
    secretEnvoyShownRef.current = true;
    setPeekingUntil(Date.now() + 8000);
  }, [hasSecretEnvoy, state.turnNumber, state.currentPhase, state.scenarioId]);

  const buyPeek = () => {
    if (!canPeek) return;
    campaignDispatch({ type: 'ADD_PURCHASE', purchase: { id: 'in_battle_peek', costPaid: 3 } });
    setPeekCount(c => c + 1);
    setPeekingUntil(Date.now() + 6000);
  };

  const buyBonus = () => {
    if (!canBonus) return;
    campaignDispatch({ type: 'ADD_PURCHASE', purchase: { id: 'in_battle_bonus_die', costPaid: 1 } });
    gameDispatch({ type: 'APPLY_SUPPLY_BONUS', kind: 'bonus_die', spawnFaction: 'cilicia' });
    setBonusUsed(true);
  };

  const buyReinf = () => {
    if (!canReinf) return;
    campaignDispatch({ type: 'ADD_PURCHASE', purchase: { id: 'in_battle_reinforcement', costPaid: 2 } });
    gameDispatch({ type: 'APPLY_SUPPLY_BONUS', kind: 'reinforcement', spawnFaction: 'cilicia' });
    setReinfUsed(true);
  };

  const buyDevotion = () => {
    if (!canDevotion) return;
    // Zaplaceno pre-battle — in-battle jen aktivace
    gameDispatch({ type: 'APPLY_SUPPLY_BONUS', kind: 'legionary_devotion', spawnFaction: 'cilicia' });
    setDevotionUsed(true);
  };

  const buyBuriedArchers = () => {
    if (!canBuriedArchers) return;
    gameDispatch({ type: 'APPLY_SUPPLY_BONUS', kind: 'buried_archers', spawnFaction: 'cilicia' });
    setBuriedUsed(true);
  };

  const buyGuerrilla = () => {
    if (!canGuerrilla) return;
    gameDispatch({ type: 'APPLY_SUPPLY_BONUS', kind: 'guerrilla_ambush', spawnFaction: 'cilicia' });
    setGuerrillaUsed(true);
  };

  // Scénářová meta pro zobrazení tajného cíle a scénářových nákupů
  const scenario = getCurrentCampaignScenario({
    currentScenarioIndex: campaign.currentScenarioIndex,
    completedScenarios: campaign.completedScenarios,
    favor: campaign.favor,
    buceliarii: campaign.buceliarii,
  });
  const goalDesc = scenario && campaign.currentSecretGoal
    ? campaign.currentSecretGoal === 'glory'
      ? scenario.goals.glory.descriptionCs
      : scenario.goals.pragma.descriptionCs
    : null;

  const purchaseNames: Record<string, string> = {};
  for (const opt of STANDARD_COUNCIL_OPTIONS) purchaseNames[opt.id] = opt.nameCs;
  if (scenario?.exclusiveOption) {
    purchaseNames[scenario.exclusiveOption.id] = scenario.exclusiveOption.nameCs;
  }
  const pregameBoughts = campaign.currentPurchases.filter(
    p => !p.id.startsWith('in_battle_')
  );

  return (
    <>
      {/* Supply HUD (spodní pravý roh, NAD action barem aby nezakrývala „Zpět"/„Ukončit kolo") */}
      <div className="fixed bottom-14 right-2 z-30 bg-gray-900/95 border border-amber-700 rounded-lg p-2 shadow-xl max-w-[260px] max-h-[calc(100vh-160px)] overflow-y-auto">
        {/* Tajný cíl scénáře */}
        {goalDesc && (
          <div className="mb-2 pb-2 border-b border-gray-700/60">
            <div className="text-[9px] uppercase tracking-wide text-gray-500 mb-0.5">
              Tajný cíl ({campaign.currentSecretGoal === 'glory' ? 'Sláva' : 'Zisk'})
            </div>
            <div className="text-[10px] text-amber-200 leading-tight italic">
              {goalDesc}
            </div>
            <div className="text-[9px] text-gray-500 mt-0.5">
              Odměna: {campaign.currentSecretGoal === 'glory' ? '+1 Přízeň' : '+2 Zásoby'}
            </div>
          </div>
        )}

        {/* Pre-bitvou zakoupené z Velitelské rady */}
        {pregameBoughts.length > 0 && (
          <div className="mb-2 pb-2 border-b border-gray-700/60">
            <div className="text-[9px] uppercase tracking-wide text-gray-500 mb-0.5">
              Z velitelské rady
            </div>
            <ul className="space-y-0.5">
              {pregameBoughts.map(p => (
                <li key={p.id} className="text-[10px] text-emerald-200 leading-tight">
                  ✓ {purchaseNames[p.id] ?? p.id}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs mb-1.5">
          <span className="text-amber-300 font-bold">Zásoby:</span>
          <span className="text-emerald-300 font-bold text-base">{sp}</span>
          <span className="text-gray-500 text-[10px]">/ 10</span>
        </div>
        <div className="flex flex-col gap-1">
          {/* Standardní in-battle akce (placené ze Zásob) */}
          <SupplyButton
            label={bonusUsed ? 'Bonus ✓ použit' : 'Bonus kostka — 1 zás.'}
            hint={bonusUsed ? 'Použito v této bitvě' : sp < 1 ? 'Nedostatek zásob' : '+1 útočná kostka pro jednu příští akci'}
            onClick={buyBonus}
            enabled={canBonus}
          />
          <SupplyButton
            label={reinfUsed ? 'Posila ✓ použita' : 'Posila — 2 zás.'}
            hint={reinfUsed ? 'Použito v této bitvě' : sp < 2 ? 'Nedostatek zásob' : 'Přivolej lehkou pěchotu do domovské řady'}
            onClick={buyReinf}
            enabled={canReinf}
          />
          <SupplyButton
            label={
              peekCount >= peekLimit
                ? `Nahlédnutí ✓ (${peekCount}/${peekLimit})`
                : `Nahlédnutí — 3 zás.${peekLimit > 1 ? ` (${peekCount}/${peekLimit})` : ''}`
            }
            hint={
              peekCount >= peekLimit
                ? hasSpy ? 'Oba sloty použity' : 'Použito v této bitvě'
                : sp < 3
                  ? 'Nedostatek zásob'
                  : hasSpy
                    ? 'Zobrazí soupeřovu ruku na 6 s (Špion dává 2 sloty)'
                    : 'Zobrazí soupeřovu ruku na 6 sekund'
            }
            onClick={buyPeek}
            enabled={canPeek}
          />

          {/* Scénářové / pre-battle unlocked akce (zdarma — už zaplaceny v Radě) */}
          {hasDevotion && (
            <SupplyButton
              label={devotionUsed ? 'Obětavost ✓ spálena' : '🔥 Obětavost legionářů'}
              hint={devotionUsed ? 'Použito v této bitvě' : 'Všechny tvé jednotky +1 útočná kostka po celé 1 kolo'}
              onClick={buyDevotion}
              enabled={canDevotion}
              variant="ultimate"
            />
          )}
          {hasBuriedArchers && state.scenarioId === 'dara' && (
            <SupplyButton
              label={buriedUsed ? 'Lukostřelci ✓ vystříleli' : '🏹 Pohřbení lukostřelci'}
              hint={buriedUsed ? 'Použito v této bitvě' : '+3 kostky pro další útok (1× za bitvu)'}
              onClick={buyBuriedArchers}
              enabled={canBuriedArchers}
              variant="scenario"
            />
          )}
          {hasGuerrilla && state.scenarioId === 'calabria' && (
            <SupplyButton
              label={guerrillaUsed ? 'Přepad ✓ proveden' : '🌲 Partyzánský přepad'}
              hint={guerrillaUsed ? 'Použito v této bitvě' : '+2 kostky pro další útok (1× za bitvu)'}
              onClick={buyGuerrilla}
              enabled={canGuerrilla}
              variant="scenario"
            />
          )}
          {hasSecretEnvoy && state.scenarioId === 'ravenna' && (
            <div className="text-[9px] text-emerald-300 italic pl-1 mt-0.5">
              Tajný posel: {secretEnvoyShownRef.current ? 'odhalení proběhlo' : 'odhalí soupeřovu ruku na startu'}
            </div>
          )}
        </div>
      </div>

      {/* Peek overlay: zobrazí soupeřovu ruku */}
      {peekingUntil !== null && (
        <div className="fixed inset-0 z-40 flex items-start justify-center pt-16 bg-black/40 pointer-events-none">
          <div className="bg-gray-900 border-2 border-amber-500 rounded-xl p-4 shadow-2xl max-w-xl pointer-events-auto">
            <div className="text-amber-300 font-bold text-sm mb-2 text-center">
              {hasSecretEnvoy && secretEnvoyShownRef.current && peekingUntil > Date.now() + 6500
                ? 'Tajný posel odhalil soupeře'
                : 'Nahlédnutí do soupeřovy ruky'}
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {state.tamerlaneHand.map(card => (
                <div
                  key={card.instanceId}
                  className="w-24 h-32 rounded-lg border-2 border-red-700 bg-red-950/40 p-2 text-xs text-red-200 flex flex-col justify-center items-center text-center"
                >
                  <div className="font-bold">{cardNameFromId(card.id)}</div>
                </div>
              ))}
              {state.tamerlaneHand.length === 0 && (
                <div className="text-gray-500 text-sm">Soupeř nemá karty v ruce</div>
              )}
            </div>
            <button
              onClick={() => setPeekingUntil(null)}
              className="mt-3 w-full py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-xs text-gray-200"
            >
              Zavřít nahlédnutí
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function SupplyButton({
  label,
  hint,
  onClick,
  enabled,
  variant = 'default',
}: {
  label: string;
  hint: string;
  onClick: () => void;
  enabled: boolean;
  variant?: 'default' | 'ultimate' | 'scenario';
}) {
  const bg =
    !enabled
      ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
      : variant === 'ultimate'
        ? 'bg-rose-700 hover:bg-rose-600 text-white'
        : variant === 'scenario'
          ? 'bg-purple-700 hover:bg-purple-600 text-white'
          : 'bg-amber-700 hover:bg-amber-600 text-white';
  return (
    <button
      onClick={onClick}
      disabled={!enabled}
      title={hint}
      className={`w-full px-2 py-1 rounded text-[10px] font-bold transition-colors text-left ${bg}`}
    >
      {label}
    </button>
  );
}

function cardNameFromId(id: string): string {
  const map: Record<string, string> = {
    scout_left: 'Průzkum L',
    scout_center: 'Průzkum S',
    scout_right: 'Průzkum P',
    skirmish_left: 'Šarvátka L',
    skirmish_center: 'Šarvátka S',
    skirmish_right: 'Šarvátka P',
    attack_left: 'Útok L',
    attack_center: 'Útok S',
    attack_right: 'Útok P',
    coordinated_advance: 'Koordinace',
    cavalry_charge: 'Jízdní zteč',
    direct_fire: 'Přímá palba',
    inspiring_commander: 'Inspirativní velitel',
    general_offensive: 'Generální ofenzíva',
    theodora_event: 'Theodora',
  };
  return map[id] ?? id;
}
