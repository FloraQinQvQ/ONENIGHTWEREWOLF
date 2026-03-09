import { Router, Request, Response } from 'express';
import { createRoom, getRoomByCode, getRoomMembers, updateRoomSettings } from '../db/rooms';
import { getUserById } from '../db/users';
import type { RoomSettings, RoomState } from 'shared';

const router = Router();

function requireAuth(req: Request, res: Response, next: () => void) {
  if (!req.user) { res.status(401).json({ error: 'Not authenticated' }); return; }
  next();
}

function buildRoomState(roomId: string, code: string, hostId: string, status: string, settingsJson: string): RoomState {
  const settings: RoomSettings = JSON.parse(settingsJson);
  const memberIds = getRoomMembers(roomId);
  const players = memberIds.map(uid => {
    const u = getUserById(uid);
    return {
      userId: uid,
      displayName: u?.display_name || 'Unknown',
      avatarUrl: u?.avatar_url || null,
      isHost: uid === hostId,
      isReady: false,
      hasVoted: false,
    };
  });
  return { roomId, code, hostId, status: status as RoomState['status'], players, settings };
}

router.post('/', requireAuth, (req: Request, res: Response) => {
  const user = req.user as { id: string };
  const settings: RoomSettings = req.body.settings || {
    roles: ['werewolf', 'werewolf', 'seer', 'robber', 'troublemaker', 'villager', 'villager', 'villager'],
    dayTimerSeconds: 300,
    nightTimerSeconds: 15,
  };
  const room = createRoom(user.id, settings);
  res.json(buildRoomState(room.id, room.code, room.host_id, room.status, room.settings));
});

router.get('/:code', requireAuth, (req: Request, res: Response) => {
  const room = getRoomByCode(req.params.code.toUpperCase());
  if (!room) { res.status(404).json({ error: 'Room not found' }); return; }
  if (room.status === 'finished') { res.status(410).json({ error: 'Room has ended' }); return; }
  res.json(buildRoomState(room.id, room.code, room.host_id, room.status, room.settings));
});

export default router;
