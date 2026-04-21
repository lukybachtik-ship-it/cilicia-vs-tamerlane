/**
 * Small SVG status glyphs drawn on or near unit tokens.
 * Each is rendered at SVG origin (0,0); callers apply translate().
 */

const pi = { pointerEvents: 'none' as const };

export function SleepingGlyph() {
  return (
    <g style={pi}>
      <text x="0" y="3" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#cbd5e1" opacity="0.85">
        Z
      </text>
      <text x="4" y="0" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#cbd5e1" opacity="0.6">
        z
      </text>
    </g>
  );
}

export function LockGlyph() {
  return (
    <g style={pi}>
      <rect x="-3.5" y="-1" width="7" height="6" fill="#fbbf24" stroke="#78350f" strokeWidth="0.6" />
      <path d="M-2,-1 L-2,-3 Q-2,-5 0,-5 Q2,-5 2,-3 L2,-1"
            fill="none" stroke="#78350f" strokeWidth="0.9" />
      <circle cx="0" cy="2" r="0.8" fill="#78350f" />
    </g>
  );
}

export function AbilityGlyph() {
  /** Gold four-point sparkle. */
  return (
    <g style={pi}>
      <polygon
        points="0,-5 1.2,-1.2 5,0 1.2,1.2 0,5 -1.2,1.2 -5,0 -1.2,-1.2"
        fill="#fde68a"
        stroke="#b45309"
        strokeWidth="0.6"
        strokeLinejoin="round"
      />
      <circle cx="0" cy="0" r="1" fill="#b45309" />
    </g>
  );
}

export function PanicGlyph() {
  return (
    <g style={pi}>
      <circle cx="0" cy="0" r="5" fill="#fbbf24" stroke="#78350f" strokeWidth="0.9" />
      <rect x="-0.7" y="-3" width="1.4" height="3.5" fill="#78350f" />
      <circle cx="0" cy="2" r="0.8" fill="#78350f" />
    </g>
  );
}

export function ChargeGlyph() {
  return (
    <g style={pi}>
      <polygon
        points="-2.5,-5 2.5,-1 0.5,-1 3,5 -1.5,1 0.5,1"
        fill="#fbbf24"
        stroke="#78350f"
        strokeWidth="0.6"
        strokeLinejoin="round"
      />
    </g>
  );
}

export function VolleyGlyph() {
  /** Muzzle flash: small radiating burst. */
  return (
    <g style={pi}>
      <polygon
        points="0,-5 1.3,-1.3 5,0 1.3,1.3 0,5 -1.3,1.3 -5,0 -1.3,-1.3"
        fill="#f97316"
        stroke="#7c2d12"
        strokeWidth="0.6"
        strokeLinejoin="round"
      />
      <circle cx="0" cy="0" r="1.3" fill="#fde047" />
    </g>
  );
}

export function CrownGlyph() {
  /** Small gold crown for named hero indicators. */
  return (
    <g style={pi}>
      <path
        d="M-6,3 L-5,-4 L-2.5,0 L0,-5 L2.5,0 L5,-4 L6,3 Z"
        fill="#fde68a"
        stroke="#78350f"
        strokeWidth="0.7"
        strokeLinejoin="round"
      />
      <line x1="-6" y1="3" x2="6" y2="3" stroke="#78350f" strokeWidth="1" />
      <circle cx="-5" cy="-4" r="0.9" fill="#78350f" />
      <circle cx="0" cy="-5" r="0.9" fill="#78350f" />
      <circle cx="5" cy="-4" r="0.9" fill="#78350f" />
    </g>
  );
}

export function MovedGlyph() {
  /** Small orange boot/arrow used for "hasMoved" indicator. */
  return (
    <g style={pi}>
      <circle cx="0" cy="0" r="3.5" fill="#f97316" stroke="#7c2d12" strokeWidth="0.6" />
    </g>
  );
}

export function AttackedGlyph() {
  /** Small purple dot used for "hasAttacked" indicator. */
  return (
    <g style={pi}>
      <circle cx="0" cy="0" r="3.5" fill="#a855f7" stroke="#4c1d95" strokeWidth="0.6" />
    </g>
  );
}
