import { useEffect, useState } from 'react';
import { GameProvider, useGame } from './state/GameContext';
import { MultiplayerProvider, useMultiplayer } from './state/MultiplayerContext';
import { CampaignProvider, useCampaign } from './state/CampaignContext';
import { MultiplayerSync } from './components/multiplayer/MultiplayerSync';
import { Game } from './components/Game';
import { LobbyScreen } from './components/UI/LobbyScreen';
import { VelitelskaRada } from './components/Campaign/VelitelskaRada';
import { TransitionScreen } from './components/Campaign/TransitionScreen';
import { PostVictoryScreen } from './components/Campaign/PostVictoryScreen';
import { EpilogBScreen } from './components/Campaign/EpilogBScreen';
import { EpilogCScreen } from './components/Campaign/EpilogCScreen';
import { CAMPAIGN_SCENARIO_SEQUENCE, resolveNextScenarioId } from './constants/campaignScenarios';
import { evaluateSecretGoal } from './logic/campaignGoals';

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
type CampaignSubphase = 'velitelska_rada' | 'transition' | 'battle' | 'post_victory';

function CampaignFlow({
  subphase,
  setSubphase,
  onExit,
}: {
  subphase: CampaignSubphase;
  setSubphase: (p: CampaignSubphase) => void;
  onExit: () => void;
}) {
  const { campaign, dispatch: campaignDispatch, reset: resetCampaign } = useCampaign();
  const { state: gameState, dispatch: gameDispatch } = useGame();
  const { setBotPlayer, setMode, setConnectionStatus } = useMultiplayer();

  // Resolve current scenario ID via branching logic (favor/buceliárii gate 7A/7B/epilog)
  const currentScenarioId = campaign
    ? (resolveNextScenarioId({
        completedScenarios: campaign.completedScenarios.filter(r => r.victory).map(r => r.scenarioId),
        favor: campaign.favor,
        buceliariiLevel: campaign.buceliarii.level,
        buceliariiAlive: campaign.buceliarii.alive,
      }) ?? CAMPAIGN_SCENARIO_SEQUENCE[campaign.currentScenarioIndex])
    : null;

  const isNarrativeEpilog = currentScenarioId === 'epilog_b' || currentScenarioId === 'epilog_c';

  // On entering battle phase, kick off the scenario as a bot game (skip for narrative epilogs)
  useEffect(() => {
    if (subphase !== 'battle') return;
    if (!campaign) return;
    if (!currentScenarioId) return;
    if (isNarrativeEpilog) return; // narrative scenes nebyjují RESTART_GAME
    setBotPlayer('tamerlane');
    gameDispatch({
      type: 'RESTART_GAME',
      scenarioId: currentScenarioId,
      campaignOverrides: {
        buceliariiLevel: campaign.buceliarii.level,
        buceliariiFigurines: campaign.buceliarii.alive ? campaign.buceliarii.figurineCount : 0,
        gelimerWounded: campaign.gelimerWounded,
        katafraktiUnlocked: campaign.katafraktiUnlocked,
        purchases: campaign.currentPurchases.map(p => p.id),
        difficulty: campaign.difficulty,
      },
    });
  }, [subphase, currentScenarioId, setBotPlayer, gameDispatch, campaign, isNarrativeEpilog]);

  // Detect game_over → post_victory
  useEffect(() => {
    if (subphase !== 'battle') return;
    if (gameState.currentPhase !== 'game_over') return;
    setSubphase('post_victory');
  }, [subphase, gameState.currentPhase, setSubphase]);

  if (!campaign) {
    // Fallback: no campaign, exit
    onExit();
    return null;
  }

  switch (subphase) {
    case 'velitelska_rada':
      return (
        <VelitelskaRada
          onBack={onExit}
          onConfirm={() => setSubphase('transition')}
        />
      );
    case 'transition':
      return <TransitionScreen onFinished={() => setSubphase('battle')} />;
    case 'battle':
      // Narrative epilogs — skip battle, render narrative component
      if (currentScenarioId === 'epilog_b') {
        return (
          <EpilogBScreen
            onFinish={() => {
              campaignDispatch({ type: 'ADVANCE_TO_NEXT_SCENARIO' });
              setSubphase('velitelska_rada');
            }}
          />
        );
      }
      if (currentScenarioId === 'epilog_c') {
        return (
          <EpilogCScreen
            onFinish={() => {
              campaignDispatch({ type: 'ADVANCE_TO_NEXT_SCENARIO' });
              onExit();
            }}
          />
        );
      }
      return <Game />;
    case 'post_victory': {
      const scenarioId = currentScenarioId ?? CAMPAIGN_SCENARIO_SEQUENCE[campaign.currentScenarioIndex]!;
      const victory = gameState.victor === 'cilicia';
      const enemiesDestroyed = gameState.destroyedUnits.filter(u => u.faction === 'tamerlane').length;
      const lossesSuffered = gameState.destroyedUnits.filter(u => u.faction === 'cilicia').length;
      const bucelariiFallen = gameState.destroyedUnits.some(u => u.definitionType === 'bucelarii');
      const goalResult = campaign.currentSecretGoal
        ? evaluateSecretGoal(scenarioId, campaign.currentSecretGoal, gameState, campaign)
        : { achieved: false };
      return (
        <PostVictoryScreen
          result={{
            scenarioId,
            victory,
            secretGoalChosen: campaign.currentSecretGoal,
            secretGoalAchieved: goalResult.achieved,
            buceliariiSurvived: !bucelariiFallen,
            buceliariiXpEarned: goalResult.buceliariiXpEarned ?? 0,
            enemiesDestroyed,
            lossesSuffered,
          }}
          onContinue={() => {
            // Scénářové odměny a unlocky
            if (scenarioId === 'tricamarum' && victory && !campaign.katafraktiUnlocked) {
              campaignDispatch({ type: 'UNLOCK_KATAFRAKTI' });
            }
            // Ad Decimum Glory → gelimerWounded flag (použije se v Tricamaru)
            if (
              scenarioId === 'ad_decimum' &&
              victory &&
              campaign.currentSecretGoal === 'glory' &&
              goalResult.achieved
            ) {
              campaignDispatch({ type: 'SET_GELIMER_WOUNDED', wounded: true });
            }
            campaignDispatch({ type: 'ADVANCE_TO_NEXT_SCENARIO' });
            setSubphase('velitelska_rada');
          }}
          onRetry={() => {
            // V čestném módu: prohra smaže celou kampaň (storage + state)
            if (campaign.hardcoreMode) {
              void resetCampaign();
            }
            setSubphase('velitelska_rada');
            setMode('local');
            setConnectionStatus('idle');
            onExit();
          }}
        />
      );
    }
  }
}

function LobbyOrGame() {
  const { mode, connectionStatus, setMode, setConnectionStatus } = useMultiplayer();
  const { campaign } = useCampaign();

  // Campaign subphase state (only relevant when mode === 'campaign')
  const [campaignSubphase, setCampaignSubphase] = useState<CampaignSubphase>('velitelska_rada');

  // Reset to rada when entering campaign mode
  useEffect(() => {
    if (mode === 'campaign') setCampaignSubphase('velitelska_rada');
  }, [mode]);

  const showGame =
    (mode === 'local' && connectionStatus !== 'idle') ||
    (mode === 'online' && connectionStatus === 'connected') ||
    (mode === 'bot' && connectionStatus === 'connected');

  if (mode === 'campaign' && campaign) {
    return (
      <CampaignFlow
        subphase={campaignSubphase}
        setSubphase={setCampaignSubphase}
        onExit={() => {
          setMode('local');
          setConnectionStatus('idle');
        }}
      />
    );
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
