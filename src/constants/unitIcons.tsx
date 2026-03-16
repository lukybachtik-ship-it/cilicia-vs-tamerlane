import React from 'react';

const PI = { pointerEvents: 'none' as const };

/**
 * SVG icon paths for each unit type.
 * All coordinates are relative to (0, 0) — the centre of the unit token.
 * Designed to fit comfortably within a circle of radius 19 px.
 */
export const UNIT_ICONS: Record<string, React.ReactNode> = {
  // ✕  Crossed swords — light infantry
  light_infantry: (
    <>
      <line x1="-7" y1="-7" x2="7" y2="7"  stroke="white" strokeWidth="2.5" strokeLinecap="round" style={PI} />
      <line x1="7"  y1="-7" x2="-7" y2="7" stroke="white" strokeWidth="2.5" strokeLinecap="round" style={PI} />
    </>
  ),

  // 🛡  Shield — heavy infantry
  heavy_infantry: (
    <path
      d="M0,-9 L8,-5 L8,1 Q5,8 0,10 Q-5,8 -8,1 L-8,-5 Z"
      fill="rgba(255,255,255,0.15)"
      stroke="white"
      strokeWidth="2"
      strokeLinejoin="round"
      style={PI}
    />
  ),

  // 🏹  Vertical bow + horizontal arrow — archers
  archers: (
    <>
      <path d="M-1,-8 Q9,0 -1,8"  fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" style={PI} />
      <line x1="-1" y1="-8" x2="-1" y2="8" stroke="white" strokeWidth="1.2" opacity={0.55} style={PI} />
      <line x1="-7" y1="0"  x2="6"  y2="0"  stroke="white" strokeWidth="1.5" style={PI} />
      <polygon points="6,0 2,-2.5 2,2.5" fill="white" style={PI} />
    </>
  ),

  // ⟩⟩  Double speed chevrons — light cavalry
  light_cavalry: (
    <>
      <polyline
        points="-7,-5 0,0 -7,5"
        fill="none" stroke="white" strokeWidth="3"
        strokeLinejoin="round" strokeLinecap="round"
        style={PI}
      />
      <polyline
        points="-1,-7 7,0 -1,7"
        fill="none" stroke="white" strokeWidth="1.8"
        strokeLinejoin="round" strokeLinecap="round"
        opacity={0.6}
        style={PI}
      />
    </>
  ),

  // ↑  Vertical lance with crossguard — heavy cavalry
  heavy_cavalry: (
    <>
      <line x1="0" y1="9" x2="0" y2="-5"  stroke="white" strokeWidth="2.5" strokeLinecap="round" style={PI} />
      <polygon points="0,-9 -3.5,-4 3.5,-4" fill="white" style={PI} />
      <line x1="-6" y1="-1" x2="6" y2="-1" stroke="white" strokeWidth="2" strokeLinecap="round" style={PI} />
    </>
  ),

  // 🏹+⟩  Bow arc + arrow + chevron — horse archers
  horse_archers: (
    <>
      <path d="M-7,-6 Q-1,0 -7,6" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" style={PI} />
      <line x1="-7" y1="-6" x2="-7" y2="6"  stroke="white" strokeWidth="1" opacity={0.45} style={PI} />
      <line x1="-3" y1="0"  x2="5"  y2="0"  stroke="white" strokeWidth="1.8" style={PI} />
      <polygon points="5,0 1,-2.5 1,2.5" fill="white" style={PI} />
      <polyline
        points="-2,5 2,8 6,5"
        fill="none" stroke="white" strokeWidth="1.6"
        strokeLinejoin="round" strokeLinecap="round"
        opacity={0.65}
        style={PI}
      />
    </>
  ),
};
