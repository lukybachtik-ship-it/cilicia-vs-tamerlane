import { useState, useEffect } from 'react';
import { useCampaign } from '../../state/CampaignContext';
import { useGame } from '../../state/GameContext';

/**
 * In-battle Supply panel — zobrazuje aktuální SP a umožňuje utrácet je
 * v průběhu bitvy. Zatím implementována jen akce "Nahlédnout do karet"
 * (Peek). Reroll a Posila přijdou v následujících iteracích.
 *
 * Komponenta se renderuje pouze v campaign módu (Game kontroluje).
 */
export function SupplyPanel() {
  const { campaign, dispatch } = useCampaign();
  const { state } = useGame();
  const [peekUsed, setPeekUsed] = useState(false);
  const [peekingUntil, setPeekingUntil] = useState<number | null>(null);

  // Reset peek availability when scenario changes (new battle)
  useEffect(() => {
    setPeekUsed(false);
    setPeekingUntil(null);
  }, [state.scenarioId, state.turnNumber === 1]);

  // Auto-hide peek overlay after 6 seconds
  useEffect(() => {
    if (peekingUntil === null) return;
    const t = setTimeout(() => setPeekingUntil(null), 6000);
    return () => clearTimeout(t);
  }, [peekingUntil]);

  if (!campaign) return null;

  const sp = campaign.supplyTokens;
  const canPeek = !peekUsed && sp >= 3 && state.currentPhase !== 'game_over';

  const buyPeek = () => {
    if (!canPeek) return;
    dispatch({
      type: 'ADD_PURCHASE',
      purchase: { id: 'in_battle_peek', costPaid: 3 },
    });
    setPeekUsed(true);
    setPeekingUntil(Date.now() + 6000);
  };

  return (
    <>
      {/* Supply HUD (spodní pravý roh) */}
      <div className="fixed bottom-2 right-2 z-30 bg-gray-900/95 border border-amber-700 rounded-lg p-2 shadow-xl">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-amber-300 font-bold">Zásoby:</span>
          <span className="text-emerald-300 font-bold text-base">{sp}</span>
          <span className="text-gray-500 text-[10px]">/ 10</span>
        </div>
        <button
          onClick={buyPeek}
          disabled={!canPeek}
          title={
            peekUsed
              ? 'Peek již použito v této bitvě'
              : sp < 3
                ? 'Nedostatek Supply tokenů (potřeba 3)'
                : 'Zobrazí soupeřovu ruku na 6 sekund'
          }
          className={`mt-1.5 w-full px-2 py-1 rounded text-[10px] font-bold transition-colors ${
            canPeek
              ? 'bg-amber-700 hover:bg-amber-600 text-white'
              : 'bg-gray-800 text-gray-600 cursor-not-allowed'
          }`}
        >
          {peekUsed ? 'Peek ✓ použito' : `Nahlédnout do karet (3 SP)`}
        </button>
        <div className="mt-1 text-[9px] text-gray-500 italic leading-tight">
          Reroll a posila — další iterace
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
