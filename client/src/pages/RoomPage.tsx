import { useEffect, useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSocket, connectSocket } from '../socket';
import { useAuthStore } from '../store/authStore';
import { useRoomStore } from '../store/roomStore';
import { useGameStore } from '../store/gameStore';
import { useLangStore } from '../store/langStore';
import { useT } from '../i18n';
import RoleSelector from '../components/room/RoleSelector';
import PlayerList from '../components/room/PlayerList';
import type { RoomState, RoleName } from 'shared';

const MIN_PLAYERS = import.meta.env.PROD ? 4 : 1;

const ROLE_PRESETS: Record<number, RoleName[]> = {
  4:  ['werewolf', 'werewolf', 'seer', 'robber', 'troublemaker', 'villager', 'villager'],
  5:  ['werewolf', 'werewolf', 'seer', 'robber', 'troublemaker', 'drunk', 'villager', 'villager'],
  6:  ['werewolf', 'werewolf', 'seer', 'robber', 'troublemaker', 'drunk', 'insomniac', 'villager', 'villager'],
  7:  ['werewolf', 'werewolf', 'minion', 'seer', 'robber', 'troublemaker', 'drunk', 'insomniac', 'hunter', 'villager'],
  8:  ['werewolf', 'werewolf', 'minion', 'mason', 'mason', 'seer', 'robber', 'troublemaker', 'drunk', 'insomniac', 'hunter'],
  9:  ['werewolf', 'werewolf', 'minion', 'mason', 'mason', 'seer', 'robber', 'troublemaker', 'drunk', 'insomniac', 'hunter', 'tanner'],
  10: ['werewolf', 'werewolf', 'minion', 'mason', 'mason', 'seer', 'robber', 'troublemaker', 'drunk', 'insomniac', 'hunter', 'tanner', 'villager'],
};

export default function RoomPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [copied, setCopied] = useState(false);
  const { room, error, setRoom, setError } = useRoomStore();
  const { setPhase, setNightOrder, setMyRole } = useGameStore();
  const { lang, setLang } = useLangStore();
  const t = useT();

  const setupSocket = useCallback(() => {
    const socket = connectSocket();

    socket.on('room:state', (state: RoomState) => {
      setRoom(state);
      if (state.status === 'in_progress') {
        navigate(`/game/${code}`);
      }
    });
    socket.on('room:error', ({ message }: { message: string }) => setError(message));
    socket.on('game:role_assigned', ({ role, otherPlayers }: { role: any; otherPlayers: any[] }) => {
      setMyRole(role, otherPlayers);
    });
    socket.on('game:starting', ({ phase, nightOrder }: { phase: string; nightOrder: string[] }) => {
      setPhase(phase as any);
      setNightOrder(nightOrder as any);
      navigate(`/game/${code}`);
    });

    socket.emit('room:join', { roomCode: code });

    return () => {
      socket.off('room:state');
      socket.off('room:error');
      socket.off('game:role_assigned');
      socket.off('game:starting');
    };
  }, [code, navigate, setRoom, setError, setMyRole, setPhase, setNightOrder]);

  useEffect(() => {
    const cleanup = setupSocket();
    return cleanup;
  }, [setupSocket]);

  const isHost = room?.hostId === user?.userId;
  const playerCount = room?.players.length ?? 0;
  const requiredRoles = playerCount + 3;
  const selectedRoles = room?.settings.roles ?? [];
  const hasWerewolf = selectedRoles.includes('werewolf');
  const myPlayer = room?.players.find(p => p.userId === user?.userId);
  const iAmReady = myPlayer?.isReady ?? false;
  const allNonHostReady = (room?.players ?? []).filter(p => !p.isHost).every(p => p.isReady);
  const rolesOk = selectedRoles.length === requiredRoles && hasWerewolf;
  const canStart = isHost && playerCount >= MIN_PLAYERS && rolesOk && allNonHostReady;

  const copyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const suggestRoles = () => {
    const preset = ROLE_PRESETS[Math.min(Math.max(playerCount, 4), 10)];
    if (preset) updateSettings(preset);
  };

  const startGame = () => {
    getSocket().emit('room:start_game');
  };

  const updateSettings = (roles: string[]) => {
    getSocket().emit('room:update_settings', {
      settings: { ...room?.settings, roles },
    });
  };

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="card text-center max-w-sm">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={() => navigate('/')} className="btn-primary">{t('back')}</button>
        </div>
      </div>
    );
  }

  if (!room) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Connecting...</div>;
  }

  const timerLabel = (secs: number) => secs === 0 ? t('noLimit') : `${Math.floor(secs / 60)} min`;

  return (
    <div className="min-h-screen flex flex-col p-4 max-w-2xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white">{t('back')}</button>
        <div className="text-center">
          <p className="text-sm text-gray-500">{t('roomCode')}</p>
          <p className="text-2xl font-mono font-bold text-moon-400 tracking-widest">{room.code}</p>
          <button
            onClick={copyUrl}
            className="text-xs text-gray-500 hover:text-gray-300 mt-1 transition-colors"
          >
            {copied ? t('copied') : t('copyLink')}
          </button>
        </div>
        <button
          onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
          className="text-xs text-gray-400 hover:text-gray-200 border border-white/10 rounded px-2 py-1 transition-colors w-16 text-center"
        >
          {lang === 'zh' ? 'EN' : '中文'}
        </button>
      </header>

      <div className="flex-1 flex flex-col gap-4">
        <div className="card">
          <h2 className="font-bold text-lg mb-3">{t('players')} ({playerCount}/10)</h2>
          <PlayerList players={room.players} currentUserId={user?.userId || ''} showReadyState />
          {playerCount < MIN_PLAYERS && (
            <p className="mt-3 text-sm text-yellow-500">{t('needPlayers', { n: MIN_PLAYERS })}</p>
          )}
        </div>

        <div className="card">
          <h2 className="font-bold text-lg mb-3">{t('gameSettings')}</h2>
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-400">{t('discussionTimer')}</label>
            <div className="flex items-center gap-2">
              {isHost ? (
                <select
                  value={room?.settings.dayTimerSeconds ?? 300}
                  onChange={e => getSocket().emit('room:update_settings', {
                    settings: { ...room?.settings, dayTimerSeconds: Number(e.target.value) },
                  })}
                  className="bg-night-800 border border-night-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-moon-400"
                >
                  <option value={60}>1 min</option>
                  <option value={120}>2 min</option>
                  <option value={180}>3 min</option>
                  <option value={300}>5 min</option>
                  <option value={480}>8 min</option>
                  <option value={600}>10 min</option>
                  <option value={0}>{t('noLimit')}</option>
                </select>
              ) : (
                <span className="text-sm text-white">
                  {timerLabel(room?.settings.dayTimerSeconds ?? 300)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-bold text-lg">{t('roleSetup')}</h2>
            {isHost && (
              <button
                onClick={suggestRoles}
                className="text-xs text-moon-400 hover:text-moon-300 border border-moon-500/40 hover:border-moon-400/60 rounded-lg px-2 py-1 transition-colors"
              >
                {t('suggest')}
              </button>
            )}
          </div>
          <p className="text-sm text-gray-400 mb-3">
            {t('selectExactly', { n: requiredRoles, p: playerCount })}
          </p>
          <RoleSelector
            selected={selectedRoles as any}
            onChange={updateSettings}
            required={requiredRoles}
            disabled={!isHost}
          />
        </div>

        {isHost && (
          <button
            onClick={startGame}
            disabled={!canStart}
            className="btn-primary w-full py-4 text-lg"
          >
            {!canStart
              ? selectedRoles.length < requiredRoles
                ? t('selectMore', { n: requiredRoles - selectedRoles.length })
                : selectedRoles.length > requiredRoles
                  ? t('removeRoles', { n: selectedRoles.length - requiredRoles })
                  : !hasWerewolf
                    ? t('addWerewolf')
                    : playerCount < MIN_PLAYERS
                      ? t('needMorePlayers')
                      : t('waitingReady')
              : t('startGame')}
          </button>
        )}
        {!isHost && (
          <div className="flex flex-col items-center gap-3 py-2">
            <button
              onClick={() => getSocket().emit('room:set_ready', { ready: !iAmReady })}
              className={`w-full py-3 text-base font-semibold rounded-xl border transition-all ${
                iAmReady
                  ? 'bg-green-500/20 border-green-500/60 text-green-400 hover:bg-green-500/30'
                  : 'bg-night-700 border-white/20 text-gray-300 hover:border-white/40 hover:text-white'
              }`}
            >
              {iAmReady ? `✓ ${t('imReady')}` : t('imReady')}
            </button>
            <p className="text-sm text-gray-500">{t('waitingForHost')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
