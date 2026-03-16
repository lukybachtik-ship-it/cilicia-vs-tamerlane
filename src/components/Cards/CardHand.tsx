import { useGame } from '../../state/GameContext';
import { CardDisplay } from './CardDisplay';

export function CardHand() {
  const { state, dispatch } = useGame();

  const hand =
    state.currentPlayer === 'cilicia' ? state.ciliciaHand : state.tamerlaneHand;
  const opponentHand =
    state.currentPlayer === 'cilicia' ? state.tamerlaneHand : state.ciliciaHand;

  const canPlayCard = state.currentPhase === 'play_card';

  // Scout: show pending drawn cards to pick which to discard
  if (state.currentPhase === 'discard_drawn' && state.pendingDrawnCards.length > 0) {
    return (
      <div className="flex flex-col gap-2">
        <div className="text-yellow-300 text-xs font-bold text-center">
          Průzkum: Zahod 1 kartu
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          {state.pendingDrawnCards.map(card => (
            <CardDisplay
              key={card.instanceId}
              card={card}
              isPlayable={true}
              onClick={() =>
                dispatch({ type: 'DISCARD_DRAWN_CARD', cardInstanceId: card.instanceId })
              }
            />
          ))}
        </div>
        <div className="text-gray-400 text-[10px] text-center">Klikni na kartu k zahození</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Active player label */}
      <div
        className={`text-xs font-bold text-center ${
          state.currentPlayer === 'cilicia' ? 'text-blue-400' : 'text-red-400'
        }`}
      >
        {state.currentPlayer === 'cilicia' ? '🔵 Kilikie' : '🔴 Tamerlán'} – tvoje ruka
      </div>

      {/* Active player's cards */}
      <div className="flex flex-wrap gap-2 justify-center">
        {hand.map(card => (
          <CardDisplay
            key={card.instanceId}
            card={card}
            isPlayable={canPlayCard}
            onClick={() => dispatch({ type: 'PLAY_CARD', cardInstanceId: card.instanceId })}
          />
        ))}
        {hand.length === 0 && (
          <div className="text-gray-500 text-xs text-center">Žádné karty v ruce</div>
        )}
      </div>

      {/* Deck status */}
      <div className="flex items-center gap-3 text-xs text-gray-400 justify-center mt-1">
        <span>🃏 Balíček: {state.deck.length}</span>
        <span>🗑 Odhoz: {state.discardPile.length}</span>
      </div>

      {/* Opponent hand (face down) */}
      <div className="mt-2 border-t border-gray-700 pt-2">
        <div
          className={`text-xs font-bold text-center mb-1 ${
            state.currentPlayer === 'cilicia' ? 'text-red-400' : 'text-blue-400'
          }`}
        >
          {state.currentPlayer === 'cilicia' ? '🔴 Tamerlán' : '🔵 Kilikie'} – ruka soupeře
        </div>
        <div className="flex gap-1 justify-center">
          {opponentHand.map(card => (
            <CardDisplay
              key={card.instanceId}
              card={card}
              isPlayable={false}
              onClick={() => {}}
              faceDown
            />
          ))}
        </div>
      </div>
    </div>
  );
}
