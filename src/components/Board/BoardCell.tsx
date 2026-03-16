import React from 'react';
import type { TerrainType } from '../../types/terrain';
import type { UnitInstance } from '../../types/unit';
import { UnitToken } from '../Units/UnitToken';

interface Props {
  row: number;
  col: number;
  terrain: TerrainType;
  unit: UnitInstance | null;
  isSelected: boolean;
  isValidMove: boolean;
  isAttackTarget: boolean;
  isActivated: boolean;
  isEligibleToActivate: boolean;
  zone: 'left' | 'center' | 'right';
  onCellClick: () => void;
  onUnitClick: (e: React.MouseEvent) => void;
}

const TERRAIN_BG: Record<TerrainType, string> = {
  plain: 'bg-stone-700',
  forest: 'bg-green-900',
  hill: 'bg-yellow-900',
  fortress: 'bg-gray-700',
};

const TERRAIN_LABEL: Record<TerrainType, string> = {
  plain: '',
  forest: '🌲',
  hill: '⛰',
  fortress: '🏰',
};

const ZONE_BORDER: Record<'left' | 'center' | 'right', string> = {
  left: 'border-orange-800/40',
  center: 'border-green-800/40',
  right: 'border-purple-800/40',
};

export function BoardCell({
  row,
  col,
  terrain,
  unit,
  isSelected,
  isValidMove,
  isAttackTarget,
  isActivated,
  isEligibleToActivate,
  zone,
  onCellClick,
  onUnitClick,
}: Props) {
  let highlight = '';
  if (isValidMove) highlight = 'bg-green-600/40 ring-1 ring-green-400';
  if (isAttackTarget) highlight = 'bg-red-600/40 ring-1 ring-red-400';
  if (isSelected && unit) highlight += ' ring-2 ring-white';

  return (
    <div
      onClick={onCellClick}
      className={`
        relative border ${ZONE_BORDER[zone]}
        ${TERRAIN_BG[terrain]} ${highlight}
        w-[62px] h-[62px] flex items-center justify-center
        cursor-pointer hover:brightness-110 transition-all duration-100
        select-none
      `}
      style={{ minWidth: 62, minHeight: 62 }}
    >
      {/* Coordinate label (tiny, corner) */}
      <span className="absolute top-0 left-0.5 text-[8px] text-gray-500 leading-none">
        {col},{row}
      </span>

      {/* Terrain icon */}
      {terrain !== 'plain' && !unit && (
        <span className="text-lg leading-none select-none pointer-events-none">
          {TERRAIN_LABEL[terrain]}
        </span>
      )}

      {/* Terrain icon (small, behind unit) */}
      {terrain !== 'plain' && unit && (
        <span className="absolute bottom-0 right-0.5 text-[10px] leading-none opacity-70 pointer-events-none">
          {TERRAIN_LABEL[terrain]}
        </span>
      )}

      {/* Unit */}
      {unit && (
        <div className="w-[54px] h-[54px]">
          <UnitToken
            unit={unit}
            isSelected={isSelected}
            isActivated={isActivated}
            isAttackTarget={isAttackTarget}
            isEligibleToActivate={isEligibleToActivate}
            onClick={onUnitClick}
          />
        </div>
      )}

      {/* Move target indicator */}
      {isValidMove && !unit && (
        <div className="w-3 h-3 rounded-full bg-green-400/70 pointer-events-none" />
      )}
    </div>
  );
}
