import { useEffect, useState } from 'react';
import { GameProvider } from './state/GameContext';
import { MultiplayerProvider, useMultiplayer } from './state/MultiplayerContext';
import { CampaignProvider, useCampaign } from './state/CampaignContext';
import { MultiplayerSync } from './components/multiplayer/MultiplayerSync';
import { Game } from './components/Game';
import { LobbyScreen } from './components/UI/LobbyScreen';
import { VelitelskaRada } from './components/Campaign/VelitelskaRada';
import { TransitionScreen } from './components/Campaign/TransitionScreen';

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

/** Subphase within campaign mode. */
type CampaignSubphase = 'velitelska_rada' | 'transition' | 'battle';

function LobbyOrGame() {
  const { mode, connectionStatus, setMode, setConnectionStatus } = useMultiplayer();
  const { campaign } = useCampaign();

  // Campaign subphase state (only relevant when mode === 'campaign')
  const [campaignSubphase, setCampaignSubphase] = useState<CampaignSubphase>('velitelska_rada');

  // Reset to rada when entering campaign mode
  useEffect(() => {
    if (mode === 'campaign') setCampaignSubphase('velitelska_rada');
  }, [mode]);

  // Show game when: local mode explicitly chosen, online connected, or bot game started
  const showGame =
    (mode === 'local' && connectionStatus !== 'idle') ||
    (mode === 'online' && connectionStatus === 'connected') ||
    (mode === 'bot' && connectionStatus === 'connected') ||
    (mode === 'campaign' && connectionStatus === 'connected' && campaignSubphase === 'battle');

  if (mode === 'campaign' && campaign && campaignSubphase === 'velitelska_rada') {
    return (
      <VelitelskaRada
        onBack={() => {
          // Zpět do kampaňového hubu (v LobbyScreen)
          setMode('local');
          setConnectionStatus('idle');
        }}
        onConfirm={() => setCampaignSubphase('transition')}
      />
    );
  }

  if (mode === 'campaign' && campaign && campaignSubphase === 'transition') {
    return <TransitionScreen onFinished={() => setCampaignSubphase('battle')} />;
  }

  return showGame ? <Game /> : <LobbyScreen />;
}

function App() {
  return (
    <MultiplayerProvider>
      <CampaignProvider>
        <GameProvider>
          <UrlRoomHandler />
          <MultiplayerSync />
          <LobbyOrGame />
        </GameProvider>
      </CampaignProvider>
    </MultiplayerProvider>
  );
}

export default App;
