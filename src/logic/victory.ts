import type { GameState } from '../types/game';
import type { PlayerTurn } from '../types/game';

const KILL_THRESHOLD = 5;

export function checkVictory(state: GameState): {
  victor: PlayerTurn | null;
  cause: string | null;
} {
  // Tamerlane special victory: infantry on the fortress at end of turn
  const fortress = state.terrain.find(t => t.terrain === 'fortress');
  if (fortress) {
    const onFortress = state.units.find(
      u =>
        u.position.row === fortress.position.row &&
        u.position.col === fortress.position.col &&
        u.faction === 'tamerlane' &&
        (u.definitionType === 'light_infantry' || u.definitionType === 'heavy_infantry')
    );
    if (onFortress) {
      return { victor: 'tamerlane', cause: 'Tamerlánova pěchota obsadila pevnost!' };
    }
  }

  // Standard: 5 enemy units destroyed
  const ciliciaLosses = state.destroyedUnits.filter(u => u.faction === 'cilicia').length;
  const tamerlaneLosses = state.destroyedUnits.filter(u => u.faction === 'tamerlane').length;

  if (tamerlaneLosses >= KILL_THRESHOLD) {
    return { victor: 'cilicia', cause: `Kilikie zničila ${KILL_THRESHOLD} nepřátelských jednotek!` };
  }
  if (ciliciaLosses >= KILL_THRESHOLD) {
    return { victor: 'tamerlane', cause: `Tamerlán zničil ${KILL_THRESHOLD} nepřátelských jednotek!` };
  }

  return { victor: null, cause: null };
}
