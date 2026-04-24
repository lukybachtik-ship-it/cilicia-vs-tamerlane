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
  | 'cesare_borgia'
  // Campaign — Belisarius era (VI. století)
  | 'belisarius'
  | 'bucelarii'
  | 'cataphract'
  | 'isaurian_infantry'
  | 'heruli'
  | 'mauri_spearmen'
  // Peršané (nepřátelé z Dary)
  | 'persian_immortal'
  | 'persian_cavalry'
  | 'elephant'
  | 'firouz'
  // Nika povstalci
  | 'civilian_mob'
  | 'stone_throwing_mob'
  | 'hypatius'
  | 'pompeius'
  // Vandalové (Ad Decimum)
  | 'vandal_cavalry'
  | 'vandal_infantry'
  | 'ammatas'
  | 'gelimer'
  | 'tzazon'
  // Campaign Fáze 2 — Tricamarum & Neapol
  | 'jan_armenian'
  | 'siege_tower'
  | 'siege_ram'
  | 'gothic_infantry'
  | 'gothic_knight'
  | 'gothic_militia'
  | 'gothic_archers'
  | 'totila'
  // Campaign Fáze 3 — Obrana Říma & Epilog
  | 'witiges'
  | 'zabergan'
  | 'hunnic_horde';

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

/**
 * When a commander (isCommander=true) dies, a modifier is auto-generated
 * from this spec. Inline import avoided — see src/logic/modifiers.ts for
 * full shape. Here we keep type-level `unknown` to avoid circular imports;
 * modifiers.ts re-declares it.
 */
export interface CommanderDeathSpec {
  descriptionCs: string;
  affectFaction?: FactionId;
  affectUnitTypes?: UnitType[];
  effect: {
    attackDice?: number;
    defenseDice?: number;
    moveBonus?: number;
    rangeBonus?: number;
    cannotMove?: boolean;
    cannotAttack?: boolean;
    ignoresRetreat?: boolean;
  };
  durationTurns: number;
}

export interface AuraSpec {
  descriptionCs: string;
  radius: number;
  targetFilter: {
    faction?: FactionId;
    exceptFaction?: FactionId;
    unitTypes?: UnitType[];
    unitClass?: UnitClass;
    excludeSourceUnit?: boolean;
  };
  effect: {
    attackDice?: number;
    defenseDice?: number;
    moveBonus?: number;
    rangeBonus?: number;
    cannotMove?: boolean;
    cannotAttack?: boolean;
    ignoresRetreat?: boolean;
  };
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
  /** Optional: marks the unit as a "named commander". When this unit dies,
   *  the commanderDeathEffect (if present) is auto-applied as a modifier. */
  isCommander?: boolean;
  commanderDeathEffect?: CommanderDeathSpec;
  /** Optional: unit emits a positional aura. Recomputed each turn and after
   *  movement. See logic/modifiers.ts:recomputeAuras. */
  auraEffect?: AuraSpec;
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
  // New: Cesare's Betrayal — condottiero controlled by enemy until this turn ends (inclusive)
  betrayedUntilTurn?: number;
  /** Original faction before betrayal (restored when betrayal expires). */
  betrayedOriginalFaction?: FactionId;
  // Scenario-specific (existing)
  sleepsUntilTurn?: number; // Ascalon: unit cannot be activated before this turn number
}
