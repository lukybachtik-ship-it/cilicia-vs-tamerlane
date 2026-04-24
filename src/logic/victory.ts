import type { GameState } from '../types/game';
import type { PlayerTurn } from '../types/game';
import { ALL_SCENARIOS } from '../constants/scenarios';
import { UNIT_DEFINITIONS } from '../constants/unitDefinitions';

const CAVALRY_TYPES = ['light_cavalry', 'heavy_cavalry', 'horse_archers'] as const;

/** Kampaňové scénáře, kde Belisariova smrt znamená okamžitou prohru (je přítomen v setupu). */
const CAMPAIGN_SCENARIOS_WITH_BELISARIUS = [
  'dara', 'nika', 'ad_decimum', 'tricamarum', 'neapol',
  'roma_6a', 'roma_6b', 'ravenna', 'calabria', 'epilog_a',
] as const;

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

  // ── UNIVERZÁLNÍ: Belisarius mrtev v kampaňovém scénáři = prohra ────────────
  // Musí běžet PŘED kill-threshold, aby jeho smrt nebyla překryta standardním
  // vítězstvím zabitím 5 nepřátel.
  if ((CAMPAIGN_SCENARIOS_WITH_BELISARIUS as readonly string[]).includes(state.scenarioId)) {
    const belisariusDead = state.destroyedUnits.some(u => u.definitionType === 'belisarius');
    if (belisariusDead) {
      return {
        victor: 'tamerlane',
        cause: `${scenario?.tamerlaneLabel ?? 'Nepřítel'}: Belisarius padl — Byzanc ztrácí generála!`,
      };
    }
  }

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
    // Wagenburg positions (fixed by scenario)
    const wbPositions = [
      { row: 8, col: 4 },
      { row: 8, col: 6 },
    ];
    // Cilicia wins by occupying BOTH wagenburg hexes (must kill defenders first)
    const bothOccupied = wbPositions.every(p =>
      state.units.some(
        u =>
          u.faction === 'cilicia' &&
          u.position.row === p.row &&
          u.position.col === p.col
      )
    );
    if (bothOccupied) {
      return {
        victor: 'cilicia',
        cause: `${scenario?.ciliciaLabel ?? 'Římané'} dobyli oba wagenburgy — Kimbrové zlomeni!`,
      };
    }
    // Tamerlane survival to turn limit: at least one wagenburg still held
    if (
      isEndOfTurn &&
      scenario?.turnLimit !== undefined &&
      scenario.turnLimit !== null &&
      state.currentPlayer === 'tamerlane' &&
      state.turnNumber >= scenario.turnLimit
    ) {
      const anyHeld = wbPositions.some(p => {
        const heldByCilicia = state.units.some(
          u =>
            u.faction === 'cilicia' &&
            u.position.row === p.row &&
            u.position.col === p.col
        );
        return !heldByCilicia;
      });
      if (anyHeld) {
        return {
          victor: 'tamerlane',
          cause: `${scenario?.tamerlaneLabel ?? 'Kimbrové'} udrželi wagenburg 14 kol!`,
        };
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

  // ── Campaign: Dara ──────────────────────────────────────────────────────
  if (state.scenarioId === 'dara') {
    // Defender rule: enemy never touches fortress (otherwise standard kill thresholds)
    // No special early win condition beyond thresholds.
  }

  // ── Campaign: Nika (Povstání) ───────────────────────────────────────────
  if (state.scenarioId === 'nika') {
    // Bot wins instantly if they occupy any palace hex (fortress marker, rows 1, cols 1-2)
    const palaceHexes = state.terrain.filter(t => t.terrain === 'fortress');
    const enemyInPalace = state.units.some(
      u =>
        u.faction === 'tamerlane' &&
        palaceHexes.some(p => p.position.row === u.position.row && p.position.col === u.position.col)
    );
    if (enemyInPalace) {
      return {
        victor: 'tamerlane',
        cause: `${scenario?.tamerlaneLabel ?? 'Povstalci'} obsadili Velký palác!`,
      };
    }
  }

  // ── Campaign: Ad Decimum / Tricamarum ───────────────────────────────────
  // (Belisariova smrt řešena univerzálním checkem nahoře.)

  // ── Campaign: Neapol — "3 jednotky uvnitř města" victory ───────────────
  if (state.scenarioId === 'neapol') {
    // Inside = row 3-6, col 5-10 (inside walls).
    const inside = state.units.filter(
      u =>
        u.faction === 'cilicia' &&
        u.position.row >= 3 && u.position.row <= 6 &&
        u.position.col >= 6 && u.position.col <= 10
    );
    if (inside.length >= 3) {
      return {
        victor: 'cilicia',
        cause: `${scenario?.ciliciaLabel ?? 'Byzantinci'} vnikli do Neapole!`,
      };
    }
  }

  // ── Campaign: Obrana Říma 6a/6b ─────────────────────────────────────────
  // Hráč vyhrává přežitím do turnLimit; bot vyhrává, pokud 2+ gotické jednotky
  // stojí uvnitř hradeb (row 3-7, col 4-10) NEBO obsadí Castel Sant'Angelo.
  if (state.scenarioId === 'roma_6a' || state.scenarioId === 'roma_6b') {
    const castel = state.terrain.find(t => t.terrain === 'fortress');
    if (castel) {
      const enemyOnCastel = state.units.some(
        u =>
          u.faction === 'tamerlane' &&
          u.position.row === castel.position.row &&
          u.position.col === castel.position.col
      );
      if (enemyOnCastel) {
        return {
          victor: 'tamerlane',
          cause: `${scenario?.tamerlaneLabel ?? 'Gotové'} obsadili Castel Sant'Angelo!`,
        };
      }
    }
    const insideCity = state.units.filter(
      u =>
        u.faction === 'tamerlane' &&
        u.position.row >= 3 && u.position.row <= 7 &&
        u.position.col >= 4 && u.position.col <= 10
    );
    if (insideCity.length >= 2) {
      return {
        victor: 'tamerlane',
        cause: `${scenario?.tamerlaneLabel ?? 'Gotové'} vnikli do Říma (2+ jednotky uvnitř)!`,
      };
    }
    // (Belisariova smrt řešena univerzálním checkem nahoře.)
    // Survival check při turn limit
    if (
      isEndOfTurn &&
      scenario?.turnLimit !== undefined &&
      scenario.turnLimit !== null &&
      state.currentPlayer === 'tamerlane' &&
      state.turnNumber >= scenario.turnLimit
    ) {
      return {
        victor: 'cilicia',
        cause: `${scenario?.ciliciaLabel ?? 'Byzantinci'} udrželi Řím ${scenario.turnLimit} kol!`,
      };
    }
  }

  // ── Campaign: Ravenna — diplomatické vítězství ─────────────────────────
  if (state.scenarioId === 'ravenna') {
    // Diplomatic: Belisarius stojí na village hex (náměstí) + 3 pěšáci sousedně +
    // ≤ 5 padlých gótských figurek (počítáno přes destroyedUnits)
    const belisarius = state.units.find(u => u.definitionType === 'belisarius' && u.faction === 'cilicia');
    const gothicFallen = state.destroyedUnits.filter(u => u.faction === 'tamerlane').length;
    if (belisarius && gothicFallen <= 5) {
      const onPlaza = state.terrain.some(
        t =>
          t.terrain === 'village' &&
          t.position.row === belisarius.position.row &&
          t.position.col === belisarius.position.col
      );
      if (onPlaza) {
        const adjInfantry = state.units.filter(u => {
          if (u.faction !== 'cilicia' || u.id === belisarius.id) return false;
          const dr = Math.abs(u.position.row - belisarius.position.row);
          const dc = Math.abs(u.position.col - belisarius.position.col);
          if (Math.max(dr, dc) !== 1) return false;
          // „infantry" = non-cavalry
          const t = u.definitionType;
          return !['heavy_cavalry', 'light_cavalry', 'horse_archers', 'bucelarii', 'cataphract', 'gendarme', 'stradiot', 'condottiero', 'equites', 'persian_cavalry', 'vandal_cavalry', 'gothic_knight', 'firouz', 'ammatas', 'gelimer', 'tzazon', 'jan_armenian', 'witiges', 'totila', 'mauri_spearmen', 'zabergan', 'hunnic_horde'].includes(t);
        }).length;
        if (adjInfantry >= 3) {
          return {
            victor: 'cilicia',
            cause: `${scenario?.ciliciaLabel ?? 'Byzantinci'}: diplomatické vítězství — Ravenna kapituluje!`,
          };
        }
      }
    }
  }

  // ── Campaign: Kalábrie — přístav victory ────────────────────────────────
  if (state.scenarioId === 'calabria') {
    // (Belisariova smrt řešena univerzálním checkem nahoře.)
    // Hráč vyhrává: přežil turnLimit A má 2+ jednotky v přístavu (tent hex nebo rows 10-11)
    if (
      isEndOfTurn &&
      scenario?.turnLimit !== undefined &&
      scenario.turnLimit !== null &&
      state.currentPlayer === 'tamerlane' &&
      state.turnNumber >= scenario.turnLimit
    ) {
      const inPort = state.units.filter(
        u => u.faction === 'cilicia' && u.position.row >= 10
      ).length;
      if (inPort >= 2) {
        return {
          victor: 'cilicia',
          cause: `${scenario?.ciliciaLabel ?? 'Byzantinci'}: nalodění v přístavu — Belisarius uniká!`,
        };
      } else {
        return {
          victor: 'tamerlane',
          cause: `${scenario?.tamerlaneLabel ?? 'Totila'}: Belisarius nestihl přístav!`,
        };
      }
    }
  }

  // ── Campaign: Epilog A Konstantinopol ─────────────────────────────────
  // (Belisariova smrt řešena univerzálním checkem nahoře.)

  return { victor: null, cause: null };
}
