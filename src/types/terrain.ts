import type { Position } from './unit';

export type TerrainType =
  | 'plain'
  | 'forest'
  | 'hill'
  | 'fortress'
  | 'village'
  | 'tent'
  // New terrains
  | 'trench'          // +1 defense, slows attacker (no move bonus)
  | 'vineyard'        // slows (costs like forest to enter), no stop
  | 'wall'            // blocking terrain, destroyable by siege/culverin
  | 'wagenburg'       // mobile fortress — +1 def, destroyable
  | 'ambush_forest'   // forest + hidden-unit mechanic (Teutoburg)
  // Campaign Fáze 2 — obléhací terény
  | 'stream'          // potok: jednotka co překročí nemůže v tom kole útočit
  | 'gate'            // brána: 4 HP, rozbitná berana (siege_ram)
  | 'aqueduct_surface'// akvadukt: skrytý teleport (odhalený po 1 kole státí)
  | 'aqueduct_exit';  // cíl teleportu uvnitř města

export interface TerrainCell {
  position: Position;
  terrain: TerrainType;
  elevation: number; // 0 = lowland, 1 = elevated (hill)
  /** Remaining HP for destroyable terrain (wall, wagenburg). */
  structureHp?: number;
}
