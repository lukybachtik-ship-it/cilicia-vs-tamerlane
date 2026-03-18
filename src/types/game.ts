import type { UnitInstance, Position, UnitType, FactionId } from './unit';
import type { CardInstance } from './card';
import type { TerrainCell } from './terrain';

export type TurnPhase =
  | 'play_card'                  // active player selects a card from hand
  | 'select_section'             // General Offensive: choose which section
  | 'discard_drawn'              // Scout: pick which of 2 drawn cards to discard
  | 'activate_units'             // player selects units to activate
  | 'move'                       // activated units can move
  | 'attack'                     // activated units can attack
  | 'choose_reinforcement_flank' // Kilíkie: Tamerlán picks which flank gets reinforcements
  | 'game_over';

export type PlayerTurn = 'cilicia' | 'tamerlane';

export interface CombatLogEntry {
  id: string;
  turn: number;
  attackerName: string;
  defenderName: string;
  diceCount: number;
  diceResults: number[];
  hits: number;
  retreats: number;
  isCounter: boolean;
  outcome: 'damage' | 'retreat' | 'destroyed' | 'no_effect' | 'blocked_retreat_damage';
}

/** Pending reinforcement wave waiting for a flank choice. */
export interface PendingReinforcement {
  count: number;
  unitType: UnitType;
  faction: FactionId;
  spawnPositions: {
    left:   Position[];
    center: Position[];
    right:  Position[];
  };
}

export interface GameState {
  // Scenario
  scenarioId: string;

  // Board dimensions (default 9×9; epic scenarios may differ)
  gridRows: number;
  gridCols: number;

  // Board terrain
  terrain: TerrainCell[];

  // Units
  units: UnitInstance[];
  destroyedUnits: UnitInstance[];

  // Cards
  deck: CardInstance[];
  discardPile: CardInstance[];
  ciliciaHand: CardInstance[];
  tamerlaneHand: CardInstance[];

  // Turn state
  currentPlayer: PlayerTurn;
  currentPhase: TurnPhase;
  turnNumber: number;

  // Within-turn tracking
  playedCard: CardInstance | null;
  activatedUnitIds: string[];
  pendingDrawnCards: CardInstance[]; // Scout: 2 drawn, player picks which to discard
  generalOffensiveSection: 'left' | 'center' | 'right' | null;

  // Reinforcement waves (Kilíkie uprising scenario)
  pendingReinforcement: PendingReinforcement | null;

  // Combat log
  combatLog: CombatLogEntry[];

  // Victory
  victor: PlayerTurn | null;
  victoryCause: string | null;

  // UI selection state
  selectedUnitId: string | null;
  validMoveTargets: Position[];
  validAttackTargets: string[]; // unit IDs
}
