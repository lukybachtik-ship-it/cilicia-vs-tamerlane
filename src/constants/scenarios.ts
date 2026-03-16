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
}

// ─────────────────────────────────────────────────────────────────────────────
// Scénář 1: Standardní bitva
// ─────────────────────────────────────────────────────────────────────────────
export const SCENARIO_STANDARD: ScenarioDefinition = {
  id: 'standard',
  nameCs: 'Standardní bitva',
  descriptionCs: 'Vyvážená bitva vhodná pro první hru. Kilikie brání pevnost uprostřed území.',
  flavourCs: 'Arménské království Kilikie čelí náporu Tamerlánových mongolských hord.',
  ciliciaLabel: 'Kilikie',
  tamerlaneLabel: 'Tamerlán',
  difficultyCs: '⚖️ Vyvážená',
  tags: ['výchozí', 'vyvážená'],
  terrain: [
    { position: { row: 3, col: 5 }, terrain: 'fortress', elevation: 0 },
    { position: { row: 4, col: 2 }, terrain: 'hill',     elevation: 1 },
    { position: { row: 3, col: 8 }, terrain: 'hill',     elevation: 1 },
    { position: { row: 5, col: 7 }, terrain: 'hill',     elevation: 1 },
    { position: { row: 6, col: 3 }, terrain: 'forest',   elevation: 0 },
    { position: { row: 6, col: 4 }, terrain: 'forest',   elevation: 0 },
    { position: { row: 7, col: 6 }, terrain: 'forest',   elevation: 0 },
  ],
  ciliciaUnits: [
    { id: 'cil_li_1', definitionType: 'light_infantry', faction: 'cilicia', position: { row: 2, col: 2 } },
    { id: 'cil_li_2', definitionType: 'light_infantry', faction: 'cilicia', position: { row: 2, col: 4 } },
    { id: 'cil_li_3', definitionType: 'light_infantry', faction: 'cilicia', position: { row: 2, col: 6 } },
    { id: 'cil_li_4', definitionType: 'light_infantry', faction: 'cilicia', position: { row: 2, col: 8 } },
    { id: 'cil_hi_1', definitionType: 'heavy_infantry',  faction: 'cilicia', position: { row: 2, col: 5 } },
    { id: 'cil_ar_1', definitionType: 'archers',          faction: 'cilicia', position: { row: 1, col: 3 } },
    { id: 'cil_ar_2', definitionType: 'archers',          faction: 'cilicia', position: { row: 1, col: 5 } },
    { id: 'cil_ar_3', definitionType: 'archers',          faction: 'cilicia', position: { row: 1, col: 7 } },
    { id: 'cil_lc_1', definitionType: 'light_cavalry',    faction: 'cilicia', position: { row: 2, col: 1 } },
    { id: 'cil_lc_2', definitionType: 'light_cavalry',    faction: 'cilicia', position: { row: 2, col: 9 } },
  ],
  tamerlaneUnits: [
    { id: 'tam_hi_1', definitionType: 'heavy_infantry',  faction: 'tamerlane', position: { row: 8, col: 4 } },
    { id: 'tam_hi_2', definitionType: 'heavy_infantry',  faction: 'tamerlane', position: { row: 8, col: 5 } },
    { id: 'tam_hi_3', definitionType: 'heavy_infantry',  faction: 'tamerlane', position: { row: 8, col: 6 } },
    { id: 'tam_li_1', definitionType: 'light_infantry',  faction: 'tamerlane', position: { row: 8, col: 2 } },
    { id: 'tam_li_2', definitionType: 'light_infantry',  faction: 'tamerlane', position: { row: 8, col: 8 } },
    { id: 'tam_ha_1', definitionType: 'horse_archers',   faction: 'tamerlane', position: { row: 7, col: 1 } },
    { id: 'tam_ha_2', definitionType: 'horse_archers',   faction: 'tamerlane', position: { row: 7, col: 3 } },
    { id: 'tam_ha_3', definitionType: 'horse_archers',   faction: 'tamerlane', position: { row: 7, col: 7 } },
    { id: 'tam_ha_4', definitionType: 'horse_archers',   faction: 'tamerlane', position: { row: 7, col: 9 } },
    { id: 'tam_hc_1', definitionType: 'heavy_cavalry',   faction: 'tamerlane', position: { row: 9, col: 3 } },
    { id: 'tam_hc_2', definitionType: 'heavy_cavalry',   faction: 'tamerlane', position: { row: 9, col: 7 } },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Scénář 2: Bitva u Angory (1402)
// ─────────────────────────────────────────────────────────────────────────────
export const SCENARIO_ANKARA: ScenarioDefinition = {
  id: 'ankara',
  nameCs: 'Bitva u Angory 1402',
  descriptionCs: 'Historická bitva u Ankary. Tamerlán nasazuje masivní jezdectvo na obou křídlech. Kilikie má silnější pěchotní centrum.',
  flavourCs: '28. července 1402. Tamerlánovy hordy zaútočily na osmansko-cilickou koalici. Mongolské jezdectvo hrozí obklíčením.',
  ciliciaLabel: 'Koalice',
  tamerlaneLabel: 'Mongolové',
  difficultyCs: '🔴 Těžká pro Koalici',
  tags: ['historická', 'asymetrická'],
  terrain: [
    { position: { row: 3, col: 5 }, terrain: 'fortress', elevation: 0 },
    { position: { row: 3, col: 2 }, terrain: 'hill',     elevation: 1 },
    { position: { row: 3, col: 7 }, terrain: 'hill',     elevation: 1 },
    { position: { row: 4, col: 4 }, terrain: 'hill',     elevation: 1 },
    { position: { row: 5, col: 5 }, terrain: 'forest',   elevation: 0 },
    { position: { row: 6, col: 2 }, terrain: 'forest',   elevation: 0 },
    { position: { row: 6, col: 8 }, terrain: 'forest',   elevation: 0 },
    { position: { row: 7, col: 5 }, terrain: 'forest',   elevation: 0 },
  ],
  ciliciaUnits: [
    // Silná pěchotní linie ve středu
    { id: 'cil_hi_1', definitionType: 'heavy_infantry', faction: 'cilicia', position: { row: 2, col: 4 } },
    { id: 'cil_hi_2', definitionType: 'heavy_infantry', faction: 'cilicia', position: { row: 2, col: 5 } },
    { id: 'cil_hi_3', definitionType: 'heavy_infantry', faction: 'cilicia', position: { row: 2, col: 6 } },
    { id: 'cil_li_1', definitionType: 'light_infantry', faction: 'cilicia', position: { row: 2, col: 2 } },
    { id: 'cil_li_2', definitionType: 'light_infantry', faction: 'cilicia', position: { row: 2, col: 8 } },
    // Lučištníci na kopcích
    { id: 'cil_ar_1', definitionType: 'archers', faction: 'cilicia', position: { row: 1, col: 3 } },
    { id: 'cil_ar_2', definitionType: 'archers', faction: 'cilicia', position: { row: 1, col: 5 } },
    { id: 'cil_ar_3', definitionType: 'archers', faction: 'cilicia', position: { row: 1, col: 7 } },
    // Málo jezdectva
    { id: 'cil_lc_1', definitionType: 'light_cavalry', faction: 'cilicia', position: { row: 1, col: 1 } },
    { id: 'cil_lc_2', definitionType: 'light_cavalry', faction: 'cilicia', position: { row: 1, col: 9 } },
  ],
  tamerlaneUnits: [
    // Masivní jízdní křídla
    { id: 'tam_ha_1', definitionType: 'horse_archers', faction: 'tamerlane', position: { row: 9, col: 1 } },
    { id: 'tam_ha_2', definitionType: 'horse_archers', faction: 'tamerlane', position: { row: 8, col: 1 } },
    { id: 'tam_ha_3', definitionType: 'horse_archers', faction: 'tamerlane', position: { row: 9, col: 9 } },
    { id: 'tam_ha_4', definitionType: 'horse_archers', faction: 'tamerlane', position: { row: 8, col: 9 } },
    { id: 'tam_hc_1', definitionType: 'heavy_cavalry', faction: 'tamerlane', position: { row: 9, col: 3 } },
    { id: 'tam_hc_2', definitionType: 'heavy_cavalry', faction: 'tamerlane', position: { row: 9, col: 7 } },
    // Pěchota ve středu
    { id: 'tam_hi_1', definitionType: 'heavy_infantry', faction: 'tamerlane', position: { row: 9, col: 5 } },
    { id: 'tam_hi_2', definitionType: 'heavy_infantry', faction: 'tamerlane', position: { row: 8, col: 4 } },
    { id: 'tam_hi_3', definitionType: 'heavy_infantry', faction: 'tamerlane', position: { row: 8, col: 6 } },
    { id: 'tam_li_1', definitionType: 'light_infantry', faction: 'tamerlane', position: { row: 8, col: 2 } },
    { id: 'tam_li_2', definitionType: 'light_infantry', faction: 'tamerlane', position: { row: 8, col: 8 } },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Scénář 3: Průlom (Breakthrough)
// ─────────────────────────────────────────────────────────────────────────────
export const SCENARIO_BREAKTHROUGH: ScenarioDefinition = {
  id: 'breakthrough',
  nameCs: 'Průlom',
  descriptionCs: 'Kilikie pevně drží opevněnou linii. Tamerlán musí prolomit obranu a obsadit pevnost.',
  flavourCs: 'Arménský velitel rozmístil vojska za kamennou zdí. Tamerlánovy hordy musí projít lesnatým terénem pod palbou lučištníků.',
  ciliciaLabel: 'Obránci',
  tamerlaneLabel: 'Útočníci',
  difficultyCs: '🔵 Těžká pro Útočníky',
  tags: ['obrana', 'průlom', 'asymetrická'],
  terrain: [
    // Dvě pevnosti – linie obrany
    { position: { row: 3, col: 3 }, terrain: 'fortress', elevation: 0 },
    { position: { row: 3, col: 7 }, terrain: 'fortress', elevation: 0 },
    // Kopce pro lučištníky
    { position: { row: 2, col: 5 }, terrain: 'hill',     elevation: 1 },
    { position: { row: 3, col: 1 }, terrain: 'hill',     elevation: 1 },
    { position: { row: 3, col: 9 }, terrain: 'hill',     elevation: 1 },
    // Hustý les – zpomaluje útočníky
    { position: { row: 5, col: 2 }, terrain: 'forest',   elevation: 0 },
    { position: { row: 5, col: 3 }, terrain: 'forest',   elevation: 0 },
    { position: { row: 5, col: 5 }, terrain: 'forest',   elevation: 0 },
    { position: { row: 5, col: 7 }, terrain: 'forest',   elevation: 0 },
    { position: { row: 5, col: 8 }, terrain: 'forest',   elevation: 0 },
    { position: { row: 6, col: 4 }, terrain: 'forest',   elevation: 0 },
    { position: { row: 6, col: 6 }, terrain: 'forest',   elevation: 0 },
  ],
  ciliciaUnits: [
    // Pevná obranná linie s těžkou pěchotou v pevnostech
    { id: 'cil_hi_1', definitionType: 'heavy_infantry', faction: 'cilicia', position: { row: 3, col: 3 } },
    { id: 'cil_hi_2', definitionType: 'heavy_infantry', faction: 'cilicia', position: { row: 3, col: 5 } },
    { id: 'cil_hi_3', definitionType: 'heavy_infantry', faction: 'cilicia', position: { row: 3, col: 7 } },
    { id: 'cil_li_1', definitionType: 'light_infantry', faction: 'cilicia', position: { row: 2, col: 2 } },
    { id: 'cil_li_2', definitionType: 'light_infantry', faction: 'cilicia', position: { row: 2, col: 4 } },
    { id: 'cil_li_3', definitionType: 'light_infantry', faction: 'cilicia', position: { row: 2, col: 6 } },
    { id: 'cil_li_4', definitionType: 'light_infantry', faction: 'cilicia', position: { row: 2, col: 8 } },
    // Lučištníci na výšinách
    { id: 'cil_ar_1', definitionType: 'archers', faction: 'cilicia', position: { row: 1, col: 3 } },
    { id: 'cil_ar_2', definitionType: 'archers', faction: 'cilicia', position: { row: 2, col: 5 } },
    { id: 'cil_ar_3', definitionType: 'archers', faction: 'cilicia', position: { row: 1, col: 7 } },
  ],
  tamerlaneUnits: [
    // Početná armáda – musí proniknout lesem
    { id: 'tam_hc_1', definitionType: 'heavy_cavalry',  faction: 'tamerlane', position: { row: 9, col: 2 } },
    { id: 'tam_hc_2', definitionType: 'heavy_cavalry',  faction: 'tamerlane', position: { row: 9, col: 8 } },
    { id: 'tam_lc_1', definitionType: 'light_cavalry',  faction: 'tamerlane', position: { row: 9, col: 4 } },
    { id: 'tam_lc_2', definitionType: 'light_cavalry',  faction: 'tamerlane', position: { row: 9, col: 6 } },
    { id: 'tam_ha_1', definitionType: 'horse_archers',  faction: 'tamerlane', position: { row: 8, col: 1 } },
    { id: 'tam_ha_2', definitionType: 'horse_archers',  faction: 'tamerlane', position: { row: 8, col: 9 } },
    { id: 'tam_hi_1', definitionType: 'heavy_infantry', faction: 'tamerlane', position: { row: 9, col: 5 } },
    { id: 'tam_li_1', definitionType: 'light_infantry', faction: 'tamerlane', position: { row: 8, col: 3 } },
    { id: 'tam_li_2', definitionType: 'light_infantry', faction: 'tamerlane', position: { row: 8, col: 5 } },
    { id: 'tam_li_3', definitionType: 'light_infantry', faction: 'tamerlane', position: { row: 8, col: 7 } },
    { id: 'tam_ha_3', definitionType: 'horse_archers',  faction: 'tamerlane', position: { row: 7, col: 3 } },
    { id: 'tam_ha_4', definitionType: 'horse_archers',  faction: 'tamerlane', position: { row: 7, col: 7 } },
  ],
};

export const ALL_SCENARIOS: ScenarioDefinition[] = [
  SCENARIO_STANDARD,
  SCENARIO_ANKARA,
  SCENARIO_BREAKTHROUGH,
];
