import type { ScenarioDefinition } from '../../constants/scenarios';
import type { TerrainType } from '../../types/terrain';

/**
 * Mini-mapa scénáře na kartách výběru — generovaná z dat scénáře
 * (terén + startovní pozice jednotek). Nahrazuje emoji ikony.
 */

const S = 6.2;                       // poloměr mini-hexu
const W = Math.sqrt(3) * S;          // šířka
const V = 1.5 * S;                   // svislý krok
const PAD = 8;

const MINI_TERRAIN: Partial<Record<TerrainType, string>> = {
  plain:    '#3a332a',
  forest:   '#1d4a2a',
  hill:     '#6e5124',
  fortress: '#4a5160',
  village:  '#6B4226',
  tent:     '#8B6914',
};

function hexPoints(cx: number, cy: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (30 + 60 * i);
    pts.push(`${(cx + S * Math.cos(a)).toFixed(2)},${(cy + S * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(' ');
}

export function ScenarioMiniMap({ scenario }: { scenario: ScenarioDefinition }) {
  const rows = scenario.gridRows ?? 9;
  const cols = scenario.gridCols ?? 9;

  const cx = (row: number, col: number) =>
    (col - 1) * W + (row % 2 === 1 ? W / 2 : 0) + W / 2 + PAD;
  const cy = (row: number) => (row - 1) * V + S + PAD;

  const width  = cols * W + W / 2 + PAD * 2;
  const height = (rows - 1) * V + 2 * S + PAD * 2;

  const terrainAt = (row: number, col: number): TerrainType =>
    scenario.terrain.find(t => t.position.row === row && t.position.col === col)
      ?.terrain ?? 'plain';

  return (
    <div
      className="w-full flex justify-center"
      style={{ background: '#0a0f1a', border: '1px solid #1f2937', borderRadius: 8, padding: 8 }}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', maxWidth: 220, height: 'auto', display: 'block' }}
      >
        {Array.from({ length: rows }, (_, r) => r + 1).flatMap(row =>
          Array.from({ length: cols }, (_, c) => c + 1).map(col => (
            <polygon
              key={`${row}-${col}`}
              points={hexPoints(cx(row, col), cy(row))}
              fill={MINI_TERRAIN[terrainAt(row, col)] ?? '#3a332a'}
              stroke="#1c1813"
              strokeWidth={0.7}
            />
          ))
        )}
        {scenario.ciliciaUnits.map(u => (
          <circle
            key={u.id}
            cx={cx(u.position.row, u.position.col)}
            cy={cy(u.position.row)}
            r={2.8}
            fill="#3b82f6"
            stroke="#bfdbfe"
            strokeWidth={0.9}
          />
        ))}
        {scenario.tamerlaneUnits.map(u => (
          <circle
            key={u.id}
            cx={cx(u.position.row, u.position.col)}
            cy={cy(u.position.row)}
            r={2.8}
            fill="#dc2626"
            stroke="#fecaca"
            strokeWidth={0.9}
          />
        ))}
      </svg>
    </div>
  );
}

/**
 * Heraldický praporek obtížnosti — nahrazuje ⚖️/🔴/🔵 emoji.
 * Barva podle difficultyCs scénáře.
 */
export function DifficultyPennant({ difficultyCs }: { difficultyCs: string }) {
  const fill = difficultyCs.includes('🔴') ? '#b91c1c'
    : difficultyCs.includes('🔵') ? '#1d4ed8'
    : '#6b7280';
  const stroke = difficultyCs.includes('🔴') ? '#f87171'
    : difficultyCs.includes('🔵') ? '#60a5fa'
    : '#9ca3af';
  return (
    <svg width={20} height={26} viewBox="0 0 20 26" className="flex-shrink-0">
      <line x1={3} y1={1} x2={3} y2={25} stroke="#4b5563" strokeWidth={1.6} />
      <path d="M4,2 L18,2 L13,7 L18,12 L4,12 Z" fill={fill} stroke={stroke} strokeWidth={1} />
    </svg>
  );
}

/** Text obtížnosti bez emoji (design: žádné emoji v UI). */
export function difficultyText(difficultyCs: string): string {
  return difficultyCs.replace(/⚖️|🔴|🔵|🗺️|⚔️/g, '').trim();
}
