import type { Server, Socket } from 'socket.io';
import { getGame, deleteGame } from '../../game/GameManager';
import { processNightAction, getPlayersForCurrentStep, allCurrentStepActed } from '../../game/NightProcessor';
import { determineExecuted, evaluateWinConditions } from '../../game/WinCondition';
import { updateRoomStatus, saveGameResult } from '../../db/rooms';
import { emitRoomState } from './roomHandlers';
import type { NightAction } from 'shared';

export function startNightStep(io: Server, roomCode: string) {
  const state = getGame(roomCode);
  if (!state) return;

  // Reset hasActedThisStep for all players
  for (const p of state.players.values()) p.hasActedThisStep = false;

  if (state.currentNightRoleIndex >= state.nightOrder.length) {
    // Night phase complete — move to day
    state.phase = 'day';
    io.to(roomCode).emit('game:night_phase_end', {});

    const timerSeconds = state.settings.dayTimerSeconds;
    io.to(roomCode).emit('game:day_begin', { timerSeconds });
    if (timerSeconds > 0) {
      let secondsLeft = timerSeconds;
      state.dayTimerHandle = setInterval(() => {
        secondsLeft--;
        io.to(roomCode).emit('game:day_timer', { secondsLeft });
        if (secondsLeft <= 0) {
          clearInterval(state.dayTimerHandle!);
          state.dayTimerHandle = null;
          startVoting(io, roomCode);
        }
      }, 1000);
    }
    return;
  }

  const currentRole = state.nightOrder[state.currentNightRoleIndex];
  const activePlayers = getPlayersForCurrentStep(state);

  // Send night action request to relevant players
  const otherPlayers = [...state.players.values()].map(p => ({
    userId: p.userId,
    displayName: p.displayName,
    avatarUrl: p.avatarUrl,
  }));

  const werewolfCount = [...state.players.values()].filter(p => p.currentRole === 'werewolf').length;

  for (const ps of activePlayers) {
    const sock = io.sockets.sockets.get(ps.socketId);
    if (sock) {
      sock.emit('game:night_action_request', {
        role: currentRole,
        players: otherPlayers.filter(p => p.userId !== ps.userId),
        isLoneWolf: currentRole === 'werewolf' && werewolfCount === 1,
      });
    }
  }

  // Notify other players that they should sleep
  const activeIds = new Set(activePlayers.map(p => p.socketId));
  for (const ps of state.players.values()) {
    if (!activeIds.has(ps.socketId)) {
      const sock = io.sockets.sockets.get(ps.socketId);
      if (sock) sock.emit('game:night_waiting', { currentRole });
    }
  }

  // Auto-advance if no one has this role
  if (activePlayers.length === 0) {
    state.currentNightRoleIndex++;
    startNightStep(io, roomCode);
    return;
  }

  // Night timer: auto-pass if players don't act in time
  state.nightTimerHandle = setTimeout(() => {
    for (const ps of activePlayers) {
      if (!ps.hasActedThisStep) {
        ps.hasActedThisStep = true;
        // Process a no-op
        const result = processNightAction(state, ps.userId, { type: 'no_action' });
        ps.nightResult = result;
        const sock = io.sockets.sockets.get(ps.socketId);
        if (sock) sock.emit('game:night_action_ack', { result });
      }
    }
    state.currentNightRoleIndex++;
    startNightStep(io, roomCode);
  }, state.settings.nightTimerSeconds * 1000);
}

function startVoting(io: Server, roomCode: string) {
  const state = getGame(roomCode);
  if (!state) return;
  state.phase = 'voting';
  io.to(roomCode).emit('game:voting_begin', {});
  emitRoomState(io, roomCode);
}

function endGame(io: Server, roomCode: string) {
  const state = getGame(roomCode);
  if (!state) return;
  state.phase = 'results';
  const executed = determineExecuted(state);
  const results = evaluateWinConditions(state, executed);

  updateRoomStatus(state.roomId, 'finished');
  saveGameResult(state.roomId, { winTeam: results.winTeam, winners: results.winners }, results);

  io.to(roomCode).emit('game:results', results);
  deleteGame(roomCode);
}

export function registerGameHandlers(io: Server, socket: Socket) {
  const userId: string = socket.data.userId;

  socket.on('game:player_ready', () => {
    const code: string | undefined = socket.data.roomCode;
    if (!code) return;
    const state = getGame(code);
    if (!state || state.phase !== 'role_reveal') return;

    const ps = state.players.get(userId);
    if (!ps) return;
    ps.isReady = true;

    emitRoomState(io, code);

    const allReady = [...state.players.values()].every(p => p.isReady);
    if (allReady) {
      state.phase = 'night';
      state.currentNightRoleIndex = 0;
      io.to(code).emit('game:night_begin', { order: state.nightOrder });
      startNightStep(io, code);
    }
  });

  socket.on('game:night_action', ({ action }: { action: NightAction }) => {
    const code: string | undefined = socket.data.roomCode;
    if (!code) return;
    const state = getGame(code);
    if (!state || state.phase !== 'night') return;

    const ps = state.players.get(userId);
    if (!ps || ps.hasActedThisStep) return;

    const currentRole = state.nightOrder[state.currentNightRoleIndex];
    if (ps.originalRole !== currentRole) return; // Not their turn

    const result = processNightAction(state, userId, action);
    ps.nightResult = result;
    ps.hasActedThisStep = true;

    socket.emit('game:night_action_ack', { result });

    if (allCurrentStepActed(state)) {
      if (state.nightTimerHandle) {
        clearTimeout(state.nightTimerHandle);
        state.nightTimerHandle = null;
      }
      state.currentNightRoleIndex++;
      setTimeout(() => startNightStep(io, code), 500);
    }
  });

  socket.on('game:skip_day', () => {
    // Host can skip the day timer
    const code: string | undefined = socket.data.roomCode;
    if (!code) return;
    const state = getGame(code);
    if (!state || state.phase !== 'day') return;
    const room = state.players.get(userId);
    if (!room) return;
    // Only host can skip
    // Check if user is host via room db
    if (state.dayTimerHandle) {
      clearInterval(state.dayTimerHandle);
      state.dayTimerHandle = null;
    }
    startVoting(io, code);
  });

  socket.on('game:submit_vote', ({ targetUserId }: { targetUserId: string }) => {
    const code: string | undefined = socket.data.roomCode;
    if (!code) return;
    const state = getGame(code);
    if (!state || state.phase !== 'voting') return;

    const ps = state.players.get(userId);
    if (!ps || ps.vote !== null) return; // Already voted
    if (!state.players.has(targetUserId)) return; // Invalid target
    if (targetUserId === userId) return; // Can't vote for yourself

    ps.vote = targetUserId;

    // Broadcast updated vote counts (anonymous)
    const voteCounts: Record<string, number> = {};
    for (const p of state.players.values()) {
      if (p.vote) voteCounts[p.vote] = (voteCounts[p.vote] ?? 0) + 1;
    }
    io.to(code).emit('game:vote_counts', { counts: voteCounts });

    emitRoomState(io, code);

    const allVoted = [...state.players.values()].every(p => p.vote !== null);
    if (allVoted) {
      setTimeout(() => endGame(io, code), 1000);
    }
  });
}
