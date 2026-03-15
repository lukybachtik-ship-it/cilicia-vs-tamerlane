import React from 'react';
import { useGame } from '../../state/GameContext';
import { BoardCell } from './BoardCell';
import { getZone, posEqual } from '../../utils/helpers';
import type { TerrainType } from '../../types/terrain';
import { canCardActivateUnit } from '../../logic/cards';

export function Board() {
  const { state, dispatch } = useGame();

  function getTerrainAt(row: number, col: number): TerrainType {
    return (
      state.terrain.find(t => t.position.row === row && t.position.col === col)
        ?.terrain ?? 'plain'
    );
  }

  function getUnitAt(row: number, col: number) {
    return state.units.find(u => u.position.row === row && u.position.col === col) ?? null;
  }

  function handleCellClick(row: number, col: number) {
    const unitOnCell = getUnitAt(row, col);

    if (state.currentPhase === 'move' || state.currentPhase === 'attack') {
      const selectedUnit = state.selectedUnitId
        ? state.units.find(u => u.id === state.selectedUnitId)
        : null;

      // Try to move selected unit to this cell
      if (
        selectedUnit &&
        state.currentPhase === 'move' &&
        state.validMoveTargets.some(p => posEqual(p, { row, col }))
      ) {
        dispatch({ type: 'MOVE_UNIT', unitId: selectedUnit.id, targetPosition: { row, col } });
        return;
      }
    }

    // Click on empty cell → deselect
    if (!unitOnCell) {
      dispatch({ type: 'SELECT_UNIT', unitId: null });
    }
  }

  function handleUnitClick(unitId: string, e: React.MouseEvent) {
    e.stopPropagation();
    const unit = state.units.find(u => u.id === unitId);
    if (!unit) return;

    const phase = state.currentPhase;

    // Activate / deactivate during activate_units phase
    if (phase === 'activate_units' && unit.faction === state.currentPlayer) {
      if (state.activatedUnitIds.includes(unitId)) {
        dispatch({ type: 'DEACTIVATE_UNIT', unitId });
      } else {
        dispatch({ type: 'ACTIVATE_UNIT', unitId });
      }
      return;
    }

    // Attack: if unit is a valid attack target, attack it
    if (
      (phase === 'attack' || phase === 'move') &&
      state.selectedUnitId &&
      state.validAttackTargets.includes(unitId)
    ) {
      dispatch({
        type: 'ATTACK_UNIT',
        attackerId: state.selectedUnitId,
        defenderId: unitId,
      });
      return;
    }

    // Otherwise, select this unit
    dispatch({ type: 'SELECT_UNIT', unitId });
  }

  const rows = Array.from({ length: 9 }, (_, i) => i + 1);
  const cols = Array.from({ length: 9 }, (_, i) => i + 1);

  return (
    <div className="flex flex-col items-center">
      {/* Zone labels */}
      <div className="flex mb-1" style={{ width: 9 * 62 }}>
        {['Levé křídlo', 'Střed', 'Pravé křídlo'].map((label, i) => {
          const colors = ['text-orange-400', 'text-green-400', 'text-purple-400'];
          return (
            <div
              key={label}
              className={`text-center text-xs font-bold ${colors[i]}`}
              style={{ width: 3 * 62 }}
            >
              {label}
            </div>
          );
        })}
      </div>

      {/* Grid */}
      <div
        className="border border-gray-600"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 62px)' }}
      >
        {rows.map(row =>
          cols.map(col => {
            const terrain = getTerrainAt(row, col);
            const unit = getUnitAt(row, col);
            const zone = getZone(col);
            const isSelected = unit?.id === state.selectedUnitId;
            const isValidMove = state.validMoveTargets.some(p =>
              posEqual(p, { row, col })
            );
            const isAttackTarget =
              !!unit && state.validAttackTargets.includes(unit.id);
            const isActivated = !!unit?.isActivated;
            const isEligibleToActivate =
              state.currentPhase === 'activate_units' &&
              !!unit &&
              !!state.playedCard &&
              canCardActivateUnit(state.playedCard, unit, state.activatedUnitIds, state);

            return (
              <BoardCell
                key={`${row}-${col}`}
                row={row}
                col={col}
                terrain={terrain}
                unit={unit}
                isSelected={isSelected}
                isValidMove={isValidMove}
                isAttackTarget={isAttackTarget}
                isActivated={isActivated}
                isEligibleToActivate={isEligibleToActivate}
                zone={zone}
                onCellClick={() => handleCellClick(row, col)}
                onUnitClick={e => unit && handleUnitClick(unit.id, e)}
              />
            );
          })
        )}
      </div>

      {/* Row numbers */}
      <div className="flex mt-1 text-[9px] text-gray-500" style={{ width: 9 * 62 }}>
        <span className="w-full text-center">← Kilikie (řada 1) ↑ • Tamerlán (řada 9) ↓</span>
      </div>
    </div>
  );
}
