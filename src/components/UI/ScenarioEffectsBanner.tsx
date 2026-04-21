import { useGame } from '../../state/GameContext';
import { getActiveEffects } from '../../logic/scenarioEffects';

const KIND_ICON: Record<string, string> = {
  heat_debuff: '🌞',
  ambush_hidden: '🌲',
  named_hero_rule: '👑',
};

export function ScenarioEffectsBanner() {
  const { state } = useGame();
  const active = getActiveEffects(state);
  if (active.length === 0) return null;

  return (
    <div className="bg-amber-900/30 border-b border-amber-700/40 px-4 py-1 flex items-center gap-4 flex-wrap flex-shrink-0">
      {active.map(effect => (
        <div key={effect.id} className="flex items-center gap-1 text-xs">
          <span className="text-base leading-none">{KIND_ICON[effect.kind] ?? '⚙️'}</span>
          <span className="text-amber-200 font-semibold">{effect.descriptionCs}</span>
          {effect.fromTurn > 0 && (
            <span className="text-amber-400/70 text-[10px] ml-1">
              {effect.toTurn !== undefined
                ? `(kola ${effect.fromTurn}–${effect.toTurn})`
                : `(od kola ${effect.fromTurn})`}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
