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

  // 👁  Eye — scout
  scout: (
    <>
      <ellipse cx={0} cy={-1} rx={8} ry={5} fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" style={PI} />
      <circle cx={0} cy={-1} r={2.5} fill="white" style={PI} />
      <line x1="-5" y1="6" x2="5" y2="6" stroke="white" strokeWidth="1.5" strokeLinecap="round" style={PI} />
    </>
  ),

  // ⚙  Catapult arm — siege machine
  siege_machine: (
    <>
      <line x1="-8" y1="7" x2="8" y2="7" stroke="white" strokeWidth="2.5" strokeLinecap="round" style={PI} />
      <line x1="-3" y1="7" x2="3" y2="-6" stroke="white" strokeWidth="2.2" strokeLinecap="round" style={PI} />
      <circle cx={3} cy={-7} r={2.5} fill="none" stroke="white" strokeWidth="1.8" style={PI} />
      <circle cx={-6} cy={8} r={2} fill="none" stroke="white" strokeWidth="1.5" style={PI} />
      <circle cx={6} cy={8} r={2} fill="none" stroke="white" strokeWidth="1.5" style={PI} />
    </>
  ),

  // ★  Five-point star — elite guard
  elite_guard: (
    <polygon
      points="0,-10 2.4,-3.3 9.5,-3.1 3.9,1.3 5.9,8.1 0,4 -5.9,8.1 -3.9,1.3 -9.5,-3.1 -2.4,-3.3"
      fill="rgba(255,255,255,0.2)"
      stroke="white"
      strokeWidth="1.5"
      strokeLinejoin="round"
      style={PI}
    />
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

  // ⊕  Circle with cross — militia (peasant soldiers, fragile)
  militia: (
    <>
      <circle cx={0} cy={0} r={8} fill="none" stroke="white" strokeWidth="1.5" style={PI} />
      <line x1={0} y1={-8} x2={0} y2={8}   stroke="white" strokeWidth="1.5" style={PI} />
      <line x1={-8} y1={0} x2={8} y2={0}   stroke="white" strokeWidth="1.5" style={PI} />
    </>
  ),

  // ─── Ancient Rome era ─────────────────────────────────────────────────────

  // Legionář — scutum (obdélníkový štít) s horizontální ryskou (pilum)
  legionary: (
    <>
      <rect x={-6} y={-8} width={12} height={16} rx={1.5} fill="rgba(255,255,255,0.12)" stroke="white" strokeWidth="1.8" style={PI} />
      <line x1={-4} y1={0} x2={4} y2={0} stroke="white" strokeWidth="1.5" style={PI} />
      <line x1={0} y1={-6} x2={0} y2={6} stroke="white" strokeWidth="1.5" style={PI} />
    </>
  ),

  // Auxilia — oválný štít
  auxilia: (
    <>
      <ellipse cx={0} cy={0} rx={6} ry={9} fill="rgba(255,255,255,0.12)" stroke="white" strokeWidth="1.8" style={PI} />
      <line x1={0} y1={-7} x2={0} y2={7} stroke="white" strokeWidth="1.2" opacity={0.7} style={PI} />
    </>
  ),

  // Equites — chevron + malá podkova pod
  equites: (
    <>
      <polyline
        points="-7,-4 0,1 -7,6"
        fill="none" stroke="white" strokeWidth="2.5"
        strokeLinejoin="round" strokeLinecap="round"
        style={PI}
      />
      <polyline
        points="-1,-6 7,1 -1,8"
        fill="none" stroke="white" strokeWidth="1.6"
        strokeLinejoin="round" strokeLinecap="round"
        opacity={0.55}
        style={PI}
      />
    </>
  ),

  // Sagittarii — složený refleks luk
  sagittarii: (
    <>
      <path d="M-2,-8 Q8,-4 4,0 Q8,4 -2,8" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" style={PI} />
      <line x1={-2} y1={-8} x2={-2} y2={8} stroke="white" strokeWidth="1" opacity={0.45} style={PI} />
      <line x1={-7} y1={0} x2={5} y2={0} stroke="white" strokeWidth="1.5" style={PI} />
      <polygon points="5,0 1,-2.5 1,2.5" fill="white" style={PI} />
    </>
  ),

  // Scorpio — trojúhelníkový rám + šipka
  scorpio: (
    <>
      <polyline points="-8,7 0,-6 8,7" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={PI} />
      <line x1={-8} y1={7} x2={8} y2={7} stroke="white" strokeWidth="1.8" style={PI} />
      <line x1={0} y1={-6} x2={0} y2={3} stroke="white" strokeWidth="2" style={PI} />
      <polygon points="0,-8 -2,-4 2,-4" fill="white" style={PI} />
    </>
  ),

  // Praetorian — orel (SPQR) — zjednodušená heraldika
  praetorian: (
    <>
      <path d="M0,-9 L5,-3 L4,2 L7,6 L0,4 L-7,6 L-4,2 L-5,-3 Z"
            fill="rgba(255,255,255,0.25)" stroke="white" strokeWidth="1.5" strokeLinejoin="round" style={PI} />
      <circle cx={0} cy={-4} r={1.4} fill="white" style={PI} />
    </>
  ),

  // Germanic warrior — sekera
  germanic_warrior: (
    <>
      <line x1={0} y1={9} x2={0} y2={-4} stroke="white" strokeWidth="2.2" strokeLinecap="round" style={PI} />
      <path d="M-7,-7 Q-2,-8 2,-4 Q-2,0 -7,-1 Z" fill="rgba(255,255,255,0.18)" stroke="white" strokeWidth="1.8" style={PI} />
      <path d="M7,-7 Q2,-8 -2,-4 Q2,0 7,-1 Z" fill="rgba(255,255,255,0.18)" stroke="white" strokeWidth="1.8" style={PI} />
    </>
  ),

  // Framea thrower — oštěp diagonálně
  framea_thrower: (
    <>
      <line x1={-8} y1={7} x2={8} y2={-7} stroke="white" strokeWidth="2.2" strokeLinecap="round" style={PI} />
      <polygon points="8,-7 3,-6 4,-2" fill="white" style={PI} />
      <line x1={-5} y1={5} x2={-8} y2={7} stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity={0.7} style={PI} />
    </>
  ),

  // Germanic chieftain — rohatá helma (cornuate silhouette)
  germanic_chieftain: (
    <>
      <path d="M-8,-2 Q-8,-9 -2,-7 Q0,-10 2,-7 Q8,-9 8,-2 Q8,4 0,6 Q-8,4 -8,-2 Z"
            fill="rgba(255,255,255,0.18)" stroke="white" strokeWidth="1.8" strokeLinejoin="round" style={PI} />
      <circle cx={-3} cy={-1} r={0.8} fill="white" style={PI} />
      <circle cx={3} cy={-1} r={0.8} fill="white" style={PI} />
    </>
  ),

  // Arminius — helma + svatozář (hero)
  arminius: (
    <>
      <circle cx={0} cy={0} r={10} fill="none" stroke="white" strokeWidth="1" opacity={0.3} style={PI} />
      <path d="M-7,2 Q-7,-8 0,-9 Q7,-8 7,2 L5,4 Q0,6 -5,4 Z"
            fill="rgba(255,220,120,0.25)" stroke="#ffd46a" strokeWidth="1.8" strokeLinejoin="round" style={PI} />
      <line x1={0} y1={-9} x2={0} y2={4} stroke="#ffd46a" strokeWidth="1.5" style={PI} />
    </>
  ),

  // ─── Renaissance / Borgia era ─────────────────────────────────────────────

  // Arkebuzír — krátká hlaveň s kouřem
  arquebusier: (
    <>
      <rect x={-8} y={-1} width={12} height={3} fill="white" style={PI} />
      <circle cx={5} cy={1} r={1.5} fill="white" style={PI} />
      <circle cx={7} cy={-2} r={1.2} fill="white" opacity={0.6} style={PI} />
      <circle cx={9} cy={-5} r={0.8} fill="white" opacity={0.4} style={PI} />
      <line x1={-8} y1={2} x2={-6} y2={7} stroke="white" strokeWidth="1.6" strokeLinecap="round" style={PI} />
    </>
  ),

  // Pikeman — dlouhá vertikální píka s praporkem
  pikeman: (
    <>
      <line x1={0} y1={-10} x2={0} y2={10} stroke="white" strokeWidth="2" strokeLinecap="round" style={PI} />
      <polygon points="0,-10 -2,-6 2,-6" fill="white" style={PI} />
      <path d="M0,-4 L6,-2 L6,2 L0,0 Z" fill="rgba(255,255,255,0.3)" stroke="white" strokeWidth="1" style={PI} />
    </>
  ),

  // Gendarme — helma s chocholem a kopí
  gendarme: (
    <>
      <path d="M-5,-2 Q-5,-7 0,-7 Q5,-7 5,-2 L4,3 Q0,5 -4,3 Z"
            fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="1.6" strokeLinejoin="round" style={PI} />
      <line x1={0} y1={-7} x2={3} y2={-11} stroke="white" strokeWidth="1.6" strokeLinecap="round" style={PI} />
      <line x1={-8} y1={8} x2={8} y2={-2} stroke="white" strokeWidth="1.8" strokeLinecap="round" style={PI} />
      <polygon points="8,-2 4,-2 6,2" fill="white" style={PI} />
    </>
  ),

  // Stradiot — šavle + zakřivený meč
  stradiot: (
    <>
      <path d="M-8,6 Q0,-8 8,-4" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" style={PI} />
      <polygon points="8,-4 4,-5 5,-1" fill="white" style={PI} />
      <polyline points="-6,-4 0,-1 -6,4" fill="none" stroke="white" strokeWidth="1.6"
        strokeLinejoin="round" strokeLinecap="round" opacity={0.55} style={PI} />
    </>
  ),

  // Rodelero — kulatý štít (rodela) + meč
  rodelero: (
    <>
      <circle cx={-1} cy={0} r={7.5} fill="rgba(255,255,255,0.15)" stroke="white" strokeWidth="1.8" style={PI} />
      <circle cx={-1} cy={0} r={1.5} fill="white" style={PI} />
      <line x1={5} y1={-6} x2={9} y2={-2} stroke="white" strokeWidth="2" strokeLinecap="round" style={PI} />
    </>
  ),

  // Crossbowman — horizontální kuše
  crossbowman: (
    <>
      <line x1={-7} y1={-4} x2={7} y2={-4} stroke="white" strokeWidth="2" strokeLinecap="round" style={PI} />
      <path d="M-7,-6 Q-7,-4 -5,-2" fill="none" stroke="white" strokeWidth="1.5" style={PI} />
      <path d="M7,-6 Q7,-4 5,-2" fill="none" stroke="white" strokeWidth="1.5" style={PI} />
      <line x1={0} y1={-4} x2={0} y2={6} stroke="white" strokeWidth="2" style={PI} />
      <polygon points="0,7 -2,3 2,3" fill="white" style={PI} />
    </>
  ),

  // Culverin — dělo na kolech
  culverin: (
    <>
      <rect x={-8} y={-3} width={14} height={5} fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="1.6" style={PI} />
      <rect x={6} y={-2} width={3} height={3} fill="white" style={PI} />
      <circle cx={-5} cy={6} r={2.5} fill="none" stroke="white" strokeWidth="1.6" style={PI} />
      <circle cx={3} cy={6} r={2.5} fill="none" stroke="white" strokeWidth="1.6" style={PI} />
      <line x1={-8} y1={2} x2={6} y2={2} stroke="white" strokeWidth="1.2" opacity={0.6} style={PI} />
    </>
  ),

  // Condottiero — přilba s chocholem, diagonální meč
  condottiero: (
    <>
      <path d="M-6,-3 Q-6,-8 0,-8 Q6,-8 6,-3 L5,2 Q0,4 -5,2 Z"
            fill="rgba(255,255,255,0.18)" stroke="white" strokeWidth="1.6" strokeLinejoin="round" style={PI} />
      <path d="M0,-8 Q4,-11 3,-7" fill="none" stroke="white" strokeWidth="1.4" style={PI} />
      <line x1={-7} y1={9} x2={7} y2={3} stroke="white" strokeWidth="1.8" strokeLinecap="round" style={PI} />
    </>
  ),

  // Caterina Sforza — koruna / věnec
  caterina_sforza: (
    <>
      <circle cx={0} cy={0} r={10} fill="none" stroke="#ffd46a" strokeWidth="1" opacity={0.4} style={PI} />
      <path d="M-8,2 L-6,-4 L-3,0 L0,-6 L3,0 L6,-4 L8,2 Z"
            fill="rgba(255,220,120,0.3)" stroke="#ffd46a" strokeWidth="1.8" strokeLinejoin="round" style={PI} />
      <circle cx={-3} cy={-1} r={1.2} fill="#ffd46a" style={PI} />
      <circle cx={0} cy={-4} r={1.4} fill="#ffd46a" style={PI} />
      <circle cx={3} cy={-1} r={1.2} fill="#ffd46a" style={PI} />
      <line x1={-8} y1={4} x2={8} y2={4} stroke="#ffd46a" strokeWidth="1.5" style={PI} />
    </>
  ),

  // Cesare Borgia — býk (heraldika rodu Borgia, zjednodušeně)
  cesare_borgia: (
    <>
      <circle cx={0} cy={0} r={10} fill="none" stroke="#ffd46a" strokeWidth="1" opacity={0.4} style={PI} />
      <path d="M-6,-2 Q-8,-7 -3,-7 L0,-4 L3,-7 Q8,-7 6,-2 L5,5 Q0,7 -5,5 Z"
            fill="rgba(255,220,120,0.25)" stroke="#ffd46a" strokeWidth="1.8" strokeLinejoin="round" style={PI} />
      <circle cx={-2.5} cy={1} r={0.8} fill="#ffd46a" style={PI} />
      <circle cx={2.5} cy={1} r={0.8} fill="#ffd46a" style={PI} />
    </>
  ),
};
