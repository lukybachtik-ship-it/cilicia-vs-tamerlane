import type { UnitInstance, UnitType, FactionId, Position } from '../types/unit';
import type { TerrainCell } from '../types/terrain';
import type { ScenarioEffect } from '../types/game';

/** A scheduled reinforcement wave that appears when Tamerlán picks a flank. */
export interface ReinforcementWave {
  /** Spawn after this turn number completes (Tamerlane's full turn). */
  triggerAfterTurn: number;
  count: number;
  unitType: UnitType;
  faction: FactionId;
  spawnPositions: {
    left:   Position[];
    center: Position[];
    right:  Position[];
  };
}

export type ScenarioUnitSeed = Omit<
  UnitInstance,
  | 'hp' | 'hasMoved' | 'hasAttacked' | 'isActivated'
  | 'attackBonus' | 'moveBonus' | 'directFireLocked' | 'parthianPhase'
  | 'moveHistoryThisTurn' | 'specialAbilityUsed' | 'pilumReady' | 'warcryActive'
>;

export interface ScenarioDefinition {
  id: string;
  nameCs: string;
  descriptionCs: string;
  flavourCs: string;           // historical context
  ciliciaLabel: string;        // what faction is called in this scenario
  tamerlaneLabel: string;
  terrain: TerrainCell[];
  ciliciaUnits: ScenarioUnitSeed[];
  tamerlaneUnits: ScenarioUnitSeed[];
  difficultyCs: string;
  tags: string[];
  // Grid dimensions (default 9×9 if omitted)
  gridRows?: number;
  gridCols?: number;
  // Victory conditions
  killThresholdCilicia: number;   // Tamerlane wins if they destroy this many Kilikie units
  killThresholdTamerlane: number; // Kilikie wins if they destroy this many Tamerlane units
  turnLimit: number | null;       // max full turns; null = no limit
  victoryObjectiveCiliciaCs: string;  // shown in TurnPanel
  victoryObjectiveTamerlaneCs: string;
  // Optional reinforcement waves (Kilíkie uprising)
  reinforcementWaves?: ReinforcementWave[];
  // Optional scenario-wide effects (heat debuff, ambush, named-hero rule)
  scenarioEffects?: ScenarioEffect[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Scénář 1: Bitva o střed
// ─────────────────────────────────────────────────────────────────────────────
export const SCENARIO_STANDARD: ScenarioDefinition = {
  id: 'standard',
  nameCs: 'Bitva o střed',
  descriptionCs: 'Pevnost stojí uprostřed bojiště. Kdo obsadí střed pěchotou, zvítězí. Symetrická bitva vhodná pro první hru.',
  flavourCs: 'Arménské království Kilikie čelí náporu Tamerlánových mongolských hord na otevřeném poli.',
  ciliciaLabel: 'Kilikie',
  tamerlaneLabel: 'Tamerlán',
  difficultyCs: '⚖️ Vyvážená',
  tags: ['výchozí', 'vyvážená'],
  killThresholdCilicia: 4,
  killThresholdTamerlane: 4,
  turnLimit: null,
  victoryObjectiveCiliciaCs: 'Obsadit pevnost pěchotou nebo zničit 4 nepřátele',
  victoryObjectiveTamerlaneCs: 'Obsadit pevnost pěchotou nebo zničit 4 nepřátele',
  terrain: [
    // Pevnost uprostřed bojiště
    { position: { row: 5, col: 5 }, terrain: 'fortress', elevation: 0 },
    // Symetrické kopce
    { position: { row: 4, col: 3 }, terrain: 'hill',    elevation: 1 },
    { position: { row: 4, col: 7 }, terrain: 'hill',    elevation: 1 },
    { position: { row: 6, col: 3 }, terrain: 'hill',    elevation: 1 },
    { position: { row: 6, col: 7 }, terrain: 'hill',    elevation: 1 },
    // Lesy na okrajích
    { position: { row: 6, col: 5 }, terrain: 'forest',  elevation: 0 },
    { position: { row: 7, col: 2 }, terrain: 'forest',  elevation: 0 },
    { position: { row: 7, col: 8 }, terrain: 'forest',  elevation: 0 },
  ],
  ciliciaUnits: [
    // Průzkum a křídla (řada 1)
    { id: 'cil_sc_1',  definitionType: 'scout',          faction: 'cilicia', position: { row: 1, col: 1 } },
    { id: 'cil_ar_1',  definitionType: 'archers',         faction: 'cilicia', position: { row: 1, col: 4 } },
    { id: 'cil_ar_2',  definitionType: 'archers',         faction: 'cilicia', position: { row: 1, col: 6 } },
    { id: 'cil_lc_1',  definitionType: 'light_cavalry',   faction: 'cilicia', position: { row: 1, col: 9 } },
    // Lehká pěchota (řada 2)
    { id: 'cil_li_1',  definitionType: 'light_infantry',  faction: 'cilicia', position: { row: 2, col: 2 } },
    { id: 'cil_li_2',  definitionType: 'light_infantry',  faction: 'cilicia', position: { row: 2, col: 5 } },
    { id: 'cil_li_3',  definitionType: 'light_infantry',  faction: 'cilicia', position: { row: 2, col: 8 } },
    // Těžká pěchota (řada 3)
    { id: 'cil_hi_1',  definitionType: 'heavy_infantry',  faction: 'cilicia', position: { row: 3, col: 3 } },
    { id: 'cil_hi_2',  definitionType: 'heavy_infantry',  faction: 'cilicia', position: { row: 3, col: 5 } },
    { id: 'cil_hi_3',  definitionType: 'heavy_infantry',  faction: 'cilicia', position: { row: 3, col: 7 } },
  ],
  tamerlaneUnits: [
    // Těžká jízda na křídlech (řada 9)
    { id: 'tam_hc_1',  definitionType: 'heavy_cavalry',   faction: 'tamerlane', position: { row: 9, col: 2 } },
    { id: 'tam_hi_1',  definitionType: 'heavy_infantry',  faction: 'tamerlane', position: { row: 9, col: 4 } },
    { id: 'tam_hi_2',  definitionType: 'heavy_infantry',  faction: 'tamerlane', position: { row: 9, col: 6 } },
    { id: 'tam_hc_2',  definitionType: 'heavy_cavalry',   faction: 'tamerlane', position: { row: 9, col: 8 } },
    // Jízdní lučištníci (řada 8)
    { id: 'tam_ha_1',  definitionType: 'horse_archers',   faction: 'tamerlane', position: { row: 8, col: 1 } },
    { id: 'tam_ha_2',  definitionType: 'horse_archers',   faction: 'tamerlane', position: { row: 8, col: 3 } },
    { id: 'tam_li_1',  definitionType: 'light_infantry',  faction: 'tamerlane', position: { row: 8, col: 5 } },
    { id: 'tam_ha_3',  definitionType: 'horse_archers',   faction: 'tamerlane', position: { row: 8, col: 7 } },
    { id: 'tam_ha_4',  definitionType: 'horse_archers',   faction: 'tamerlane', position: { row: 8, col: 9 } },
    // Zvěd ve středu (řada 7)
    { id: 'tam_sc_1',  definitionType: 'scout',           faction: 'tamerlane', position: { row: 7, col: 5 } },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Scénář 2: Obklíčení u Ankary (1402)
// ─────────────────────────────────────────────────────────────────────────────
export const SCENARIO_ANKARA: ScenarioDefinition = {
  id: 'ankara',
  nameCs: 'Obklíčení u Ankary',
  descriptionCs: 'Kilikie drží pevnost jako štáb. Tamerlán útočí masivní jízdou na obou křídlech a snaží se obklíčit koalici. Kilikie musí přežít 12 tahů.',
  flavourCs: '28. července 1402. Tamerlánovy mongolské hordy obklíčily osmansko-cilickou koalici u Ankary. Mongolské jezdectvo hrozí totálním obklíčením.',
  ciliciaLabel: 'Koalice',
  tamerlaneLabel: 'Mongolové',
  difficultyCs: '🔴 Těžká pro Koalici',
  tags: ['historická', 'asymetrická', 'přežití'],
  killThresholdCilicia: 4,
  killThresholdTamerlane: 5,
  turnLimit: 12,
  victoryObjectiveCiliciaCs: 'Přežít 12 tahů nebo zničit 5 nepřátel',
  victoryObjectiveTamerlaneCs: 'Zničit 4 nepřátele nebo obklíčit (2 jezdci v řadách 1–2)',
  terrain: [
    // Pevnost jako štáb Koalice
    { position: { row: 3, col: 5 }, terrain: 'fortress', elevation: 0 },
    // Kopce
    { position: { row: 3, col: 2 }, terrain: 'hill',    elevation: 1 },
    { position: { row: 3, col: 8 }, terrain: 'hill',    elevation: 1 },
    { position: { row: 4, col: 5 }, terrain: 'hill',    elevation: 1 },
    // Lesy zpomalují obchvat
    { position: { row: 5, col: 4 }, terrain: 'forest',  elevation: 0 },
    { position: { row: 5, col: 6 }, terrain: 'forest',  elevation: 0 },
    { position: { row: 6, col: 2 }, terrain: 'forest',  elevation: 0 },
    { position: { row: 6, col: 8 }, terrain: 'forest',  elevation: 0 },
    { position: { row: 7, col: 5 }, terrain: 'forest',  elevation: 0 },
  ],
  ciliciaUnits: [
    // Zvěd a jízda na křídle (řada 1)
    { id: 'cil_sc_1',  definitionType: 'scout',          faction: 'cilicia', position: { row: 1, col: 1 } },
    { id: 'cil_ar_1',  definitionType: 'archers',         faction: 'cilicia', position: { row: 1, col: 3 } },
    { id: 'cil_ar_2',  definitionType: 'archers',         faction: 'cilicia', position: { row: 1, col: 5 } },
    { id: 'cil_ar_3',  definitionType: 'archers',         faction: 'cilicia', position: { row: 1, col: 7 } },
    { id: 'cil_lc_1',  definitionType: 'light_cavalry',   faction: 'cilicia', position: { row: 1, col: 9 } },
    // Slabá pěchota na křídlech (řada 2)
    { id: 'cil_li_1',  definitionType: 'light_infantry',  faction: 'cilicia', position: { row: 2, col: 2 } },
    { id: 'cil_li_2',  definitionType: 'light_infantry',  faction: 'cilicia', position: { row: 2, col: 8 } },
    // Silné pěchotní centrum (řada 2)
    { id: 'cil_hi_1',  definitionType: 'heavy_infantry',  faction: 'cilicia', position: { row: 2, col: 4 } },
    { id: 'cil_hi_2',  definitionType: 'heavy_infantry',  faction: 'cilicia', position: { row: 2, col: 5 } },
    { id: 'cil_hi_3',  definitionType: 'heavy_infantry',  faction: 'cilicia', position: { row: 2, col: 6 } },
  ],
  tamerlaneUnits: [
    // Levé křídlo: průzkum + jízdní lučištníci + těžká jízda
    { id: 'tam_sc_1',  definitionType: 'scout',           faction: 'tamerlane', position: { row: 9, col: 1 } },
    { id: 'tam_ha_1',  definitionType: 'horse_archers',   faction: 'tamerlane', position: { row: 8, col: 2 } },
    { id: 'tam_ha_2',  definitionType: 'horse_archers',   faction: 'tamerlane', position: { row: 9, col: 2 } },
    { id: 'tam_hc_1',  definitionType: 'heavy_cavalry',   faction: 'tamerlane', position: { row: 9, col: 3 } },
    // Střed: pěchota
    { id: 'tam_hc_3',  definitionType: 'heavy_cavalry',   faction: 'tamerlane', position: { row: 8, col: 5 } },
    { id: 'tam_hi_1',  definitionType: 'heavy_infantry',  faction: 'tamerlane', position: { row: 9, col: 4 } },
    { id: 'tam_hi_2',  definitionType: 'heavy_infantry',  faction: 'tamerlane', position: { row: 9, col: 6 } },
    { id: 'tam_li_1',  definitionType: 'light_infantry',  faction: 'tamerlane', position: { row: 8, col: 4 } },
    { id: 'tam_li_2',  definitionType: 'light_infantry',  faction: 'tamerlane', position: { row: 8, col: 6 } },
    // Pravé křídlo: jízdní lučištníci + těžká jízda
    { id: 'tam_ha_3',  definitionType: 'horse_archers',   faction: 'tamerlane', position: { row: 8, col: 8 } },
    { id: 'tam_ha_4',  definitionType: 'horse_archers',   faction: 'tamerlane', position: { row: 9, col: 8 } },
    { id: 'tam_hc_2',  definitionType: 'heavy_cavalry',   faction: 'tamerlane', position: { row: 9, col: 7 } },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Scénář 3: Obléhání pevností
// ─────────────────────────────────────────────────────────────────────────────
export const SCENARIO_BREAKTHROUGH: ScenarioDefinition = {
  id: 'breakthrough',
  nameCs: 'Obléhání pevností',
  descriptionCs: 'Kilikie brání dvě pevnosti. Tamerlán musí obsadit obě nebo zničit 5 nepřátel. Kilikie musí přežít 14 tahů nebo zničit 4 útočníky.',
  flavourCs: 'Tamerlánovy obléhací stroje mají za úkol prorazit arménskou obrannou linii a obsadit obě pevnosti najednou.',
  ciliciaLabel: 'Obránci',
  tamerlaneLabel: 'Útočníci',
  difficultyCs: '🔵 Těžká pro Útočníky',
  tags: ['obrana', 'obléhání', 'asymetrická', 'přežití'],
  killThresholdCilicia: 5,
  killThresholdTamerlane: 4,
  turnLimit: 14,
  victoryObjectiveCiliciaCs: 'Přežít 14 tahů nebo zničit 4 útočníky',
  victoryObjectiveTamerlaneCs: 'Obsadit obě pevnosti nebo zničit 5 obránců',
  terrain: [
    // Dvě pevnosti – linie obrany
    { position: { row: 4, col: 3 }, terrain: 'fortress', elevation: 0 },
    { position: { row: 4, col: 7 }, terrain: 'fortress', elevation: 0 },
    // Kopce pro lučištníky
    { position: { row: 2, col: 5 }, terrain: 'hill',     elevation: 1 },
    { position: { row: 3, col: 1 }, terrain: 'hill',     elevation: 1 },
    { position: { row: 3, col: 9 }, terrain: 'hill',     elevation: 1 },
    // Les – no-man's-land s průchodem u sloupce 5
    { position: { row: 5, col: 2 }, terrain: 'forest',   elevation: 0 },
    { position: { row: 5, col: 3 }, terrain: 'forest',   elevation: 0 },
    { position: { row: 5, col: 4 }, terrain: 'forest',   elevation: 0 },
    { position: { row: 5, col: 6 }, terrain: 'forest',   elevation: 0 },
    { position: { row: 5, col: 7 }, terrain: 'forest',   elevation: 0 },
    { position: { row: 5, col: 8 }, terrain: 'forest',   elevation: 0 },
    { position: { row: 6, col: 3 }, terrain: 'forest',   elevation: 0 },
    { position: { row: 6, col: 7 }, terrain: 'forest',   elevation: 0 },
  ],
  ciliciaUnits: [
    // Elitní garda v levé pevnosti
    { id: 'cil_eg_1',  definitionType: 'elite_guard',    faction: 'cilicia', position: { row: 4, col: 3 } },
    // Lehká pěchota v pravé pevnosti a centru
    { id: 'cil_li_1',  definitionType: 'light_infantry', faction: 'cilicia', position: { row: 4, col: 7 } },
    { id: 'cil_li_2',  definitionType: 'light_infantry', faction: 'cilicia', position: { row: 3, col: 5 } },
    { id: 'cil_li_3',  definitionType: 'light_infantry', faction: 'cilicia', position: { row: 2, col: 3 } },
    { id: 'cil_li_4',  definitionType: 'light_infantry', faction: 'cilicia', position: { row: 2, col: 7 } },
    // Těžká pěchota – záloha
    { id: 'cil_hi_1',  definitionType: 'heavy_infantry', faction: 'cilicia', position: { row: 3, col: 3 } },
    { id: 'cil_hi_2',  definitionType: 'heavy_infantry', faction: 'cilicia', position: { row: 3, col: 7 } },
    // Lučištníci na výšinách
    { id: 'cil_ar_1',  definitionType: 'archers',         faction: 'cilicia', position: { row: 1, col: 3 } },
    { id: 'cil_ar_2',  definitionType: 'archers',         faction: 'cilicia', position: { row: 2, col: 5 } },
    { id: 'cil_ar_3',  definitionType: 'archers',         faction: 'cilicia', position: { row: 1, col: 7 } },
  ],
  tamerlaneUnits: [
    // Těžká jízda na křídle (řada 9)
    { id: 'tam_hc_1',  definitionType: 'heavy_cavalry',  faction: 'tamerlane', position: { row: 9, col: 2 } },
    { id: 'tam_hi_1',  definitionType: 'heavy_infantry', faction: 'tamerlane', position: { row: 9, col: 4 } },
    { id: 'tam_hi_2',  definitionType: 'heavy_infantry', faction: 'tamerlane', position: { row: 9, col: 5 } },
    { id: 'tam_hi_3',  definitionType: 'heavy_infantry', faction: 'tamerlane', position: { row: 9, col: 6 } },
    { id: 'tam_hc_2',  definitionType: 'heavy_cavalry',  faction: 'tamerlane', position: { row: 9, col: 8 } },
    // Obléhací stroje + pěchota (řada 8)
    { id: 'tam_ha_1',  definitionType: 'horse_archers',  faction: 'tamerlane', position: { row: 8, col: 1 } },
    { id: 'tam_li_1',  definitionType: 'light_infantry', faction: 'tamerlane', position: { row: 8, col: 3 } },
    { id: 'tam_os_1',  definitionType: 'siege_machine',  faction: 'tamerlane', position: { row: 8, col: 4 } },
    { id: 'tam_os_2',  definitionType: 'siege_machine',  faction: 'tamerlane', position: { row: 8, col: 6 } },
    { id: 'tam_li_2',  definitionType: 'light_infantry', faction: 'tamerlane', position: { row: 8, col: 7 } },
    { id: 'tam_ha_2',  definitionType: 'horse_archers',  faction: 'tamerlane', position: { row: 8, col: 9 } },
    // Průzkum a jízdní lučištníci (řada 7)
    { id: 'tam_ha_3',  definitionType: 'horse_archers',  faction: 'tamerlane', position: { row: 7, col: 3 } },
    { id: 'tam_sc_1',  definitionType: 'scout',          faction: 'tamerlane', position: { row: 7, col: 5 } },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Scénář 4: Aškelon – Přepad za úsvitu
// Křižáci se plíží do tureckého tábora za tmy. Cíl: dobýt velitelský stan
// dříve, než se probudí turecká posádka.
// ─────────────────────────────────────────────────────────────────────────────
export const SCENARIO_ASCALON: ScenarioDefinition = {
  id: 'ascalon',
  nameCs: 'Aškelon – Přepad za úsvitu',
  descriptionCs: 'Křižáci se za tmy vplíží do tureckého tábora. Musí dobýt velitelský stan, než se probudí celá posádka. Turci se probouzejí ve vlnách — každé dvě kola přichází další posily.',
  flavourCs: 'Rok 1099. Po dobytí Jeruzaléma se křižácké vojsko vydalo na jih, kde v hustých olivovnících spí turecká posádka Aškelonu. Ranní opar skrývá jejich pohyb — ale ne nadlouho.',
  ciliciaLabel: 'Křižáci',
  tamerlaneLabel: 'Turci',
  difficultyCs: '⚔️ Útočná výzva',
  tags: ['přepad', 'závodní', 'asymetrická'],
  killThresholdCilicia: 4,  // Turci vyhrají, pokud zničí 4 křižáky
  killThresholdTamerlane: 99, // Turci nevyhrají zničením jednotek (jen obranou)
  turnLimit: 10,
  victoryObjectiveCiliciaCs: 'Dostat jednotku na velitelský stan (řada 9, sloupec 5) nebo zničit 5 Turků',
  victoryObjectiveTamerlaneCs: 'Zničit 4 křižáky nebo udržet stan do konce kola 10',
  terrain: [
    // Velitelský stan — cíl Křižáků (řada 9, střed)
    { position: { row: 9, col: 5 }, terrain: 'tent',   elevation: 0 },
    // Olivovníky u tábora (turecký tábor, řady 7–8)
    { position: { row: 7, col: 3 }, terrain: 'forest', elevation: 0 },
    { position: { row: 7, col: 7 }, terrain: 'forest', elevation: 0 },
    { position: { row: 8, col: 2 }, terrain: 'forest', elevation: 0 },
    { position: { row: 8, col: 8 }, terrain: 'forest', elevation: 0 },
    // Kopce uprostřed pole (obranná linie)
    { position: { row: 5, col: 3 }, terrain: 'hill',   elevation: 1 },
    { position: { row: 5, col: 7 }, terrain: 'hill',   elevation: 1 },
    // Les na bocích (kanalizuje přepad)
    { position: { row: 4, col: 1 }, terrain: 'forest', elevation: 0 },
    { position: { row: 4, col: 9 }, terrain: 'forest', elevation: 0 },
  ],
  // ── Křižáci (6 jednotek) — startují vpřed (řady 3–4), přepad ───────────
  ciliciaUnits: [
    { id: 'asc_cil_lc_1', definitionType: 'light_cavalry', faction: 'cilicia', position: { row: 3, col: 1 } },
    { id: 'asc_cil_sc_1', definitionType: 'scout',          faction: 'cilicia', position: { row: 3, col: 3 } },
    { id: 'asc_cil_li_1', definitionType: 'light_infantry', faction: 'cilicia', position: { row: 4, col: 5 } },
    { id: 'asc_cil_hi_1', definitionType: 'heavy_infantry', faction: 'cilicia', position: { row: 3, col: 5 } },
    { id: 'asc_cil_li_2', definitionType: 'light_infantry', faction: 'cilicia', position: { row: 4, col: 7 } },
    { id: 'asc_cil_lc_2', definitionType: 'light_cavalry', faction: 'cilicia', position: { row: 3, col: 9 } },
  ],
  // ── Turci: 2 hlídky aktivní + 9 spících (probouzejí se ve vlnách) ───────
  tamerlaneUnits: [
    // Aktivní hlídky od začátku (řady 6–7)
    { id: 'asc_tam_g1',   definitionType: 'light_infantry', faction: 'tamerlane', position: { row: 6, col: 3 } },
    { id: 'asc_tam_g2',   definitionType: 'light_infantry', faction: 'tamerlane', position: { row: 6, col: 7 } },
    // Vlna 1 — probouzí se od kola 4 (lehká jízda + lučištníci)
    { id: 'asc_tam_w4_1', definitionType: 'horse_archers',  faction: 'tamerlane', position: { row: 7, col: 2 }, sleepsUntilTurn: 4 },
    { id: 'asc_tam_w4_2', definitionType: 'light_cavalry',  faction: 'tamerlane', position: { row: 7, col: 5 }, sleepsUntilTurn: 4 },
    { id: 'asc_tam_w4_3', definitionType: 'horse_archers',  faction: 'tamerlane', position: { row: 7, col: 8 }, sleepsUntilTurn: 4 },
    // Vlna 2 — probouzí se od kola 6 (těžká pěchota)
    { id: 'asc_tam_w6_1', definitionType: 'heavy_infantry', faction: 'tamerlane', position: { row: 8, col: 3 }, sleepsUntilTurn: 6 },
    { id: 'asc_tam_w6_2', definitionType: 'heavy_infantry', faction: 'tamerlane', position: { row: 8, col: 7 }, sleepsUntilTurn: 6 },
    { id: 'asc_tam_w6_3', definitionType: 'archers',        faction: 'tamerlane', position: { row: 8, col: 5 }, sleepsUntilTurn: 6 },
    // Vlna 3 — probouzí se od kola 8 (těžká jízda + velitelova stráž NA stanu)
    { id: 'asc_tam_w8_1', definitionType: 'heavy_cavalry',  faction: 'tamerlane', position: { row: 9, col: 2 }, sleepsUntilTurn: 8 },
    { id: 'asc_tam_w8_2', definitionType: 'elite_guard',    faction: 'tamerlane', position: { row: 9, col: 5 }, sleepsUntilTurn: 8 },
    { id: 'asc_tam_w8_3', definitionType: 'heavy_cavalry',  faction: 'tamerlane', position: { row: 9, col: 8 }, sleepsUntilTurn: 8 },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Scénář 5: Povstání v Kilíkii — Epický formát (11×9)
// Místní milice povstalá proti Tamerlánovi čeká na pomoc Křižáků.
// Tamerlán dobývá zpět vesnice; Křižáci musí přijít včas.
// ─────────────────────────────────────────────────────────────────────────────
export const SCENARIO_KILICIE_UPRISING: ScenarioDefinition = {
  id: 'kilicie_uprising',
  nameCs: 'Povstání v Kilíkii',
  descriptionCs: 'Kilická milice povstala proti Tamerlánovu jhu. Křižáci vyslali předvoj, ale hlavní síla přijde pozdě. Tamerlánova rychlá jízda musí překonat tvrdohlavé vesničany i rytířský předvoj.',
  flavourCs: 'Rok 1400. Tamerlán zpustošil Kilíkii a vyžaduje tributy. Vesničané se zvedají k odporu — ale jsou slabí. Křižáčtí rytíři se vydávají na pochod a dávají předvoj vpřed. Každá hodina se počítá.',
  ciliciaLabel: 'Křižáci & Milice',
  tamerlaneLabel: 'Tamerlánova vojska',
  difficultyCs: '🗺️ Epická asymetrie',
  tags: ['epický', 'posily', 'milice', 'více front', 'asymetrická'],
  gridRows: 11,
  gridCols: 9,
  killThresholdCilicia: 99, // Tamerlán tímto nevyhrává — jen vesnicemi nebo milicemi
  killThresholdTamerlane: 5, // Kilikie může vyhrát zabitím 5 nepřátel
  turnLimit: 16,
  victoryObjectiveCiliciaCs: 'Přežít 16 tahů nebo zničit 5 nepřátel',
  victoryObjectiveTamerlaneCs: 'Obsadit 4 vesnice NEBO zničit všechny milice',
  terrain: [
    // ── Vesnice (cílové hexy) ────────────────────────────────────────────
    { position: { row: 3, col: 2 }, terrain: 'village', elevation: 0 }, // levá-blízká
    { position: { row: 3, col: 8 }, terrain: 'village', elevation: 0 }, // pravá-blízká
    { position: { row: 6, col: 5 }, terrain: 'village', elevation: 0 }, // střed
    { position: { row: 9, col: 2 }, terrain: 'village', elevation: 0 }, // levá-vzdálená
    { position: { row: 9, col: 8 }, terrain: 'village', elevation: 0 }, // pravá-vzdálená
    // ── Terén ──────────────────────────────────────────────────────────
    { position: { row: 4, col: 5 }, terrain: 'hill',    elevation: 1 }, // centrální výšina
    { position: { row: 5, col: 1 }, terrain: 'forest',  elevation: 0 }, // levý les
    { position: { row: 5, col: 9 }, terrain: 'forest',  elevation: 0 }, // pravý les
    { position: { row: 7, col: 4 }, terrain: 'forest',  elevation: 0 }, // středový les (L)
    { position: { row: 7, col: 6 }, terrain: 'forest',  elevation: 0 }, // středový les (P)
    { position: { row: 8, col: 5 }, terrain: 'hill',    elevation: 1 }, // jižní výšina
    { position: { row: 2, col: 4 }, terrain: 'hill',    elevation: 1 }, // severní výšina L
    { position: { row: 2, col: 6 }, terrain: 'hill',    elevation: 1 }, // severní výšina P
  ],
  // ── Křižáci (8 jednotek) — hlavní síla na severu (řady 1–2), předvoj ve středu (řady 4–5) ──
  ciliciaUnits: [
    // Hlavní síla — severní hrana (řady 1–2)
    { id: 'kil_cil_lc_1', definitionType: 'light_cavalry', faction: 'cilicia', position: { row: 1, col: 1 } },
    { id: 'kil_cil_hi_1', definitionType: 'heavy_infantry',faction: 'cilicia', position: { row: 1, col: 3 } },
    { id: 'kil_cil_ar_1', definitionType: 'archers',        faction: 'cilicia', position: { row: 2, col: 5 } },
    { id: 'kil_cil_li_1', definitionType: 'light_infantry', faction: 'cilicia', position: { row: 1, col: 7 } },
    { id: 'kil_cil_lc_2', definitionType: 'light_cavalry', faction: 'cilicia', position: { row: 1, col: 9 } },
    // Předvoj — vyslaný dopředu (řady 4–5), tvoří obrannou linii před vesnicemi
    { id: 'kil_cil_hi_2', definitionType: 'heavy_infantry', faction: 'cilicia', position: { row: 4, col: 5 } }, // na centrální výšině
    { id: 'kil_cil_lc_3', definitionType: 'light_cavalry',  faction: 'cilicia', position: { row: 5, col: 2 } }, // levý bok
    { id: 'kil_cil_lc_4', definitionType: 'light_cavalry',  faction: 'cilicia', position: { row: 5, col: 8 } }, // pravý bok
    // Místní milice — stojí přímo na vesnicích
    { id: 'kil_ml_1',     definitionType: 'militia',        faction: 'cilicia', position: { row: 3, col: 2 } }, // levá přední vesnice
    { id: 'kil_ml_2',     definitionType: 'militia',        faction: 'cilicia', position: { row: 3, col: 8 } }, // pravá přední vesnice
    { id: 'kil_ml_3',     definitionType: 'militia',        faction: 'cilicia', position: { row: 6, col: 5 } }, // centrální vesnice (přímo na ní)
    { id: 'kil_ml_4',     definitionType: 'militia',        faction: 'cilicia', position: { row: 6, col: 4 } }, // podpora centra
    { id: 'kil_ml_5',     definitionType: 'militia',        faction: 'cilicia', position: { row: 9, col: 2 } }, // levá vzdálená vesnice (přímo na ní)
    { id: 'kil_ml_6',     definitionType: 'militia',        faction: 'cilicia', position: { row: 9, col: 8 } }, // pravá vzdálená vesnice (přímo na ní)
  ],
  // ── Tamerlán (7 jednotek) — vstupuje z jihu (řady 10–11) ───────────────
  tamerlaneUnits: [
    { id: 'kil_tam_hc_1', definitionType: 'heavy_cavalry',  faction: 'tamerlane', position: { row: 11, col: 2 } },
    { id: 'kil_tam_ha_1', definitionType: 'horse_archers',  faction: 'tamerlane', position: { row: 11, col: 4 } },
    { id: 'kil_tam_hi_1', definitionType: 'heavy_infantry', faction: 'tamerlane', position: { row: 11, col: 5 } },
    { id: 'kil_tam_ha_2', definitionType: 'horse_archers',  faction: 'tamerlane', position: { row: 11, col: 6 } },
    { id: 'kil_tam_hc_2', definitionType: 'heavy_cavalry',  faction: 'tamerlane', position: { row: 11, col: 8 } },
    { id: 'kil_tam_li_1', definitionType: 'light_infantry', faction: 'tamerlane', position: { row: 10, col: 3 } },
    { id: 'kil_tam_li_2', definitionType: 'light_infantry', faction: 'tamerlane', position: { row: 10, col: 7 } },
  ],
  // ── Posily Tamerlána — každé 4 kola, hráč volí křídlo ─────────────────
  reinforcementWaves: [
    {
      triggerAfterTurn: 4,
      count: 2,
      unitType: 'light_cavalry',
      faction: 'tamerlane',
      spawnPositions: {
        left:   [{ row: 11, col: 1 }, { row: 11, col: 2 }],
        center: [{ row: 11, col: 4 }, { row: 11, col: 5 }],
        right:  [{ row: 11, col: 8 }, { row: 11, col: 9 }],
      },
    },
    {
      triggerAfterTurn: 8,
      count: 2,
      unitType: 'horse_archers',
      faction: 'tamerlane',
      spawnPositions: {
        left:   [{ row: 11, col: 1 }, { row: 11, col: 2 }],
        center: [{ row: 11, col: 4 }, { row: 11, col: 5 }],
        right:  [{ row: 11, col: 8 }, { row: 11, col: 9 }],
      },
    },
    {
      triggerAfterTurn: 12,
      count: 2,
      unitType: 'heavy_cavalry',
      faction: 'tamerlane',
      spawnPositions: {
        left:   [{ row: 11, col: 1 }, { row: 11, col: 2 }],
        center: [{ row: 11, col: 4 }, { row: 11, col: 5 }],
        right:  [{ row: 11, col: 8 }, { row: 11, col: 9 }],
      },
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Scénář 6: Les Teutoburský (9 n. l.) — Varova katastrofa
// Cilicia = Římské legie (sever, sloup v pochodu)
// Tamerlane = Germánské kmeny (jih, skrytý přepad z lesa)
// ─────────────────────────────────────────────────────────────────────────────
export const SCENARIO_TEUTOBURG: ScenarioDefinition = {
  id: 'teutoburg',
  nameCs: 'Les Teutoburský',
  descriptionCs:
    'Varovy tři legie pochodují v úzkém průseku hustým lesem. Germánské kmeny pod Arminiem čekají ukryté mezi stromy. Římané musí projít — nebo pobít vůdce povstání.',
  flavourCs:
    '9. n. l. Publius Quinctilius Varus vede XVII., XVIII. a XIX. legii přes les na sever. V bažinaté úžlabině se stromy hemží germánskými válečníky. Kdo nevidí nepřítele, tomu hrozí vyhubení.',
  ciliciaLabel: 'Římané',
  tamerlaneLabel: 'Germáni',
  difficultyCs: '🌲 Přepadová past',
  tags: ['přepad', 'historická', 'les', 'asymetrická'],
  killThresholdCilicia: 5,   // Germáni vyhrají, pokud pobijí 5 římanů
  killThresholdTamerlane: 99, // Římané vítězí buď průchodem nebo zabitím Arminia (named_hero_rule)
  turnLimit: 10,
  victoryObjectiveCiliciaCs: 'Dostat 3 legionáře na řadu 9 do 10 kol NEBO zabít Arminia',
  victoryObjectiveTamerlaneCs: 'Zničit 5 Římanů NEBO udržet Arminia 10 kol',
  terrain: [
    // Hlavní průsek (sloupec 5) jako volný, zbytek lesa
    { position: { row: 2, col: 2 }, terrain: 'ambush_forest', elevation: 0 },
    { position: { row: 2, col: 8 }, terrain: 'ambush_forest', elevation: 0 },
    { position: { row: 3, col: 1 }, terrain: 'ambush_forest', elevation: 0 },
    { position: { row: 3, col: 3 }, terrain: 'ambush_forest', elevation: 0 },
    { position: { row: 3, col: 7 }, terrain: 'ambush_forest', elevation: 0 },
    { position: { row: 3, col: 9 }, terrain: 'ambush_forest', elevation: 0 },
    { position: { row: 4, col: 2 }, terrain: 'ambush_forest', elevation: 0 },
    { position: { row: 4, col: 4 }, terrain: 'ambush_forest', elevation: 0 },
    { position: { row: 4, col: 6 }, terrain: 'ambush_forest', elevation: 0 },
    { position: { row: 4, col: 8 }, terrain: 'ambush_forest', elevation: 0 },
    { position: { row: 5, col: 1 }, terrain: 'ambush_forest', elevation: 0 },
    { position: { row: 5, col: 3 }, terrain: 'ambush_forest', elevation: 0 },
    { position: { row: 5, col: 7 }, terrain: 'ambush_forest', elevation: 0 },
    { position: { row: 5, col: 9 }, terrain: 'ambush_forest', elevation: 0 },
    { position: { row: 6, col: 2 }, terrain: 'ambush_forest', elevation: 0 },
    { position: { row: 6, col: 4 }, terrain: 'ambush_forest', elevation: 0 },
    { position: { row: 6, col: 6 }, terrain: 'ambush_forest', elevation: 0 },
    { position: { row: 6, col: 8 }, terrain: 'ambush_forest', elevation: 0 },
    { position: { row: 7, col: 1 }, terrain: 'ambush_forest', elevation: 0 },
    { position: { row: 7, col: 3 }, terrain: 'ambush_forest', elevation: 0 },
    { position: { row: 7, col: 7 }, terrain: 'ambush_forest', elevation: 0 },
    { position: { row: 7, col: 9 }, terrain: 'ambush_forest', elevation: 0 },
    { position: { row: 8, col: 2 }, terrain: 'ambush_forest', elevation: 0 },
    { position: { row: 8, col: 8 }, terrain: 'ambush_forest', elevation: 0 },
    // Malý kopec v centru (terénní orientační bod)
    { position: { row: 5, col: 5 }, terrain: 'hill', elevation: 1 },
  ],
  ciliciaUnits: [
    // Pochodový sloup — rozprostřený od řady 1 k řadě 4
    { id: 'teu_cil_sc',   definitionType: 'scout',       faction: 'cilicia', position: { row: 1, col: 5 } },
    { id: 'teu_cil_aux1', definitionType: 'auxilia',     faction: 'cilicia', position: { row: 1, col: 4 } },
    { id: 'teu_cil_aux2', definitionType: 'auxilia',     faction: 'cilicia', position: { row: 1, col: 6 } },
    { id: 'teu_cil_leg1', definitionType: 'legionary',   faction: 'cilicia', position: { row: 2, col: 5 } },
    { id: 'teu_cil_sag',  definitionType: 'sagittarii',  faction: 'cilicia', position: { row: 2, col: 4 } },
    { id: 'teu_cil_leg2', definitionType: 'legionary',   faction: 'cilicia', position: { row: 2, col: 6 } },
    { id: 'teu_cil_leg3', definitionType: 'legionary',   faction: 'cilicia', position: { row: 3, col: 5 } },
    { id: 'teu_cil_pre',  definitionType: 'praetorian',  faction: 'cilicia', position: { row: 3, col: 4 } },
    { id: 'teu_cil_leg4', definitionType: 'legionary',   faction: 'cilicia', position: { row: 3, col: 6 } },
    { id: 'teu_cil_eq',   definitionType: 'equites',     faction: 'cilicia', position: { row: 4, col: 5 } },
  ],
  tamerlaneUnits: [
    // Skrytá past v lese — rozptýleni po stranách průseku
    { id: 'teu_tam_arm',  definitionType: 'arminius',          faction: 'tamerlane', position: { row: 6, col: 6 } },
    { id: 'teu_tam_ch',   definitionType: 'germanic_chieftain', faction: 'tamerlane', position: { row: 5, col: 3 } },
    { id: 'teu_tam_gw1',  definitionType: 'germanic_warrior',   faction: 'tamerlane', position: { row: 4, col: 2 } },
    { id: 'teu_tam_gw2',  definitionType: 'germanic_warrior',   faction: 'tamerlane', position: { row: 4, col: 8 } },
    { id: 'teu_tam_gw3',  definitionType: 'germanic_warrior',   faction: 'tamerlane', position: { row: 5, col: 7 } },
    { id: 'teu_tam_gw4',  definitionType: 'germanic_warrior',   faction: 'tamerlane', position: { row: 6, col: 4 } },
    { id: 'teu_tam_gw5',  definitionType: 'germanic_warrior',   faction: 'tamerlane', position: { row: 7, col: 3 } },
    { id: 'teu_tam_gw6',  definitionType: 'germanic_warrior',   faction: 'tamerlane', position: { row: 7, col: 7 } },
    { id: 'teu_tam_fr1',  definitionType: 'framea_thrower',     faction: 'tamerlane', position: { row: 3, col: 3 } },
    { id: 'teu_tam_fr2',  definitionType: 'framea_thrower',     faction: 'tamerlane', position: { row: 3, col: 7 } },
    { id: 'teu_tam_fr3',  definitionType: 'framea_thrower',     faction: 'tamerlane', position: { row: 8, col: 2 } },
  ],
  scenarioEffects: [
    {
      id: 'teu_ambush',
      descriptionCs: 'Přepad v lese — Germáni skryti, dokud se Římané nedostanou do 2 hexů',
      kind: 'ambush_hidden',
      fromTurn: 1,
      affectedFaction: 'tamerlane',
    },
    {
      id: 'teu_arminius',
      descriptionCs: 'Padne-li Arminius, povstání se zhroutí',
      kind: 'named_hero_rule',
      fromTurn: 1,
      affectedFaction: 'tamerlane',
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Scénář 7: Vercellae (101 př. n. l.) — Marius a Kimbrové
// Cilicia = Římané (Marius), Tamerlane = Kimbrové
// Otevřená pláň, centrální wagenburg, letní žár od kola 4
// ─────────────────────────────────────────────────────────────────────────────
export const SCENARIO_VERCELLAE: ScenarioDefinition = {
  id: 'vercellae',
  nameCs: 'Bitva u Vercellae',
  descriptionCs:
    'Mariovy legie se střetávají s obrovskou hordou Kimbrů na rozpálené italské pláni. Kimbrové útočí zuřivě, ale letní slunce je rychle vysiluje. Římská disciplína musí vydržet první nápor.',
  flavourCs:
    '30. července 101 př. n. l. Gaius Marius v pláních u Vercellae. Kimbrové v kožešinách bojují po ránu, ale odpoledne slunce zlomí jejich řev. Jedna z nejkrvavějších římských vítězství.',
  ciliciaLabel: 'Římané',
  tamerlaneLabel: 'Kimbrové',
  difficultyCs: '⚔️ Polní bitva',
  tags: ['polní', 'vyvážená', 'antika', 'wagenburg'],
  killThresholdCilicia: 5,
  killThresholdTamerlane: 6,
  turnLimit: 14,
  victoryObjectiveCiliciaCs: 'Zničit 6 Kimbrů NEBO dobýt oba wagenburgy (řada 8)',
  victoryObjectiveTamerlaneCs: 'Zničit 5 Římanů NEBO udržet alespoň jeden wagenburg do kola 14',
  terrain: [
    // Dva wagenburgy hluboko v kimberském týlu (řada 8) — strukturální HP 4 každý
    { position: { row: 8, col: 4 }, terrain: 'wagenburg', elevation: 0, structureHp: 4 },
    { position: { row: 8, col: 6 }, terrain: 'wagenburg', elevation: 0, structureHp: 4 },
    // Kopce pro scorpio a sagittarie
    { position: { row: 2, col: 3 }, terrain: 'hill', elevation: 1 },
    { position: { row: 2, col: 7 }, terrain: 'hill', elevation: 1 },
    { position: { row: 6, col: 2 }, terrain: 'hill', elevation: 1 },
    { position: { row: 6, col: 8 }, terrain: 'hill', elevation: 1 },
    // Ostrůvky lesa na okrajích
    { position: { row: 5, col: 1 }, terrain: 'forest', elevation: 0 },
    { position: { row: 5, col: 9 }, terrain: 'forest', elevation: 0 },
    { position: { row: 6, col: 5 }, terrain: 'forest', elevation: 0 },
  ],
  ciliciaUnits: [
    // Řada 2: lučištníci + scorpio na kopci
    { id: 'ver_cil_sag1', definitionType: 'sagittarii', faction: 'cilicia', position: { row: 2, col: 3 } },
    { id: 'ver_cil_sc',   definitionType: 'scorpio',    faction: 'cilicia', position: { row: 2, col: 5 } },
    { id: 'ver_cil_sag2', definitionType: 'sagittarii', faction: 'cilicia', position: { row: 2, col: 7 } },
    // Řada 3: jízda po stranách
    { id: 'ver_cil_eq1',  definitionType: 'equites',    faction: 'cilicia', position: { row: 3, col: 1 } },
    { id: 'ver_cil_aux1', definitionType: 'auxilia',    faction: 'cilicia', position: { row: 3, col: 3 } },
    { id: 'ver_cil_leg1', definitionType: 'legionary',  faction: 'cilicia', position: { row: 3, col: 5 } },
    { id: 'ver_cil_aux2', definitionType: 'auxilia',    faction: 'cilicia', position: { row: 3, col: 7 } },
    { id: 'ver_cil_eq2',  definitionType: 'equites',    faction: 'cilicia', position: { row: 3, col: 9 } },
    // Řada 4: hlavní legie + praetorian
    { id: 'ver_cil_leg2', definitionType: 'legionary',  faction: 'cilicia', position: { row: 4, col: 3 } },
    { id: 'ver_cil_leg3', definitionType: 'legionary',  faction: 'cilicia', position: { row: 4, col: 5 } },
    { id: 'ver_cil_leg4', definitionType: 'legionary',  faction: 'cilicia', position: { row: 4, col: 7 } },
    { id: 'ver_cil_pre',  definitionType: 'praetorian', faction: 'cilicia', position: { row: 4, col: 4 } },
  ],
  tamerlaneUnits: [
    // Germáni bránící wagenburgy (přímo na hexech)
    { id: 'ver_tam_ch',   definitionType: 'germanic_chieftain', faction: 'tamerlane', position: { row: 8, col: 4 } },
    { id: 'ver_tam_gw1',  definitionType: 'germanic_warrior',   faction: 'tamerlane', position: { row: 8, col: 6 } },
    // První linie (řada 6–7): záporná zóna předběhnutí
    { id: 'ver_tam_gw2',  definitionType: 'germanic_warrior',   faction: 'tamerlane', position: { row: 6, col: 5 } },
    { id: 'ver_tam_gw3',  definitionType: 'germanic_warrior',   faction: 'tamerlane', position: { row: 7, col: 4 } },
    { id: 'ver_tam_gw4',  definitionType: 'germanic_warrior',   faction: 'tamerlane', position: { row: 7, col: 6 } },
    // Druhá linie (řada 7): široká fronta
    { id: 'ver_tam_fr1',  definitionType: 'framea_thrower',     faction: 'tamerlane', position: { row: 7, col: 2 } },
    { id: 'ver_tam_gw5',  definitionType: 'germanic_warrior',   faction: 'tamerlane', position: { row: 7, col: 3 } },
    { id: 'ver_tam_gw6',  definitionType: 'germanic_warrior',   faction: 'tamerlane', position: { row: 7, col: 7 } },
    { id: 'ver_tam_fr2',  definitionType: 'framea_thrower',     faction: 'tamerlane', position: { row: 7, col: 8 } },
    // Záloha (řada 9)
    { id: 'ver_tam_gw7',  definitionType: 'germanic_warrior',   faction: 'tamerlane', position: { row: 9, col: 3 } },
    { id: 'ver_tam_gw8',  definitionType: 'germanic_warrior',   faction: 'tamerlane', position: { row: 9, col: 7 } },
  ],
  scenarioEffects: [
    {
      id: 'ver_heat',
      descriptionCs: 'Žár pláně — Kimbrové −1 kostka útoku',
      kind: 'heat_debuff',
      fromTurn: 4,
      affectedFaction: 'tamerlane',
      affectedUnitTypes: ['germanic_warrior', 'germanic_chieftain', 'framea_thrower'],
      diceModifier: -1,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Scénář 8: Obléhání Forlì (1500) — Cesare Borgia vs Caterina Sforza "La Tigre"
// Cilicia = Obránci Ravaldina (Caterina), Tamerlane = Borgiova armáda
// Hradby s HP 3, centrální citadela, kulveriny Cesareho zdola
// ─────────────────────────────────────────────────────────────────────────────
export const SCENARIO_FORLI: ScenarioDefinition = {
  id: 'forli',
  nameCs: 'Obléhání Forlì',
  descriptionCs:
    'Cesare Borgia útočí na citadelu Ravaldino. Caterina Sforza, "La Tigre", velí z hradeb sama. Borgiovy kulveriny musí rozbít zdi dříve, než Caterina jeho vojsko vyčerpá.',
  flavourCs:
    'Prosinec 1499. Cesare se svými condottieri a obléhacími děly stojí před Ravaldinem. Caterina Sforza, vdova po Riariovi, odmítla kapitulaci. "Mám ještě, čím bojovat," vzkázala.',
  ciliciaLabel: 'Caterina',
  tamerlaneLabel: 'Borgiova armáda',
  difficultyCs: '🏰 Obléhání',
  tags: ['obléhání', 'renesance', 'historická', 'asymetrická', 'named_hero'],
  killThresholdCilicia: 99,  // Cesare vyhrává obsazením citadely nebo smrtí Catheriny
  killThresholdTamerlane: 99,// Caterina vyhrává přežitím nebo zničením všech kulverin
  turnLimit: 14,
  victoryObjectiveCiliciaCs: 'Přežít 14 kol NEBO zničit obě kulveriny',
  victoryObjectiveTamerlaneCs: 'Dobýt citadelu (řada 2, sloupec 5) pěchotou NEBO zabít Caterinu',
  terrain: [
    // Citadela (fortress) uprostřed horní části
    { position: { row: 2, col: 5 }, terrain: 'fortress', elevation: 0 },
    // Hradby okolo citadely (HP 3 každá)
    { position: { row: 2, col: 4 }, terrain: 'wall', elevation: 0, structureHp: 3 },
    { position: { row: 2, col: 6 }, terrain: 'wall', elevation: 0, structureHp: 3 },
    { position: { row: 3, col: 4 }, terrain: 'wall', elevation: 0, structureHp: 3 },
    { position: { row: 3, col: 5 }, terrain: 'wall', elevation: 0, structureHp: 3 },
    { position: { row: 3, col: 6 }, terrain: 'wall', elevation: 0, structureHp: 3 },
    // Vinice mezi pozicemi (pomalý terén)
    { position: { row: 5, col: 3 }, terrain: 'vineyard', elevation: 0 },
    { position: { row: 5, col: 5 }, terrain: 'vineyard', elevation: 0 },
    { position: { row: 5, col: 7 }, terrain: 'vineyard', elevation: 0 },
    { position: { row: 6, col: 4 }, terrain: 'vineyard', elevation: 0 },
    { position: { row: 6, col: 6 }, terrain: 'vineyard', elevation: 0 },
    // Kopec pro kulveriny
    { position: { row: 8, col: 4 }, terrain: 'hill', elevation: 1 },
    { position: { row: 8, col: 6 }, terrain: 'hill', elevation: 1 },
  ],
  ciliciaUnits: [
    // Caterina na citadele
    { id: 'for_cil_cat',  definitionType: 'caterina_sforza', faction: 'cilicia', position: { row: 2, col: 5 } },
    // Arkebuzíři na hradbách
    { id: 'for_cil_aq1',  definitionType: 'arquebusier', faction: 'cilicia', position: { row: 1, col: 4 } },
    { id: 'for_cil_aq2',  definitionType: 'arquebusier', faction: 'cilicia', position: { row: 1, col: 5 } },
    { id: 'for_cil_aq3',  definitionType: 'arquebusier', faction: 'cilicia', position: { row: 1, col: 6 } },
    // Kušiníci (obrana z hradeb)
    { id: 'for_cil_cb1',  definitionType: 'crossbowman', faction: 'cilicia', position: { row: 1, col: 3 } },
    { id: 'for_cil_cb2',  definitionType: 'crossbowman', faction: 'cilicia', position: { row: 1, col: 7 } },
    // Pikenýři před branou
    { id: 'for_cil_pk1',  definitionType: 'pikeman',     faction: 'cilicia', position: { row: 2, col: 3 } },
    { id: 'for_cil_pk2',  definitionType: 'pikeman',     faction: 'cilicia', position: { row: 2, col: 7 } },
    // Rodeleros pro výpady
    { id: 'for_cil_rd1',  definitionType: 'rodelero',    faction: 'cilicia', position: { row: 3, col: 3 } },
    { id: 'for_cil_rd2',  definitionType: 'rodelero',    faction: 'cilicia', position: { row: 3, col: 7 } },
  ],
  tamerlaneUnits: [
    // Cesare v týlu
    { id: 'for_tam_ces',  definitionType: 'cesare_borgia',  faction: 'tamerlane', position: { row: 9, col: 5 } },
    // Dvě kulveriny na kopcích
    { id: 'for_tam_cv1',  definitionType: 'culverin',       faction: 'tamerlane', position: { row: 8, col: 4 } },
    { id: 'for_tam_cv2',  definitionType: 'culverin',       faction: 'tamerlane', position: { row: 8, col: 6 } },
    // Gendarmi jako hlavní úderná síla
    { id: 'for_tam_gd1',  definitionType: 'gendarme',       faction: 'tamerlane', position: { row: 8, col: 2 } },
    { id: 'for_tam_gd2',  definitionType: 'gendarme',       faction: 'tamerlane', position: { row: 8, col: 8 } },
    // Kondotiéři (mohou být obráceni Cesarovou zradou v přípdaě obrany)
    { id: 'for_tam_kd1',  definitionType: 'condottiero',    faction: 'tamerlane', position: { row: 9, col: 3 } },
    { id: 'for_tam_kd2',  definitionType: 'condottiero',    faction: 'tamerlane', position: { row: 9, col: 7 } },
    // Pikenýři jako pěší podpora
    { id: 'for_tam_pk1',  definitionType: 'pikeman',        faction: 'tamerlane', position: { row: 7, col: 4 } },
    { id: 'for_tam_pk2',  definitionType: 'pikeman',        faction: 'tamerlane', position: { row: 7, col: 6 } },
    // Stradiot jako průzkum
    { id: 'for_tam_sd',   definitionType: 'stradiot',       faction: 'tamerlane', position: { row: 9, col: 1 } },
  ],
  scenarioEffects: [
    {
      id: 'for_caterina',
      descriptionCs: 'Padne-li Caterina Sforza, obrana Ravaldina padne',
      kind: 'named_hero_rule',
      fromTurn: 1,
      affectedFaction: 'cilicia',
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Scénář 9: Bitva u Cerignoly (1503) — První gunpowder vítězství
// Cilicia = Francouzi (Nemours), Tamerlane = Španělé (Gonzalo de Córdoba)
// Francouzští gendarmi útočí na španělské zákopy s arkebuzíry
// ─────────────────────────────────────────────────────────────────────────────
export const SCENARIO_CERIGNOLA: ScenarioDefinition = {
  id: 'cerignola',
  nameCs: 'Bitva u Cerignoly',
  descriptionCs:
    'První bitva v dějinách, kterou rozhodly ruční palné zbraně. Francouzští gendarmi útočí na španělské zákopy, ale arkebuzíři za okopy a vinicemi střílí dřív, než piky dorazí. Volejová palba mění válku navždy.',
  flavourCs:
    '28. dubna 1503. Gonzalo "El Gran Capitán" nechal vyhloubit zákopy ve vinicích. Francouzský velitel Nemours nařídil čelní útok gendarmy. Byl prvním z tisíců, které kulka srazila.',
  ciliciaLabel: 'Francouzi',
  tamerlaneLabel: 'Španělé',
  difficultyCs: '🔫 Palná zbraň',
  tags: ['renesance', 'gunpowder', 'historická', 'obrana', 'vyvážená'],
  killThresholdCilicia: 5,
  killThresholdTamerlane: 6,
  turnLimit: 10,
  victoryObjectiveCiliciaCs: 'Dostat jednotku na řadu 9 (průlom do týlu) NEBO zničit 6 Španělů',
  victoryObjectiveTamerlaneCs: 'Zničit 5 Francouzů NEBO držet zákopy 10 kol',
  terrain: [
    // Vinice v prostoru mezi liniemi
    { position: { row: 3, col: 2 }, terrain: 'vineyard', elevation: 0 },
    { position: { row: 3, col: 5 }, terrain: 'vineyard', elevation: 0 },
    { position: { row: 3, col: 8 }, terrain: 'vineyard', elevation: 0 },
    { position: { row: 4, col: 3 }, terrain: 'vineyard', elevation: 0 },
    { position: { row: 4, col: 5 }, terrain: 'vineyard', elevation: 0 },
    { position: { row: 4, col: 7 }, terrain: 'vineyard', elevation: 0 },
    // Španělské zákopy — celá řada 5
    { position: { row: 5, col: 2 }, terrain: 'trench', elevation: 0 },
    { position: { row: 5, col: 3 }, terrain: 'trench', elevation: 0 },
    { position: { row: 5, col: 4 }, terrain: 'trench', elevation: 0 },
    { position: { row: 5, col: 5 }, terrain: 'trench', elevation: 0 },
    { position: { row: 5, col: 6 }, terrain: 'trench', elevation: 0 },
    { position: { row: 5, col: 7 }, terrain: 'trench', elevation: 0 },
    { position: { row: 5, col: 8 }, terrain: 'trench', elevation: 0 },
    // Kopec pro španělskou artilerii (kulverina)
    { position: { row: 8, col: 5 }, terrain: 'hill', elevation: 1 },
  ],
  ciliciaUnits: [
    // Francouzi — gendarmi vpředu (řada 1-2), švýcarští pikenýři, kušiníci
    { id: 'cer_cil_gd1',  definitionType: 'gendarme',    faction: 'cilicia', position: { row: 1, col: 3 } },
    { id: 'cer_cil_gd2',  definitionType: 'gendarme',    faction: 'cilicia', position: { row: 1, col: 5 } },
    { id: 'cer_cil_gd3',  definitionType: 'gendarme',    faction: 'cilicia', position: { row: 1, col: 7 } },
    { id: 'cer_cil_pk1',  definitionType: 'pikeman',     faction: 'cilicia', position: { row: 2, col: 3 } },
    { id: 'cer_cil_pk2',  definitionType: 'pikeman',     faction: 'cilicia', position: { row: 2, col: 5 } },
    { id: 'cer_cil_pk3',  definitionType: 'pikeman',     faction: 'cilicia', position: { row: 2, col: 7 } },
    { id: 'cer_cil_cb1',  definitionType: 'crossbowman', faction: 'cilicia', position: { row: 2, col: 2 } },
    { id: 'cer_cil_cb2',  definitionType: 'crossbowman', faction: 'cilicia', position: { row: 2, col: 8 } },
    { id: 'cer_cil_sd',   definitionType: 'stradiot',    faction: 'cilicia', position: { row: 1, col: 1 } },
    { id: 'cer_cil_sd2',  definitionType: 'stradiot',    faction: 'cilicia', position: { row: 1, col: 9 } },
  ],
  tamerlaneUnits: [
    // Španělé — arkebuzíři v zákopech (řada 5), rodeleros, pikenýři, kulverina
    { id: 'cer_tam_aq1',  definitionType: 'arquebusier', faction: 'tamerlane', position: { row: 5, col: 3 } },
    { id: 'cer_tam_aq2',  definitionType: 'arquebusier', faction: 'tamerlane', position: { row: 5, col: 4 } },
    { id: 'cer_tam_aq3',  definitionType: 'arquebusier', faction: 'tamerlane', position: { row: 5, col: 5 } },
    { id: 'cer_tam_aq4',  definitionType: 'arquebusier', faction: 'tamerlane', position: { row: 5, col: 6 } },
    { id: 'cer_tam_aq5',  definitionType: 'arquebusier', faction: 'tamerlane', position: { row: 5, col: 7 } },
    { id: 'cer_tam_pk1',  definitionType: 'pikeman',     faction: 'tamerlane', position: { row: 6, col: 4 } },
    { id: 'cer_tam_pk2',  definitionType: 'pikeman',     faction: 'tamerlane', position: { row: 6, col: 6 } },
    { id: 'cer_tam_rd1',  definitionType: 'rodelero',    faction: 'tamerlane', position: { row: 7, col: 3 } },
    { id: 'cer_tam_rd2',  definitionType: 'rodelero',    faction: 'tamerlane', position: { row: 7, col: 7 } },
    { id: 'cer_tam_cv',   definitionType: 'culverin',    faction: 'tamerlane', position: { row: 8, col: 5 } },
  ],
};

export const ALL_SCENARIOS: ScenarioDefinition[] = [
  SCENARIO_STANDARD,
  SCENARIO_ANKARA,
  SCENARIO_BREAKTHROUGH,
  SCENARIO_ASCALON,
  SCENARIO_KILICIE_UPRISING,
  SCENARIO_TEUTOBURG,
  SCENARIO_VERCELLAE,
  SCENARIO_FORLI,
  SCENARIO_CERIGNOLA,
];
