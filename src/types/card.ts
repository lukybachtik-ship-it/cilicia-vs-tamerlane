export type CardId =
  | 'scout_left' | 'scout_center' | 'scout_right'
  | 'skirmish_left' | 'skirmish_center' | 'skirmish_right'
  | 'attack_left' | 'attack_center' | 'attack_right'
  | 'coordinated_advance'
  | 'cavalry_charge'
  | 'direct_fire'
  | 'inspiring_commander'
  | 'general_offensive';

export type CardSection = 'left' | 'center' | 'right' | 'any';

export type UnitTypeFilter = 'any' | 'cavalry' | 'ranged' | 'one_per_section';

export interface CardDefinition {
  id: CardId;
  nameCs: string;
  category: 'positional' | 'tactical';
  section: CardSection;
  maxActivations: number; // 99 = unlimited (General Offensive)
  unitTypeFilter: UnitTypeFilter;
  sectionRestricted: boolean; // if true, only units in card's section can be activated
  moveBonus: number;
  attackBonus: number;
  noMoveAllowed: boolean;   // Direct Fire: activated units cannot move
  scoutDraw: boolean;       // Scout: draw 2 then discard 1
  generalOffensive: boolean; // General Offensive: choose section at play time
  description: string;
}

export interface CardInstance {
  id: CardId;
  instanceId: string; // unique ID per card copy in the deck
}
