import type { CampaignScenarioDefinition } from '../../constants/campaignScenarios';
import { ALL_CAMPAIGN_SCENARIOS, CAMPAIGN_SCENARIO_SEQUENCE } from '../../constants/campaignScenarios';

/**
 * Stylizovaná SVG mapa Středomoří s piny na každý kampaňový scénář.
 * Koordináty v `mapCoords` jsou v rozsahu 0–1000; mapa sama v 1000×500.
 * Geografie odpovídá zhruba 6. století (Byzantská říše + Justinianova obnova).
 */

interface Props {
  currentScenarioIndex: number;
  completedScenarios: string[]; // ids
  onScenarioClick?: (scenario: CampaignScenarioDefinition) => void;
}

export function MediterraneanMap({ currentScenarioIndex, completedScenarios, onScenarioClick }: Props) {
  const currentId = CAMPAIGN_SCENARIO_SEQUENCE[currentScenarioIndex] ?? null;

  // Sestav trasu pouze z navštívených + aktuálního scénáře
  const visitedIds = [...completedScenarios, currentId].filter((id): id is string => !!id);
  const visitedScenarios = visitedIds
    .map(id => ALL_CAMPAIGN_SCENARIOS.find(s => s.id === id))
    .filter((s): s is CampaignScenarioDefinition => !!s);

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

      {/* ── Kontinenty a ostrovy (stylizovaná geografie Středomoří) ──── */}

      {/* Severní Afrika (Maghreb + Egypt) */}
      <path
        d="M0,500 L0,420
           C 80,410 180,425 280,440
           L 360,460 L 440,445 L 500,465
           L 600,475 L 720,455 L 830,470 L 1000,465
           L 1000,500 Z"
        fill="#c19868" stroke="#6f4a28" strokeWidth="1.5"
      />
      {/* Iberský poloostrov — Španělsko */}
      <path
        d="M20,260 L60,235 L140,225 L200,240 L245,275 L260,320 L245,365 L205,395
           L140,405 L85,395 L45,365 L25,315 Z"
        fill="#a8945e" stroke="#6f5a33" strokeWidth="1.5"
      />
      {/* Sardinie (ostrov, západně od Itálie) */}
      <ellipse cx="395" cy="330" rx="16" ry="28" fill="#7a8a5c" stroke="#4a5c3a" strokeWidth="1.3" />
      {/* Korsika */}
      <ellipse cx="385" cy="268" rx="12" ry="22" fill="#7a8a5c" stroke="#4a5c3a" strokeWidth="1.3" />

      {/* Itálie — klasický tvar „boty" (25 bodů, striktně po směru hodinových ručiček) */}
      <path
        d="M 470,100
           L 545,100
           L 560,125
           L 555,170
           L 558,215
           L 552,255
           L 545,295
           L 540,330
           L 558,348
           L 588,360
           L 610,370
           L 612,390
           L 590,400
           L 555,405
           L 525,420
           L 510,432
           L 498,428
           L 493,412
           L 498,390
           L 510,365
           L 515,335
           L 510,300
           L 497,260
           L 488,215
           L 480,170
           L 473,130
           Z"
        fill="#7a8a5c" stroke="#4a5c3a" strokeWidth="1.5"
      />
      {/* Sicílie — trojúhelníkový ostrov pod špičkou Itálie (mírně odsazený JZ) */}
      <polygon
        points="440,448 495,443 510,468 465,472"
        fill="#7a8a5c" stroke="#4a5c3a" strokeWidth="1.5"
      />

      {/* Balkán + Řecko (zahrnuje Adriatický poloostrov) — posunuto na východ,
           aby Itálie a Balkán byly jasně oddělené Adriatickým mořem */}
      <path
        d="M 595,95
           L 645,108
           L 670,145
           L 680,195
           L 685,245
           L 665,295
           L 632,325
           L 602,345
           L 590,325
           L 582,285
           L 585,235
           L 590,180
           L 592,135
           Z"
        fill="#7a8a5c" stroke="#4a5c3a" strokeWidth="1.5"
      />
      {/* Peloponés (jižní výběžek Řecka) */}
      <path
        d="M 610,345 L 625,340 L 635,360 L 620,375 L 605,370 Z"
        fill="#7a8a5c" stroke="#4a5c3a" strokeWidth="1.3"
      />
      {/* Kréta */}
      <ellipse cx="665" cy="395" rx="28" ry="7" fill="#7a8a5c" stroke="#4a5c3a" strokeWidth="1.3" />
      {/* Kypr */}
      <ellipse cx="815" cy="310" rx="20" ry="9" fill="#c19868" stroke="#6f4a28" strokeWidth="1.3" />

      {/* Malá Asie (Anatolia) */}
      <path
        d="M 620,100
           L 700,90 L 800,95 L 880,105 L 940,125
           L 970,170 L 975,220 L 945,255 L 885,270
           L 810,275 L 745,260 L 695,240 L 660,210
           L 645,165 L 635,125
           Z"
        fill="#c19868" stroke="#6f4a28" strokeWidth="1.5"
      />
      {/* Bospor a Konstantinopolský poloostrov */}
      <path d="M 615,195 L 630,190 L 635,215 L 620,220 Z"
            fill="#7a8a5c" stroke="#4a5c3a" strokeWidth="1" />

      {/* Levant + Sýrie + Egypt (jihovýchodní kout) */}
      <path
        d="M 820,275 L 900,270 L 965,285 L 990,335
           L 975,385 L 950,425 L 900,440 L 840,435
           L 805,420 L 790,380 L 795,330 Z"
        fill="#c19868" stroke="#6f4a28" strokeWidth="1.5"
      />

      {/* ── Popisky moří (jemné) ──────────────────────────────────────── */}
      <g fill="rgba(255,255,255,0.25)" fontSize="11" fontStyle="italic">
        <text x={120} y={180}>Atlantický oceán</text>
        <text x={350} y={380}>Tyrhénské moře</text>
        <text x={640} y={265}>Egejské moře</text>
        <text x={870} y={360}>Levantské moře</text>
        <text x={300} y={460}>Středozemní moře</text>
      </g>

      {/* ── Trasa Belisariových tažení (jen navštívené body) ──────────── */}
      <g opacity={0.75} stroke="#fbbf24" strokeWidth="1.8" strokeDasharray="5,3" fill="none" strokeLinecap="round">
        {visitedScenarios.map((s, i) => {
          if (i === 0) return null;
          const prev = visitedScenarios[i - 1];
          if (!prev) return null;
          return (
            <line
              key={s.id}
              x1={prev.mapCoords.x}
              y1={prev.mapCoords.y}
              x2={s.mapCoords.x}
              y2={s.mapCoords.y}
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

        return (
          <g
            key={scenario.id}
            transform={`translate(${scenario.mapCoords.x},${scenario.mapCoords.y})`}
            style={{ cursor: isFuture ? 'not-allowed' : 'pointer' }}
            onClick={() => !isFuture && onScenarioClick?.(scenario)}
          >
            {isCurrent && (
              <circle cx={0} cy={0} r={18} fill="none" stroke="#fbbf24" strokeWidth="2" opacity="0.4">
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
              fill="rgba(0,0,0,0.75)"
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
