import type { GameState } from '../types/game';
import type { PlayerTurn } from '../types/game';
import { ALL_SCENARIOS } from '../constants/scenarios';

const CAVALRY_TYPES = ['light_cavalry', 'heavy_cavalry', 'horse_archers'] as const;

export function checkVictory(
  state: GameState,
  isEndOfTurn = false
): {
  victor: PlayerTurn | null;
  cause: string | null;
} {
  const scenario = ALL_SCENARIOS.find(s => s.id === state.scenarioId);
  const killCilicia = scenario?.killThresholdCilicia ?? 5;
  const killTamerlane = scenario?.killThresholdTamerlane ?? 5;

  // ── Kill thresholds ────────────────────────────────────────────────────────
  const ciliciaLosses = state.destroyedUnits.filter(u => u.faction === 'cilicia').length;
  const tamerlaneLosses = state.destroyedUnits.filter(u => u.faction === 'tamerlane').length;

  if (ciliciaLosses >= killCilicia) {
    return {
      victor: 'tamerlane',
      cause: `${scenario?.tamerlaneLabel ?? 'Tamerlán'} zničil ${killCilicia} nepřátelských jednotek!`,
    };
  }
  if (tamerlaneLosses >= killTamerlane) {
    return {
      victor: 'cilicia',
      cause: `${scenario?.ciliciaLabel ?? 'Kilikie'} zničila ${killTamerlane} nepřátelských jednotek!`,
    };
  }

  // ── Scenario-specific conditions ───────────────────────────────────────────

  if (state.scenarioId === 'standard') {
    // Either side's infantry on the central fortress wins
    const fortress = state.terrain.find(t => t.terrain === 'fortress');
    if (fortress) {
      const onFortress = state.units.find(
        u =>
          u.position.row === fortress.position.row &&
          u.position.col === fortress.position.col &&
          (u.definitionType === 'light_infantry' ||
            u.definitionType === 'heavy_infantry' ||
            u.definitionType === 'elite_guard')
      );
      if (onFortress) {
        const victor: PlayerTurn = onFortress.faction === 'cilicia' ? 'cilicia' : 'tamerlane';
        const label = victor === 'cilicia'
          ? (scenario?.ciliciaLabel ?? 'Kilikie')
          : (scenario?.tamerlaneLabel ?? 'Tamerlán');
        return { victor, cause: `${label}: pěchota obsadila střed bojiště!` };
      }
    }
  }

  if (state.scenarioId === 'ankara') {
    // Tamerlane special: 2+ cavalry units in rows 1-2 (encirclement)
    const encirclingCavalry = state.units.filter(
      u =>
        u.faction === 'tamerlane' &&
        u.position.row <= 2 &&
        (CAVALRY_TYPES as readonly string[]).includes(u.definitionType)
    );
    if (encirclingCavalry.length >= 2) {
      return {
        victor: 'tamerlane',
        cause: `${scenario?.tamerlaneLabel ?? 'Mongolové'} obklíčili koalici! (${encirclingCavalry.length} jezdci v týlu)`,
      };
    }

    // Kilikie survival: checked at end of Tamerlane's turn
    if (
      isEndOfTurn &&
      scenario?.turnLimit !== null &&
      scenario?.turnLimit !== undefined &&
      state.currentPlayer === 'tamerlane' &&
      state.turnNumber >= scenario.turnLimit
    ) {
      return {
        victor: 'cilicia',
        cause: `${scenario?.ciliciaLabel ?? 'Koalice'} přežila ${scenario.turnLimit} tahů!`,
      };
    }
  }

  if (state.scenarioId === 'breakthrough') {
    // Tamerlane: occupy BOTH fortresses simultaneously with any unit
    const fortresses = state.terrain.filter(t => t.terrain === 'fortress');
    if (fortresses.length >= 2) {
      const allOccupied = fortresses.every(f =>
        state.units.some(
          u =>
            u.faction === 'tamerlane' &&
            u.position.row === f.position.row &&
            u.position.col === f.position.col
        )
      );
      if (allOccupied) {
        return {
          victor: 'tamerlane',
          cause: `${scenario?.tamerlaneLabel ?? 'Útočníci'} obsadili obě pevnosti!`,
        };
      }
    }

    // Kilikie survival: checked at end of Tamerlane's turn
    if (
      isEndOfTurn &&
      scenario?.turnLimit !== null &&
      scenario?.turnLimit !== undefined &&
      state.currentPlayer === 'tamerlane' &&
      state.turnNumber >= scenario.turnLimit
    ) {
      return {
        victor: 'cilicia',
        cause: `${scenario?.ciliciaLabel ?? 'Obránci'} ubránili pevnosti po ${scenario.turnLimit} tahů!`,
      };
    }
  }

  return { victor: null, cause: null };
}
