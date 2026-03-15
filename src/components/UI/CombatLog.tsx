import { useGame } from '../../state/GameContext';
import type { CombatLogEntry } from '../../types/game';

function DiceResult({ value, defenderClass }: { value: number; defenderClass?: string }) {
  const isHit =
    defenderClass === 'light'
      ? [1, 2, 6].includes(value)
      : defenderClass === 'heavy'
      ? [3, 4, 6].includes(value)
      : false;
  const isRetreat = value === 5;

  let bg = 'bg-gray-600 text-gray-300'; // miss
  if (isHit) bg = 'bg-green-600 text-white';
  else if (isRetreat) bg = 'bg-orange-500 text-white';

  return (
    <span
      className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold ${bg}`}
    >
      {value}
    </span>
  );
}

function OutcomeLabel({ outcome }: { outcome: CombatLogEntry['outcome'] }) {
  const map: Record<CombatLogEntry['outcome'], [string, string]> = {
    no_effect: ['Žádný efekt', 'text-gray-400'],
    damage: ['Zranění', 'text-yellow-400'],
    retreat: ['Ústup', 'text-orange-400'],
    destroyed: ['Zničena!', 'text-red-400 font-bold'],
    blocked_retreat_damage: ['Blok→Zranění', 'text-orange-300'],
  };
  const [label, color] = map[outcome];
  return <span className={`text-[10px] ${color}`}>{label}</span>;
}

export function CombatLog() {
  const { state } = useGame();
  const log = [...state.combatLog].reverse(); // newest first

  return (
    <div className="flex flex-col gap-1 h-full">
      <div className="text-gray-400 text-xs font-bold mb-1">⚔ Bojový deník</div>
      <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 max-h-96">
        {log.length === 0 && (
          <div className="text-gray-600 text-xs text-center mt-4">Zatím žádné boje</div>
        )}
        {log.map(entry => (
          <div
            key={entry.id}
            className={`bg-gray-800 rounded p-1.5 text-[10px] border-l-2 ${
              entry.isCounter ? 'border-purple-500' : 'border-orange-500'
            }`}
          >
            <div className="text-gray-300 leading-tight">
              <span className="text-orange-300">{entry.attackerName}</span>
              {' '}→{' '}
              <span className="text-red-300">{entry.defenderName}</span>
              {entry.isCounter && <span className="text-purple-400"> (Protiútok)</span>}
            </div>
            <div className="flex items-center gap-1 mt-0.5 flex-wrap">
              <span className="text-gray-400">{entry.diceCount}k6:</span>
              {entry.diceResults.map((v, i) => (
                <DiceResult key={i} value={v} />
              ))}
              <span className="text-gray-400 ml-1">
                {entry.hits}🗡 {entry.retreats}↩
              </span>
              <OutcomeLabel outcome={entry.outcome} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
