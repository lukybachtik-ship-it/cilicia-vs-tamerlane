import { useGame } from '../../state/GameContext';
import { ALL_SCENARIOS } from '../../constants/scenarios';
import { UNIT_DEFINITIONS } from '../../constants/unitDefinitions';
import type { TerrainType } from '../../types/terrain';
import type { UnitType } from '../../types/unit';
import { TerrainGlyph, TERRAIN_NAMES, TERRAIN_EFFECTS } from '../Board/TerrainGlyphs';
import {
  AbilityGlyph, ChargeGlyph, VolleyGlyph, PanicGlyph, CrownGlyph,
} from '../Units/StatusGlyphs';

/**
 * Shown in the left sidebar below the player's hand, replacing the (useless)
 * opponent-hand preview. Lists terrain types present in the scenario and
 * highlights which scenario-specific mechanics are in play.
 */
export function ScenarioLegend() {
  const { state } = useGame();
  const scenario = ALL_SCENARIOS.find(s => s.id === state.scenarioId);
  if (!scenario) return null;

  // Collect terrain types used in this scenario (sorted, non-plain, unique)
  const terrainsInPlay = Array.from(
    new Set(scenario.terrain.map(t => t.terrain))
  ) as TerrainType[];

  // Mechanic flags detected from units present in this scenario
  const unitTypes: UnitType[] = Array.from(
    new Set([
      ...scenario.ciliciaUnits.map(u => u.definitionType),
      ...scenario.tamerlaneUnits.map(u => u.definitionType),
    ])
  );
  const hasAny = (pred: (u: UnitType) => boolean) =>
    unitTypes.some(t => pred(t));

  const mechanicFlags = {
    pikeWall: hasAny(t => UNIT_DEFINITIONS[t].pikeWall),
    chargeRequires3Hex: hasAny(t => UNIT_DEFINITIONS[t].chargeRequires3Hex),
    volleyFireBonus: hasAny(t => UNIT_DEFINITIONS[t].volleyFireBonus),
    gunpowderWeapon: hasAny(t => UNIT_DEFINITIONS[t].gunpowderWeapon),
    setupRequired: hasAny(t => UNIT_DEFINITIONS[t].setupRequired),
    antiHeavyCavalry: hasAny(t => UNIT_DEFINITIONS[t].antiHeavyCavalry),
    destroysWalls: hasAny(t => UNIT_DEFINITIONS[t].destroysWalls),
    namedHero: hasAny(t => UNIT_DEFINITIONS[t].namedHero),
    hiddenInForest: hasAny(t => UNIT_DEFINITIONS[t].hiddenInForest),
  };

  // Abilities present in this scenario
  const abilitiesPresent = Array.from(
    new Set(
      unitTypes
        .map(t => UNIT_DEFINITIONS[t].activatedAbility)
        .filter((x): x is NonNullable<typeof x> => !!x)
    )
  );

  const ABILITY_DESC: Record<string, string> = {
    warcry:        'Válečný řev — 1×/hru: +2 kostky útoku a +1 pohyb',
    pilum:         'Pilum salva — 1×/hru: ranged 1–2 s +2 kostkami',
    betrayal:      'Zrada — 1×/hru: obrátit sousedního kondotiéra',
    ambush_signal: 'Signál přepadu — 1×/hru: odhalit germány + +1 útok',
  };

  return (
    <div className="mt-2 border-t border-gray-700 pt-2 text-[11px] text-gray-300">
      <div className="text-xs font-bold text-amber-300 mb-1">
        Vysvětlivky scénáře
      </div>

      {/* Terrain types */}
      {terrainsInPlay.length > 0 && (
        <div className="mb-2">
          <div className="text-gray-400 text-[10px] uppercase tracking-wide mb-1">Terén</div>
          <div className="flex flex-col gap-1">
            {terrainsInPlay.map(t => (
              <div key={t} className="flex items-start gap-1.5">
                <svg width={24} height={24} viewBox="-12 -12 24 24" className="flex-shrink-0">
                  <TerrainGlyph type={t} cx={0} cy={0} scale={0.9} />
                </svg>
                <div className="leading-tight">
                  <div className="text-gray-200 font-semibold">{TERRAIN_NAMES[t]}</div>
                  <div className="text-gray-500 text-[10px]">{TERRAIN_EFFECTS[t]}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activated abilities */}
      {abilitiesPresent.length > 0 && (
        <div className="mb-2">
          <div className="text-gray-400 text-[10px] uppercase tracking-wide mb-1">
            Aktivované schopnosti
          </div>
          <div className="flex flex-col gap-1">
            {abilitiesPresent.map(kind => (
              <div key={kind} className="flex items-start gap-1.5">
                <svg width={16} height={16} viewBox="-8 -8 16 16" className="flex-shrink-0 mt-0.5">
                  <AbilityGlyph />
                </svg>
                <div className="text-gray-300 text-[10px] leading-tight">{ABILITY_DESC[kind]}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Passive / conditional mechanics */}
      {(mechanicFlags.pikeWall || mechanicFlags.chargeRequires3Hex ||
        mechanicFlags.volleyFireBonus || mechanicFlags.gunpowderWeapon ||
        mechanicFlags.setupRequired || mechanicFlags.antiHeavyCavalry ||
        mechanicFlags.destroysWalls) && (
        <div className="mb-2">
          <div className="text-gray-400 text-[10px] uppercase tracking-wide mb-1">Mechaniky</div>
          <ul className="text-[10px] space-y-0.5 text-gray-300 leading-tight">
            {mechanicFlags.chargeRequires3Hex && (
              <li className="flex items-start gap-1.5">
                <svg width={14} height={14} viewBox="-7 -7 14 14" className="flex-shrink-0 mt-0.5">
                  <ChargeGlyph />
                </svg>
                <span><b>Nárazový útok</b>: jízda +2 kostky po 3+ hexech v linii</span>
              </li>
            )}
            {mechanicFlags.pikeWall && (
              <li><b>Pike wall</b>: pikenýr proti útočící jízdě +2 obrana, 1 auto-zásah</li>
            )}
            {mechanicFlags.volleyFireBonus && (
              <li className="flex items-start gap-1.5">
                <svg width={14} height={14} viewBox="-7 -7 14 14" className="flex-shrink-0 mt-0.5">
                  <VolleyGlyph />
                </svg>
                <span><b>Volejová palba</b>: 3+ arkebuzírů v řadě → +1 kostka každému</span>
              </li>
            )}
            {mechanicFlags.gunpowderWeapon && (
              <li className="flex items-start gap-1.5">
                <svg width={14} height={14} viewBox="-7 -7 14 14" className="flex-shrink-0 mt-0.5">
                  <PanicGlyph />
                </svg>
                <span><b>Prachová panika</b>: po zásahu palnou zbraní cíl −1 útok příští kolo</span>
              </li>
            )}
            {mechanicFlags.setupRequired && (
              <li><b>Setup required</b>: dělostřelectvo nemůže střílet v kole, kdy se pohnulo</li>
            )}
            {mechanicFlags.antiHeavyCavalry && (
              <li><b>Anti-jízda</b>: rodelero +1 kostka proti těžké jízdě / gendarmovi</li>
            )}
            {mechanicFlags.destroysWalls && (
              <li><b>Ničení hradeb</b>: dělostřelectvo může ostřelovat zdi (klik na hex)</li>
            )}
          </ul>
        </div>
      )}

      {/* Scenario-wide effects */}
      {scenario.scenarioEffects && scenario.scenarioEffects.length > 0 && (
        <div className="mb-1">
          <div className="text-gray-400 text-[10px] uppercase tracking-wide mb-1">
            Scénářové efekty
          </div>
          <ul className="text-[10px] space-y-1 text-gray-300 leading-tight">
            {scenario.scenarioEffects.map(eff => (
              <li key={eff.id} className="flex items-start gap-1.5">
                {eff.kind === 'named_hero_rule' && (
                  <svg width={14} height={14} viewBox="-7 -7 14 14" className="flex-shrink-0 mt-0.5">
                    <CrownGlyph />
                  </svg>
                )}
                <span>
                  {eff.descriptionCs}
                  {eff.fromTurn > 1 && <span className="text-gray-500"> (od kola {eff.fromTurn})</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Hidden units mention */}
      {mechanicFlags.hiddenInForest && (
        <div className="text-[10px] text-gray-400 mt-1 leading-tight">
          <b>Temný les:</b> germánské jednotky v temném lese jsou skryté,
          dokud se nepřátelé nedostanou do 2 hexů.
        </div>
      )}
    </div>
  );
}
