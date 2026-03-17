export type UnitClass = 'light' | 'heavy';

export type UnitType =
  | 'light_infantry'
  | 'heavy_infantry'
  | 'archers'
  | 'light_cavalry'
  | 'heavy_cavalry'
  | 'horse_archers'
  | 'scout'
  | 'siege_machine'
  | 'elite_guard';

export type FactionId = 'cilicia' | 'tamerlane';

export interface Position {
  row: number; // 1–9, row 1 = Cilicia home (top), row 9 = Tamerlane home (bottom)
  col: number; // 1–9
}

export interface UnitDefinition {
  type: UnitType;
  unitClass: UnitClass;
  move: number;
  rangeMin: number;
  rangeMax: number;
  attack: number;
  maxHp: number;
  // Special ability flags
  hitAndRun: boolean;           // Light Cavalry: free 1-step retreat after melee attack
  breakthrough: boolean;        // Heavy Cavalry: move to vacated square after kill/retreat
  parthianShot: boolean;        // Horse Archers: move→attack→move
  reducedMeleeDefense: boolean; // Archers & Horse Archers: only 1 die in counter-attack
  movedAttackPenalty: boolean;  // Archers: if moved this turn, attack = 1
  meleeAttackPenalty: boolean;  // Archers: melee attack (dist=1) uses -1 die
  ignoresTerrainStop: boolean;  // Scout: doesn't stop when entering forest/fortress
  siegeBonus: boolean;          // Siege Machine: +2 dice when attacking fortress defenders
  // Czech display name
  nameCs: string;
  abbrevCs: string; // short 2-3 char abbreviation
}

export interface UnitInstance {
  id: string;
  definitionType: UnitType;
  faction: FactionId;
  hp: number;
  position: Position;
  // Per-turn tracking (reset on end turn)
  hasMoved: boolean;
  hasAttacked: boolean;
  isActivated: boolean;
  attackBonus: number;
  moveBonus: number;
  directFireLocked: boolean; // Direct Fire card: cannot move this turn
  // Parthian Shot sub-state
  parthianPhase: 'none' | 'pre_attack' | 'post_attack'; // which half of split move
}
