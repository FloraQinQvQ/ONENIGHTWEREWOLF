import { db } from '../config/database';

export interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  custom_avatar: string | null;
  profile_setup_done: number;
  created_at: number;
  last_seen_at: number;
}

export function upsertUser(user: Pick<User, 'id' | 'email' | 'display_name' | 'avatar_url'>): User {
  db.prepare(`
    INSERT INTO users (id, email, display_name, avatar_url)
    VALUES (@id, @email, @display_name, @avatar_url)
    ON CONFLICT(id) DO UPDATE SET
      email = excluded.email,
      avatar_url = excluded.avatar_url,
      last_seen_at = unixepoch()
  `).run(user);
  return getUserById(user.id)!;
}

export function updateDisplayName(id: string, name: string): User | undefined {
  db.prepare('UPDATE users SET display_name = ? WHERE id = ?').run(name, id);
  return getUserById(id);
}

export function updateProfile(id: string, displayName: string, customAvatar: string | null): User | undefined {
  db.prepare(
    'UPDATE users SET display_name = ?, custom_avatar = ?, profile_setup_done = 1 WHERE id = ?'
  ).run(displayName, customAvatar, id);
  return getUserById(id);
}

export function getUserById(id: string): User | undefined {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined;
}

export function deleteUser(id: string): void {
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
}
