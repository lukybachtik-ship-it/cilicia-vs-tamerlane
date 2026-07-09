/**
 * DESIGN REFERENCE — čárový SVG ikonový set nahrazující emoji v UI.
 * Jednotný styl: viewBox 0 0 24 24, fill none, stroke currentColor,
 * stroke-width 1.8, stroke-linecap/linejoin round.
 * Výchozí barva #d1d5db (gray-300); aktivní stavy dědí barvu textu.
 */
import React from 'react';

const S = {
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const Icon = ({ children, size = 24 }: { children: React.ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...S}>{children}</svg>
);

/** 🌐 Vytvořit online hru (LobbyScreen) */
export const IconOnline = ({ size }: { size?: number }) => (
  <Icon size={size}>
    <circle cx={12} cy={12} r={9} />
    <ellipse cx={12} cy={12} rx={4} ry={9} />
    <line x1={3} y1={12} x2={21} y2={12} />
  </Icon>
);

/** 🔗 Připojit se ke hře (LobbyScreen) */
export const IconJoin = ({ size }: { size?: number }) => (
  <Icon size={size}>
    <path d="M10,14 L14,10" />
    <path d="M9,15 l-2,2 a3.6,3.6 0 0 1 -5.1,-5.1 l3,-3 a3.6,3.6 0 0 1 5.1,0" />
    <path d="M15,9 l2,-2 a3.6,3.6 0 0 1 5.1,5.1 l-3,3 a3.6,3.6 0 0 1 -5.1,0" />
  </Icon>
);

/** 🤖 Hra s botem (LobbyScreen) */
export const IconBot = ({ size }: { size?: number }) => (
  <Icon size={size}>
    <circle cx={12} cy={12} r={3.2} />
    <path d="M12,3.5 L13.6,7.2 M12,3.5 L10.4,7.2" />
    <circle cx={12} cy={12} r={8} strokeDasharray="3.6 2.6" />
    <circle cx={12} cy={12} r={1} fill="currentColor" />
  </Icon>
);

/** 👥 Lokální hra / hotseat (LobbyScreen) */
export const IconHotseat = ({ size }: { size?: number }) => (
  <Icon size={size}>
    <circle cx={9} cy={8.5} r={3} />
    <path d="M3.5,19 Q3.5,13.5 9,13.5 Q14.5,13.5 14.5,19" />
    <circle cx={16.5} cy={9.5} r={2.4} />
    <path d="M16.5,13.8 Q20.5,14.5 20.5,19" />
  </Icon>
);

/** 📖 Jak hrát — návod (LobbyScreen, RulesModal) */
export const IconBook = ({ size }: { size?: number }) => (
  <Icon size={size}>
    <path d="M12,5.5 Q8.5,3.5 3.5,4.5 L3.5,18.5 Q8.5,17.5 12,19.5 Q15.5,17.5 20.5,18.5 L20.5,4.5 Q15.5,3.5 12,5.5 Z" />
    <line x1={12} y1={5.5} x2={12} y2={19.5} />
  </Icon>
);

/** 🎴 Fáze: zahraj kartu (PhaseIndicator, Game) */
export const IconCard = ({ size }: { size?: number }) => (
  <Icon size={size}>
    <rect x={6} y={3.5} width={12} height={17} rx={2} />
    <path d="M9.5,8 L14.5,8" />
    <path d="M9.5,11.5 L14.5,11.5" />
  </Icon>
);

/** ✓ Fáze: aktivace / potvrzení (PhaseIndicator, TurnPanel) */
export const IconCheck = ({ size }: { size?: number }) => (
  <Icon size={size}>
    <circle cx={12} cy={12} r={9} />
    <path d="M7.5,12.5 L10.8,15.5 L16.5,8.8" />
  </Icon>
);

/** ◈ Fáze: pohyb (PhaseIndicator) */
export const IconMove = ({ size }: { size?: number }) => (
  <Icon size={size}>
    <path d="M4,12 L17,12 M13,7.5 L17.5,12 L13,16.5" />
    <path d="M4,7.5 L7,7.5 M4,16.5 L7,16.5" opacity={0.5} />
  </Icon>
);

/** ⚔️ Fáze: útok / boj (PhaseIndicator, CombatLog, TurnPanel) */
export const IconAttack = ({ size }: { size?: number }) => (
  <Icon size={size}>
    <path d="M5,5 L15.5,15.5 M15.5,15.5 L18.5,18.5 M13.5,17.5 L17.5,13.5" />
    <path d="M19,5 L8.5,15.5 M8.5,15.5 L5.5,18.5 M10.5,17.5 L6.5,13.5" />
  </Icon>
);

/** 🏆 Konec hry / vítězství (TurnPanel, VictoryModal, RulesModal) */
export const IconTrophy = ({ size }: { size?: number }) => (
  <Icon size={size}>
    <path d="M8,4 L16,4 L16,10 Q16,14 12,14 Q8,14 8,10 Z" />
    <path d="M8,6 Q4.5,6 4.5,9 Q4.5,11.5 8,11.5 M16,6 Q19.5,6 19.5,9 Q19.5,11.5 16,11.5" />
    <path d="M12,14 L12,17 M9,20 L15,20 L14,17 L10,17 Z" />
  </Icon>
);

/** ◈ Stat: pohyb — podkova (UnitLegend, TurnPanel) */
export const IconStatMove = ({ size }: { size?: number }) => (
  <Icon size={size}>
    <path d="M6,17 Q6,8 12,6 Q18,8 18,17" strokeWidth={2} />
    <path d="M9.5,17 Q9.5,11 12,10 Q14.5,11 14.5,17" opacity={0.5} />
  </Icon>
);

/** ⚔ Stat: útočné kostky — d6 (UnitLegend, TurnPanel) */
export const IconStatDice = ({ size }: { size?: number }) => (
  <Icon size={size}>
    <rect x={4.5} y={4.5} width={15} height={15} rx={3} />
    <circle cx={9} cy={9} r={1.2} fill="currentColor" />
    <circle cx={15} cy={9} r={1.2} fill="currentColor" />
    <circle cx={9} cy={15} r={1.2} fill="currentColor" />
    <circle cx={15} cy={15} r={1.2} fill="currentColor" />
  </Icon>
);

/** ⟶ Stat: dostřel — balistická křivka (UnitLegend) */
export const IconStatRange = ({ size }: { size?: number }) => (
  <Icon size={size}>
    <path d="M4,18 Q12,4 19,9" />
    <path d="M19,9 L15.5,8.6 M19,9 L17.6,12.2" />
  </Icon>
);

/** ♥ Stat: HP — tři figurky (UnitLegend) */
export const IconStatHp = ({ size }: { size?: number }) => (
  <Icon size={size}>
    <rect x={4} y={10} width={4} height={10} rx={1.4} />
    <rect x={10} y={7} width={4} height={13} rx={1.4} />
    <rect x={16} y={4} width={4} height={16} rx={1.4} />
  </Icon>
);

/** 🔒 Přímá palba — zámek (UnitToken, TurnPanel) */
export const IconLock = ({ size }: { size?: number }) => (
  <Icon size={size}>
    <rect x={6} y={11} width={12} height={9} rx={2} />
    <path d="M8.5,11 L8.5,8 Q8.5,4.5 12,4.5 Q15.5,4.5 15.5,8 L15.5,11" />
    <circle cx={12} cy={15.5} r={1.3} fill="currentColor" />
  </Icon>
);

/**
 * Heraldický praporek obtížnosti (karty scénářů) — nahrazuje ⚖️/🔴/🔵.
 * fill: vyvážená #6b7280 · těžká pro modré #1d4ed8 · těžká pro červené #b91c1c
 */
export const DifficultyPennant = ({ fill, stroke }: { fill: string; stroke: string }) => (
  <svg width={20} height={26} viewBox="0 0 20 26">
    <line x1={3} y1={1} x2={3} y2={25} stroke="#4b5563" strokeWidth={1.6} />
    <path d="M4,2 L18,2 L13,7 L18,12 L4,12 Z" fill={fill} stroke={stroke} strokeWidth={1} />
  </svg>
);
