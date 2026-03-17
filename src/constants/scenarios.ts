import type { UnitInstance } from '../types/unit';
import type { TerrainCell } from '../types/terrain';

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
  // Victory conditions
  killThresholdCilicia: number;   // Tamerlane wins if they destroy this many Kilikie units
  killThresholdTamerlane: number; // Kilikie wins if they destroy this many Tamerlane units
  turnLimit: number | null;       // max full turns; null = no limit
  victoryObjectiveCiliciaCs: string;  // shown in TurnPanel
  victoryObjectiveTamerlaneCs: string;
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

export const ALL_SCENARIOS: ScenarioDefinition[] = [
  SCENARIO_STANDARD,
  SCENARIO_ANKARA,
  SCENARIO_BREAKTHROUGH,
];
