import { useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { connectSocket, getSocket } from '../socket';
import { useAuthStore } from '../store/authStore';
import { useRoomStore } from '../store/roomStore';
import { useGameStore } from '../store/gameStore';
import NightPhase from '../components/game/NightPhase';
import DayPhase from '../components/game/DayPhase';
import VotingPhase from '../components/game/VotingPhase';
import ResultsCard from '../components/results/ResultsCard';
import RoleCard from '../components/game/RoleCard';
import { useNarrator } from '../hooks/useNarrator';
import { ROLE_INFO } from '../utils/roleInfo';
import { ROLE_WAKE_SCRIPT, ROLE_WAIT_SCRIPT, narrateNightResult, narrateResult } from '../utils/narratorScript';
import type { RoomState, NightActionRequest, NightActionResult, GameResults, RoleName, GamePhase } from 'shared';

export default function GamePage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { setRoom, room } = useRoomStore();
  const {
    phase, setPhase,
    myRole, setMyRole,
    setNightOrder,
    setNightActionRequest, setNightActionResult, setCurrentNightRole,
    setDayTimer,
    setVoteCounts,
    setMyVote,
    setResults,
    reset,
  } = useGameStore();

  const { speak, muted, toggleMute, volume, setVolume } = useNarrator();

  const setupSocket = useCallback(() => {
    const socket = connectSocket();

    socket.on('room:state', (state: RoomState) => {
      setRoom(state);
    });

    socket.on('game:reconnect', (data: {
      phase: GamePhase;
      role: RoleName;
      nightOrder: RoleName[];
      otherPlayers: Array<{ userId: string; displayName: string; avatarUrl: string | null; customAvatar: string | null }>;
      currentNightRole: RoleName | null;
      nightActionRequest: NightActionRequest | null;
      nightActionResult: NightActionResult | null;
      dayTimerSecondsLeft: number;
      voteCounts: Record<string, number>;
      myVote: string | null;
    }) => {
      setMyRole(data.role, data.otherPlayers);
      setNightOrder(data.nightOrder);
      setPhase(data.phase);
      setCurrentNightRole(data.currentNightRole);
      setNightActionRequest(data.nightActionRequest);
      setNightActionResult(data.nightActionResult);
      setDayTimer(data.dayTimerSecondsLeft);
      setVoteCounts(data.voteCounts);
      if (data.myVote) setMyVote(data.myVote);
    });

    socket.on('game:role_assigned', ({ role, otherPlayers }: { role: RoleName; otherPlayers: Array<{ userId: string; displayName: string; avatarUrl: string | null }> }) => {
      setMyRole(role, otherPlayers);
      setPhase('role_reveal');
      const info = ROLE_INFO[role];
      speak(`You are the ${info.name}. ${info.description}`);
    });

    socket.on('game:starting', ({ phase: p, nightOrder }: { phase: string; nightOrder: RoleName[] }) => {
      setPhase(p as any);
      setNightOrder(nightOrder);
    });

    socket.on('game:night_begin', ({ order }: { order: RoleName[] }) => {
      setNightOrder(order);
      setPhase('night');
      speak("Night falls. Everyone close your eyes and put your thumbs up.");
    });

    socket.on('game:night_action_request', (req: NightActionRequest) => {
      setCurrentNightRole(req.role);
      setNightActionRequest(req);
      setNightActionResult(null);
      speak(ROLE_WAKE_SCRIPT[req.role]);
    });

    socket.on('game:night_waiting', ({ currentRole }: { currentRole: RoleName }) => {
      setCurrentNightRole(currentRole);
      setNightActionRequest(null);
      const script = ROLE_WAIT_SCRIPT[currentRole];
      if (script) speak(script);
    });

    socket.on('game:night_action_ack', ({ result }: { result: NightActionResult }) => {
      setNightActionResult(result);
      setNightActionRequest(null);
      speak(narrateNightResult(result));
    });

    socket.on('game:night_phase_end', () => {
      setNightActionRequest(null);
      setCurrentNightRole(null);
    });

    socket.on('game:day_begin', ({ timerSeconds }: { timerSeconds: number }) => {
      setPhase('day');
      setDayTimer(timerSeconds);
      if (timerSeconds > 0) {
        const mins = Math.round(timerSeconds / 60);
        speak(`Everyone wake up! The sun is rising. Discuss and find the werewolves. You have ${mins} minute${mins !== 1 ? 's' : ''}.`);
      } else {
        speak("Everyone wake up! The sun is rising. Discuss and find the werewolves.");
      }
    });

    socket.on('game:day_timer', ({ secondsLeft }: { secondsLeft: number }) => {
      setDayTimer(secondsLeft);
    });

    socket.on('game:voting_begin', () => {
      setPhase('voting');
      speak("Discussion is over. It is time to vote. Point at the player you think is a werewolf.");
    });

    socket.on('game:vote_counts', ({ counts }: { counts: Record<string, number> }) => {
      setVoteCounts(counts);
    });

    socket.on('game:results', (results: GameResults) => {
      setResults(results);
      speak(narrateResult(results, user?.userId || ''));
    });

    socket.emit('room:join', { roomCode: code });

    return () => {
      socket.off('room:state');
      socket.off('game:role_assigned');
      socket.off('game:starting');
      socket.off('game:night_begin');
      socket.off('game:night_action_request');
      socket.off('game:night_waiting');
      socket.off('game:night_action_ack');
      socket.off('game:night_phase_end');
      socket.off('game:day_begin');
      socket.off('game:day_timer');
      socket.off('game:voting_begin');
      socket.off('game:vote_counts');
      socket.off('game:results');
      socket.off('game:reconnect');
    };
  }, [code, setRoom, setMyRole, setPhase, setNightOrder, setNightActionRequest, setNightActionResult, setCurrentNightRole, setDayTimer, setVoteCounts, setMyVote, setResults, speak, user?.userId]);

  useEffect(() => {
    const cleanup = setupSocket();
    return cleanup;
  }, [setupSocket]);

  const handleLeave = () => {
    reset();
    navigate(`/room/${code}`);
  };

  const MuteButton = (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-night-800 border border-white/10 rounded-full px-3 py-2 shadow-lg">
      <button
        onClick={toggleMute}
        title={muted ? 'Unmute narrator' : 'Mute narrator'}
        className="text-lg leading-none hover:opacity-70 transition-opacity"
      >
        {muted ? '🔇' : volume < 0.4 ? '🔉' : '🔊'}
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={muted ? 0 : volume}
        onChange={e => {
          const v = parseFloat(e.target.value);
          if (muted && v > 0) toggleMute();
          if (!muted && v === 0) toggleMute();
          setVolume(v === 0 ? volume : v);
        }}
        className="w-20 accent-moon-500 cursor-pointer"
        title="Narrator volume"
      />
      <span className="text-xs text-gray-400 w-7 text-right tabular-nums">
        {Math.round((muted ? 0 : volume) * 100)}%
      </span>
    </div>
  );

  if (phase === 'results') {
    return (
      <>
        <ResultsCard onLeave={handleLeave} currentUserId={user?.userId || ''} />
        {MuteButton}
      </>
    );
  }

  if (phase === 'role_reveal') {
    const readyCount = room?.players.filter(p => p.isReady).length ?? 0;
    const totalCount = room?.players.length ?? 0;
    return (
      <>
        <RoleCard
          role={myRole!}
          onReady={() => getSocket().emit('game:player_ready')}
          readyCount={readyCount}
          totalCount={totalCount}
        />
        {MuteButton}
      </>
    );
  }

  if (phase === 'night') {
    return (
      <>
        <NightPhase currentUserId={user?.userId || ''} />
        {MuteButton}
      </>
    );
  }

  if (phase === 'day') {
    return (
      <>
        <DayPhase currentUserId={user?.userId || ''} />
        {MuteButton}
      </>
    );
  }

  if (phase === 'voting') {
    return (
      <>
        <VotingPhase currentUserId={user?.userId || ''} />
        {MuteButton}
      </>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4 animate-pulse">🌙</div>
        <p className="text-gray-400">Waiting for game to start...</p>
      </div>
    </div>
  );
}
