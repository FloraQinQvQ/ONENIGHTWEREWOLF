import type { Server, Socket } from 'socket.io';
import { getGame, deleteGame } from '../../game/GameManager';
import { processNightAction, getPlayersForCurrentStep, allCurrentStepActed } from '../../game/NightProcessor';
import { determineExecuted, evaluateWinConditions } from '../../game/WinCondition';
import { updateRoomStatus, saveGameResult, getRoomByCode } from '../../db/rooms';
import { emitRoomState } from './roomHandlers';
import type { NightAction } from 'shared';

const VALID_ACTION_TYPES = new Set([
  'werewolf:view', 'minion:view', 'mason:view',
  'seer:view_player', 'seer:view_center',
  'robber:steal', 'troublemaker:swap',
  'drunk:take_center', 'insomniac:view', 'no_action',
]);

function isValidNightAction(action: unknown): action is NightAction {
  if (!action || typeof action !== 'object') return false;
  const a = action as Record<string, unknown>;
  if (typeof a.type !== 'string' || !VALID_ACTION_TYPES.has(a.type)) return false;
  // Validate string fields that are passed as user IDs
  if ('targetUserId' in a && typeof a.targetUserId !== 'string') return false;
  if ('targetUserIds' in a) {
    if (!Array.isArray(a.targetUserIds) || a.targetUserIds.length !== 2) return false;
    if (typeof a.targetUserIds[0] !== 'string' || typeof a.targetUserIds[1] !== 'string') return false;
  }
  if ('centerIndex' in a && typeof a.centerIndex !== 'number') return false;
  if ('centerIndices' in a) {
    if (!Array.isArray(a.centerIndices) || a.centerIndices.length !== 2) return false;
  }
  return true;
}

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
    state.dayTimerSecondsLeft = timerSeconds;
    io.to(roomCode).emit('game:day_begin', { timerSeconds });
    if (timerSeconds > 0) {
      let secondsLeft = timerSeconds;
      state.dayTimerHandle = setInterval(() => {
        secondsLeft--;
        state.dayTimerSecondsLeft = secondsLeft;
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
    customAvatar: p.customAvatar,
  }));

  const werewolfCount = [...state.players.values()].filter(p => p.currentRole === 'werewolf').length;

  for (const ps of activePlayers) {
    const sock = io.sockets.sockets.get(ps.socketId);
    if (sock) {
      // For werewolves, only send fellow werewolves (not all players)
      const requestPlayers = currentRole === 'werewolf'
        ? [...state.players.values()]
            .filter(p => p.currentRole === 'werewolf' && p.userId !== ps.userId)
            .map(p => ({ userId: p.userId, displayName: p.displayName, avatarUrl: p.avatarUrl, customAvatar: p.customAvatar }))
        : otherPlayers.filter(p => p.userId !== ps.userId);
      sock.emit('game:night_action_request', {
        role: currentRole,
        players: requestPlayers,
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

  // This role is a center card — fake the action with a random pause so players can't tell
  if (activePlayers.length === 0) {
    const fakeDelay = (6 + Math.random() * 7) * 1000; // 6–13 seconds random
    setTimeout(() => {
      state.currentNightRoleIndex++;
      startNightStep(io, roomCode);
    }, fakeDelay);
    return;
  }

  // Night timer: auto-pass if players don't act in time
  state.nightTimerHandle = setTimeout(() => {
    for (const ps of activePlayers) {
      if (!ps.hasActedThisStep) {
        ps.hasActedThisStep = true;
        // Auto-submit the appropriate action so information-gathering roles still see their result
        const role = ps.originalRole;
        const autoAction =
          role === 'drunk'
            ? { type: 'drunk:take_center' as const, centerIndex: (Math.floor(Math.random() * 3)) as 0 | 1 | 2 }
            : role === 'werewolf'
            ? { type: 'werewolf:view' as const }
            : role === 'minion'
            ? { type: 'minion:view' as const }
            : role === 'mason'
            ? { type: 'mason:view' as const }
            : role === 'insomniac'
            ? { type: 'insomniac:view' as const }
            : { type: 'no_action' as const };
        const result = processNightAction(state, ps.userId, autoAction);
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

  saveGameResult(state.roomId, { winTeam: results.winTeam, winners: results.winners }, results);
  updateRoomStatus(state.roomId, 'waiting'); // Reset room for next game

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

  socket.on('game:night_action', ({ action }: { action: unknown }) => {
    const code: string | undefined = socket.data.roomCode;
    if (!code) return;
    const state = getGame(code);
    if (!state || state.phase !== 'night') return;

    const ps = state.players.get(userId);
    if (!ps || ps.hasActedThisStep) return;

    const currentRole = state.nightOrder[state.currentNightRoleIndex];
    if (ps.originalRole !== currentRole) return; // Not their turn

    if (!isValidNightAction(action)) return; // Reject malformed payloads

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
    const code: string | undefined = socket.data.roomCode;
    if (!code) return;
    const state = getGame(code);
    if (!state || state.phase !== 'day') return;
    // Only host can skip
    const room = getRoomByCode(code);
    if (!room || room.host_id !== userId) return;
    if (state.dayTimerHandle) {
      clearInterval(state.dayTimerHandle);
      state.dayTimerHandle = null;
    }
    startVoting(io, code);
  });

  socket.on('game:submit_vote', (payload: unknown) => {
    if (!payload || typeof payload !== 'object') return;
    const { targetUserId } = payload as Record<string, unknown>;
    if (typeof targetUserId !== 'string' || !targetUserId) return;

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
