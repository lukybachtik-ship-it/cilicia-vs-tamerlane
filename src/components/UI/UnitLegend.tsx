import { useState } from 'react';
import { UNIT_DEFINITIONS } from '../../constants/unitDefinitions';
import { UNIT_ICONS, UNIT_FRAMES, UNIT_FRAME_COLORS, getIconCategory } from '../../constants/unitIcons';
import { IconStatMove, IconStatDice, IconStatRange, IconStatHp } from '../../constants/uiIcons';
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
              const category = getIconCategory(type);
              const frame = UNIT_FRAMES[category];
              const isHeavy = def.unitClass === 'heavy';
              const ringColor =
                faction === 'cilicia' ? UNIT_FRAME_COLORS.cilicia.stroke :
                faction === 'tamerlane' ? UNIT_FRAME_COLORS.tamerlane.stroke :
                '#a3a3a3';
              const bgColor =
                faction === 'cilicia'
                  ? (isHeavy ? UNIT_FRAME_COLORS.cilicia.heavy : UNIT_FRAME_COLORS.cilicia.light)
                  : faction === 'tamerlane'
                    ? (isHeavy ? UNIT_FRAME_COLORS.tamerlane.heavy : UNIT_FRAME_COLORS.tamerlane.light)
                    : '#404040';

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
                    <g transform={`scale(${SCALE})`}>
                      <path d={frame.d} fill={bgColor} stroke={ringColor} strokeWidth={2} strokeLinejoin="round" />
                      {isHeavy && (
                        <path d={frame.inner} fill="none" stroke={ringColor} strokeWidth={1.3} opacity={0.7} />
                      )}
                      <g transform="translate(0,-1.5) scale(0.82)" style={{ pointerEvents: 'none' }}>
                        {icon}
                      </g>
                    </g>
                  </svg>
                  <span className="text-gray-300 text-[9px] font-semibold text-center leading-tight">
                    {def.nameCs}
                  </span>
                  <div className="flex gap-1.5 text-[8px] text-gray-500 items-center">
                    <span title="Pohyb" className="flex items-center gap-0.5"><IconStatMove size={9} />{def.move}</span>
                    <span title="Útočné kostky" className="flex items-center gap-0.5"><IconStatDice size={9} />{def.attack}</span>
                    {def.rangeMax > 1 && <span title="Dostřel" className="flex items-center gap-0.5"><IconStatRange size={9} />{def.rangeMax}</span>}
                    <span title="HP" className="flex items-center gap-0.5"><IconStatHp size={9} />{def.maxHp}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 pt-2 border-t border-gray-700 text-[9px] text-gray-500 leading-relaxed">
            <div>
              <span className="text-blue-400">● modrá</span> = tvá strana,{' '}
              <span className="text-red-400">● červená</span> = soupeř,{' '}
              <span className="text-gray-400">● šedá</span> = obě strany
            </div>
            <div className="mt-0.5">
              Tvar rámu: čtverec pěchota · kosočtverec jízda · kruh střelci · šestiúhelník stroj — dvojitý rám = těžká jednotka
            </div>
            <div className="mt-0.5 flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-0.5"><IconStatMove size={10} /> pohyb</span>
              <span className="flex items-center gap-0.5"><IconStatDice size={10} /> útočné kostky</span>
              <span className="flex items-center gap-0.5"><IconStatRange size={10} /> dostřel</span>
              <span className="flex items-center gap-0.5"><IconStatHp size={10} /> HP</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
