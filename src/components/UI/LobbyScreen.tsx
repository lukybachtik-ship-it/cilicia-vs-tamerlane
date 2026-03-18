import React, { useState, useEffect, useRef } from 'react';
import { useMultiplayer } from '../../state/MultiplayerContext';
import { useGame } from '../../state/GameContext';
import { createRoom, joinRoom, getRoomState } from '../../services/multiplayerService';
import { supabase } from '../../lib/supabase';
import { buildInitialState } from '../../constants/scenarioSetup';
import { ALL_SCENARIOS } from '../../constants/scenarios';

import type { PlayerTurn } from '../../types/game';

type LobbyView = 'home' | 'bot_setup' | 'create_scenario' | 'create_waiting' | 'join_input' | 'joining';

const SCENARIO_ICONS: Record<string, string> = {
  standard: '⚔️',
  ankara: '🏇',
  breakthrough: '🏰',
};

export function LobbyScreen() {
  const mp = useMultiplayer();
  const { startOnlineGame, dispatch } = useGame();

  // Auto-fill join code if arriving from a shared URL
  const pendingJoinCode = sessionStorage.getItem('ctg_join_code') ?? '';
  const [view, setView] = useState<LobbyView>(pendingJoinCode ? 'join_input' : 'home');
  const [joinCode, setJoinCode] = useState(pendingJoinCode);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [botSide, setBotSide] = useState<PlayerTurn>('cilicia'); // human plays this side
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clear session storage once consumed
  useEffect(() => {
    if (pendingJoinCode) sessionStorage.removeItem('ctg_join_code');
  }, []);

  // Poll for opponent joining (while in 'create_waiting' view)
  useEffect(() => {
    if (view !== 'create_waiting' || !mp.roomCode) return;

    pollRef.current = setInterval(async () => {
      if (!mp.roomCode) return;
      const state = await getRoomState(mp.roomCode);
      if (!state) return;

      // Check if opponent joined by looking at room status via a fresh fetch
      const { data } = await supabase
        .from('game_rooms')
        .select('status')
        .eq('id', mp.roomCode)
        .single();

      if (data?.status === 'playing') {
        clearInterval(pollRef.current!);
        mp.setOpponentConnected(true);
        mp.setConnectionStatus('connected');
      }
    }, 2500);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [view, mp.roomCode]);

  async function handleCreateGame(scenarioId: string) {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const initialState = buildInitialState(scenarioId);
      const code = await createRoom(scenarioId, initialState);

      mp.setMode('online');
      mp.setRoomCode(code);
      mp.setMyPlayer('cilicia');
      mp.setConnectionStatus('waiting');

      // Apply game state locally
      startOnlineGame(initialState);

      setView('create_waiting');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('createRoom failed:', msg);
      setErrorMsg(`Nepodařilo se vytvořit místnost: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleJoinGame() {
    const code = joinCode.trim().toUpperCase();
    if (code.length < 4) {
      setErrorMsg('Zadej platný kód místnosti.');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    setView('joining');
    try {
      const gameState = await joinRoom(code);
      if (!gameState) {
        setErrorMsg('Místnost nenalezena nebo hra již skončila.');
        setView('join_input');
        return;
      }

      mp.setMode('online');
      mp.setRoomCode(code);
      mp.setMyPlayer('tamerlane');
      mp.setConnectionStatus('connected');
      mp.setOpponentConnected(true);

      startOnlineGame(gameState);
    } catch (e) {
      setErrorMsg('Chyba připojení. Zkontroluj kód a zkus znovu.');
      setView('join_input');
    } finally {
      setIsLoading(false);
    }
  }

  function handleBotGame(scenarioId: string) {
    const humanPlayer: PlayerTurn = botSide;
    const botFaction: PlayerTurn = botSide === 'cilicia' ? 'tamerlane' : 'cilicia';
    mp.setMode('bot');
    mp.setBotPlayer(botFaction);
    mp.setMyPlayer(humanPlayer);
    mp.setConnectionStatus('connected');
    dispatch({ type: 'RESTART_GAME', scenarioId });
  }

  function handleLocalGame() {
    mp.setMode('local');
    mp.setConnectionStatus('connected');
    // ScenarioSelect will show automatically (showScenarioSelect starts as true)
    // Dispatch RESTART_GAME without scenarioId to trigger ScenarioSelect from Game component
    dispatch({ type: 'RESTART_GAME' });
  }

  // ── Views ──────────────────────────────────────────────────────────────────

  if (view === 'joining') {
    return (
      <FullscreenContainer>
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">🔗</div>
          <p className="text-gray-300 text-lg">Připojuji se k místnosti <span className="text-yellow-400 font-bold">{joinCode.toUpperCase()}</span>…</p>
        </div>
      </FullscreenContainer>
    );
  }

  if (view === 'create_waiting') {
    const gameUrl = `${window.location.origin}${window.location.pathname}?room=${mp.roomCode}`;
    return (
      <FullscreenContainer>
        <div className="text-center max-w-sm w-full">
          <div className="text-5xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold text-white mb-2">Čekám na soupeře…</h2>
          <p className="text-gray-400 text-sm mb-6">Sdílej kód místnosti nebo odkaz s druhým hráčem.</p>

          <div className="bg-gray-800 border border-gray-600 rounded-2xl p-6 mb-4">
            <div className="text-gray-400 text-xs mb-2">KÓD MÍSTNOSTI</div>
            <div className="text-5xl font-bold text-yellow-400 tracking-widest mb-4">{mp.roomCode}</div>
            <button
              onClick={() => navigator.clipboard.writeText(gameUrl)}
              className="w-full py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm transition-colors"
            >
              📋 Zkopírovat odkaz
            </button>
          </div>

          <div className="flex items-center gap-2 justify-center text-gray-500 text-sm mb-6">
            <span className="animate-pulse">●</span>
            <span>Čekám na připojení…</span>
          </div>

          <button
            onClick={() => { mp.leaveGame(); setView('home'); }}
            className="text-gray-600 hover:text-gray-400 text-xs transition-colors"
          >
            Zrušit a vrátit se
          </button>
        </div>
      </FullscreenContainer>
    );
  }

  if (view === 'create_scenario') {
    return (
      <FullscreenContainer>
        <div className="w-full max-w-3xl mx-4">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white">Vyber scénář pro online hru</h2>
            <p className="text-gray-500 text-sm mt-1">Ty budeš hrát za <span className="text-blue-400 font-semibold">Kilikiję</span> (hraješ jako první)</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {ALL_SCENARIOS.map(scenario => (
              <button
                key={scenario.id}
                onClick={() => handleCreateGame(scenario.id)}
                disabled={isLoading}
                className="group flex flex-col gap-3 p-5 rounded-2xl border transition-all duration-200 text-left
                           border-gray-700 bg-gray-900 hover:border-blue-500 hover:bg-gray-800
                           hover:shadow-[0_0_24px_rgba(59,130,246,0.2)] disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{SCENARIO_ICONS[scenario.id] ?? '🗡'}</span>
                  <div>
                    <div className="text-white font-bold text-base leading-tight">{scenario.nameCs}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{scenario.difficultyCs}</div>
                  </div>
                </div>
                <p className="text-gray-400 text-xs leading-relaxed">{scenario.descriptionCs}</p>
                <div className="mt-1 w-full text-center py-2 rounded-lg text-sm font-bold
                                bg-gray-800 group-hover:bg-blue-600 text-gray-400 group-hover:text-white
                                border border-gray-700 group-hover:border-blue-500 transition-all duration-200">
                  {isLoading ? 'Vytváří se…' : 'Hrát online →'}
                </div>
              </button>
            ))}
          </div>

          {errorMsg && (
            <p className="text-red-400 text-sm text-center mb-4">{errorMsg}</p>
          )}

          <div className="text-center">
            <button onClick={() => setView('home')} className="text-gray-600 hover:text-gray-400 text-sm transition-colors">
              ← Zpět
            </button>
          </div>
        </div>
      </FullscreenContainer>
    );
  }

  if (view === 'join_input') {
    return (
      <FullscreenContainer>
        <div className="w-full max-w-sm text-center">
          <div className="text-5xl mb-4">🔗</div>
          <h2 className="text-2xl font-bold text-white mb-2">Připojit se ke hře</h2>
          <p className="text-gray-400 text-sm mb-6">Zadej 6místný kód místnosti od prvního hráče.</p>

          <input
            type="text"
            value={joinCode}
            onChange={e => { setJoinCode(e.target.value.toUpperCase()); setErrorMsg(''); }}
            onKeyDown={e => e.key === 'Enter' && handleJoinGame()}
            placeholder="ABC123"
            maxLength={8}
            className="w-full text-center text-3xl font-bold tracking-widest bg-gray-800 border border-gray-600
                       rounded-xl px-4 py-4 text-yellow-400 placeholder-gray-700 outline-none
                       focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 mb-4 uppercase"
            autoFocus
          />

          {errorMsg && <p className="text-red-400 text-sm mb-4">{errorMsg}</p>}

          <button
            onClick={handleJoinGame}
            disabled={isLoading || joinCode.trim().length < 4}
            className="w-full py-3 rounded-xl font-bold text-base bg-green-600 hover:bg-green-500
                       text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed mb-3"
          >
            {isLoading ? 'Připojuji…' : 'Připojit se →'}
          </button>

          <button onClick={() => { setView('home'); setErrorMsg(''); }} className="text-gray-600 hover:text-gray-400 text-sm transition-colors">
            ← Zpět
          </button>
        </div>
      </FullscreenContainer>
    );
  }

  // Bot setup view
  if (view === 'bot_setup') {
    return (
      <FullscreenContainer>
        <div className="w-full max-w-3xl mx-4">
          <div className="text-center mb-5">
            <h2 className="text-2xl font-bold text-white">🤖 Hra s botem</h2>
            <p className="text-gray-500 text-sm mt-1">Vyber svou stranu a scénář</p>
          </div>

          {/* Side selection */}
          <div className="mb-5">
            <div className="text-gray-400 text-xs text-center mb-2">Hraješ jako:</div>
            <div className="flex gap-3 justify-center">
              {(['cilicia', 'tamerlane'] as PlayerTurn[]).map(side => (
                <button
                  key={side}
                  onClick={() => setBotSide(side)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 font-bold text-sm transition-all ${
                    botSide === side
                      ? side === 'cilicia'
                        ? 'border-blue-500 bg-blue-950 text-blue-300'
                        : 'border-red-500 bg-red-950 text-red-300'
                      : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {side === 'cilicia' ? '🔵 Kilikie' : '🔴 Tamerlán'}
                  {botSide === side && <span className="text-[10px] opacity-70">(ty)</span>}
                </button>
              ))}
            </div>
            <p className="text-gray-600 text-[10px] text-center mt-1">
              Bot hraje za {botSide === 'cilicia' ? '🔴 Tamerlána' : '🔵 Kilikiję'}.
              {' '}Kilikie vždy hraje jako první.
            </p>
          </div>

          {/* Scenario selection */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            {ALL_SCENARIOS.map(scenario => (
              <button
                key={scenario.id}
                onClick={() => handleBotGame(scenario.id)}
                className="group flex flex-col gap-2 p-4 rounded-2xl border transition-all duration-200 text-left
                           border-gray-700 bg-gray-900 hover:border-purple-500 hover:bg-gray-800
                           hover:shadow-[0_0_24px_rgba(168,85,247,0.2)]"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{SCENARIO_ICONS[scenario.id] ?? '🗡'}</span>
                  <div>
                    <div className="text-white font-bold text-sm leading-tight">{scenario.nameCs}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{scenario.difficultyCs}</div>
                  </div>
                </div>
                <p className="text-gray-400 text-xs leading-relaxed">{scenario.descriptionCs}</p>
                <div className="mt-auto w-full text-center py-1.5 rounded-lg text-xs font-bold
                                bg-gray-800 group-hover:bg-purple-700 text-gray-400 group-hover:text-white
                                border border-gray-700 group-hover:border-purple-500 transition-all">
                  Hrát →
                </div>
              </button>
            ))}
          </div>

          <div className="text-center">
            <button onClick={() => setView('home')} className="text-gray-600 hover:text-gray-400 text-sm transition-colors">
              ← Zpět
            </button>
          </div>
        </div>
      </FullscreenContainer>
    );
  }

  // Home view
  return (
    <FullscreenContainer>
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-1 tracking-wide">
            ⚔ <span className="text-blue-400">Kilikie</span>
            <span className="text-gray-500 text-2xl mx-3">vs</span>
            <span className="text-red-400">Tamerlán</span>
          </h1>
          <p className="text-gray-500 text-sm">Taktická tahová válečná hra</p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => setView('create_scenario')}
            className="flex items-center gap-4 p-5 rounded-2xl border border-gray-700 bg-gray-900
                       hover:border-blue-500 hover:bg-gray-800 hover:shadow-[0_0_24px_rgba(59,130,246,0.2)]
                       transition-all duration-200 text-left"
          >
            <span className="text-3xl">🌐</span>
            <div>
              <div className="text-white font-bold">Vytvořit online hru</div>
              <div className="text-gray-500 text-xs">Hrát přes internet s druhým hráčem</div>
            </div>
          </button>

          <button
            onClick={() => { setView('join_input'); setErrorMsg(''); }}
            className="flex items-center gap-4 p-5 rounded-2xl border border-gray-700 bg-gray-900
                       hover:border-green-500 hover:bg-gray-800 hover:shadow-[0_0_24px_rgba(34,197,94,0.2)]
                       transition-all duration-200 text-left"
          >
            <span className="text-3xl">🔗</span>
            <div>
              <div className="text-white font-bold">Připojit se ke hře</div>
              <div className="text-gray-500 text-xs">Zadat kód místnosti od soupeře</div>
            </div>
          </button>

          <button
            onClick={() => setView('bot_setup')}
            className="flex items-center gap-4 p-5 rounded-2xl border border-gray-700 bg-gray-900
                       hover:border-purple-500 hover:bg-gray-800 hover:shadow-[0_0_24px_rgba(168,85,247,0.2)]
                       transition-all duration-200 text-left"
          >
            <span className="text-3xl">🤖</span>
            <div>
              <div className="text-white font-bold">Hra s botem</div>
              <div className="text-gray-500 text-xs">Hrát proti počítačovému protivníkovi</div>
            </div>
          </button>

          <button
            onClick={handleLocalGame}
            className="flex items-center gap-4 p-5 rounded-2xl border border-gray-700 bg-gray-900
                       hover:border-gray-500 hover:bg-gray-800
                       transition-all duration-200 text-left"
          >
            <span className="text-3xl">👥</span>
            <div>
              <div className="text-white font-bold">Lokální hra (hotseat)</div>
              <div className="text-gray-500 text-xs">Dva hráči na jednom zařízení</div>
            </div>
          </button>
        </div>

        <p className="text-gray-700 text-xs mt-8">Command &amp; Colors inspired · Hex-based tactics · Czech UI</p>
      </div>
    </FullscreenContainer>
  );
}

function FullscreenContainer({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #0d1117 0%, #161b22 50%, #0d1117 100%)' }}
    >
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)',
          backgroundSize: '20px 20px',
        }}
      />
      <div className="relative flex items-center justify-center w-full h-full px-4">
        {children}
      </div>
    </div>
  );
}
