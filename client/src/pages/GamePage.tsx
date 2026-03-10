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
import type { RoomState, NightActionRequest, NightActionResult, GameResults, RoleName } from 'shared';

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
    setResults,
    reset,
  } = useGameStore();

  const setupSocket = useCallback(() => {
    const socket = connectSocket();

    socket.on('room:state', (state: RoomState) => {
      setRoom(state);
    });

    socket.on('game:role_assigned', ({ role, otherPlayers }: { role: RoleName; otherPlayers: Array<{ userId: string; displayName: string; avatarUrl: string | null }> }) => {
      setMyRole(role, otherPlayers);
      setPhase('role_reveal');
    });

    socket.on('game:starting', ({ phase: p, nightOrder }: { phase: string; nightOrder: RoleName[] }) => {
      setPhase(p as any);
      setNightOrder(nightOrder);
    });

    socket.on('game:night_begin', ({ order }: { order: RoleName[] }) => {
      setNightOrder(order);
      setPhase('night');
    });

    socket.on('game:night_action_request', (req: NightActionRequest) => {
      setCurrentNightRole(req.role);
      setNightActionRequest(req);
      setNightActionResult(null);
    });

    socket.on('game:night_waiting', ({ currentRole }: { currentRole: RoleName }) => {
      setCurrentNightRole(currentRole);
      setNightActionRequest(null);
    });

    socket.on('game:night_action_ack', ({ result }: { result: NightActionResult }) => {
      setNightActionResult(result);
      setNightActionRequest(null);
    });

    socket.on('game:night_phase_end', () => {
      setNightActionRequest(null);
      // Keep nightActionResult — DayPhase uses it to show what you did last night
      setCurrentNightRole(null);
    });

    socket.on('game:day_begin', ({ timerSeconds }: { timerSeconds: number }) => {
      setPhase('day');
      setDayTimer(timerSeconds);
    });

    socket.on('game:day_timer', ({ secondsLeft }: { secondsLeft: number }) => {
      setDayTimer(secondsLeft);
    });

    socket.on('game:voting_begin', () => {
      setPhase('voting');
    });

    socket.on('game:vote_counts', ({ counts }: { counts: Record<string, number> }) => {
      setVoteCounts(counts);
    });

    socket.on('game:results', (results: GameResults) => {
      setResults(results);
    });

    // Join the room socket channel (in case we navigated directly here)
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
    };
  }, [code, setRoom, setMyRole, setPhase, setNightOrder, setNightActionRequest, setNightActionResult, setCurrentNightRole, setDayTimer, setVoteCounts, setResults]);

  useEffect(() => {
    const cleanup = setupSocket();
    return cleanup;
  }, [setupSocket]);

  const handleLeave = () => {
    reset();
    navigate(`/room/${code}`);
  };

  if (phase === 'results') {
    return <ResultsCard onLeave={handleLeave} currentUserId={user?.userId || ''} />;
  }

  if (phase === 'role_reveal') {
    const readyCount = room?.players.filter(p => p.isReady).length ?? 0;
    const totalCount = room?.players.length ?? 0;
    return (
      <RoleCard
        role={myRole!}
        onReady={() => getSocket().emit('game:player_ready')}
        readyCount={readyCount}
        totalCount={totalCount}
      />
    );
  }

  if (phase === 'night') {
    return <NightPhase currentUserId={user?.userId || ''} />;
  }

  if (phase === 'day') {
    return <DayPhase currentUserId={user?.userId || ''} />;
  }

  if (phase === 'voting') {
    return <VotingPhase currentUserId={user?.userId || ''} />;
  }

  // Waiting / loading
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4 animate-pulse">🌙</div>
        <p className="text-gray-400">Waiting for game to start...</p>
      </div>
    </div>
  );
}
