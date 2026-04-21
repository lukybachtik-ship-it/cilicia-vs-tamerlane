import type { GameState } from '../types/game';
import type { PlayerTurn } from '../types/game';
import { ALL_SCENARIOS } from '../constants/scenarios';
import { UNIT_DEFINITIONS } from '../constants/unitDefinitions';

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

  // ── Named hero rule (scenario effect) ───────────────────────────────────────
  const heroRule = state.activeScenarioEffects.find(e => e.kind === 'named_hero_rule');
  if (heroRule && heroRule.affectedFaction) {
    const faction = heroRule.affectedFaction;
    const heroAlive = state.units.some(
      u => u.faction === faction && UNIT_DEFINITIONS[u.definitionType].namedHero
    );
    const heroDied = state.destroyedUnits.some(
      u => u.faction === faction && UNIT_DEFINITIONS[u.definitionType].namedHero
    );
    if (!heroAlive && heroDied) {
      const winner: PlayerTurn = faction === 'cilicia' ? 'tamerlane' : 'cilicia';
      return {
        victor: winner,
        cause: `Hrdina padl — ${faction === 'cilicia' ? (scenario?.ciliciaLabel ?? 'Kilikie') : (scenario?.tamerlaneLabel ?? 'Tamerlán')} se hroutí bez vůdce!`,
      };
    }
  }

  // ── Kill thresholds (skipped in Kilíkie — vítěz je určen vesnicemi/milicemi) ─
  const ciliciaLosses = state.destroyedUnits.filter(u => u.faction === 'cilicia').length;
  const tamerlaneLosses = state.destroyedUnits.filter(u => u.faction === 'tamerlane').length;

  // V Kilíkii Tamerlán nemůže vyhrát prostým zabíjením — pouze vesnicemi nebo milicemi
  if (state.scenarioId !== 'kilicie_uprising' && ciliciaLosses >= killCilicia) {
    return {
      victor: 'tamerlane',
      cause: `${scenario?.tamerlaneLabel ?? 'Tamerlán'} zničil ${killCilicia} nepřátelských jednotek!`,
    };
  }
  // Kilikie může vyhrát zabitím nepřátel v každém scénáři
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

    // Tamerlane early win: holds 4+ villages at end of any turn
    if (isEndOfTurn && villagesHeldByTamerlane >= 4) {
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

  // ── Les Teutoburský ────────────────────────────────────────────────────────
  if (state.scenarioId === 'teutoburg') {
    // Romans win: 3+ legionaries reach row 9
    const legionsEscaped = state.units.filter(
      u => u.faction === 'cilicia' && u.definitionType === 'legionary' && u.position.row >= 9
    ).length;
    if (legionsEscaped >= 3) {
      return {
        victor: 'cilicia',
        cause: `${scenario?.ciliciaLabel ?? 'Římané'} se probili z lesa — 3 legie na severu!`,
      };
    }
    // Tamerlane (Germans) survival to turn limit
    if (
      isEndOfTurn &&
      scenario?.turnLimit !== undefined &&
      scenario.turnLimit !== null &&
      state.currentPlayer === 'tamerlane' &&
      state.turnNumber >= scenario.turnLimit
    ) {
      return {
        victor: 'tamerlane',
        cause: `${scenario?.tamerlaneLabel ?? 'Germáni'} udrželi past — Řím ustupuje!`,
      };
    }
  }

  // ── Vercellae ──────────────────────────────────────────────────────────────
  if (state.scenarioId === 'vercellae') {
    // Cilicia wins by taking the wagenburg (any Cilicia unit on wagenburg hex)
    const wagenburg = state.terrain.find(t => t.terrain === 'wagenburg');
    if (wagenburg) {
      const onWagenburg = state.units.some(
        u =>
          u.faction === 'cilicia' &&
          u.position.row === wagenburg.position.row &&
          u.position.col === wagenburg.position.col
      );
      if (onWagenburg) {
        return {
          victor: 'cilicia',
          cause: `${scenario?.ciliciaLabel ?? 'Římané'} dobyli wagenburg — Kimbrové zlomeni!`,
        };
      }
    }
    // Tamerlane survival to turn limit (holding wagenburg)
    if (
      isEndOfTurn &&
      scenario?.turnLimit !== undefined &&
      scenario.turnLimit !== null &&
      state.currentPlayer === 'tamerlane' &&
      state.turnNumber >= scenario.turnLimit
    ) {
      if (wagenburg) {
        const wagenburgTerrainLost =
          wagenburg.structureHp !== undefined && wagenburg.structureHp <= 0;
        if (!wagenburgTerrainLost) {
          return {
            victor: 'tamerlane',
            cause: `${scenario?.tamerlaneLabel ?? 'Kimbrové'} udrželi wagenburg 14 kol!`,
          };
        }
      }
    }
  }

  // ── Obléhání Forlì ─────────────────────────────────────────────────────────
  if (state.scenarioId === 'forli') {
    // Tamerlane wins: any infantry-type unit on the fortress hex
    const fortress = state.terrain.find(t => t.terrain === 'fortress');
    if (fortress) {
      const infantryOnFortress = state.units.some(
        u =>
          u.faction === 'tamerlane' &&
          u.position.row === fortress.position.row &&
          u.position.col === fortress.position.col &&
          (u.definitionType === 'light_infantry' ||
            u.definitionType === 'heavy_infantry' ||
            u.definitionType === 'pikeman' ||
            u.definitionType === 'rodelero' ||
            u.definitionType === 'elite_guard' ||
            u.definitionType === 'legionary' ||
            u.definitionType === 'praetorian' ||
            u.definitionType === 'cesare_borgia')
      );
      if (infantryOnFortress) {
        return {
          victor: 'tamerlane',
          cause: `${scenario?.tamerlaneLabel ?? 'Borgia'} obsadil citadelu — Ravaldino padlo!`,
        };
      }
    }
    // Cilicia wins: all enemy culverins destroyed
    const culverinAlive = state.units.some(
      u => u.faction === 'tamerlane' && u.definitionType === 'culverin'
    );
    const culverinExisted = state.destroyedUnits.some(
      u => u.faction === 'tamerlane' && u.definitionType === 'culverin'
    );
    if (!culverinAlive && culverinExisted) {
      return {
        victor: 'cilicia',
        cause: `${scenario?.ciliciaLabel ?? 'Caterina'} zničila všechny kulveriny — obléhání skončilo!`,
      };
    }
    // Cilicia survival to turn limit
    if (
      isEndOfTurn &&
      scenario?.turnLimit !== undefined &&
      scenario.turnLimit !== null &&
      state.currentPlayer === 'tamerlane' &&
      state.turnNumber >= scenario.turnLimit
    ) {
      return {
        victor: 'cilicia',
        cause: `${scenario?.ciliciaLabel ?? 'Caterina'} ubránila Ravaldino — Borgia ustupuje!`,
      };
    }
  }

  // ── Cerignola ──────────────────────────────────────────────────────────────
  if (state.scenarioId === 'cerignola') {
    // Cilicia (French) win: any French unit reaches row 9
    const breakthroughUnit = state.units.some(
      u => u.faction === 'cilicia' && u.position.row >= 9
    );
    if (breakthroughUnit) {
      return {
        victor: 'cilicia',
        cause: `${scenario?.ciliciaLabel ?? 'Francouzi'} prolomili linii — průlom do týlu!`,
      };
    }
    // Tamerlane (Spanish) survival to turn limit
    if (
      isEndOfTurn &&
      scenario?.turnLimit !== undefined &&
      scenario.turnLimit !== null &&
      state.currentPlayer === 'tamerlane' &&
      state.turnNumber >= scenario.turnLimit
    ) {
      return {
        victor: 'tamerlane',
        cause: `${scenario?.tamerlaneLabel ?? 'Španělé'} ubránili zákopy — Francouzi poraženi!`,
      };
    }
  }

  return { victor: null, cause: null };
}
