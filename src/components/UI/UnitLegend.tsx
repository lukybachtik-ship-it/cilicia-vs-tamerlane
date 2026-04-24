import { useState } from 'react';
import { UNIT_DEFINITIONS } from '../../constants/unitDefinitions';
import { UNIT_ICONS } from '../../constants/unitIcons';
import { useGame } from '../../state/GameContext';
import type { UnitType } from '../../types/unit';

const ICON_R = 16;
const ICON_SIZE = ICON_R * 2 + 4;
const SCALE = ICON_R / 19;

export function UnitLegend() {
  const { state } = useGame();
  const [open, setOpen] = useState(false);

  // Legenda je scénář-aware: ukazuje jen jednotky přítomné v aktuální bitvě
  // (jak mezi živými, tak mezi mrtvými — hráč vidí, s čím se potýkal).
  const unitTypesInScenario = Array.from(
    new Set([
      ...state.units.map(u => u.definitionType),
      ...state.destroyedUnits.map(u => u.definitionType),
    ])
  ) as UnitType[];

  // Seřaď je: cilicia unity nahoru, pak tamerlane; v každé skupině dle prvního
  // výskytu
  const factionByType = new Map<UnitType, 'cilicia' | 'tamerlane' | 'both'>();
  for (const u of [...state.units, ...state.destroyedUnits]) {
    const existing = factionByType.get(u.definitionType);
    if (existing === undefined) factionByType.set(u.definitionType, u.faction);
    else if (existing !== u.faction) factionByType.set(u.definitionType, 'both');
  }
  unitTypesInScenario.sort((a, b) => {
    const fa = factionByType.get(a) ?? 'both';
    const fb = factionByType.get(b) ?? 'both';
    if (fa === fb) return UNIT_DEFINITIONS[a].nameCs.localeCompare(UNIT_DEFINITIONS[b].nameCs, 'cs');
    if (fa === 'cilicia') return -1;
    if (fb === 'cilicia') return 1;
    return 0;
  });

  return (
    <div className="w-full max-w-3xl">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-1.5 rounded
                   bg-gray-800 hover:bg-gray-750 border border-gray-700
                   text-gray-400 hover:text-gray-200 text-xs font-semibold transition-colors"
        style={{ backgroundColor: open ? '#1f2937' : undefined }}
      >
        <span>Legenda jednotek ({unitTypesInScenario.length})</span>
        <span className="text-gray-500">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div
          className="mt-1 rounded border border-gray-700 p-3"
          style={{ backgroundColor: '#1a1f2e' }}
        >
          <div className="grid grid-cols-3 gap-x-4 gap-y-2 sm:grid-cols-5 lg:grid-cols-7">
            {unitTypesInScenario.map(type => {
              const def = UNIT_DEFINITIONS[type];
              const icon = UNIT_ICONS[type];
              const faction = factionByType.get(type) ?? 'both';
              const ringColor =
                faction === 'cilicia' ? '#3b82f6' :
                faction === 'tamerlane' ? '#ef4444' :
                '#a3a3a3';
              const bgColor =
                faction === 'cilicia' ? '#1e3a8a' :
                faction === 'tamerlane' ? '#7f1d1d' :
                '#404040';

              return (
                <div
                  key={type}
                  className="flex flex-col items-center gap-1"
                  title={`${def.nameCs} — Pohyb: ${def.move}, Útok: ${def.attack}, Dosah: ${def.rangeMin}${def.rangeMax > def.rangeMin ? `-${def.rangeMax}` : ''}, HP: ${def.maxHp}`}
                >
                  <svg
                    width={ICON_SIZE}
                    height={ICON_SIZE}
                    viewBox={`${-ICON_R - 2} ${-ICON_R - 2} ${ICON_SIZE} ${ICON_SIZE}`}
                  >
                    <circle
                      cx={0} cy={0}
                      r={ICON_R}
                      fill={bgColor}
                      stroke={ringColor}
                      strokeWidth="1.5"
                    />
                    <g transform={`scale(${SCALE})`} style={{ pointerEvents: 'none' }}>
                      {icon}
                    </g>
                  </svg>
                  <span className="text-gray-300 text-[9px] font-semibold text-center leading-tight">
                    {def.nameCs}
                  </span>
                  <div className="flex gap-1 text-[8px] text-gray-500">
                    <span title="Pohyb">◈{def.move}</span>
                    <span title="Útok">⚔{def.attack}</span>
                    {def.rangeMax > 1 && <span title="Dosah">⟶{def.rangeMax}</span>}
                    <span title="HP">♥{def.maxHp}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 pt-2 border-t border-gray-700 text-[9px] text-gray-500 leading-relaxed">
            <div>
              <span className="text-blue-400">● modrý kruh</span> = tvá strana,{' '}
              <span className="text-red-400">● červený</span> = soupeř,{' '}
              <span className="text-gray-400">● šedý</span> = obě strany
            </div>
            <div className="mt-0.5">
              Symboly: ◈ pohyb · ⚔ útočné kostky · ⟶ dostřel · ♥ HP (figurky)
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
