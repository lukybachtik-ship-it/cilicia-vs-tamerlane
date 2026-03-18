import type { Position } from './unit';

export type TerrainType = 'plain' | 'forest' | 'hill' | 'fortress' | 'village' | 'tent';

export interface TerrainCell {
  position: Position;
  terrain: TerrainType;
  elevation: number; // 0 = lowland, 1 = elevated (hill)
}
