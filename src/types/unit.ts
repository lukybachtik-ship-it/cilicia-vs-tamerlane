export type UnitClass = 'light' | 'heavy';

export type UnitType =
  // Original units
  | 'light_infantry'
  | 'heavy_infantry'
  | 'archers'
  | 'light_cavalry'
  | 'heavy_cavalry'
  | 'horse_archers'
  | 'scout'
  | 'siege_machine'
  | 'elite_guard'
  | 'militia'
  // Ancient Rome era
  | 'legionary'
  | 'auxilia'
  | 'equites'
  | 'sagittarii'
  | 'scorpio'
  | 'praetorian'
  | 'germanic_warrior'
  | 'framea_thrower'
  | 'germanic_chieftain'
  | 'arminius'
  // Renaissance / Borgia era
  | 'arquebusier'
  | 'pikeman'
  | 'gendarme'
  | 'stradiot'
  | 'rodelero'
  | 'crossbowman'
  | 'culverin'
  | 'condottiero'
  | 'caterina_sforza'
  | 'cesare_borgia';

export type FactionId = 'cilicia' | 'tamerlane';

/** Types of activated abilities (1× per game). */
export type ActivatedAbilityKind =
  | 'warcry'          // Germanic warrior: +2 dice & +1 move for one action
  | 'pilum'           // Legionary: ranged 1–2 attack with +2 dice, once
  | 'betrayal'        // Cesare Borgia: flip adjacent condottiero to your side for 1 turn
  | 'ambush_signal';  // Arminius: reveal all hidden Germanic units + +1 die this turn

export interface Position {
  row: number; // 1–N, row 1 = Cilicia home (top), row N = Tamerlane home (bottom)
  col: number; // 1–M
}

export interface UnitDefinition {
  type: UnitType;
  unitClass: UnitClass;
  move: number;
  rangeMin: number;
  rangeMax: number;
  attack: number;
  maxHp: number;
  // Special ability flags (original)
  hitAndRun: boolean;           // Light Cavalry: free 1-step retreat after melee attack
  breakthrough: boolean;        // Heavy Cavalry: move to vacated square after kill/retreat
  parthianShot: boolean;        // Horse Archers: move→attack→move
  reducedMeleeDefense: boolean; // Archers & Horse Archers: only 1 die in counter-attack
  movedAttackPenalty: boolean;  // Archers: if moved this turn, attack = 1
  meleeAttackPenalty: boolean;  // Archers: melee attack (dist=1) uses -1 die
  ignoresTerrainStop: boolean;  // Scout: doesn't stop when entering forest/fortress
  siegeBonus: boolean;          // Siege Machine: +2 dice when attacking fortress defenders
  panicRetreat: boolean;        // Militia: retreat result = 2 hexes instead of 1
  // New flags (Rome + Renaissance)
  activatedAbility?: ActivatedAbilityKind; // 1× per game activated ability
  chargeRequires3Hex: boolean;  // Gendarm: +2 dice if moved 3+ hexes in straight line this turn
  volleyFireBonus: boolean;     // Arquebusier: +1 die if 3+ arquebusiers same row attack same turn
  pikeWall: boolean;            // Pikeman: +2 def & 1 auto-hit vs attacking cavalry
  setupRequired: boolean;       // Culverin/Scorpio: cannot attack on a turn it moved
  antiHeavyCavalry: boolean;    // Rodelero: +1 die vs heavy cavalry / gendarme
  gunpowderWeapon: boolean;     // Arquebusier/Culverin: applies gunpowder panic debuff
  namedHero: boolean;           // Caterina, Cesare, Arminius: death = faction loses (if scenario rule)
  destroysWalls: boolean;       // Culverin/Siege: can damage 'wall' terrain
  hiddenInForest: boolean;      // Germanic units in ambush_forest: hidden beyond 2 hexes
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
  // New: per-turn move history for charge detection (list of positions visited, including start)
  moveHistoryThisTurn: Position[];
  // New: activated ability 1×/game (true once used)
  specialAbilityUsed: boolean;
  // New: flag set by Pilum activation — next attack is ranged with +2 dice
  pilumReady: boolean;
  // New: flag set by Warcry activation — next attack gets +2 dice; move also temporarily +1
  warcryActive: boolean;
  // New: Gunpowder panic — turn number until which unit suffers -1 attack die (inclusive)
  gunpowderPanicUntilTurn?: number;
  // New: Cesare's Betrayal — condottiero controlled by enemy until this turn ends (inclusive)
  betrayedUntilTurn?: number;
  /** Original faction before betrayal (restored when betrayal expires). */
  betrayedOriginalFaction?: FactionId;
  // Scenario-specific (existing)
  sleepsUntilTurn?: number; // Ascalon: unit cannot be activated before this turn number
}
