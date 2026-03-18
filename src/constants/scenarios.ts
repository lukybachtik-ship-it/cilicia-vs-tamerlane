import type { UnitInstance, UnitType, FactionId, Position } from '../types/unit';
import type { TerrainCell } from '../types/terrain';

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

export interface ScenarioDefinition {
  id: string;
  nameCs: string;
  descriptionCs: string;
  flavourCs: string;           // historical context
  ciliciaLabel: string;        // what faction is called in this scenario
  tamerlaneLabel: string;
  terrain: TerrainCell[];
  ciliciaUnits: Omit<UnitInstance, 'hp' | 'hasMoved' | 'hasAttacked' | 'isActivated' | 'attackBonus' | 'moveBonus' | 'directFireLocked' | 'parthianPhase'>[];
  tamerlaneUnits: Omit<UnitInstance, 'hp' | 'hasMoved' | 'hasAttacked' | 'isActivated' | 'attackBonus' | 'moveBonus' | 'directFireLocked' | 'parthianPhase'>[];
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
  descriptionCs: 'Kilická milice povstala proti Tamerlánovu jhu. Křižáci musí přes celou zemi stihnout pomoci před tím, než Tamerlán znovu dobyje všechny vesnice. Epická mapa, více front, přicházející posily.',
  flavourCs: 'Rok 1400. Tamerlán zpustošil Kilíkii a vyžaduje tributy. Vesničané se zvedají k odporu — ale jsou slabí. Křižáčtí rytíři se vydávají na pochod. Každá hodina se počítá.',
  ciliciaLabel: 'Křižáci & Milice',
  tamerlaneLabel: 'Tamerlánova vojska',
  difficultyCs: '🗺️ Epická asymetrie',
  tags: ['epický', 'posily', 'milice', 'více front', 'asymetrická'],
  gridRows: 11,
  gridCols: 9,
  killThresholdCilicia: 99, // Tamerlán nevyhraje prostým zabíjením — vítěz je ve vesnicích
  killThresholdTamerlane: 5,
  turnLimit: 16,
  victoryObjectiveCiliciaCs: 'Udržet alespoň 3 z 5 vesnic do konce kola 16',
  victoryObjectiveTamerlaneCs: 'Obsadit 3 vesnice NEBO zničit všechny milice (nebo 5 nepřátel)',
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
  // ── Křižáci (5 jednotek) — vstupují ze severu (řady 1–2) ───────────────
  ciliciaUnits: [
    { id: 'kil_cil_lc_1', definitionType: 'light_cavalry', faction: 'cilicia', position: { row: 1, col: 1 } },
    { id: 'kil_cil_hi_1', definitionType: 'heavy_infantry',faction: 'cilicia', position: { row: 1, col: 3 } },
    { id: 'kil_cil_ar_1', definitionType: 'archers',        faction: 'cilicia', position: { row: 2, col: 5 } },
    { id: 'kil_cil_li_1', definitionType: 'light_infantry', faction: 'cilicia', position: { row: 1, col: 7 } },
    { id: 'kil_cil_lc_2', definitionType: 'light_cavalry', faction: 'cilicia', position: { row: 1, col: 9 } },
    // Místní milice — rozmístěny u vesnic
    { id: 'kil_ml_1',     definitionType: 'militia',        faction: 'cilicia', position: { row: 3, col: 2 } },
    { id: 'kil_ml_2',     definitionType: 'militia',        faction: 'cilicia', position: { row: 3, col: 8 } },
    { id: 'kil_ml_3',     definitionType: 'militia',        faction: 'cilicia', position: { row: 6, col: 4 } },
    { id: 'kil_ml_4',     definitionType: 'militia',        faction: 'cilicia', position: { row: 6, col: 6 } },
    { id: 'kil_ml_5',     definitionType: 'militia',        faction: 'cilicia', position: { row: 9, col: 3 } },
    { id: 'kil_ml_6',     definitionType: 'militia',        faction: 'cilicia', position: { row: 9, col: 7 } },
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

export const ALL_SCENARIOS: ScenarioDefinition[] = [
  SCENARIO_STANDARD,
  SCENARIO_ANKARA,
  SCENARIO_BREAKTHROUGH,
  SCENARIO_ASCALON,
  SCENARIO_KILICIE_UPRISING,
];
