import type { TerrainType } from '../../types/terrain';

interface Props {
  type: TerrainType;
  cx: number;
  cy: number;
  /** Scale factor (1 = full hex glyph, 0.5 = corner badge). */
  scale?: number;
  dim?: boolean;
}

/**
 * SVG terrain glyph — drawn at (cx, cy) in SVG coordinate space.
 * Replaces emoji-based terrain icons.
 */
export function TerrainGlyph({ type, cx, cy, scale = 1, dim = false }: Props) {
  const opacity = dim ? 0.7 : 1;
  const t = `translate(${cx},${cy}) scale(${scale})`;
  const pi = { pointerEvents: 'none' as const };

  switch (type) {
    case 'plain':
      return null;

    case 'forest':
      return (
        <g transform={t} style={pi} opacity={opacity}>
          <polygon points="-6,5 0,-9 6,5" fill="#3d8a4a" stroke="#1e4d26" strokeWidth="1" />
          <polygon points="-9,9 0,-3 9,9" fill="#2d7a3a" stroke="#1e4d26" strokeWidth="1" />
          <rect x="-1.5" y="9" width="3" height="3" fill="#4a3220" />
        </g>
      );

    case 'ambush_forest':
      return (
        <g transform={t} style={pi} opacity={opacity}>
          <polygon points="-6,5 0,-9 6,5" fill="#1e4d26" stroke="#0a2812" strokeWidth="1.5" />
          <polygon points="-9,9 0,-3 9,9" fill="#143a1c" stroke="#0a2812" strokeWidth="1.5" />
          <rect x="-1.5" y="9" width="3" height="3" fill="#2b1a0f" />
          <circle cx="0" cy="-2" r="1.2" fill="#7a0000" opacity="0.6" />
        </g>
      );

    case 'hill':
      return (
        <g transform={t} style={pi} opacity={opacity}>
          <polygon points="-11,6 -4,-6 2,1 11,6" fill="#9a7438" stroke="#5c4520" strokeWidth="1" />
          <polygon points="-11,6 -4,-6 2,1 -4,1" fill="#b88a45" stroke="none" opacity="0.5" />
        </g>
      );

    case 'fortress':
      return (
        <g transform={t} style={pi} opacity={opacity}>
          <rect x="-9" y="-2" width="18" height="11" fill="#8a8a8a" stroke="#404040" strokeWidth="1" />
          <rect x="-9" y="-5" width="3" height="3" fill="#8a8a8a" stroke="#404040" strokeWidth="1" />
          <rect x="-1.5" y="-5" width="3" height="3" fill="#8a8a8a" stroke="#404040" strokeWidth="1" />
          <rect x="6" y="-5" width="3" height="3" fill="#8a8a8a" stroke="#404040" strokeWidth="1" />
          <rect x="-2" y="3" width="4" height="6" fill="#3a2818" stroke="#404040" strokeWidth="0.8" />
        </g>
      );

    case 'village':
      return (
        <g transform={t} style={pi} opacity={opacity}>
          <polygon points="-8,1 0,-8 8,1" fill="#b94a2a" stroke="#6b2818" strokeWidth="1" />
          <rect x="-7" y="1" width="14" height="8" fill="#c19868" stroke="#6b4226" strokeWidth="1" />
          <rect x="-1.5" y="4" width="3" height="5" fill="#5a3820" />
          <rect x="-5" y="2.5" width="2.5" height="2.5" fill="#3a2818" />
          <rect x="2.5" y="2.5" width="2.5" height="2.5" fill="#3a2818" />
        </g>
      );

    case 'tent':
      return (
        <g transform={t} style={pi} opacity={opacity}>
          <polygon points="-10,8 0,-9 10,8" fill="#d4a54b" stroke="#6b4912" strokeWidth="1" />
          <polygon points="-2,8 0,0 2,8" fill="#3a2818" stroke="#6b4912" strokeWidth="0.8" />
          <line x1="0" y1="-9" x2="0" y2="-12" stroke="#6b4912" strokeWidth="1" />
          <circle cx="0" cy="-12" r="1.3" fill="#d4a54b" />
        </g>
      );

    case 'trench':
      return (
        <g transform={t} style={pi} opacity={opacity}>
          <path
            d="M-10,-2 L-7,2 L-4,-3 L-1,2 L2,-3 L5,2 L8,-2 L10,-2 L10,8 L-10,8 Z"
            fill="#6b4a28"
            stroke="#2a1a0a"
            strokeWidth="1"
          />
          <line x1="-8" y1="5" x2="8" y2="5" stroke="#2a1a0a" strokeWidth="0.7" opacity="0.6" />
        </g>
      );

    case 'vineyard':
      return (
        <g transform={t} style={pi} opacity={opacity}>
          <circle cx="-4" cy="-2" r="2.2" fill="#7b4d99" />
          <circle cx="0"  cy="-3" r="2.2" fill="#7b4d99" />
          <circle cx="4"  cy="-2" r="2.2" fill="#7b4d99" />
          <circle cx="-2" cy="1.5" r="2"   fill="#6a3f88" />
          <circle cx="2"  cy="1.5" r="2"   fill="#6a3f88" />
          <circle cx="0"  cy="5" r="2"   fill="#593572" />
          <line x1="0" y1="-6" x2="0" y2="-4" stroke="#3a5a1e" strokeWidth="1.5" />
        </g>
      );

    case 'wall':
      return (
        <g transform={t} style={pi} opacity={opacity}>
          <rect x="-10" y="-5" width="20" height="13" fill="#b0a896" stroke="#5c584e" strokeWidth="1" />
          <line x1="-3" y1="-5" x2="-3" y2="0.5" stroke="#5c584e" strokeWidth="0.9" />
          <line x1="3"  y1="-5" x2="3"  y2="0.5" stroke="#5c584e" strokeWidth="0.9" />
          <line x1="-10" y1="0.5" x2="10" y2="0.5" stroke="#5c584e" strokeWidth="0.9" />
          <line x1="-6.5" y1="0.5" x2="-6.5" y2="8" stroke="#5c584e" strokeWidth="0.9" />
          <line x1="0"    y1="0.5" x2="0"    y2="8" stroke="#5c584e" strokeWidth="0.9" />
          <line x1="6.5"  y1="0.5" x2="6.5"  y2="8" stroke="#5c584e" strokeWidth="0.9" />
        </g>
      );

    case 'wagenburg':
      return (
        <g transform={t} style={pi} opacity={opacity}>
          <circle cx="0" cy="0" r="10" fill="#8B5E3C" stroke="#3d2815" strokeWidth="1.5" />
          <circle cx="0" cy="0" r="10" fill="none" stroke="#3d2815" strokeWidth="0.8" strokeDasharray="3,2" />
          <line x1="0" y1="-10" x2="0"  y2="10" stroke="#3d2815" strokeWidth="1" />
          <line x1="-10" y1="0" x2="10" y2="0" stroke="#3d2815" strokeWidth="1" />
          <line x1="-7"  y1="-7" x2="7"  y2="7" stroke="#3d2815" strokeWidth="0.8" />
          <line x1="-7"  y1="7" x2="7"  y2="-7" stroke="#3d2815" strokeWidth="0.8" />
          <circle cx="0" cy="0" r="2" fill="#3d2815" />
        </g>
      );

    case 'stream':
      return (
        <g transform={t} style={pi} opacity={opacity}>
          {/* Animated-look wavy water */}
          <path d="M-11,-3 Q-7,-6 -3,-3 T5,-3 T13,-3" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
          <path d="M-11,2 Q-7,-1 -3,2 T5,2 T13,2" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" />
          <path d="M-11,7 Q-7,4 -3,7 T5,7 T13,7" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
        </g>
      );

    case 'gate':
      return (
        <g transform={t} style={pi} opacity={opacity}>
          {/* Dřevěná brána — vertikální prkna + železné kování */}
          <rect x="-8" y="-8" width="16" height="16" fill="#8b5e34" stroke="#3d2815" strokeWidth="1.4" />
          <line x1="-4" y1="-8" x2="-4" y2="8" stroke="#3d2815" strokeWidth="1" />
          <line x1="0"  y1="-8" x2="0"  y2="8" stroke="#3d2815" strokeWidth="1" />
          <line x1="4"  y1="-8" x2="4"  y2="8" stroke="#3d2815" strokeWidth="1" />
          <rect x="-8" y="-5" width="16" height="1.5" fill="#5a4020" />
          <rect x="-8" y="3.5" width="16" height="1.5" fill="#5a4020" />
        </g>
      );

    case 'aqueduct_surface':
      return (
        <g transform={t} style={pi} opacity={opacity}>
          {/* Dvojitý oblouk — klasický římský akvadukt */}
          <rect x="-10" y="-8" width="20" height="4" fill="#b0a896" stroke="#5c584e" strokeWidth="1" />
          <path d="M-9,-4 Q-9,2 -5,2" fill="#b0a896" stroke="#5c584e" strokeWidth="1" />
          <path d="M-5,2 Q-5,-4 -1,-4 Q-1,2 3,2 Q3,-4 7,-4 Q7,2 9,2" fill="#b0a896" stroke="#5c584e" strokeWidth="1" />
          <rect x="-10" y="2" width="20" height="6" fill="#9a9080" stroke="#5c584e" strokeWidth="1" />
          {/* Malý pramen uvnitř (naznačuje vodu) */}
          <path d="M-3,-2 Q0,0 3,-2" fill="none" stroke="#3b82f6" strokeWidth="0.7" />
        </g>
      );

    case 'aqueduct_exit':
      return (
        <g transform={t} style={pi} opacity={opacity}>
          {/* Čtverec se šipkou dovnitř — exit teleportu */}
          <rect x="-8" y="-8" width="16" height="16" rx="2" fill="#6b4a28" stroke="#fbbf24" strokeWidth="1.8" />
          <polygon points="0,-3 -4,3 4,3" fill="#fbbf24" />
          <line x1="0" y1="-7" x2="0" y2="-3" stroke="#fbbf24" strokeWidth="1.5" />
        </g>
      );
  }
  return null;
}

/** Human-readable Czech names for terrain (used in Legend panel). */
export const TERRAIN_NAMES: Record<TerrainType, string> = {
  plain:            'Pláň',
  forest:           'Les',
  ambush_forest:    'Temný les',
  hill:             'Kopec',
  fortress:         'Pevnost',
  village:          'Vesnice',
  tent:             'Velitelský stan',
  trench:           'Zákop',
  vineyard:         'Vinice',
  wall:             'Hradba',
  wagenburg:        'Wagenburg',
  stream:           'Potok',
  gate:             'Brána',
  aqueduct_surface: 'Akvadukt',
  aqueduct_exit:    'Vchod do města',
};

/** One-line effect hints for legend panel. */
export const TERRAIN_EFFECTS: Record<TerrainType, string> = {
  plain:            '—',
  forest:           'Obránce −1 útok; jednotka musí zastavit',
  ambush_forest:    'Skrývá germány do 2 hexů; obránce −1 útok',
  hill:             'Střelci bonus proti nížině; +1 elevation',
  fortress:         'Obránce −1 útok; ignoruje 1× ústup; jízda nesmí',
  village:          'Cíl obsazení; +1 obrana stojícímu',
  tent:             'Velitelský stan (Aškelon – cíl Křižáků)',
  trench:           'Obránce +1 obrana; útok skrz −1 kostka',
  vineyard:         'Pomalý terén — jednotka musí zastavit',
  wall:             'Neprůchozí; ničitelná dělostřelectvem (HP)',
  wagenburg:        'Obránce −1 útok; ignoruje ústup; ničitelný',
  stream:           'Potok: jednotka co překročí nemůže v tom kole útočit',
  gate:             'Brána (4 HP): rozbitná beranem nebo 2× útokem pěchoty',
  aqueduct_surface: 'Akvadukt: lehká pěchota odtud teleportuje dovnitř města',
  aqueduct_exit:    'Cíl teleportu akvaduktu (uvnitř města)',
};
