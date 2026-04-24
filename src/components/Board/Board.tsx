import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../../state/GameContext';
import { useMultiplayer } from '../../state/MultiplayerContext';
import { getZone, posEqual } from '../../utils/helpers';
import {
  hexCenter,
  hexDistance,
  hexPolygonPoints,
  getSvgSize,
  HEX_SIZE,
  HEX_WIDTH,
  HEX_MARGIN,
} from '../../utils/hexGrid';
import type { TerrainType } from '../../types/terrain';
import type { Position } from '../../types/unit';
import { canCardActivateUnit } from '../../logic/cards';
import { UNIT_DEFINITIONS } from '../../constants/unitDefinitions';
import { UNIT_ICONS } from '../../constants/unitIcons';
import { isHiddenFrom } from '../../logic/visibility';
import { hasAvailableAbility, hasGunpowderPanic, isChargingThisTurn, getVolleyBonus } from '../../logic/abilities';
import { canBetray } from '../../logic/abilities';
import { TerrainGlyph } from './TerrainGlyphs';
import {
  SleepingGlyph, LockGlyph, AbilityGlyph, PanicGlyph, ChargeGlyph, VolleyGlyph, CrownGlyph,
  MovedGlyph, AttackedGlyph,
} from '../Units/StatusGlyphs';
import { ALL_SCENARIOS } from '../../constants/scenarios';
import {
  playSelectSound,
  playMoveSound,
  playAttackSound,
  playHitSound,
} from '../../utils/sounds';

// ── Visual constants ──────────────────────────────────────────────────────────
const UNIT_R = 19;

const TERRAIN_FILL: Record<TerrainType, string> = {
  plain:            'url(#grad-plain)',
  forest:           'url(#grad-forest)',
  hill:             'url(#grad-hill)',
  fortress:         'url(#grad-fortress)',
  village:          'url(#grad-village)',
  tent:             'url(#grad-tent)',
  trench:           'url(#grad-trench)',
  vineyard:         'url(#grad-vineyard)',
  wall:             'url(#grad-wall)',
  wagenburg:        'url(#grad-wagenburg)',
  ambush_forest:    'url(#grad-ambush)',
  stream:           '#1e3a5f',
  gate:             '#5a4020',
  aqueduct_surface: '#9a9080',
  aqueduct_exit:    '#3a2818',
};

const TERRAIN_STROKE: Record<TerrainType, string> = {
  plain:            '#4a4540',
  forest:           '#2d5c33',
  hill:             '#6b4f2e',
  fortress:         '#666666',
  village:          '#8B4513',
  tent:             '#cc9900',
  trench:           '#573920',
  vineyard:         '#6b4a8f',
  wall:             '#8d8477',
  wagenburg:        '#7a5228',
  ambush_forest:    '#1a4a25',
  stream:           '#3b82f6',
  gate:             '#3d2815',
  aqueduct_surface: '#5c584e',
  aqueduct_exit:    '#fbbf24',
};

// (terrain emoji map removed — using TerrainGlyph SVG component)

// ── Lunge animation state type ─────────────────────────────────────────────────
interface LungeOffset {
  unitId: string;
  dx: number;
  dy: number;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function Board() {
  const { state, dispatch } = useGame();
  const { mode, myPlayer } = useMultiplayer();
  const [hoveredCell, setHoveredCell]   = useState<Position | null>(null);
  const [attackFlash, setAttackFlash]   = useState<Position | null>(null);
  const [lungeOffset, setLungeOffset]   = useState<LungeOffset | null>(null);

  // Viewing faction: which side's "eyes" are we drawing for (hides ambush units)
  const viewingFaction =
    mode === 'online' || mode === 'bot'
      ? (myPlayer ?? state.currentPlayer)
      : state.currentPlayer;

  // Track previous unit positions to detect remote moves and play sounds
  const prevPositionsRef = useRef<Map<string, { row: number; col: number }>>(new Map());

  useEffect(() => {
    const prevMap = prevPositionsRef.current;
    const isOnline = mode === 'online';
    const isOpponentTurn = state.currentPlayer !== myPlayer;

    if (isOnline && isOpponentTurn) {
      for (const unit of state.units) {
        const prev = prevMap.get(unit.id);
        if (prev && (prev.row !== unit.position.row || prev.col !== unit.position.col)) {
          playMoveSound();
          break; // one sound per remote state update
        }
      }
    }

    // Update tracked positions
    prevPositionsRef.current = new Map(
      state.units.map(u => [u.id, { row: u.position.row, col: u.position.col }])
    );
  }, [state.units, mode, myPlayer, state.currentPlayer]);

  const rows = Array.from({ length: state.gridRows }, (_, i) => i + 1);
  const cols = Array.from({ length: state.gridCols }, (_, i) => i + 1);
  const scenario = ALL_SCENARIOS.find(s => s.id === state.scenarioId);
  const topLabel = scenario?.ciliciaLabel ?? 'Kilikie';
  const bottomLabel = scenario?.tamerlaneLabel ?? 'Tamerlán';

  // ── Helpers ───────────────────────────────────────────────────────────────
  function getTerrainAt(row: number, col: number): TerrainType {
    return (
      state.terrain.find(t => t.position.row === row && t.position.col === col)
        ?.terrain ?? 'plain'
    );
  }

  function getTerrainElevation(row: number, col: number): number {
    return (
      state.terrain.find(t => t.position.row === row && t.position.col === col)
        ?.elevation ?? 0
    );
  }

  function getUnitAt(row: number, col: number) {
    return state.units.find(u => u.position.row === row && u.position.col === col) ?? null;
  }

  // ── Event handlers ────────────────────────────────────────────────────────
  function handleCellClick(row: number, col: number) {
    const unitOnCell = getUnitAt(row, col);

    if (state.currentPhase === 'move' || state.currentPhase === 'attack') {
      const selectedUnit = state.selectedUnitId
        ? state.units.find(u => u.id === state.selectedUnitId)
        : null;

      if (
        selectedUnit &&
        state.currentPhase === 'move' &&
        state.validMoveTargets.some(p => posEqual(p, { row, col }))
      ) {
        playMoveSound();
        dispatch({ type: 'MOVE_UNIT', unitId: selectedUnit.id, targetPosition: { row, col } });
        return;
      }

      // Culverin / siege: click on wall/wagenburg to shell it
      if (
        selectedUnit &&
        state.currentPhase === 'attack' &&
        state.validAttackTerrainTargets.some(p => posEqual(p, { row, col }))
      ) {
        playAttackSound();
        setAttackFlash({ row, col });
        dispatch({ type: 'ATTACK_TERRAIN', attackerId: selectedUnit.id, targetPosition: { row, col } });
        setTimeout(() => setAttackFlash(null), 600);
        return;
      }
    }

    if (!unitOnCell) {
      dispatch({ type: 'SELECT_UNIT', unitId: null });
    }
  }

  function handleUnitClick(unitId: string, e: React.MouseEvent) {
    e.stopPropagation();
    const unit = state.units.find(u => u.id === unitId);
    if (!unit) return;

    const phase = state.currentPhase;

    // Cesare's betrayal target picker
    if (phase === 'select_betrayal_target' && state.pendingBetrayalSourceId) {
      const source = state.units.find(u => u.id === state.pendingBetrayalSourceId);
      if (source && canBetray(source, unit)) {
        playSelectSound();
        dispatch({ type: 'SELECT_BETRAYAL_TARGET', targetId: unitId });
      }
      return;
    }

    if (phase === 'activate_units' && unit.faction === state.currentPlayer) {
      if (state.activatedUnitIds.includes(unitId)) {
        dispatch({ type: 'DEACTIVATE_UNIT', unitId });
      } else {
        dispatch({ type: 'ACTIVATE_UNIT', unitId });
      }
      return;
    }

    if (
      (phase === 'attack' || phase === 'move') &&
      state.selectedUnitId &&
      state.validAttackTargets.includes(unitId)
    ) {
      const attackerId = state.selectedUnitId;
      const attacker   = state.units.find(u => u.id === attackerId);
      const defender   = unit;

      // Compute lunge offset (40% toward the defender)
      if (attacker) {
        const from = hexCenter(attacker.position);
        const to   = hexCenter(defender.position);
        const ldx  = (to.x - from.x) * 0.4;
        const ldy  = (to.y - from.y) * 0.4;

        setLungeOffset({ unitId: attackerId, dx: ldx, dy: ldy });
        playAttackSound();

        // After lunge lands → resolve attack + flash
        setTimeout(() => {
          setAttackFlash({ ...defender.position });
          playHitSound();
          dispatch({ type: 'ATTACK_UNIT', attackerId, defenderId: unitId });

          // Return attacker to origin position
          setTimeout(() => setLungeOffset(null), 180);
          // Fade out flash
          setTimeout(() => setAttackFlash(null), 600);
        }, 220);
      } else {
        // Fallback (no attacker found)
        setAttackFlash({ ...unit.position });
        setTimeout(() => setAttackFlash(null), 550);
        dispatch({ type: 'ATTACK_UNIT', attackerId, defenderId: unitId });
      }
      return;
    }

    playSelectSound();
    dispatch({ type: 'SELECT_UNIT', unitId });
  }

  // ── Zone separator x-positions ────────────────────────────────────────────
  const sep1x = 2.75 * HEX_WIDTH + HEX_MARGIN;
  const sep2x = 5.75 * HEX_WIDTH + HEX_MARGIN;

  // ── Zone label positions ───────────────────────────────────────────────────
  const zoneLabelY = HEX_MARGIN - 14;
  const zoneLabels = [
    { x: hexCenter({ row: 1, col: 2 }).x, label: 'Levé křídlo',  color: '#fb923c' },
    { x: hexCenter({ row: 1, col: 5 }).x, label: 'Střed',         color: '#4ade80' },
    { x: hexCenter({ row: 1, col: 8 }).x, label: 'Pravé křídlo', color: '#c084fc' },
  ];

  // ── Range visualization for selected ranged unit ───────────────────────────
  const selectedUnit = state.selectedUnitId
    ? state.units.find(u => u.id === state.selectedUnitId)
    : null;

  const showRange =
    selectedUnit &&
    (state.currentPhase === 'move' || state.currentPhase === 'attack') &&
    UNIT_DEFINITIONS[selectedUnit.definitionType].rangeMax > 1;

  const rangeHexSet = new Set<string>();
  if (showRange && selectedUnit) {
    const def = UNIT_DEFINITIONS[selectedUnit.definitionType];
    for (const row of rows) {
      for (const col of cols) {
        const d = hexDistance(selectedUnit.position, { row, col });
        if (d >= def.rangeMin && d <= def.rangeMax) {
          rangeHexSet.add(`${row},${col}`);
        }
      }
    }
  }

  // ── Arrow preview ─────────────────────────────────────────────────────────
  function renderArrow() {
    if (!state.selectedUnitId || !hoveredCell) return null;
    const selUnit = state.units.find(u => u.id === state.selectedUnitId);
    if (!selUnit) return null;

    const isValidMove   = state.validMoveTargets.some(p => posEqual(p, hoveredCell));
    const hoveredUnit   = getUnitAt(hoveredCell.row, hoveredCell.col);
    const isAttackTarget = !!hoveredUnit && state.validAttackTargets.includes(hoveredUnit.id);

    if (!isValidMove && !isAttackTarget) return null;

    const from = hexCenter(selUnit.position);
    const to   = hexCenter(hoveredCell);
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) return null;

    const trim = UNIT_R + 4;
    const x1 = from.x + (dx * trim) / dist;
    const y1 = from.y + (dy * trim) / dist;
    const x2 = to.x   - (dx * trim) / dist;
    const y2 = to.y   - (dy * trim) / dist;

    return isValidMove ? (
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke="#4ade80" strokeWidth={2.5} strokeDasharray="7,4"
        markerEnd="url(#arrow-move)" opacity={0.9}
        style={{ pointerEvents: 'none' }}
      />
    ) : (
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke="#ef4444" strokeWidth={2.5}
        markerEnd="url(#arrow-attack)" opacity={0.9}
        style={{ pointerEvents: 'none' }}
      />
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center select-none w-full">
      <svg
        width="100%"
        height="auto"
        viewBox={`0 0 ${getSvgSize(state.gridRows, state.gridCols).width} ${getSvgSize(state.gridRows, state.gridCols).height}`}
        style={{ display: 'block' }}
      >
        {/* ── Definitions ──────────────────────────────────────────────── */}
        <defs>
          <linearGradient id="grad-plain" x1="0" y1="0" x2="0.5" y2="1">
            <stop offset="0%"   stopColor="#4a4038" />
            <stop offset="100%" stopColor="#3d3530" />
          </linearGradient>
          <linearGradient id="grad-forest" x1="0" y1="0" x2="0.5" y2="1">
            <stop offset="0%"   stopColor="#2d5c33" />
            <stop offset="100%" stopColor="#1a3d20" />
          </linearGradient>
          <linearGradient id="grad-hill" x1="0" y1="0" x2="0.5" y2="1">
            <stop offset="0%"   stopColor="#7a6228" />
            <stop offset="100%" stopColor="#5c4a1e" />
          </linearGradient>
          <linearGradient id="grad-fortress" x1="0" y1="0" x2="0.5" y2="1">
            <stop offset="0%"   stopColor="#555555" />
            <stop offset="100%" stopColor="#3d3d3d" />
          </linearGradient>
          <linearGradient id="grad-village" x1="0" y1="0" x2="0.5" y2="1">
            <stop offset="0%"   stopColor="#8B5E3C" />
            <stop offset="100%" stopColor="#6B4226" />
          </linearGradient>
          <linearGradient id="grad-tent" x1="0" y1="0" x2="0.5" y2="1">
            <stop offset="0%"   stopColor="#b8860b" />
            <stop offset="100%" stopColor="#8B6914" />
          </linearGradient>
          <linearGradient id="grad-trench" x1="0" y1="0" x2="0.5" y2="1">
            <stop offset="0%"   stopColor="#6b4a28" />
            <stop offset="100%" stopColor="#3d2b15" />
          </linearGradient>
          <linearGradient id="grad-vineyard" x1="0" y1="0" x2="0.5" y2="1">
            <stop offset="0%"   stopColor="#7b4d99" />
            <stop offset="100%" stopColor="#4a2c66" />
          </linearGradient>
          <linearGradient id="grad-wall" x1="0" y1="0" x2="0.5" y2="1">
            <stop offset="0%"   stopColor="#a89e8f" />
            <stop offset="100%" stopColor="#6e6859" />
          </linearGradient>
          <linearGradient id="grad-wagenburg" x1="0" y1="0" x2="0.5" y2="1">
            <stop offset="0%"   stopColor="#8B5E3C" />
            <stop offset="100%" stopColor="#553a24" />
          </linearGradient>
          <linearGradient id="grad-ambush" x1="0" y1="0" x2="0.5" y2="1">
            <stop offset="0%"   stopColor="#2d5c33" />
            <stop offset="100%" stopColor="#0f2818" />
          </linearGradient>

          <marker id="arrow-move"   markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#4ade80" />
          </marker>
          <marker id="arrow-attack" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#ef4444" />
          </marker>
        </defs>

        {/* ── Zone labels ──────────────────────────────────────────────── */}
        {zoneLabels.map(z => (
          <text
            key={z.label}
            x={z.x} y={zoneLabelY}
            textAnchor="middle"
            fontSize="10"
            fontWeight="bold"
            fill={z.color}
            style={{ pointerEvents: 'none' }}
          >
            {z.label}
          </text>
        ))}

        {/* ── Hex cells ────────────────────────────────────────────────── */}
        {rows.flatMap(row =>
          cols.map(col => {
            const terrain = getTerrainAt(row, col);
            const structureHp = state.terrain.find(
              t => t.position.row === row && t.position.col === col
            )?.structureHp;
            const unit    = getUnitAt(row, col);
            const zone    = getZone(col);

            const isValidMove   = state.validMoveTargets.some(p => posEqual(p, { row, col }));
            const isAttackTarget = !!unit && state.validAttackTargets.includes(unit.id);
            const isTerrainAttackTarget = state.validAttackTerrainTargets.some(p => posEqual(p, { row, col }));
            const isSelected    = unit?.id === state.selectedUnitId;
            const isFlashing    = !!attackFlash && attackFlash.row === row && attackFlash.col === col;
            const isRangeHex    = rangeHexSet.has(`${row},${col}`);

            const { x, y } = hexCenter({ row, col });
            const pts = hexPolygonPoints(x, y);

            const zoneTint: Record<string, string> = {
              left:   'rgba(251,146,60,0.15)',
              center: 'rgba(74,222,128,0.08)',
              right:  'rgba(192,132,252,0.15)',
            };

            return (
              <g
                key={`hex-${row}-${col}`}
                onClick={() => handleCellClick(row, col)}
                onMouseEnter={() => setHoveredCell({ row, col })}
                onMouseLeave={() => setHoveredCell(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Base terrain */}
                <polygon
                  points={pts}
                  fill={TERRAIN_FILL[terrain]}
                  stroke={TERRAIN_STROKE[terrain]}
                  strokeWidth={1}
                />
                {/* Zone tint */}
                <polygon
                  points={pts}
                  fill={zoneTint[zone]}
                  stroke="none"
                  style={{ pointerEvents: 'none' }}
                />

                {/* Range visualization — subtle yellow outline */}
                {isRangeHex && !isValidMove && !isAttackTarget && (
                  <polygon
                    points={pts}
                    fill="rgba(250,204,21,0.06)"
                    stroke="rgba(250,204,21,0.45)"
                    strokeWidth={1.2}
                    style={{ pointerEvents: 'none' }}
                  />
                )}

                {/* Valid move highlight */}
                {isValidMove && (
                  <polygon
                    points={pts}
                    fill="rgba(74,222,128,0.22)"
                    stroke="#4ade80"
                    strokeWidth={1.5}
                    style={{ pointerEvents: 'none' }}
                  />
                )}

                {/* Attack target highlight */}
                {isAttackTarget && (
                  <polygon
                    points={pts}
                    fill="rgba(239,68,68,0.22)"
                    stroke="#ef4444"
                    strokeWidth={1.5}
                    style={{ pointerEvents: 'none' }}
                  />
                )}

                {/* Wall/wagenburg attack target highlight */}
                {isTerrainAttackTarget && (
                  <polygon
                    points={pts}
                    fill="rgba(250,204,21,0.28)"
                    stroke="#facc15"
                    strokeWidth={2}
                    style={{ pointerEvents: 'none' }}
                  />
                )}

                {/* Selected unit hex outline */}
                {isSelected && (
                  <polygon
                    points={pts}
                    fill="none"
                    stroke="white"
                    strokeWidth={2}
                    opacity={0.7}
                    style={{ pointerEvents: 'none' }}
                  />
                )}

                {/* Hit flash — animated orange burst */}
                {isFlashing && (
                  <polygon
                    points={pts}
                    fill="rgba(255,120,0,0.75)"
                    stroke="#ff8800"
                    strokeWidth={2.5}
                    style={{ pointerEvents: 'none' }}
                    className="hex-flash"
                  />
                )}

                {/* Terrain glyph (SVG, drawn when no unit on cell) */}
                {terrain !== 'plain' && !unit && (
                  <TerrainGlyph type={terrain} cx={x} cy={y} />
                )}

                {/* Structure HP label (walls/wagenburg) — shown even when unit present */}
                {structureHp !== undefined && structureHp > 0 && (
                  <g transform={`translate(${x + HEX_SIZE * 0.55},${y - HEX_SIZE * 0.55})`} style={{ pointerEvents: 'none' }}>
                    <rect x={-10} y={-5} width={20} height={10} rx={2} fill="rgba(0,0,0,0.7)" stroke="#facc15" strokeWidth="0.8" />
                    <text x={0} y={2.5} textAnchor="middle" fontSize="8" fontWeight="bold" fill="#facc15">
                      HP {structureHp}
                    </text>
                  </g>
                )}

                {/* Coordinate label */}
                <text
                  x={x - HEX_SIZE * 0.56}
                  y={y - HEX_SIZE * 0.72}
                  fontSize="7"
                  fill="rgba(156,163,175,0.5)"
                  style={{ pointerEvents: 'none' }}
                >
                  {col},{row}
                </text>
              </g>
            );
          })
        )}

        {/* ── Zone separator lines ─────────────────────────────────────── */}
        <line
          x1={sep1x} y1={HEX_MARGIN / 2}
          x2={sep1x} y2={getSvgSize(state.gridRows, state.gridCols).height - HEX_MARGIN / 2}
          stroke="rgba(255,255,255,0.12)" strokeWidth={1} strokeDasharray="4,4"
          style={{ pointerEvents: 'none' }}
        />
        <line
          x1={sep2x} y1={HEX_MARGIN / 2}
          x2={sep2x} y2={getSvgSize(state.gridRows, state.gridCols).height - HEX_MARGIN / 2}
          stroke="rgba(255,255,255,0.12)" strokeWidth={1} strokeDasharray="4,4"
          style={{ pointerEvents: 'none' }}
        />

        {/* ── Hidden-unit ghosts (ambush forest ?) ─────────────────────── */}
        {state.units
          .filter(u => isHiddenFrom(u, viewingFaction, state))
          .map(u => {
            const { x, y } = hexCenter(u.position);
            return (
              <g key={`hidden-${u.id}`} style={{ pointerEvents: 'none' }}>
                <circle cx={x} cy={y} r={15} fill="rgba(20,40,20,0.6)" stroke="#4ade80" strokeWidth={1.5} strokeDasharray="3,2" opacity={0.7} />
                <text x={x} y={y + 5} textAnchor="middle" fontSize="18" fontWeight="bold" fill="#4ade80">?</text>
              </g>
            );
          })
        }

        {/* ── Unit tokens (CSS-animated translate for smooth movement) ──── */}
        {state.units
          .filter(unit => !isHiddenFrom(unit, viewingFaction, state))
          .map(unit => {
          const { x, y } = hexCenter(unit.position);
          const def = UNIT_DEFINITIONS[unit.definitionType];

          const isCilicia    = unit.faction === 'cilicia';
          const isSelected   = unit.id === state.selectedUnitId;
          const isActivated  = unit.isActivated;
          const isAttackTarget = state.validAttackTargets.includes(unit.id);
          const isSleeping   = unit.sleepsUntilTurn !== undefined && state.turnNumber < unit.sleepsUntilTurn;
          const isEligible   =
            !isSleeping &&
            state.currentPhase === 'activate_units' &&
            !!state.playedCard &&
            canCardActivateUnit(state.playedCard, unit, state.activatedUnitIds, state);

          // Betrayal target candidate?
          const betrayalSource = state.pendingBetrayalSourceId
            ? state.units.find(u => u.id === state.pendingBetrayalSourceId)
            : null;
          const isBetrayalTarget = !!betrayalSource && canBetray(betrayalSource, unit);
          const hasAbility = hasAvailableAbility(unit) && unit.faction === state.currentPlayer;
          const hasPanic = hasGunpowderPanic(unit, state);
          const charging = isChargingThisTurn(unit);
          const volleying = getVolleyBonus(unit, state) > 0;

          const terrain   = getTerrainAt(unit.position.row, unit.position.col);
          const elevation = getTerrainElevation(unit.position.row, unit.position.col);

          const fill = isSleeping             ? '#374151'
            : isActivated                     ? '#14532d'
            : isCilicia                       ? '#1e3a8a'
            : '#7f1d1d';
          const stroke = isSleeping           ? '#6b7280'
            : isActivated                     ? '#22c55e'
            : isCilicia                       ? '#3b82f6'
            : '#ef4444';

          const ringColor = isSelected     ? '#ffffff'
            : isBetrayalTarget             ? '#ffd46a'
            : isAttackTarget               ? '#ef4444'
            : isEligible                   ? '#fbbf24'
            : null;

          // HP dots (coordinates relative to unit origin 0,0)
          const hpSpacing = 9;
          const hpY_rel   = UNIT_R * 0.65 + 7;
          const hpDots = Array.from({ length: def.maxHp }, (_, i) => {
            const filled   = i < unit.hp;
            const dotColor = !filled ? '#374151'
              : unit.hp === 3       ? '#4ade80'
              : unit.hp === 2       ? '#facc15'
              : '#f87171';
            const dotX_rel = -((def.maxHp - 1) / 2) * hpSpacing + i * hpSpacing;
            return (
              <circle
                key={i}
                cx={dotX_rel}
                cy={hpY_rel}
                r={3.5}
                fill={dotColor}
                style={{ pointerEvents: 'none' }}
              />
            );
          });

          return (
            <g
              key={unit.id}
              onClick={e => handleUnitClick(unit.id, e)}
              onMouseEnter={() => setHoveredCell(unit.position)}
              style={{
                cursor: 'pointer',
                // CSS transform for smooth position animation + lunge offset
                transform: lungeOffset?.unitId === unit.id
                  ? `translate(${x + lungeOffset.dx}px, ${y + lungeOffset.dy}px)`
                  : `translate(${x}px, ${y}px)`,
                transition: 'transform 0.22s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              }}
            >
              {/* Outer glow ring */}
              {ringColor && (
                <circle
                  cx={0} cy={0}
                  r={UNIT_R + 4}
                  fill="none"
                  stroke={ringColor}
                  strokeWidth={2}
                  opacity={0.9}
                  style={{ pointerEvents: 'none' }}
                />
              )}

              {/* Unit body circle */}
              <circle
                cx={0} cy={0}
                r={UNIT_R}
                fill={fill}
                stroke={stroke}
                strokeWidth={1.5}
              />

              {/* Unit type icon */}
              <g style={{ pointerEvents: 'none' }}>
                {UNIT_ICONS[unit.definitionType] ?? (
                  <text
                    x={0} y={-2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="11"
                    fontWeight="bold"
                    fill="white"
                    style={{ pointerEvents: 'none' }}
                  >
                    {def.abbrevCs}
                  </text>
                )}
              </g>

              {/* HP dots */}
              {hpDots}

              {/* Status: has moved — small orange dot */}
              {unit.hasMoved && (
                <g transform={`translate(${UNIT_R * 0.7},${-UNIT_R * 0.7})`}>
                  <MovedGlyph />
                </g>
              )}

              {/* Status: has attacked — small purple dot */}
              {unit.hasAttacked && (
                <g transform={`translate(${-UNIT_R * 0.7},${-UNIT_R * 0.7})`}>
                  <AttackedGlyph />
                </g>
              )}

              {/* Direct fire locked indicator */}
              {unit.directFireLocked && (
                <g transform={`translate(${UNIT_R * 0.6},${UNIT_R * 0.75})`}>
                  <LockGlyph />
                </g>
              )}

              {/* Elevation indicator */}
              {terrain === 'hill' && elevation > 0 && (
                <text
                  x={-UNIT_R * 0.7}
                  y={UNIT_R * 0.9}
                  fontSize="8"
                  fontWeight="bold"
                  fill="#fbbf24"
                  style={{ pointerEvents: 'none' }}
                >
                  ▲{elevation}
                </text>
              )}

              {/* Sleeping unit indicator */}
              {isSleeping && (
                <g transform={`translate(0,0)`} opacity={0.9}>
                  <SleepingGlyph />
                </g>
              )}

              {/* Named hero crown */}
              {UNIT_DEFINITIONS[unit.definitionType].namedHero && (
                <g transform={`translate(0,${-UNIT_R - 5})`}>
                  <CrownGlyph />
                </g>
              )}

              {/* Available activated ability (gold spark) */}
              {hasAbility && (
                <g transform={`translate(${-UNIT_R * 0.6},${UNIT_R * 0.85})`}>
                  <AbilityGlyph />
                </g>
              )}

              {/* Gunpowder panic indicator */}
              {hasPanic && (
                <g transform={`translate(${UNIT_R * 0.2},${-UNIT_R * 0.7})`}>
                  <PanicGlyph />
                </g>
              )}

              {/* Charge bonus indicator */}
              {charging && (
                <g transform={`translate(${-UNIT_R * 0.2},${-UNIT_R * 0.7})`}>
                  <ChargeGlyph />
                </g>
              )}

              {/* Volley fire bonus indicator */}
              {volleying && (
                <g transform={`translate(${UNIT_R * 0.6},${UNIT_R * 0.85})`}>
                  <VolleyGlyph />
                </g>
              )}
            </g>
          );
        })}

        {/* ── Direction arrow ──────────────────────────────────────────── */}
        {renderArrow()}

        {/* ── Bottom label ─────────────────────────────────────────────── */}
        <text
          x={getSvgSize(state.gridRows, state.gridCols).width / 2}
          y={getSvgSize(state.gridRows, state.gridCols).height - 8}
          textAnchor="middle"
          fontSize="8"
          fill="rgba(107,114,128,0.8)"
          style={{ pointerEvents: 'none' }}
        >
          ↑ {topLabel} (řada 1)  •  {bottomLabel} (řada {state.gridRows}) ↓
        </text>
      </svg>
    </div>
  );
}
