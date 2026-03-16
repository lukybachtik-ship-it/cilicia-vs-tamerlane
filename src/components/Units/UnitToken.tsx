import React from 'react';
import type { UnitInstance } from '../../types/unit';
import { UNIT_DEFINITIONS } from '../../constants/unitDefinitions';

interface Props {
  unit: UnitInstance;
  isSelected: boolean;
  isActivated: boolean;
  isAttackTarget: boolean;
  isEligibleToActivate: boolean;
  onClick: (e: React.MouseEvent) => void;
}

export function UnitToken({ unit, isSelected, isActivated, isAttackTarget, isEligibleToActivate, onClick }: Props) {
  const def = UNIT_DEFINITIONS[unit.definitionType];
  const isCilicia = unit.faction === 'cilicia';

  // Build tooltip with state hints
  const statusHints: string[] = [];
  if (unit.directFireLocked) statusHints.push('🔒 Přímá palba – nelze pohybovat');
  if (unit.hasMoved) statusHints.push('✓ Pohybovala se');
  if (unit.hasAttacked) statusHints.push('✓ Zaútočila');
  const rangeInfo = def.rangeMax > 1
    ? `Dosah: ${def.rangeMin}–${def.rangeMax}`
    : 'Dosah: 1 (melee)';
  const meleeNote = def.meleeAttackPenalty ? ' (-1 kostka v melee)' : '';
  const tooltip = [
    `${def.nameCs} | HP: ${unit.hp}/${def.maxHp}`,
    `Pohyb: ${def.move} | Útok: ${def.attack}k6 | ${rangeInfo}${meleeNote}`,
    ...statusHints,
  ].join('\n');

  // Activated units get a green base to stand out clearly
  const baseColor = isActivated
    ? 'bg-green-700 border-green-400'
    : isCilicia
      ? 'bg-blue-600 border-blue-400'
      : 'bg-red-700 border-red-400';
  const selectedRing = isSelected ? 'ring-2 ring-white' : '';
  const attackRing = isAttackTarget ? 'ring-2 ring-red-300' : '';
  // Eligible: yellow ring; activated already: bright green ring
  const stateRing = isActivated
    ? 'ring-2 ring-green-300'
    : isEligibleToActivate
      ? 'ring-2 ring-yellow-400'
      : '';
  // Dimmed only when in activate phase but not eligible AND not activated
  const dimmed = !isActivated && !isEligibleToActivate ? 'opacity-40' : 'opacity-100';

  return (
    <div
      onClick={onClick}
      className={`
        relative flex flex-col items-center justify-center
        w-full h-full rounded cursor-pointer select-none
        border-2 ${baseColor} ${selectedRing} ${attackRing} ${stateRing} ${dimmed}
        hover:opacity-100 transition-all duration-150
      `}
      title={tooltip}
    >
      {/* Unit abbreviation */}
      <span className="text-white font-bold text-xs leading-none">{def.abbrevCs}</span>

      {/* HP dots */}
      <div className="flex gap-0.5 mt-0.5">
        {Array.from({ length: def.maxHp }, (_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full ${
              i < unit.hp
                ? unit.hp === 3 ? 'bg-green-400' : unit.hp === 2 ? 'bg-yellow-400' : 'bg-red-400'
                : 'bg-gray-600'
            }`}
          />
        ))}
      </div>

      {/* Direct fire locked: cannot move */}
      {unit.directFireLocked && (
        <div className="absolute bottom-0 right-0 text-[8px] leading-none pointer-events-none">🔒</div>
      )}

      {/* Moved/attacked indicators */}
      {unit.hasMoved && (
        <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-orange-400 rounded-full" />
      )}
      {unit.hasAttacked && (
        <div className="absolute top-0 left-0 w-1.5 h-1.5 bg-purple-400 rounded-full" />
      )}
    </div>
  );
}
