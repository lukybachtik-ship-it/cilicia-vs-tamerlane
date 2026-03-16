import { useMultiplayer } from '../../state/MultiplayerContext';
import { useGame } from '../../state/GameContext';

export function ConnectionBadge() {
  const { mode, roomCode, myPlayer, connectionStatus, leaveGame } = useMultiplayer();
  const { state, openScenarioSelect } = useGame();

  if (mode !== 'online' || !roomCode) return null;

  const isMyTurn = state.currentPlayer === myPlayer;
  const statusColor = connectionStatus === 'connected' ? 'bg-green-900 border-green-700' : 'bg-yellow-900 border-yellow-700';
  const dot = connectionStatus === 'connected' ? '🟢' : '🟡';

  return (
    <div className={`flex items-center gap-2 text-xs px-3 py-1 rounded-full border ${statusColor}`}>
      <span>{dot}</span>
      <span className="text-gray-300 font-mono font-bold">{roomCode}</span>
      <span className="text-gray-500">|</span>
      <span className={myPlayer === 'cilicia' ? 'text-blue-400' : 'text-red-400'}>
        {myPlayer === 'cilicia' ? '🔵 Kilikie' : '🔴 Tamerlán'}
      </span>
      {connectionStatus === 'connected' && (
        <>
          <span className="text-gray-500">|</span>
          <span className={isMyTurn ? 'text-green-400 font-semibold' : 'text-gray-500'}>
            {isMyTurn ? 'tvůj tah' : 'soupeřův tah'}
          </span>
        </>
      )}
      <button
        onClick={() => { leaveGame(); openScenarioSelect(); }}
        className="ml-1 text-gray-600 hover:text-gray-400 transition-colors"
        title="Opustit online hru"
      >
        ✕
      </button>
    </div>
  );
}
