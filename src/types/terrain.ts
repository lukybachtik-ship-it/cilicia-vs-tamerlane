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
  | 'ambush_forest';  // forest + hidden-unit mechanic (Teutoburg)

export interface TerrainCell {
  position: Position;
  terrain: TerrainType;
  elevation: number; // 0 = lowland, 1 = elevated (hill)
  /** Remaining HP for destroyable terrain (wall, wagenburg). */
  structureHp?: number;
}
