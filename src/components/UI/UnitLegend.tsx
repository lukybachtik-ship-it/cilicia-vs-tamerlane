import { useState } from 'react';
import { UNIT_DEFINITIONS } from '../../constants/unitDefinitions';
import { UNIT_ICONS } from '../../constants/unitIcons';
import type { UnitType } from '../../types/unit';

const ICON_R = 16; // radius of the mini-circle
const ICON_SIZE = ICON_R * 2 + 4; // SVG viewport size

const UNIT_ORDER: UnitType[] = [
  'light_infantry',
  'heavy_infantry',
  'archers',
  'light_cavalry',
  'heavy_cavalry',
  'horse_archers',
  'scout',
  'siege_machine',
  'elite_guard',
];

// Scale down icon paths to fit a smaller circle (board uses r=19, legend uses r=16)
const SCALE = ICON_R / 19;

export function UnitLegend() {
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full max-w-2xl">
      {/* Toggle button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-1.5 rounded
                   bg-gray-800 hover:bg-gray-750 border border-gray-700
                   text-gray-400 hover:text-gray-200 text-xs font-semibold transition-colors"
        style={{ backgroundColor: open ? '#1f2937' : undefined }}
      >
        <span>📋 Legenda jednotek</span>
        <span className="text-gray-500">{open ? '▲' : '▼'}</span>
      </button>

      {/* Legend panel */}
      {open && (
        <div
          className="mt-1 rounded border border-gray-700 p-3"
          style={{ backgroundColor: '#1a1f2e' }}
        >
          <div className="grid grid-cols-3 gap-x-4 gap-y-2 sm:grid-cols-6">
            {UNIT_ORDER.map(type => {
              const def = UNIT_DEFINITIONS[type];
              const icon = UNIT_ICONS[type];

              return (
                <div
                  key={type}
                  className="flex flex-col items-center gap-1"
                  title={`${def.nameCs} — Pohyb: ${def.move}, Útok: ${def.attack}, Dosah: ${def.rangeMax}`}
                >
                  {/* Mini unit token */}
                  <svg
                    width={ICON_SIZE}
                    height={ICON_SIZE}
                    viewBox={`${-ICON_R - 2} ${-ICON_R - 2} ${ICON_SIZE} ${ICON_SIZE}`}
                  >
                    {/* Circle */}
                    <circle
                      cx={0} cy={0}
                      r={ICON_R}
                      fill="#1e3a8a"
                      stroke="#3b82f6"
                      strokeWidth="1.5"
                    />
                    {/* Scaled-down icon */}
                    <g transform={`scale(${SCALE})`} style={{ pointerEvents: 'none' }}>
                      {icon}
                    </g>
                  </svg>

                  {/* Name */}
                  <span className="text-gray-300 text-[9px] font-semibold text-center leading-tight">
                    {def.nameCs}
                  </span>

                  {/* Stats row */}
                  <div className="flex gap-1 text-[8px] text-gray-500">
                    <span title="Pohyb">⚡{def.move}</span>
                    <span title="Útok">⚔{def.attack}</span>
                    <span title="Dosah">🏹{def.rangeMax}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Terrain + status legend */}
          <div className="mt-3 pt-2 border-t border-gray-700 flex flex-wrap gap-x-4 gap-y-1 text-[9px] text-gray-500">
            <span className="font-semibold text-gray-400">Terén:</span>
            <span>🌲 Les  (+1 obrana, stop)</span>
            <span>⛰ Kopec  (+1 obrana)</span>
            <span>🏰 Pevnost  (+2 obrana, stop)</span>
            <span className="font-semibold text-gray-400">Speciální:</span>
            <span>👁 Zvěd: ignoruje terénní stop</span>
            <span>⚙ Obléhací stroj: +2 kostky vs. 🏰</span>
            <span>★ Elitní garda: 5 kostek útoku</span>
            <span className="font-semibold text-gray-400">Status:</span>
            <span>🟠 Pohyboval se</span>
            <span>🟣 Zaútočil</span>
          </div>
        </div>
      )}
    </div>
  );
}
