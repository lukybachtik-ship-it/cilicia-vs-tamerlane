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

  // Arkebuzír — jasná silueta arkebuzy (dlouhá hlaveň + pažba)
  arquebusier: (
    <>
      {/* Pažba */}
      <path d="M-10,2 L-10,6 L-6,6 L-4,3 L-3,3 L-3,-1 L-6,-1 Z"
            fill="white" stroke="white" strokeWidth="0.6" style={PI} />
      {/* Hlaveň */}
      <rect x={-3} y={-1} width={13} height={2.5} fill="white" style={PI} />
      <rect x={8} y={-2} width={2} height={4.5} fill="white" style={PI} />
      {/* Zážeh/kohoutek */}
      <line x1={-2} y1={-1} x2={-1} y2={-4} stroke="white" strokeWidth="1.2" strokeLinecap="round" style={PI} />
    </>
  ),

  // Pikeman — dvě vertikální piky s praporkem (jasně asociativní)
  pikeman: (
    <>
      <line x1={-4} y1={10} x2={-4} y2={-10} stroke="white" strokeWidth="2" strokeLinecap="round" style={PI} />
      <polygon points="-4,-10 -6,-7 -2,-7" fill="white" style={PI} />
      <line x1={4} y1={10} x2={4} y2={-10} stroke="white" strokeWidth="2" strokeLinecap="round" style={PI} />
      <polygon points="4,-10 2,-7 6,-7" fill="white" style={PI} />
      <path d="M-4,-4 L4,-4 L4,0 L-4,0 Z" fill="rgba(255,255,255,0.25)" stroke="white" strokeWidth="0.8" style={PI} />
    </>
  ),

  // Gendarme — silueta kopiníka na koni (lance charge)
  gendarme: (
    <>
      {/* Kůň jako tělo */}
      <path d="M-8,5 L-8,0 Q-6,-2 -2,-1 L3,-1 Q6,-2 8,0 L8,5 L4,5 L4,7 L2,7 L2,5 L-2,5 L-2,7 L-4,7 L-4,5 Z"
            fill="rgba(255,255,255,0.25)" stroke="white" strokeWidth="1.4" strokeLinejoin="round" style={PI} />
      {/* Kopí (sklopené dopředu) */}
      <line x1={-10} y1={-6} x2={11} y2={-2} stroke="white" strokeWidth="1.8" strokeLinecap="round" style={PI} />
      <polygon points="11,-2 7,-3 8,1" fill="white" style={PI} />
      {/* Chochol */}
      <path d="M-5,-4 Q-7,-8 -4,-9" fill="none" stroke="white" strokeWidth="1.2" style={PI} />
    </>
  ),

  // Stradiot — zakřivená šavle s jilcem (asociace s balkánskou lehkou jízdou)
  stradiot: (
    <>
      {/* Kůň (minimalistická linie) */}
      <path d="M-8,6 L-8,2 Q-6,0 -2,1 L2,1 Q6,0 8,2 L8,6" fill="none" stroke="white" strokeWidth="1.4" opacity={0.6} style={PI} />
      {/* Šavle */}
      <path d="M-6,-3 Q4,-8 9,-1" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" style={PI} />
      <polygon points="9,-1 5,-3 6,0" fill="white" style={PI} />
      {/* Jilec */}
      <circle cx={-6} cy={-3} r={1.3} fill="white" style={PI} />
    </>
  ),

  // Rodelero — kulatý štít (rodela) s centrálním umbem + krátký meč
  rodelero: (
    <>
      <circle cx={-2} cy={0} r={7} fill="rgba(255,255,255,0.18)" stroke="white" strokeWidth="2" style={PI} />
      <circle cx={-2} cy={0} r={2} fill="white" style={PI} />
      {/* Paprsky na štítu */}
      <line x1={-2} y1={-7} x2={-2} y2={-4} stroke="white" strokeWidth="0.8" style={PI} />
      <line x1={-2} y1={4}  x2={-2} y2={7}  stroke="white" strokeWidth="0.8" style={PI} />
      <line x1={-9} y1={0}  x2={-6} y2={0}  stroke="white" strokeWidth="0.8" style={PI} />
      <line x1={2}  y1={0}  x2={5}  y2={0}  stroke="white" strokeWidth="0.8" style={PI} />
      {/* Meč */}
      <line x1={4} y1={-6} x2={9} y2={-1} stroke="white" strokeWidth="2" strokeLinecap="round" style={PI} />
      <line x1={3} y1={-5} x2={5} y2={-3} stroke="white" strokeWidth="1.6" strokeLinecap="round" style={PI} />
    </>
  ),

  // Crossbowman — horizontální kuše s lukem a střelou
  crossbowman: (
    <>
      {/* Lučiště */}
      <path d="M-8,-5 Q-8,-2 -4,-2" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" style={PI} />
      <path d="M8,-5 Q8,-2 4,-2" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" style={PI} />
      <line x1={-8} y1={-3} x2={8} y2={-3} stroke="white" strokeWidth="1.4" style={PI} />
      {/* Pažba */}
      <rect x={-2} y={-3} width={4} height={7} fill="white" style={PI} />
      <rect x={-4} y={4} width={8} height={3} fill="white" style={PI} />
      {/* Střela */}
      <line x1={0} y1={-3} x2={0} y2={-8} stroke="white" strokeWidth="1.6" style={PI} />
      <polygon points="0,-9 -1.5,-6 1.5,-6" fill="white" style={PI} />
    </>
  ),

  // Culverin — polní dělo (hlaveň + lafeta + kola)
  culverin: (
    <>
      {/* Hlaveň */}
      <rect x={-10} y={-5} width={15} height={5} fill="rgba(255,255,255,0.9)" stroke="white" strokeWidth="1" style={PI} />
      {/* Ústí */}
      <rect x={5} y={-5.5} width={2.5} height={6} fill="white" style={PI} />
      {/* Lafeta (trojúhelníková) */}
      <polygon points="-9,1 5,1 -3,7" fill="rgba(255,255,255,0.4)" stroke="white" strokeWidth="1" style={PI} />
      {/* Kola */}
      <circle cx={-7} cy={7} r={3} fill="none" stroke="white" strokeWidth="1.5" style={PI} />
      <line x1={-9} y1={7} x2={-5} y2={7} stroke="white" strokeWidth="0.8" style={PI} />
      <line x1={-7} y1={5} x2={-7} y2={9} stroke="white" strokeWidth="0.8" style={PI} />
      <circle cx={5} cy={7} r={3} fill="none" stroke="white" strokeWidth="1.5" style={PI} />
      <line x1={3} y1={7} x2={7} y2={7} stroke="white" strokeWidth="0.8" style={PI} />
      <line x1={5} y1={5} x2={5} y2={9} stroke="white" strokeWidth="0.8" style={PI} />
    </>
  ),

  // Condottiero — renesanční sallet-helma s hledím (žoldnéřský velitel)
  condottiero: (
    <>
      {/* Sallet tvar — kapkový profil */}
      <path d="M-7,2 Q-8,-5 -2,-8 Q5,-8 8,-3 L8,3 Q5,5 -2,5 Q-6,5 -7,2 Z"
            fill="rgba(255,255,255,0.22)" stroke="white" strokeWidth="1.8" strokeLinejoin="round" style={PI} />
      {/* Hledí — vodorovný pruh */}
      <rect x={-5} y={-2} width={11} height={1.5} fill="white" style={PI} />
      {/* Chochol (vzadu) */}
      <path d="M-2,-8 Q-6,-11 -1,-11 Q2,-10 3,-8" fill="rgba(255,255,255,0.4)" stroke="white" strokeWidth="1.2" strokeLinejoin="round" style={PI} />
      {/* Dolní okraj (gorget) */}
      <path d="M-5,5 L-3,9 L6,9 L8,5" fill="rgba(255,255,255,0.15)" stroke="white" strokeWidth="1" strokeLinejoin="round" style={PI} />
    </>
  ),

  // Caterina Sforza — zlatá koruna s pěti hroty (named hero)
  caterina_sforza: (
    <>
      {/* Svatozář */}
      <circle cx={0} cy={-1} r={11} fill="none" stroke="#fde68a" strokeWidth="0.6" opacity={0.35} style={PI} />
      {/* Koruna — pět hrotů s kuličkami */}
      <path d="M-8,4 L-6,-5 L-3,1 L0,-7 L3,1 L6,-5 L8,4 Z"
            fill="rgba(253,230,138,0.35)" stroke="#fde68a" strokeWidth="2" strokeLinejoin="round" style={PI} />
      <circle cx={-6} cy={-5} r={1.5} fill="#fde68a" stroke="#78350f" strokeWidth="0.5" style={PI} />
      <circle cx={0} cy={-7} r={1.8} fill="#fde68a" stroke="#78350f" strokeWidth="0.5" style={PI} />
      <circle cx={6} cy={-5} r={1.5} fill="#fde68a" stroke="#78350f" strokeWidth="0.5" style={PI} />
      {/* Base koruny */}
      <rect x={-8} y={4} width={16} height={2.5} fill="#fde68a" stroke="#78350f" strokeWidth="0.6" style={PI} />
      {/* Ozdobné diamanty */}
      <rect x={-1.5} y={5} width={3} height={1.5} fill="#78350f" style={PI} />
    </>
  ),

  // ─── Kampaň: Belisariova éra ───────────────────────────────────────────────

  // Belisarius — helma s chocholem + gold accent (hero)
  belisarius: (
    <>
      <circle cx={0} cy={0} r={11} fill="none" stroke="#fde68a" strokeWidth="0.6" opacity={0.3} style={PI} />
      <path d="M-6,2 Q-6,-6 0,-7 Q6,-6 6,2 L5,5 Q0,7 -5,5 Z"
            fill="rgba(253,230,138,0.3)" stroke="#fde68a" strokeWidth="1.8" strokeLinejoin="round" style={PI} />
      <path d="M0,-7 Q3,-11 4,-7" fill="none" stroke="#fde68a" strokeWidth="1.4" style={PI} />
      <line x1={-4} y1={-2} x2={4} y2={-2} stroke="#fde68a" strokeWidth="1" style={PI} />
      <line x1={0} y1={5} x2={0} y2={9} stroke="#fde68a" strokeWidth="1.4" style={PI} />
    </>
  ),

  // Bukelárii — šavle se stuhou (elitní družina)
  bucelarii: (
    <>
      <path d="M-9,6 Q0,-10 8,-2" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" style={PI} />
      <polygon points="8,-2 4,-4 5,0" fill="white" style={PI} />
      <circle cx={-9} cy={6} r={1.8} fill="white" style={PI} />
      <path d="M-6,5 Q-4,8 0,6" fill="none" stroke="white" strokeWidth="1" opacity={0.6} style={PI} />
    </>
  ),

  // Katafrakti — plně obrněný jezdec (kruhy = šupinová zbroj)
  cataphract: (
    <>
      <rect x={-7} y={-3} width={14} height={8} rx={2} fill="rgba(255,255,255,0.25)" stroke="white" strokeWidth="1.4" style={PI} />
      <circle cx={-4} cy={1} r={1.3} fill="white" style={PI} />
      <circle cx={0}  cy={1} r={1.3} fill="white" style={PI} />
      <circle cx={4}  cy={1} r={1.3} fill="white" style={PI} />
      <line x1={-9} y1={-5} x2={9} y2={-5} stroke="white" strokeWidth="2" style={PI} />
      <polygon points="9,-5 5,-7 5,-3" fill="white" style={PI} />
      <circle cx={0} cy={-8} r={1.5} fill="white" style={PI} />
    </>
  ),

  // Isaurijci — hory + kopí
  isaurian_infantry: (
    <>
      <polygon points="-9,6 -4,-2 -1,2 3,-6 9,6" fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="1.6" strokeLinejoin="round" style={PI} />
      <line x1={0} y1={8} x2={0} y2={-5} stroke="white" strokeWidth="1.6" strokeLinecap="round" style={PI} />
      <polygon points="0,-7 -1.5,-3 1.5,-3" fill="white" style={PI} />
    </>
  ),

  // Herulové — dvě sekery zkřížené (berserker)
  heruli: (
    <>
      <line x1={-8} y1={8} x2={8} y2={-8} stroke="white" strokeWidth="1.6" strokeLinecap="round" style={PI} />
      <line x1={8} y1={8} x2={-8} y2={-8} stroke="white" strokeWidth="1.6" strokeLinecap="round" style={PI} />
      <path d="M-8,-8 Q-6,-5 -3,-5 Q-6,-2 -8,-1 Z" fill="rgba(255,255,255,0.18)" stroke="white" strokeWidth="1.5" style={PI} />
      <path d="M8,-8 Q6,-5 3,-5 Q6,-2 8,-1 Z" fill="rgba(255,255,255,0.18)" stroke="white" strokeWidth="1.5" style={PI} />
      <circle cx={0} cy={0} r={1.5} fill="white" style={PI} />
    </>
  ),

  // Maurijští oštěpníci — oštěp + kruhový štít
  mauri_spearmen: (
    <>
      <circle cx={-4} cy={2} r={6} fill="rgba(255,255,255,0.15)" stroke="white" strokeWidth="1.4" style={PI} />
      <line x1={4} y1={-8} x2={9} y2={8} stroke="white" strokeWidth="1.8" strokeLinecap="round" style={PI} />
      <polygon points="4,-8 2,-5 6,-5" fill="white" style={PI} />
    </>
  ),

  // ─── Peršané ──────────────────────────────────────────────────────────────

  // Nesmrtelní — zdobené kopí + koruna
  persian_immortal: (
    <>
      <path d="M-8,6 L-8,-4 Q-4,-7 0,-7 Q4,-7 8,-4 L8,6 Z" fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="1.5" strokeLinejoin="round" style={PI} />
      <line x1={0} y1={-7} x2={0} y2={-11} stroke="white" strokeWidth="1.4" style={PI} />
      <polygon points="0,-11 -2,-9 2,-9" fill="white" style={PI} />
      <line x1={-5} y1={2} x2={5} y2={2} stroke="white" strokeWidth="1" opacity={0.7} style={PI} />
    </>
  ),

  // Perská jízda — vlnitý meč (shamshir)
  persian_cavalry: (
    <>
      <path d="M-8,7 Q-3,-3 2,-2 Q6,-1 9,-5" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" style={PI} />
      <polygon points="9,-5 5,-6 6,-2" fill="white" style={PI} />
      <polyline points="-6,-5 0,-2 -6,3" fill="none" stroke="white" strokeWidth="1.6" opacity={0.6} strokeLinejoin="round" style={PI} />
    </>
  ),

  // Slon — silueta slona s klem
  elephant: (
    <>
      <ellipse cx={-1} cy={2} rx={9} ry={5} fill="rgba(255,255,255,0.25)" stroke="white" strokeWidth="1.4" style={PI} />
      <circle cx={-7} cy={-1} r={2.5} fill="rgba(255,255,255,0.3)" stroke="white" strokeWidth="1.2" style={PI} />
      <path d="M-9,-1 Q-11,3 -10,7" fill="none" stroke="white" strokeWidth="1.4" strokeLinecap="round" style={PI} />
      <line x1={-9} y1={4} x2={-11} y2={6} stroke="white" strokeWidth="1.2" style={PI} />
      <line x1={5} y1={7} x2={5} y2={10} stroke="white" strokeWidth="1.2" style={PI} />
      <line x1={-2} y1={7} x2={-2} y2={10} stroke="white" strokeWidth="1.2" style={PI} />
      <circle cx={-5} cy={-2} r={0.8} fill="white" style={PI} />
    </>
  ),

  // Firouz — persian_cavalry + zlatý chochol
  firouz: (
    <>
      <circle cx={0} cy={0} r={11} fill="none" stroke="#fde68a" strokeWidth="0.6" opacity={0.3} style={PI} />
      <path d="M-8,7 Q-3,-3 2,-2 Q6,-1 9,-5" fill="none" stroke="#fde68a" strokeWidth="2.2" strokeLinecap="round" style={PI} />
      <polygon points="9,-5 5,-6 6,-2" fill="#fde68a" style={PI} />
      <path d="M-3,-3 Q-1,-8 2,-7" fill="none" stroke="#fde68a" strokeWidth="1.4" style={PI} />
      <circle cx={2} cy={-7} r={1.3} fill="#fde68a" style={PI} />
    </>
  ),

  // ─── Nika povstalci ───────────────────────────────────────────────────────

  // Civilní dav — pěti-bodový "zubatý" tvar (rozběsněný dav)
  civilian_mob: (
    <>
      <polygon points="-9,6 -6,-2 -3,4 0,-4 3,4 6,-2 9,6" fill="rgba(255,255,255,0.18)" stroke="white" strokeWidth="1.4" strokeLinejoin="round" style={PI} />
      <circle cx={-6} cy={0} r={1} fill="white" style={PI} />
      <circle cx={0} cy={-1} r={1} fill="white" style={PI} />
      <circle cx={6} cy={0} r={1} fill="white" style={PI} />
    </>
  ),

  // Dav s kameny — přidáno "letící" kruhy
  stone_throwing_mob: (
    <>
      <polygon points="-9,8 -6,0 -3,6 0,-2 3,6 6,0 9,8" fill="rgba(255,255,255,0.18)" stroke="white" strokeWidth="1.4" strokeLinejoin="round" style={PI} />
      <circle cx={-3} cy={-6} r={2} fill="white" style={PI} />
      <circle cx={3} cy={-8} r={1.5} fill="white" opacity={0.7} style={PI} />
      <circle cx={5} cy={-4} r={1.2} fill="white" opacity={0.5} style={PI} />
    </>
  ),

  // Hypatius — dav + purpurová koruna
  hypatius: (
    <>
      <polygon points="-9,7 -6,-1 -3,5 0,-3 3,5 6,-1 9,7" fill="rgba(196,87,255,0.3)" stroke="#c77dff" strokeWidth="1.4" strokeLinejoin="round" style={PI} />
      <path d="M-5,-4 L-3,-7 L0,-4 L3,-7 L5,-4 L5,-2 L-5,-2 Z" fill="#c77dff" stroke="#7b2cbf" strokeWidth="1" strokeLinejoin="round" style={PI} />
    </>
  ),

  // Pompeius — stejný vzor, jiná pozice koruny
  pompeius: (
    <>
      <polygon points="-9,7 -6,-1 -3,5 0,-3 3,5 6,-1 9,7" fill="rgba(196,87,255,0.3)" stroke="#c77dff" strokeWidth="1.4" strokeLinejoin="round" style={PI} />
      <rect x={-5} y={-7} width={10} height={3} fill="#c77dff" stroke="#7b2cbf" strokeWidth="1" style={PI} />
      <rect x={-3} y={-5} width={6} height={2} fill="#c77dff" stroke="#7b2cbf" strokeWidth="0.5" style={PI} />
    </>
  ),

  // ─── Vandalové ──────────────────────────────────────────────────────────

  // Vandalská jízda — rohatá helma + oštěp (barbaři)
  vandal_cavalry: (
    <>
      <path d="M-6,-2 Q-6,-8 0,-8 Q6,-8 6,-2 L5,3 Q0,5 -5,3 Z"
            fill="rgba(255,255,255,0.18)" stroke="white" strokeWidth="1.5" strokeLinejoin="round" style={PI} />
      <path d="M-6,-5 Q-9,-10 -7,-11" fill="none" stroke="white" strokeWidth="1.4" strokeLinecap="round" style={PI} />
      <path d="M6,-5 Q9,-10 7,-11" fill="none" stroke="white" strokeWidth="1.4" strokeLinecap="round" style={PI} />
      <line x1={-8} y1={9} x2={8} y2={3} stroke="white" strokeWidth="1.8" strokeLinecap="round" style={PI} />
    </>
  ),

  // Vandalská pěchota — zkřížené meče
  vandal_infantry: (
    <>
      <line x1={-7} y1={-7} x2={7} y2={7}  stroke="white" strokeWidth="2.2" strokeLinecap="round" style={PI} />
      <line x1={7}  y1={-7} x2={-7} y2={7} stroke="white" strokeWidth="2.2" strokeLinecap="round" style={PI} />
      <circle cx={0} cy={0} r={1.6} fill="white" style={PI} />
    </>
  ),

  // Ammatas — vandal + červený chochol
  ammatas: (
    <>
      <circle cx={0} cy={0} r={11} fill="none" stroke="#f87171" strokeWidth="0.5" opacity={0.3} style={PI} />
      <path d="M-6,-2 Q-6,-8 0,-8 Q6,-8 6,-2 L5,3 Q0,5 -5,3 Z"
            fill="rgba(248,113,113,0.25)" stroke="#f87171" strokeWidth="1.6" strokeLinejoin="round" style={PI} />
      <path d="M0,-8 Q3,-12 2,-7" fill="#f87171" stroke="#b91c1c" strokeWidth="1" style={PI} />
      <line x1={-8} y1={9} x2={8} y2={3} stroke="#f87171" strokeWidth="1.8" strokeLinecap="round" style={PI} />
    </>
  ),

  // Gelimer — královská koruna
  gelimer: (
    <>
      <circle cx={0} cy={0} r={11} fill="none" stroke="#fbbf24" strokeWidth="0.5" opacity={0.3} style={PI} />
      <path d="M-6,-2 Q-6,-8 0,-8 Q6,-8 6,-2 L5,3 Q0,5 -5,3 Z"
            fill="rgba(251,191,36,0.25)" stroke="#fbbf24" strokeWidth="1.6" strokeLinejoin="round" style={PI} />
      <path d="M-5,-8 L-3,-12 L0,-9 L3,-12 L5,-8" fill="#fbbf24" stroke="#b45309" strokeWidth="1" strokeLinejoin="round" style={PI} />
      <circle cx={-3} cy={-12} r={1} fill="#fbbf24" style={PI} />
      <circle cx={0} cy={-9} r={1} fill="#fbbf24" style={PI} />
      <circle cx={3} cy={-12} r={1} fill="#fbbf24" style={PI} />
      <line x1={-8} y1={9} x2={8} y2={3} stroke="#fbbf24" strokeWidth="1.8" strokeLinecap="round" style={PI} />
    </>
  ),

  // Tzazon — vandal + modrý chochol
  tzazon: (
    <>
      <circle cx={0} cy={0} r={11} fill="none" stroke="#60a5fa" strokeWidth="0.5" opacity={0.3} style={PI} />
      <path d="M-6,-2 Q-6,-8 0,-8 Q6,-8 6,-2 L5,3 Q0,5 -5,3 Z"
            fill="rgba(96,165,250,0.25)" stroke="#60a5fa" strokeWidth="1.6" strokeLinejoin="round" style={PI} />
      <path d="M0,-8 Q-2,-12 -3,-8" fill="none" stroke="#60a5fa" strokeWidth="1.4" style={PI} />
      <line x1={-8} y1={9} x2={8} y2={3} stroke="#60a5fa" strokeWidth="1.8" strokeLinecap="round" style={PI} />
    </>
  ),

  // ─── Fáze 2 — Tricamarum & Neapol ──────────────────────────────────────────

  // Jan Arménský — stříbrný orel (heraldika) + kopí
  jan_armenian: (
    <>
      <circle cx={0} cy={0} r={11} fill="none" stroke="#cbd5e1" strokeWidth="0.6" opacity={0.3} style={PI} />
      <path d="M0,-8 L4,-3 L3,1 L6,6 L0,4 L-6,6 L-3,1 L-4,-3 Z"
            fill="rgba(203,213,225,0.35)" stroke="#cbd5e1" strokeWidth="1.6" strokeLinejoin="round" style={PI} />
      <circle cx={0} cy={-4} r={1.3} fill="#cbd5e1" style={PI} />
      <line x1={-10} y1={8} x2={10} y2={-2} stroke="#cbd5e1" strokeWidth="1.6" strokeLinecap="round" style={PI} />
      <polygon points="10,-2 6,-4 7,0" fill="#cbd5e1" style={PI} />
    </>
  ),

  // Obléhací věž — vysoká věž s žebříkem
  siege_tower: (
    <>
      <rect x={-6} y={-10} width={12} height={15} fill="rgba(255,255,255,0.25)" stroke="white" strokeWidth="1.4" style={PI} />
      <rect x={-6} y={-10} width={12} height={2} fill="white" style={PI} />
      <line x1={-3} y1={-8} x2={-3} y2={5} stroke="white" strokeWidth="0.8" style={PI} />
      <line x1={3} y1={-8} x2={3} y2={5} stroke="white" strokeWidth="0.8" style={PI} />
      <line x1={-6} y1={-5} x2={6} y2={-5} stroke="white" strokeWidth="0.8" style={PI} />
      <line x1={-6} y1={0} x2={6} y2={0} stroke="white" strokeWidth="0.8" style={PI} />
      {/* Kola dole */}
      <circle cx={-4} cy={7} r={2} fill="none" stroke="white" strokeWidth="1.4" style={PI} />
      <circle cx={4} cy={7} r={2} fill="none" stroke="white" strokeWidth="1.4" style={PI} />
      {/* Žebřík/rampa */}
      <path d="M-6,-6 L-9,-3" stroke="white" strokeWidth="1.2" style={PI} />
      <path d="M-8,-5 L-10,-5" stroke="white" strokeWidth="1" style={PI} />
    </>
  ),

  // Beran — tlustý kláda se železnou hlavou
  siege_ram: (
    <>
      {/* Hlava berana */}
      <path d="M-10,-2 L-8,-5 L-5,-4 L-5,3 L-8,4 L-10,1 Z" fill="rgba(255,255,255,0.4)" stroke="white" strokeWidth="1.2" style={PI} />
      <circle cx={-8} cy={-2} r={0.8} fill="#1f2937" style={PI} />
      <circle cx={-8} cy={1} r={0.8} fill="#1f2937" style={PI} />
      {/* Kláda */}
      <rect x={-5} y={-1} width={12} height={2.5} fill="white" style={PI} />
      {/* Závěsná konstrukce */}
      <line x1={0} y1={-2} x2={0} y2={-7} stroke="white" strokeWidth="1.4" style={PI} />
      <line x1={6} y1={-2} x2={6} y2={-7} stroke="white" strokeWidth="1.4" style={PI} />
      <line x1={-2} y1={-7} x2={8} y2={-7} stroke="white" strokeWidth="1.4" style={PI} />
      {/* Kola */}
      <circle cx={-2} cy={6} r={1.8} fill="none" stroke="white" strokeWidth="1.2" style={PI} />
      <circle cx={6} cy={6} r={1.8} fill="none" stroke="white" strokeWidth="1.2" style={PI} />
    </>
  ),

  // Gotická pěchota — trojúhelníkový štít + sekera
  gothic_infantry: (
    <>
      <polygon points="-6,-8 6,-8 6,3 0,8 -6,3" fill="rgba(255,255,255,0.18)" stroke="white" strokeWidth="1.5" strokeLinejoin="round" style={PI} />
      <line x1={0} y1={-8} x2={0} y2={8} stroke="white" strokeWidth="0.8" opacity={0.6} style={PI} />
      <line x1={-6} y1={-2} x2={6} y2={-2} stroke="white" strokeWidth="0.8" opacity={0.6} style={PI} />
    </>
  ),

  // Gotický rytíř — chocholatá helma + kopí
  gothic_knight: (
    <>
      <path d="M-5,-3 Q-5,-8 0,-8 Q5,-8 5,-3 L4,2 Q0,4 -4,2 Z"
            fill="rgba(255,255,255,0.22)" stroke="white" strokeWidth="1.5" strokeLinejoin="round" style={PI} />
      <path d="M0,-8 Q-3,-11 -4,-8" fill="none" stroke="white" strokeWidth="1.4" strokeLinecap="round" style={PI} />
      <path d="M0,-8 Q3,-12 4,-7" fill="none" stroke="white" strokeWidth="1.2" style={PI} />
      <line x1={-8} y1={8} x2={8} y2={-1} stroke="white" strokeWidth="1.8" strokeLinecap="round" style={PI} />
      <polygon points="8,-1 4,-2 5,2" fill="white" style={PI} />
    </>
  ),

  // Gotická milice — jednoduchý dům/hrot (obránci města)
  gothic_militia: (
    <>
      <polygon points="-7,3 0,-7 7,3" fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="1.4" strokeLinejoin="round" style={PI} />
      <rect x={-6} y={3} width={12} height={5} fill="rgba(255,255,255,0.18)" stroke="white" strokeWidth="1.2" style={PI} />
      <rect x={-1.5} y={4.5} width={3} height={3.5} fill="white" opacity={0.7} style={PI} />
      <line x1={-3} y1={5.5} x2={-3} y2={8} stroke="#1f2937" strokeWidth="0.6" style={PI} />
    </>
  ),

  // Gotičtí lučištníci — jednoduchý luk
  gothic_archers: (
    <>
      <path d="M-3,-8 Q9,0 -3,8" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" style={PI} />
      <line x1={-3} y1={-8} x2={-3} y2={8} stroke="white" strokeWidth="1" opacity={0.5} style={PI} />
      <line x1={-8} y1={0} x2={6} y2={0} stroke="white" strokeWidth="1.5" style={PI} />
      <polygon points="6,0 2,-2 2,2" fill="white" style={PI} />
    </>
  ),

  // Totila — zlatá koruna + gotický rytíř
  totila: (
    <>
      <circle cx={0} cy={0} r={11} fill="none" stroke="#fde68a" strokeWidth="0.6" opacity={0.35} style={PI} />
      <path d="M-5,-3 Q-5,-8 0,-8 Q5,-8 5,-3 L4,2 Q0,4 -4,2 Z"
            fill="rgba(253,230,138,0.3)" stroke="#fde68a" strokeWidth="1.6" strokeLinejoin="round" style={PI} />
      <path d="M-5,-8 L-3,-12 L0,-9 L3,-12 L5,-8" fill="#fde68a" stroke="#78350f" strokeWidth="1" strokeLinejoin="round" style={PI} />
      <circle cx={-3} cy={-12} r={1} fill="#fde68a" style={PI} />
      <circle cx={0} cy={-9} r={1} fill="#fde68a" style={PI} />
      <circle cx={3} cy={-12} r={1} fill="#fde68a" style={PI} />
      <line x1={-8} y1={8} x2={8} y2={-1} stroke="#fde68a" strokeWidth="1.8" strokeLinecap="round" style={PI} />
      <polygon points="8,-1 4,-2 5,2" fill="#fde68a" style={PI} />
    </>
  ),

  // Cesare Borgia — zlatý býk (heraldika Borgia) se zakřivenými rohy
  cesare_borgia: (
    <>
      {/* Svatozář */}
      <circle cx={0} cy={0} r={11} fill="none" stroke="#fde68a" strokeWidth="0.6" opacity={0.35} style={PI} />
      {/* Hlava býka */}
      <path d="M-6,-1 Q-7,-7 -2,-6 L-2,-3 Q0,-2 2,-3 L2,-6 Q7,-7 6,-1 L5,4 Q0,6 -5,4 Z"
            fill="rgba(253,230,138,0.35)" stroke="#fde68a" strokeWidth="2" strokeLinejoin="round" style={PI} />
      {/* Rohy */}
      <path d="M-7,-4 Q-10,-8 -8,-10" fill="none" stroke="#fde68a" strokeWidth="1.8" strokeLinecap="round" style={PI} />
      <path d="M7,-4 Q10,-8 8,-10" fill="none" stroke="#fde68a" strokeWidth="1.8" strokeLinecap="round" style={PI} />
      {/* Oči */}
      <circle cx={-2.5} cy={0} r={1} fill="#78350f" style={PI} />
      <circle cx={2.5} cy={0} r={1} fill="#78350f" style={PI} />
      {/* Nozdra */}
      <circle cx={0} cy={3} r={0.8} fill="#78350f" style={PI} />
    </>
  ),
};
