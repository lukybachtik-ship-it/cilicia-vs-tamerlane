import { useState, useEffect } from 'react';
import { useCampaign } from '../../state/CampaignContext';
import { useGame } from '../../state/GameContext';

/**
 * In-battle Supply panel — zobrazuje aktuální SP a umožňuje utrácet je
 * v průběhu bitvy: Peek (3 SP), Bonus kostka (1 SP), Posila (2 SP).
 * Každá akce 1× za bitvu.
 */
export function SupplyPanel() {
  const { campaign, dispatch: campaignDispatch } = useCampaign();
  const { state, dispatch: gameDispatch } = useGame();
  const [peekUsed, setPeekUsed] = useState(false);
  const [bonusUsed, setBonusUsed] = useState(false);
  const [reinfUsed, setReinfUsed] = useState(false);
  const [peekingUntil, setPeekingUntil] = useState<number | null>(null);

  // Reset action availability on new battle (turn 1)
  useEffect(() => {
    if (state.turnNumber === 1 && state.currentPhase === 'play_card') {
      setPeekUsed(false);
      setBonusUsed(false);
      setReinfUsed(false);
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
  const canPeek = !peekUsed && sp >= 3 && !gameOver;
  const canBonus = !bonusUsed && sp >= 1 && !gameOver;
  const canReinf = !reinfUsed && sp >= 2 && !gameOver;

  const buyPeek = () => {
    if (!canPeek) return;
    campaignDispatch({ type: 'ADD_PURCHASE', purchase: { id: 'in_battle_peek', costPaid: 3 } });
    setPeekUsed(true);
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

  return (
    <>
      {/* Supply HUD (spodní pravý roh) */}
      <div className="fixed bottom-2 right-2 z-30 bg-gray-900/95 border border-amber-700 rounded-lg p-2 shadow-xl max-w-[200px]">
        <div className="flex items-center gap-2 text-xs mb-1.5">
          <span className="text-amber-300 font-bold">Zásoby:</span>
          <span className="text-emerald-300 font-bold text-base">{sp}</span>
          <span className="text-gray-500 text-[10px]">/ 10</span>
        </div>
        <div className="flex flex-col gap-1">
          <SupplyButton
            label={bonusUsed ? 'Bonus ✓ použito' : 'Bonus kostka (1 SP)'}
            hint={
              bonusUsed
                ? 'Použito v této bitvě'
                : sp < 1
                  ? 'Nedostatek SP'
                  : '+1 útočná kostka pro jednu příští akci'
            }
            onClick={buyBonus}
            enabled={canBonus}
          />
          <SupplyButton
            label={reinfUsed ? 'Posila ✓ použita' : 'Posila (2 SP)'}
            hint={
              reinfUsed
                ? 'Použito v této bitvě'
                : sp < 2
                  ? 'Nedostatek SP'
                  : 'Přivolej lehkou pěchotu do domovské řady'
            }
            onClick={buyReinf}
            enabled={canReinf}
          />
          <SupplyButton
            label={peekUsed ? 'Peek ✓ použito' : 'Nahlédnutí (3 SP)'}
            hint={
              peekUsed
                ? 'Použito v této bitvě'
                : sp < 3
                  ? 'Nedostatek SP'
                  : 'Zobrazí soupeřovu ruku na 6 sekund'
            }
            onClick={buyPeek}
            enabled={canPeek}
          />
        </div>
      </div>

      {/* Peek overlay: zobrazí soupeřovu ruku */}
      {peekingUntil !== null && (
        <div className="fixed inset-0 z-40 flex items-start justify-center pt-16 bg-black/40 pointer-events-none">
          <div className="bg-gray-900 border-2 border-amber-500 rounded-xl p-4 shadow-2xl max-w-xl pointer-events-auto">
            <div className="text-amber-300 font-bold text-sm mb-2 text-center">
              Nahlédnutí do soupeřovy ruky
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
}: {
  label: string;
  hint: string;
  onClick: () => void;
  enabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!enabled}
      title={hint}
      className={`w-full px-2 py-1 rounded text-[10px] font-bold transition-colors text-left ${
        enabled
          ? 'bg-amber-700 hover:bg-amber-600 text-white'
          : 'bg-gray-800 text-gray-600 cursor-not-allowed'
      }`}
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
