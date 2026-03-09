import { db } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import type { RoomSettings } from 'shared';

export interface RoomRow {
  id: string;
  code: string;
  host_id: string;
  status: 'waiting' | 'in_progress' | 'finished';
  settings: string;
  created_at: number;
  updated_at: number;
}

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

function uniqueCode(): string {
  let code = generateCode();
  while (db.prepare('SELECT id FROM rooms WHERE code = ?').get(code)) {
    code = generateCode();
  }
  return code;
}

export function createRoom(hostId: string, settings: RoomSettings): RoomRow {
  const id = uuidv4();
  const code = uniqueCode();
  db.prepare(`
    INSERT INTO rooms (id, code, host_id, settings)
    VALUES (?, ?, ?, ?)
  `).run(id, code, hostId, JSON.stringify(settings));
  addMember(id, hostId);
  return getRoomById(id)!;
}

export function getRoomById(id: string): RoomRow | undefined {
  return db.prepare('SELECT * FROM rooms WHERE id = ?').get(id) as RoomRow | undefined;
}

export function getRoomByCode(code: string): RoomRow | undefined {
  return db.prepare('SELECT * FROM rooms WHERE code = ?').get(code) as RoomRow | undefined;
}

export function updateRoomStatus(id: string, status: RoomRow['status']): void {
  db.prepare('UPDATE rooms SET status = ?, updated_at = unixepoch() WHERE id = ?').run(status, id);
}

export function updateRoomSettings(id: string, settings: RoomSettings): void {
  db.prepare('UPDATE rooms SET settings = ?, updated_at = unixepoch() WHERE id = ?').run(JSON.stringify(settings), id);
}

export function addMember(roomId: string, userId: string): void {
  db.prepare(`
    INSERT OR IGNORE INTO room_members (room_id, user_id) VALUES (?, ?)
  `).run(roomId, userId);
}

export function removeMember(roomId: string, userId: string): void {
  db.prepare('DELETE FROM room_members WHERE room_id = ? AND user_id = ?').run(roomId, userId);
}

export function getRoomMembers(roomId: string): string[] {
  const rows = db.prepare('SELECT user_id FROM room_members WHERE room_id = ?').all(roomId) as Array<{ user_id: string }>;
  return rows.map(r => r.user_id);
}

export function saveGameResult(roomId: string, result: object, roleLog: object): void {
  const id = uuidv4();
  db.prepare(`
    INSERT INTO games (id, room_id, result, role_log, ended_at)
    VALUES (?, ?, ?, ?, unixepoch())
  `).run(id, roomId, JSON.stringify(result), JSON.stringify(roleLog));
}
