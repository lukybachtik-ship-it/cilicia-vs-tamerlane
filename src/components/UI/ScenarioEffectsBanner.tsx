import { useGame } from '../../state/GameContext';
import { getActiveEffects } from '../../logic/scenarioEffects';
import { CrownGlyph } from '../Units/StatusGlyphs';

function KindGlyph({ kind }: { kind: string }) {
  if (kind === 'named_hero_rule') {
    return (
      <svg width={14} height={14} viewBox="-7 -7 14 14" className="flex-shrink-0">
        <CrownGlyph />
      </svg>
    );
  }
  if (kind === 'heat_debuff') {
    return (
      <svg width={14} height={14} viewBox="-7 -7 14 14" className="flex-shrink-0">
        <circle cx={0} cy={0} r={4} fill="#fbbf24" stroke="#78350f" strokeWidth="0.7" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map(a => (
          <line key={a} x1={Math.cos(a * Math.PI / 180) * 5} y1={Math.sin(a * Math.PI / 180) * 5}
                       x2={Math.cos(a * Math.PI / 180) * 7} y2={Math.sin(a * Math.PI / 180) * 7}
                       stroke="#fbbf24" strokeWidth="1.2" strokeLinecap="round" />
        ))}
      </svg>
    );
  }
  if (kind === 'ambush_hidden') {
    return (
      <svg width={14} height={14} viewBox="-7 -7 14 14" className="flex-shrink-0">
        <polygon points="-5,4 0,-6 5,4" fill="#1e4d26" stroke="#0a2812" strokeWidth="0.8" />
        <circle cx="0" cy="-1" r="1" fill="#7a0000" opacity="0.8" />
      </svg>
    );
  }
  return null;
}

export function ScenarioEffectsBanner() {
  const { state } = useGame();
  const active = getActiveEffects(state);
  if (active.length === 0) return null;

  return (
    <div className="bg-amber-900/30 border-b border-amber-700/40 px-4 py-1 flex items-center gap-4 flex-wrap flex-shrink-0">
      {active.map(effect => (
        <div key={effect.id} className="flex items-center gap-1.5 text-xs">
          <KindGlyph kind={effect.kind} />
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
