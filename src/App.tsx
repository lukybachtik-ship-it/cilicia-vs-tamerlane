import { useEffect } from 'react';
import { GameProvider } from './state/GameContext';
import { MultiplayerProvider, useMultiplayer } from './state/MultiplayerContext';
import { MultiplayerSync } from './components/multiplayer/MultiplayerSync';
import { Game } from './components/Game';
import { LobbyScreen } from './components/UI/LobbyScreen';

/** Reads ?room=CODE from URL and stores it for the LobbyScreen to pick up */
function UrlRoomHandler() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    if (room) {
      window.history.replaceState({}, '', window.location.pathname);
      sessionStorage.setItem('ctg_join_code', room.toUpperCase());
    }
  }, []);

  return null;
}

function LobbyOrGame() {
  const { mode, connectionStatus } = useMultiplayer();

  // Show game when: local mode explicitly chosen, online connected, or bot game started
  const showGame =
    (mode === 'local' && connectionStatus !== 'idle') ||
    (mode === 'online' && connectionStatus === 'connected') ||
    (mode === 'bot' && connectionStatus === 'connected');

  return showGame ? <Game /> : <LobbyScreen />;
}

function App() {
  return (
    <MultiplayerProvider>
      <GameProvider>
        <UrlRoomHandler />
        <MultiplayerSync />
        <LobbyOrGame />
      </GameProvider>
    </MultiplayerProvider>
  );
}

export default App;
