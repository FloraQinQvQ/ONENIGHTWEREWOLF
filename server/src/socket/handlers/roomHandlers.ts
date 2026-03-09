import type { Server, Socket } from 'socket.io';
import { getRoomByCode, addMember, removeMember, getRoomMembers, updateRoomSettings, updateRoomStatus } from '../../db/rooms';
import { getUserById } from '../../db/users';
import { getGame, setGame, deleteGame } from '../../game/GameManager';
import { assignRoles, computeNightOrder } from '../../game/RoleAssigner';
import { startNightStep } from './gameHandlers';
import type { RoomState, RoomSettings, PublicPlayer } from 'shared';

function buildPublicPlayers(roomId: string, hostId: string, game?: ReturnType<typeof getGame>): PublicPlayer[] {
  const memberIds = getRoomMembers(roomId);
  return memberIds.map(uid => {
    const u = getUserById(uid);
    const gs = game?.players.get(uid);
    return {
      userId: uid,
      displayName: u?.display_name || 'Unknown',
      avatarUrl: u?.avatar_url || null,
      isHost: uid === hostId,
      isReady: gs?.isReady ?? false,
      hasVoted: gs ? gs.vote !== null : false,
    };
  });
}

export function emitRoomState(io: Server, roomCode: string) {
  const room = getRoomByCode(roomCode);
  if (!room) return;
  const game = getGame(roomCode);
  const players = buildPublicPlayers(room.id, room.host_id, game);
  const settings: RoomSettings = JSON.parse(room.settings);
  const state: RoomState = {
    roomId: room.id,
    code: room.code,
    hostId: room.host_id,
    status: room.status,
    players,
    settings,
  };
  io.to(roomCode).emit('room:state', state);
}

export function registerRoomHandlers(io: Server, socket: Socket) {
  const userId: string = socket.data.userId;

  socket.on('room:join', ({ roomCode }: { roomCode: string }) => {
    const code = roomCode.toUpperCase();
    const room = getRoomByCode(code);
    if (!room) { socket.emit('room:error', { message: 'Room not found' }); return; }
    if (room.status === 'finished') { socket.emit('room:error', { message: 'Room has ended' }); return; }
    if (room.status === 'in_progress') {
      // Allow reconnect if already a member
      const members = getRoomMembers(room.id);
      if (!members.includes(userId)) { socket.emit('room:error', { message: 'Game already in progress' }); return; }
      // Reconnect: update socketId in game state
      const game = getGame(code);
      if (game) {
        const ps = game.players.get(userId);
        if (ps) ps.socketId = socket.id;
      }
    } else {
      addMember(room.id, userId);
    }

    // Leave any previous rooms
    for (const r of socket.rooms) {
      if (r !== socket.id) socket.leave(r);
    }
    socket.join(code);
    socket.data.roomCode = code;

    emitRoomState(io, code);
  });

  socket.on('room:leave', () => {
    const code: string | undefined = socket.data.roomCode;
    if (!code) return;
    const room = getRoomByCode(code);
    if (room && room.status === 'waiting') {
      removeMember(room.id, userId);
    }
    socket.leave(code);
    socket.data.roomCode = undefined;
    emitRoomState(io, code);
  });

  socket.on('room:update_settings', ({ settings }: { settings: RoomSettings }) => {
    const code: string | undefined = socket.data.roomCode;
    if (!code) return;
    const room = getRoomByCode(code);
    if (!room || room.host_id !== userId) { socket.emit('room:error', { message: 'Not the host' }); return; }
    updateRoomSettings(room.id, settings);
    emitRoomState(io, code);
  });

  socket.on('room:start_game', () => {
    const code: string | undefined = socket.data.roomCode;
    if (!code) return;
    const room = getRoomByCode(code);
    if (!room || room.host_id !== userId) { socket.emit('room:error', { message: 'Not the host' }); return; }
    if (room.status !== 'waiting') { socket.emit('room:error', { message: 'Game already started' }); return; }

    const settings: RoomSettings = JSON.parse(room.settings);
    const memberIds = getRoomMembers(room.id);
    const playerCount = memberIds.length;

    if (playerCount < 1) { socket.emit('room:error', { message: 'Need at least 1 player' }); return; }
    if (settings.roles.length !== playerCount + 3) {
      socket.emit('room:error', { message: `Select exactly ${playerCount + 3} roles (${playerCount} players + 3 center cards)` });
      return;
    }

    const { playerRoles, centerCards } = assignRoles(memberIds, settings.roles);
    const allRoles = [...playerRoles.values()];
    const nightOrder = computeNightOrder(allRoles);

    const players = new Map(memberIds.map(uid => {
      const u = getUserById(uid)!;
      // Find socket for this user
      const sockets = [...io.sockets.sockets.values()].filter(s => s.data.userId === uid && s.data.roomCode === code);
      return [uid, {
        userId: uid,
        displayName: u.display_name,
        avatarUrl: u.avatar_url,
        socketId: sockets[0]?.id || '',
        originalRole: playerRoles.get(uid)!,
        currentRole: playerRoles.get(uid)!,
        isReady: false,
        hasActedThisStep: false,
        vote: null,
        nightResult: null,
      }];
    }));

    const gameState = {
      roomCode: code,
      roomId: room.id,
      phase: 'role_reveal' as const,
      players,
      centerCards,
      nightOrder,
      currentNightRoleIndex: 0,
      settings,
      dayTimerHandle: null,
      nightTimerHandle: null,
    };
    setGame(code, gameState);
    updateRoomStatus(room.id, 'in_progress');

    // Send each player their role privately
    for (const [uid, ps] of players) {
      const targetSocket = io.sockets.sockets.get(ps.socketId);
      if (targetSocket) {
        targetSocket.emit('game:role_assigned', {
          role: ps.originalRole,
          otherPlayers: memberIds.filter(id => id !== uid).map(id => {
            const u = getUserById(id);
            return { userId: id, displayName: u?.display_name || 'Unknown', avatarUrl: u?.avatar_url || null };
          }),
        });
      }
    }

    io.to(code).emit('game:starting', { phase: 'role_reveal', nightOrder });
    emitRoomState(io, code);
  });

  socket.on('disconnect', () => {
    const code: string | undefined = socket.data.roomCode;
    if (!code) return;
    const room = getRoomByCode(code);
    if (!room) return;

    if (room.status === 'waiting') {
      removeMember(room.id, userId);
      emitRoomState(io, code);
    }
    // Mid-game disconnect: keep player in game, they can reconnect
  });
}
