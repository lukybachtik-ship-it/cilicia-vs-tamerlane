import type { CampaignScenarioDefinition } from '../../constants/campaignScenarios';
import { ALL_CAMPAIGN_SCENARIOS, CAMPAIGN_SCENARIO_SEQUENCE } from '../../constants/campaignScenarios';

/**
 * Stylizovaná SVG mapa Středomoří s piny na každý kampaňový scénář.
 * Koordináty v `mapCoords` jsou v rozsahu 0–1000; mapa sama v 1000×500.
 */

interface Props {
  currentScenarioIndex: number;
  completedScenarios: string[]; // ids
  onScenarioClick?: (scenario: CampaignScenarioDefinition) => void;
}

export function MediterraneanMap({ currentScenarioIndex, completedScenarios, onScenarioClick }: Props) {
  const currentId = CAMPAIGN_SCENARIO_SEQUENCE[currentScenarioIndex] ?? null;

  return (
    <svg
      viewBox="0 0 1000 500"
      className="w-full h-auto border border-gray-700 rounded-lg"
      style={{ background: 'linear-gradient(180deg, #1e3a5f 0%, #2a4f7a 70%, #3a6591 100%)' }}
    >
      {/* ── Sea texture ──────────────────────────────────────────────── */}
      <defs>
        <pattern id="waves" width="40" height="20" patternUnits="userSpaceOnUse">
          <path d="M0,10 Q10,5 20,10 T40,10" stroke="rgba(255,255,255,0.08)" strokeWidth="1" fill="none" />
        </pattern>
      </defs>
      <rect width="1000" height="500" fill="url(#waves)" />

      {/* ── Simplified coastlines ───────────────────────────────────────
          Severní Afrika, Španělsko, Itálie, Balkán, Malá Asie, Egypt.  */}
      {/* Severní Afrika */}
      <path
        d="M0,480 L0,400 C80,390 200,405 320,420 L400,470 L550,480 L700,460 L820,480 L1000,470 L1000,500 L0,500 Z"
        fill="#8a6f3d" stroke="#5c4a24" strokeWidth="1.5"
      />
      {/* Itálie */}
      <path
        d="M450,130 L470,140 L475,180 L500,230 L510,280 L525,310 L530,350 L560,380 L555,410 L530,420 L510,400 L490,380 L490,330 L470,280 L455,240 L445,200 Z"
        fill="#7a8a5c" stroke="#4a5c3a" strokeWidth="1.5"
      />
      {/* Sicílie (ostrov) */}
      <ellipse cx="540" cy="425" rx="30" ry="15" fill="#7a8a5c" stroke="#4a5c3a" strokeWidth="1.5" />
      {/* Španělsko */}
      <path
        d="M50,250 L80,230 L180,240 L220,260 L250,300 L240,360 L200,390 L120,400 L70,380 L40,340 Z"
        fill="#a8945e" stroke="#6f5a33" strokeWidth="1.5"
      />
      {/* Balkán + Řecko */}
      <path
        d="M540,100 L600,120 L620,180 L640,220 L630,270 L620,310 L580,340 L555,320 L540,280 L530,220 L525,170 Z"
        fill="#7a8a5c" stroke="#4a5c3a" strokeWidth="1.5"
      />
      {/* Malá Asie */}
      <path
        d="M620,120 L700,110 L850,125 L920,160 L950,220 L920,260 L820,270 L720,250 L660,220 L640,180 Z"
        fill="#c19868" stroke="#6f4a28" strokeWidth="1.5"
      />
      {/* Konstantinopol peninsula hint */}
      <path d="M610,225 L625,215 L625,245 L610,250 Z" fill="#7a8a5c" stroke="#4a5c3a" strokeWidth="1" />
      {/* Egypt/Levant */}
      <path
        d="M820,290 L900,280 L950,340 L920,420 L870,440 L810,430 L780,400 L790,340 Z"
        fill="#c19868" stroke="#6f4a28" strokeWidth="1.5"
      />

      {/* ── Travel routes (traced between scenarios in order) ───────── */}
      <g opacity={0.65} stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="4,3" fill="none">
        {ALL_CAMPAIGN_SCENARIOS.slice(0, Math.max(1, currentScenarioIndex + 1)).map((s, i, arr) => {
          if (i === 0) return null;
          const prev = arr[i - 1];
          const curr = s;
          if (!prev || !curr) return null;
          return (
            <line
              key={s.id}
              x1={prev.mapCoords.x}
              y1={prev.mapCoords.y}
              x2={curr.mapCoords.x}
              y2={curr.mapCoords.y}
            />
          );
        })}
      </g>

      {/* ── Scenario pins ────────────────────────────────────────────── */}
      {ALL_CAMPAIGN_SCENARIOS.map(scenario => {
        const isCurrent = scenario.id === currentId;
        const isCompleted = completedScenarios.includes(scenario.id);
        const isFuture = !isCurrent && !isCompleted;

        const color = isCompleted ? '#22c55e' : isCurrent ? '#fbbf24' : '#6b7280';
        const ringColor = isCurrent ? '#fbbf24' : 'transparent';

        return (
          <g
            key={scenario.id}
            transform={`translate(${scenario.mapCoords.x},${scenario.mapCoords.y})`}
            style={{ cursor: isFuture ? 'not-allowed' : 'pointer' }}
            onClick={() => !isFuture && onScenarioClick?.(scenario)}
          >
            {isCurrent && (
              <circle cx={0} cy={0} r={18} fill="none" stroke={ringColor} strokeWidth="2" opacity="0.4">
                <animate attributeName="r" from="14" to="22" dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.7" to="0.1" dur="1.5s" repeatCount="indefinite" />
              </circle>
            )}
            <circle cx={0} cy={0} r={10} fill={color} stroke="#1f2937" strokeWidth="2" />
            {isCompleted && (
              <text x={0} y={4} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#fff" style={{ pointerEvents: 'none' }}>
                ✓
              </text>
            )}
            {isFuture && (
              <text x={0} y={4} textAnchor="middle" fontSize="13" fontWeight="bold" fill="#fff" style={{ pointerEvents: 'none' }}>
                ?
              </text>
            )}
            <rect
              x={-40} y={14} width={80} height={16}
              rx={3}
              fill="rgba(0,0,0,0.7)"
              stroke="#f3f4f6" strokeWidth="0.5"
              style={{ pointerEvents: 'none' }}
            />
            <text
              x={0} y={26} textAnchor="middle"
              fontSize="10" fontWeight="bold" fill="#f3f4f6"
              style={{ pointerEvents: 'none' }}
            >
              {scenario.mapLabel}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
