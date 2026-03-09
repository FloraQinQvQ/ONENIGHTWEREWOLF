import { db } from '../config/database';

export interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  created_at: number;
  last_seen_at: number;
}

export function upsertUser(user: Pick<User, 'id' | 'email' | 'display_name' | 'avatar_url'>): User {
  db.prepare(`
    INSERT INTO users (id, email, display_name, avatar_url)
    VALUES (@id, @email, @display_name, @avatar_url)
    ON CONFLICT(id) DO UPDATE SET
      email = excluded.email,
      display_name = excluded.display_name,
      avatar_url = excluded.avatar_url,
      last_seen_at = unixepoch()
  `).run(user);
  return getUserById(user.id)!;
}

export function getUserById(id: string): User | undefined {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined;
}
