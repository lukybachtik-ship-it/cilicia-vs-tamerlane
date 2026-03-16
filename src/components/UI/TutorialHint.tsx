import { useState } from 'react';
import { useGame } from '../../state/GameContext';
import { UNIT_DEFINITIONS } from '../../constants/unitDefinitions';

interface HintContent {
  icon: string;
  title: string;
  body: string;
  tip?: string;
}

const PHASE_HINTS: Record<string, HintContent> = {
  play_card: {
    icon: '🃏',
    title: 'Zahraj kartu',
    body: 'Každá karta aktivuje konkrétní sekci nebo typ jednotky. Pozice karty na poli (levé/střed/pravé křídlo) určuje, které jednotky lze aktivovat.',
    tip: 'Tip: Průzkum (Scout) dovolí zahrát o kartu navíc příští tah!',
  },
  activate_units: {
    icon: '✨',
    title: 'Aktivuj jednotky',
    body: 'Žlutě zvýrazněné jednotky lze aktivovat. Maximální počet závisí na zahrané kartě. Poté potvrzení aktivace spustí fázi pohybu.',
    tip: 'Aktivované jednotky mohou pohybovat se a útočit. Neaktivované zůstávají stát.',
  },
  move: {
    icon: '🚶',
    title: 'Pohybuj se',
    body: 'Klikni na aktivovanou jednotku → zelená pole ukazují dosah pohybu. Jezdectvo se pohybuje rychleji. Lesy a pevnosti zastavují pohyb.',
    tip: 'Tip: Přesunutí lučištníka sníží jeho útok na 1 kostku! Střílej dřív, hýbej potom (Partyzánský výpad).',
  },
  attack: {
    icon: '⚔️',
    title: 'Útok',
    body: 'Klikni na aktivovanou jednotku → červená pole ukazují cíle útoku. Počet kostek závisí na útoku jednotky a terénu.',
    tip: 'Tip: Lehké jednotky jsou zranitelné (hity na 1, 2, 6). Těžké jsou odolnější (hity pouze na 3, 4, 6). Výsledek 5 = ústup.',
  },
  select_section: {
    icon: '🗺️',
    title: 'Generální ofenzíva',
    body: 'Vyber sekci, kde chceš zaútočit. Všechny tvé jednotky v dané sekci se aktivují a mohou se pohnout a zaútočit (pohyb omezen na 1 pole).',
    tip: 'Nejsilnější karta — koordinuje celé křídlo najednou!',
  },
  discard_drawn: {
    icon: '🔍',
    title: 'Průzkum: vyber kartu',
    body: 'Lízl jsi 2 karty — jednu ponechej, druhou zahoď. Poté aktivuj jednotku dle původně zahrané karty.',
    tip: 'Vyhodni co protivník nemá a co ty budeš potřebovat.',
  },
};

const UNIT_TIPS: Record<string, string> = {
  light_infantry:  '🗡 LP: Pohyb 2, útok 2. Rychlá a levná pěchota. Hit-and-run taktiky.',
  heavy_infantry:  '🛡 TP: Pohyb 1, útok 4. Pomalá, ale devastující. Postav ji na kopec nebo pevnost!',
  archers:         '🏹 ST: Dosah 1–3. NEHÝBEJ před střelbou (penalizace). Výborná za hradbami.',
  light_cavalry:   '⚡ LJ: Pohyb 3, útok 2. Hit-and-run: po útoku se automaticky stáhne 1 hex zpět.',
  heavy_cavalry:   '⚔ TJ: Pohyb 2, útok 3. Průlom: po zabití/ústupu nepřítele se přesouvá na uvolněné místo!',
  horse_archers:   '🏇 JL: Pohyb 3, dosah 1–2. Partyzánský výpad: pohyb → útok → pohyb. Velmi mobilní.',
};

export function TutorialHint() {
  const { state } = useGame();
  const [dismissed, setDismissed] = useState(false);
  const [unitTipDismissed, setUnitTipDismissed] = useState<string | null>(null);

  // Hide after turn 4 or when dismissed
  const showPhaseHint = !dismissed && state.turnNumber <= 4;
  const hint = PHASE_HINTS[state.currentPhase];

  // Unit tip — shown when a unit is selected
  const selectedUnit = state.selectedUnitId
    ? state.units.find(u => u.id === state.selectedUnitId)
    : null;
  const unitTip = selectedUnit ? UNIT_TIPS[selectedUnit.definitionType] : null;
  const showUnitTip = !!unitTip && unitTipDismissed !== selectedUnit?.id;

  if (!showPhaseHint && !showUnitTip) return null;

  return (
    <div className="flex flex-col gap-2 w-full max-w-2xl">
      {/* Phase tutorial hint */}
      {showPhaseHint && hint && (
        <div className="relative flex gap-3 px-3 py-2.5 rounded-xl border border-yellow-800/50 bg-yellow-950/40 text-left">
          <span className="text-xl flex-shrink-0 mt-0.5">{hint.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="text-yellow-300 text-xs font-bold">{hint.title}</div>
            <div className="text-gray-300 text-[10px] leading-relaxed mt-0.5">{hint.body}</div>
            {hint.tip && (
              <div className="text-yellow-500/80 text-[10px] italic mt-1">{hint.tip}</div>
            )}
            <div className="text-gray-600 text-[9px] mt-1">Nápověda zmizí po 4. tahu</div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-1.5 right-2 text-gray-600 hover:text-gray-400 text-xs leading-none"
            title="Skrýt nápovědu"
          >
            ✕
          </button>
        </div>
      )}

      {/* Selected unit tip */}
      {showUnitTip && selectedUnit && (
        <div className="relative flex gap-2 px-3 py-2 rounded-lg border border-blue-900/60 bg-blue-950/30 text-left">
          <div className="flex-1 min-w-0">
            <div className="text-blue-300 text-[10px] font-bold">
              {UNIT_DEFINITIONS[selectedUnit.definitionType].nameCs}
            </div>
            <div className="text-gray-400 text-[10px] leading-relaxed mt-0.5">{unitTip}</div>
          </div>
          <button
            onClick={() => setUnitTipDismissed(selectedUnit.id)}
            className="absolute top-1.5 right-2 text-gray-600 hover:text-gray-400 text-xs leading-none"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
