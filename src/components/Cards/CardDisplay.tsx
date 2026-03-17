import type { CardInstance } from '../../types/card';
import { CARD_DEFINITIONS } from '../../constants/cardDefinitions';

interface Props {
  card: CardInstance;
  isPlayable: boolean;
  isSelected?: boolean;
  onClick: () => void;
  faceDown?: boolean;
}

const SECTION_BADGE: Record<string, string> = {
  left: 'bg-orange-600 text-white',
  center: 'bg-green-600 text-white',
  right: 'bg-purple-600 text-white',
  any: 'bg-gray-600 text-white',
};

const SECTION_LABEL: Record<string, string> = {
  left: 'Levé',
  center: 'Střed',
  right: 'Pravé',
  any: 'Kdekoli',
};

export function CardDisplay({ card, isPlayable, isSelected, onClick, faceDown }: Props) {
  const def = CARD_DEFINITIONS[card.id];

  if (faceDown) {
    return (
      <div className="w-12 h-16 rounded-md bg-gray-700 border border-gray-600 flex items-center justify-center">
        <span className="text-gray-500 text-lg">🂠</span>
      </div>
    );
  }

  const categoryColor = def.category === 'positional'
    ? 'border-blue-500 bg-blue-950'
    : 'border-amber-500 bg-amber-950';

  const playableClass = isPlayable
    ? 'hover:brightness-125 cursor-pointer'
    : 'opacity-50 cursor-not-allowed';

  const selectedClass = isSelected ? 'ring-2 ring-white scale-105' : '';

  return (
    <div
      onClick={isPlayable ? onClick : undefined}
      className={`
        w-24 h-[7.5rem] rounded-lg border-2 ${categoryColor}
        ${playableClass} ${selectedClass}
        flex flex-col p-1.5 gap-0.5 transition-all duration-150 select-none
        text-left
      `}
    >
      {/* Section badge */}
      <div className={`
        self-start px-1 py-0.5 rounded text-[9px] font-bold
        ${SECTION_BADGE[def.section]}
      `}>
        {SECTION_LABEL[def.section]}
      </div>

      {/* Name */}
      <div className="text-white text-[10px] font-bold leading-tight">
        {def.nameCs}
      </div>

      {/* Activations */}
      <div className="text-gray-300 text-[9px]">
        {def.maxActivations >= 99 ? 'Všechny' : `≤${def.maxActivations}`} jednotek
      </div>

      {/* Bonuses */}
      {(def.moveBonus > 0 || def.attackBonus > 0) && (
        <div className="text-yellow-300 text-[9px]">
          {def.moveBonus > 0 && `+${def.moveBonus} pohyb `}
          {def.attackBonus > 0 && `+${def.attackBonus} útok`}
        </div>
      )}

      {/* Description */}
      <div className="text-gray-400 text-[8px] leading-tight flex-1 overflow-hidden">
        {def.description.substring(0, 60)}{def.description.length > 60 ? '…' : ''}
      </div>
    </div>
  );
}
