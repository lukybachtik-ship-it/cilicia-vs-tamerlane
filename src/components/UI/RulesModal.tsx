import { useState } from 'react';
import { UNIT_DEFINITIONS } from '../../constants/unitDefinitions';
import { CARD_DEFINITIONS } from '../../constants/cardDefinitions';

type TabId = 'dice' | 'units' | 'cards' | 'terrain';

const TABS: { id: TabId; label: string }[] = [
  { id: 'dice',    label: 'Kostky & Boj' },
  { id: 'units',   label: 'Jednotky' },
  { id: 'cards',   label: 'Karty' },
  { id: 'terrain', label: 'Terén & Vítězství' },
];

// ── Tab: Dice & Combat ────────────────────────────────────────────────────────
function DiceTab() {
  return (
    <div className="flex flex-col gap-4 text-sm">
      <section>
        <h3 className="text-yellow-300 font-bold mb-2">Výsledky hodu kostkou</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-700 rounded p-3">
            <div className="text-blue-300 font-bold mb-1">Lehká jednotka (obranca)</div>
            <div className="flex gap-1 mb-1">
              {[1, 2, 6].map(v => (
                <span key={v} className="w-6 h-6 flex items-center justify-center bg-green-600 rounded text-xs font-bold">{v}</span>
              ))}
              <span className="text-gray-400 text-xs self-center ml-1">= Zásah</span>
            </div>
            <div className="flex gap-1 mb-1">
              {[3, 4].map(v => (
                <span key={v} className="w-6 h-6 flex items-center justify-center bg-gray-600 rounded text-xs font-bold">{v}</span>
              ))}
              <span className="text-gray-400 text-xs self-center ml-1">= Bez efektu</span>
            </div>
            <div className="flex gap-1">
              <span className="w-6 h-6 flex items-center justify-center bg-orange-500 rounded text-xs font-bold">5</span>
              <span className="text-gray-400 text-xs self-center ml-1">= Ústup</span>
            </div>
          </div>
          <div className="bg-gray-700 rounded p-3">
            <div className="text-red-300 font-bold mb-1">Těžká jednotka (obranca)</div>
            <div className="flex gap-1 mb-1">
              {[3, 4, 6].map(v => (
                <span key={v} className="w-6 h-6 flex items-center justify-center bg-green-600 rounded text-xs font-bold">{v}</span>
              ))}
              <span className="text-gray-400 text-xs self-center ml-1">= Zásah</span>
            </div>
            <div className="flex gap-1 mb-1">
              {[1, 2].map(v => (
                <span key={v} className="w-6 h-6 flex items-center justify-center bg-gray-600 rounded text-xs font-bold">{v}</span>
              ))}
              <span className="text-gray-400 text-xs self-center ml-1">= Bez efektu</span>
            </div>
            <div className="flex gap-1">
              <span className="w-6 h-6 flex items-center justify-center bg-orange-500 rounded text-xs font-bold">5</span>
              <span className="text-gray-400 text-xs self-center ml-1">= Ústup</span>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-yellow-300 font-bold mb-2">Průběh souboje</h3>
        <ol className="list-decimal list-inside space-y-1 text-gray-300 text-xs">
          <li>Útočník hází <span className="text-white">Útok</span> + bonusy kostek.</li>
          <li>Penalizace: pohyb lukostřelce (jen 1 kostka), přímý souboj střelce (−1 kostka), terén obrancy (les/kopec/pevnost: −1 kostka útočníka).</li>
          <li>Výsledky se vyhodnotí podle třídy obrany.</li>
          <li>Obranca provede <span className="text-purple-300">protiútok</span> (pokud přežil).</li>
          <li>Kilikie: pevnost/kopec obrancovi dává +1 kostka protiútoku.</li>
        </ol>
      </section>

      <section>
        <h3 className="text-yellow-300 font-bold mb-2">Ústup & Zásah</h3>
        <ul className="space-y-1 text-gray-300 text-xs list-disc list-inside">
          <li>1+ zásah → obranca ztratí 1 HP (nebo se stáhne, pokud HP sníží na 0).</li>
          <li>Pevnost ignoruje první ústup (blokuje ho) a převede ho na zásah.</li>
          <li>Ústup: jednotka se posune 1 hex k vlastnímu kraji.</li>
          <li>Zničení: HP dosáhne 0 → jednotka odstraněna z hry.</li>
        </ul>
      </section>
    </div>
  );
}

// ── Tab: Units ────────────────────────────────────────────────────────────────
function UnitsTab() {
  const units = Object.values(UNIT_DEFINITIONS);

  function specials(u: (typeof units)[0]): string {
    const s: string[] = [];
    if (u.hitAndRun)           s.push('Hit & Run (volný ústup po útoku)');
    if (u.breakthrough)        s.push('Průlom (postup na místo po zabití)');
    if (u.parthianShot)        s.push('Parthský výstřel (pohyb→útok→pohyb)');
    if (u.reducedMeleeDefense) s.push('−1 kostka v protiútoku v přímém boji');
    if (u.movedAttackPenalty)  s.push('Pohyb → jen 1 kostka útoku');
    if (u.meleeAttackPenalty)  s.push('−1 kostka při útoku z bezprostřední blízkosti');
    return s.join('; ') || '—';
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="text-gray-400 border-b border-gray-600">
            <th className="text-left py-1 pr-2">Jednotka</th>
            <th className="text-center px-1">Poh.</th>
            <th className="text-center px-1">Útok</th>
            <th className="text-center px-1">Dosah</th>
            <th className="text-center px-1">Třída</th>
            <th className="text-left pl-2">Speciální</th>
          </tr>
        </thead>
        <tbody>
          {units.map(u => (
            <tr key={u.type} className="border-b border-gray-700 hover:bg-gray-700">
              <td className="py-1 pr-2 font-medium text-white">{u.nameCs}</td>
              <td className="text-center px-1 text-green-300">{u.move}</td>
              <td className="text-center px-1 text-red-300">{u.attack}</td>
              <td className="text-center px-1 text-blue-300">{u.rangeMin}–{u.rangeMax}</td>
              <td className="text-center px-1 text-gray-300">
                {u.unitClass === 'light' ? '⬡ L' : '⬡ T'}
              </td>
              <td className="pl-2 text-gray-400 text-[10px]">{specials(u)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Tab: Cards ────────────────────────────────────────────────────────────────
function CardsTab() {
  const cards = Object.values(CARD_DEFINITIONS);
  const positional = cards.filter(c => c.category === 'positional');
  const tactical = cards.filter(c => c.category === 'tactical');

  const sectionLabel: Record<string, string> = {
    left: 'Levé', center: 'Střed', right: 'Pravé', any: 'Libovolné',
  };

  function CardGroup({ title, list, color }: { title: string; list: typeof cards; color: string }) {
    return (
      <div className="mb-4">
        <h3 className={`font-bold mb-2 ${color}`}>{title}</h3>
        <div className="space-y-1.5">
          {list.map(c => (
            <div key={c.id} className="bg-gray-700 rounded p-2">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-white text-xs font-bold">{c.nameCs}</span>
                <span className="text-gray-400 text-[10px]">
                  {sectionLabel[c.section]} · max {c.maxActivations === 99 ? '∞' : c.maxActivations}
                </span>
              </div>
              <div className="text-gray-400 text-[10px]">{c.description}</div>
              {(c.moveBonus > 0 || c.attackBonus > 0) && (
                <div className="text-yellow-400 text-[10px] mt-0.5">
                  {c.moveBonus > 0 && `+${c.moveBonus} pohyb  `}
                  {c.attackBonus > 0 && `+${c.attackBonus} útok`}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <CardGroup title="Poziční karty (9)" list={positional} color="text-blue-300" />
      <CardGroup title="Taktické karty (5)" list={tactical} color="text-amber-300" />
    </div>
  );
}

// ── Tab: Terrain & Victory ────────────────────────────────────────────────────
function TerrainTab() {
  const terrains = [
    {
      icon: '⬡', name: 'Rovina', color: 'text-gray-300',
      desc: 'Bez efektu na pohyb ani obranu.',
    },
    {
      icon: '🌲', name: 'Les', color: 'text-green-400',
      desc: 'Pohyb se zastaví při vstupu. Blokuje výhled (nelze střílet skrz). Obranca: +1 obrana.',
    },
    {
      icon: '⛰', name: 'Kopec', color: 'text-yellow-600',
      desc: 'Pohyb se zastaví při vstupu. Výšková výhoda blokuje výhled pro jednotky níže. Obranca na kopci: +1 obrana. Kilikie protiútok +1 kostka z kopce.',
    },
    {
      icon: '🏰', name: 'Pevnost', color: 'text-gray-400',
      desc: 'Jízda sem nemůže vstoupit. Pohyb se zastaví. Blokuje výhled. Obranca: +1 obrana a ignoruje první ústup (přemění ho na zásah). Kilikie protiútok +1 kostka z pevnosti.',
    },
  ];

  return (
    <div className="flex flex-col gap-4 text-sm">
      <section>
        <h3 className="text-yellow-300 font-bold mb-2">Typy terénu</h3>
        <div className="space-y-2">
          {terrains.map(t => (
            <div key={t.name} className="bg-gray-700 rounded p-2.5 flex gap-3">
              <span className="text-2xl">{t.icon}</span>
              <div>
                <div className={`font-bold text-xs ${t.color}`}>{t.name}</div>
                <div className="text-gray-400 text-xs mt-0.5">{t.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-yellow-300 font-bold mb-2">Vítězné podmínky</h3>
        <div className="space-y-2">
          <div className="bg-gray-700 rounded p-2.5">
            <div className="text-white font-bold text-xs mb-1">🏆 Standardní vítězství</div>
            <div className="text-gray-400 text-xs">
              Hráč, který jako první zničí <span className="text-red-400 font-bold">5 nepřátelských jednotek</span>, vítězí.
            </div>
          </div>
          <div className="bg-gray-700 rounded p-2.5">
            <div className="text-red-400 font-bold text-xs mb-1">🏰 Tamerlánovo zvláštní vítězství</div>
            <div className="text-gray-400 text-xs">
              Pokud Tamerlánova pěchota (lehká nebo těžká) stojí na <span className="text-gray-300">pevnosti</span> na konci kola, Tamerlán vítězí okamžitě.
            </div>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-yellow-300 font-bold mb-2">Průběh tahu</h3>
        <ol className="list-decimal list-inside space-y-1 text-gray-300 text-xs">
          <li><span className="text-yellow-300">Zahraj kartu</span> ze své ruky.</li>
          <li><span className="text-yellow-300">Aktivuj jednotky</span> podle pravidel karty, pak potvrď.</li>
          <li><span className="text-yellow-300">Pohyb</span> — vyber aktivovanou jednotku a klikni na zelené hexagony.</li>
          <li><span className="text-yellow-300">Útok</span> — klikni na nepřítele označeného červeně.</li>
          <li><span className="text-yellow-300">Konec tahu</span> → přejde na soupeře.</li>
        </ol>
      </section>
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export function RulesModal({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<TabId>('dice');

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-600 rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-white font-bold text-base">📖 Pravidla hry</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-lg w-7 h-7 flex items-center justify-center rounded hover:bg-gray-700 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 flex-shrink-0 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-yellow-400 text-yellow-300 bg-gray-800'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1">
          {activeTab === 'dice'    && <DiceTab />}
          {activeTab === 'units'   && <UnitsTab />}
          {activeTab === 'cards'   && <CardsTab />}
          {activeTab === 'terrain' && <TerrainTab />}
        </div>
      </div>
    </div>
  );
}
