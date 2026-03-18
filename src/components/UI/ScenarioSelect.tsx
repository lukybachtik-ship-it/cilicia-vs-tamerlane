import { useState } from 'react';
import { useGame } from '../../state/GameContext';
import { ALL_SCENARIOS } from '../../constants/scenarios';
import { RulesModal } from './RulesModal';

const SCENARIO_ICONS: Record<string, string> = {
  standard:     '⚔️',
  ankara:       '🏇',
  breakthrough: '🏰',
};

type Tab = 'scenarios' | 'howto';

export function ScenarioSelect() {
  const { dispatch } = useGame();
  const [tab, setTab] = useState<Tab>('scenarios');
  const [rulesOpen, setRulesOpen] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #0d1117 0%, #161b22 50%, #0d1117 100%)' }}
    >
      {/* Background texture */}
      <div className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)',
          backgroundSize: '20px 20px',
        }}
      />

      <div className="relative w-full max-w-3xl mx-4 flex flex-col max-h-screen py-6">
        {/* Title */}
        <div className="text-center mb-5 flex-shrink-0">
          <h1 className="text-4xl font-bold text-white mb-1 tracking-wide">
            ⚔ <span className="text-blue-400">Kilikie</span>
            <span className="text-gray-500 text-2xl mx-3">vs</span>
            <span className="text-red-400">Tamerlán</span>
          </h1>
          <p className="text-gray-500 text-sm">Taktická tahová válečná hra</p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-1 mb-4 flex-shrink-0">
          {([
            { id: 'scenarios', label: '⚔️ Scénáře' },
            { id: 'howto',     label: '📖 Jak hrát' },
          ] as { id: Tab; label: string }[]).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                tab === t.id
                  ? 'bg-blue-700 text-white shadow-lg'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Scenarios tab ── */}
        {tab === 'scenarios' && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 overflow-y-auto">
            {ALL_SCENARIOS.map(scenario => (
              <button
                key={scenario.id}
                onClick={() => dispatch({ type: 'RESTART_GAME', scenarioId: scenario.id })}
                className="group relative flex flex-col gap-3 p-5 rounded-2xl border transition-all duration-200 text-left
                           border-gray-700 bg-gray-900 hover:border-blue-500 hover:bg-gray-800
                           hover:shadow-[0_0_24px_rgba(59,130,246,0.2)]"
              >
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{SCENARIO_ICONS[scenario.id] ?? '🗡'}</span>
                  <div>
                    <div className="text-white font-bold text-base leading-tight">{scenario.nameCs}</div>
                    <div className="text-xs mt-0.5">{scenario.difficultyCs}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {scenario.tags.map(tag => (
                    <span key={tag}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 border border-gray-700 text-gray-400">
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-gray-400 text-xs leading-relaxed">{scenario.descriptionCs}</p>
                <p className="text-gray-600 text-[10px] italic leading-relaxed border-t border-gray-800 pt-2">
                  {scenario.flavourCs}
                </p>
                <div className="flex justify-between text-[10px] text-gray-500">
                  <span>🔵 {scenario.ciliciaLabel}: {scenario.ciliciaUnits.length} j.</span>
                  <span>🔴 {scenario.tamerlaneLabel}: {scenario.tamerlaneUnits.length} j.</span>
                </div>
                <div className="mt-1 w-full text-center py-2 rounded-lg text-sm font-bold
                                bg-gray-800 group-hover:bg-blue-600 text-gray-400 group-hover:text-white
                                border border-gray-700 group-hover:border-blue-500 transition-all duration-200">
                  Hrát tento scénář →
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── How to play tab ── */}
        {tab === 'howto' && (
          <div className="overflow-y-auto flex-1 rounded-2xl border border-gray-700 bg-gray-900 p-6 space-y-6 text-sm">

            {/* Quick overview */}
            <section>
              <h2 className="text-yellow-300 font-bold text-base mb-2">🎯 Cíl hry</h2>
              <p className="text-gray-300 leading-relaxed">
                Dvě strany — <span className="text-blue-400 font-semibold">Kilikie</span> a{' '}
                <span className="text-red-400 font-semibold">Tamerlán</span> — bojují na hexagonální mapě.
                Hraješ karty, aktivuješ jednotky, pohybuješ s nimi a útočíš na nepřátele.
                Vyhraj splněním podmínek scénáře (zlikviduj dost nepřátel nebo splň cíl).
              </p>
            </section>

            {/* Turn structure */}
            <section>
              <h2 className="text-yellow-300 font-bold text-base mb-3">🔄 Průběh tahu</h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { icon: '🃏', num: '1', title: 'Zahraj kartu', desc: 'Zvol kartu z ruky. Karta určí, které jednotky a kolik jich můžeš aktivovat.' },
                  { icon: '⚡', num: '2', title: 'Aktivuj jednotky', desc: 'Klikni na žlutě označené jednotky (max. dle karty), pak "Potvrdit".' },
                  { icon: '🚶', num: '3', title: 'Pohyb', desc: 'Každá aktivovaná jednotka se může pohnout o svůj pohyb (hexů).' },
                  { icon: '⚔️', num: '4', title: 'Útok', desc: 'Zaútoč na sousední nebo vzdálené nepřátele. Pak ukonči tah.' },
                ].map(step => (
                  <div key={step.num} className="bg-gray-800 rounded-xl p-3 flex flex-col gap-1">
                    <div className="text-2xl">{step.icon}</div>
                    <div className="text-yellow-300 font-bold text-xs">{step.num}. {step.title}</div>
                    <div className="text-gray-400 text-[10px] leading-relaxed">{step.desc}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Cards */}
            <section>
              <h2 className="text-yellow-300 font-bold text-base mb-2">🃏 Karty</h2>
              <div className="space-y-1.5 text-gray-300 text-xs">
                <div className="flex gap-2 items-start">
                  <span className="text-orange-400 font-bold w-16 shrink-0">Levé/Střed/Pravé</span>
                  <span>Poziční karty aktivují jednotky v dané části hřiště. Sleduj barevné zóny nahoře na desce.</span>
                </div>
                <div className="flex gap-2 items-start">
                  <span className="text-amber-300 font-bold w-16 shrink-0">Taktické</span>
                  <span>Aktivují určitý typ jednotek kdekoliv (jezdectvo, střelci) nebo celou sekci najednou (Generální ofenzíva).</span>
                </div>
                <div className="flex gap-2 items-start">
                  <span className="text-blue-300 font-bold w-16 shrink-0">Průzkum</span>
                  <span>Speciální karta: dobereš 2 karty, jednu si ponecháš (výběr), druhou zahodíš.</span>
                </div>
              </div>
            </section>

            {/* Combat */}
            <section>
              <h2 className="text-yellow-300 font-bold text-base mb-2">⚔️ Boj — kostky</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="text-blue-300 font-bold text-xs mb-2">vs. Lehká jednotka</div>
                  <div className="flex flex-wrap gap-1 text-xs">
                    <span className="w-6 h-6 flex items-center justify-center bg-green-700 rounded font-bold">1</span>
                    <span className="w-6 h-6 flex items-center justify-center bg-green-700 rounded font-bold">2</span>
                    <span className="w-6 h-6 flex items-center justify-center bg-green-700 rounded font-bold">6</span>
                    <span className="text-gray-400 self-center">= Zásah</span>
                  </div>
                  <div className="flex gap-1 mt-1 text-xs">
                    <span className="w-6 h-6 flex items-center justify-center bg-orange-600 rounded font-bold">5</span>
                    <span className="text-gray-400 self-center">= Ústup</span>
                  </div>
                  <div className="text-gray-500 text-[10px] mt-1">3, 4 = bez efektu</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="text-red-300 font-bold text-xs mb-2">vs. Těžká jednotka</div>
                  <div className="flex flex-wrap gap-1 text-xs">
                    <span className="w-6 h-6 flex items-center justify-center bg-green-700 rounded font-bold">3</span>
                    <span className="w-6 h-6 flex items-center justify-center bg-green-700 rounded font-bold">4</span>
                    <span className="w-6 h-6 flex items-center justify-center bg-green-700 rounded font-bold">6</span>
                    <span className="text-gray-400 self-center">= Zásah</span>
                  </div>
                  <div className="flex gap-1 mt-1 text-xs">
                    <span className="w-6 h-6 flex items-center justify-center bg-orange-600 rounded font-bold">5</span>
                    <span className="text-gray-400 self-center">= Ústup</span>
                  </div>
                  <div className="text-gray-500 text-[10px] mt-1">1, 2 = bez efektu</div>
                </div>
              </div>
              <p className="text-gray-500 text-[10px] mt-2">
                Po každém útoku přeživší obránce automaticky vrátí protiútok. Terén (kopec, pevnost) dává obránci −1 kostku útočníkovi.
              </p>
            </section>

            {/* Terrain */}
            <section>
              <h2 className="text-yellow-300 font-bold text-base mb-2">🗺️ Terén</h2>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { icon: '🌲', name: 'Les', desc: 'Stop pohybu. Obránce: −1 kostka útočníkovi.' },
                  { icon: '⛰', name: 'Kopec', desc: 'Stop pohybu. Obránce: −1 kostka útočníkovi + bonus protiútoku.' },
                  { icon: '🏰', name: 'Pevnost', desc: 'Stop pohybu, jen pěchota. Obránce: −1 kostka + ignoruje první ústup.' },
                  { icon: '👁', name: 'Zvěd', desc: 'Speciální: ignoruje terénní zastavení (projde lesem i pevností).' },
                ].map(t => (
                  <div key={t.name} className="bg-gray-800 rounded-lg p-2.5 flex gap-2">
                    <span className="text-xl shrink-0">{t.icon}</span>
                    <div>
                      <div className="font-bold text-gray-200">{t.name}</div>
                      <div className="text-gray-400 text-[10px] leading-tight mt-0.5">{t.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Special unit abilities */}
            <section>
              <h2 className="text-yellow-300 font-bold text-base mb-2">⭐ Speciální schopnosti jednotek</h2>
              <div className="space-y-1 text-xs text-gray-300">
                <div><span className="text-green-300 font-semibold">Hit & Run (Lehká jízda):</span> Po útoku se automaticky stáhne 1 hex zpět.</div>
                <div><span className="text-green-300 font-semibold">Průlom (Těžká jízda):</span> Po zničení nepřítele postoupí na jeho místo.</div>
                <div><span className="text-green-300 font-semibold">Parthský výpad (Jízdní lučištník):</span> Pohyb → útok → pohyb (bez penalizace za pohyb).</div>
                <div><span className="text-green-300 font-semibold">Obléhací stroj:</span> +2 kostky útoku vs. pevnost, ale pomalý (pohyb 1).</div>
                <div><span className="text-green-300 font-semibold">Elitní garda:</span> 5 kostek útoku — nejsilnější pěchotní jednotka.</div>
              </div>
            </section>

            {/* Victory */}
            <section>
              <h2 className="text-yellow-300 font-bold text-base mb-2">🏆 Jak vyhrát</h2>
              <p className="text-gray-300 text-xs leading-relaxed mb-2">
                Každý scénář má jiné podmínky vítězství (popsané v kartičce scénáře a na pravém panelu během hry):
              </p>
              <ul className="space-y-1 text-gray-400 text-xs list-disc list-inside">
                <li><span className="text-white">Zničení jednotek</span> — eliminuj daný počet nepřátelských jednotek.</li>
                <li><span className="text-white">Obsazení pevnosti</span> — postav svou pěchotu na cílový hexagon pevnosti.</li>
                <li><span className="text-white">Přežití do limitu</span> — vydržte útok do konce posledního tahu.</li>
                <li><span className="text-white">Obklíčení</span> — dostaň jezdce za nepřátelské linie (u Ankary).</li>
              </ul>
            </section>

            {/* Link to full rules */}
            <div className="border-t border-gray-700 pt-4 text-center">
              <p className="text-gray-500 text-xs mb-2">Chceš detailní pravidla se všemi kartami a jednotkami?</p>
              <button
                onClick={() => setRulesOpen(true)}
                className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 text-xs transition-colors"
              >
                📖 Otevřít plná pravidla
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-gray-700 text-xs mt-4 flex-shrink-0">
          Command &amp; Colors inspired · Hex-based tactics · Czech UI
        </p>
      </div>

      {rulesOpen && <RulesModal onClose={() => setRulesOpen(false)} />}
    </div>
  );
}
