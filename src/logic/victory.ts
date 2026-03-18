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

  // ── Aškelon: Přepad za úsvitu ──────────────────────────────────────────────
  if (state.scenarioId === 'ascalon') {
    // Crusaders win: any Crusader unit stands on the tent hex
    const tentHex = state.terrain.find(t => t.terrain === 'tent');
    if (tentHex) {
      const onTent = state.units.find(
        u =>
          u.faction === 'cilicia' &&
          u.position.row === tentHex.position.row &&
          u.position.col === tentHex.position.col
      );
      if (onTent) {
        return {
          victor: 'cilicia',
          cause: `${scenario?.ciliciaLabel ?? 'Křižáci'} dobyli velitelský stan!`,
        };
      }
    }

    // Turn limit: Turks defend until end of turn 10
    if (
      isEndOfTurn &&
      scenario?.turnLimit !== null &&
      scenario?.turnLimit !== undefined &&
      state.currentPlayer === 'tamerlane' &&
      state.turnNumber >= scenario.turnLimit
    ) {
      return {
        victor: 'tamerlane',
        cause: `${scenario?.tamerlaneLabel ?? 'Turci'} ubránili tábor do úsvitu!`,
      };
    }
  }

  // ── Povstání v Kilíkii ─────────────────────────────────────────────────────
  if (state.scenarioId === 'kilicie_uprising') {
    const villages = state.terrain.filter(t => t.terrain === 'village');
    const villagesHeldByTamerlane = villages.filter(v =>
      state.units.some(
        u =>
          u.faction === 'tamerlane' &&
          u.position.row === v.position.row &&
          u.position.col === v.position.col
      )
    ).length;

    // Tamerlane early win: holds 3+ villages at end of any turn
    if (isEndOfTurn && villagesHeldByTamerlane >= 3) {
      return {
        victor: 'tamerlane',
        cause: `${scenario?.tamerlaneLabel ?? 'Tamerlán'} znovu ovládl ${villagesHeldByTamerlane} vesnice!`,
      };
    }

    // Tamerlane win: all militia destroyed
    const militiaAlive = state.units.filter(
      u => u.faction === 'cilicia' && u.definitionType === 'militia'
    ).length;
    if (militiaAlive === 0) {
      const startingMilitia = 6; // defined in scenario
      const militiaDestroyed = state.destroyedUnits.filter(
        u => u.faction === 'cilicia' && u.definitionType === 'militia'
      ).length;
      if (militiaDestroyed >= startingMilitia) {
        return {
          victor: 'tamerlane',
          cause: `${scenario?.tamerlaneLabel ?? 'Tamerlán'} potlačil povstání — všechny milice zničeny!`,
        };
      }
    }

    // Cilicia survival win: end of turn 16 with Tamerlane holding < 3 villages
    if (
      isEndOfTurn &&
      scenario?.turnLimit !== null &&
      scenario?.turnLimit !== undefined &&
      state.currentPlayer === 'tamerlane' &&
      state.turnNumber >= scenario.turnLimit
    ) {
      return {
        victor: 'cilicia',
        cause: `${scenario?.ciliciaLabel ?? 'Křižáci'} udrželi povstání naživu — vesnice jsou svobodné!`,
      };
    }
  }

  return { victor: null, cause: null };
}
