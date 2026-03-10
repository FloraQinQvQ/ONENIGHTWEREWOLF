import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DATABASE_PATH || './data/werewolf.db';
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      avatar_url TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      last_seen_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      host_id TEXT NOT NULL REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'waiting'
        CHECK(status IN ('waiting','in_progress','finished')),
      settings TEXT NOT NULL DEFAULT '{}',
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS room_members (
      room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id),
      joined_at INTEGER NOT NULL DEFAULT (unixepoch()),
      PRIMARY KEY (room_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL REFERENCES rooms(id),
      result TEXT,
      role_log TEXT,
      started_at INTEGER NOT NULL DEFAULT (unixepoch()),
      ended_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS sessions (
      sid TEXT PRIMARY KEY,
      sess TEXT NOT NULL,
      expired_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(code);
    CREATE INDEX IF NOT EXISTS idx_room_members_room ON room_members(room_id);
    CREATE INDEX IF NOT EXISTS idx_games_room ON games(room_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expired ON sessions(expired_at);
  `);

  // Safe migrations for new columns (SQLite doesn't support IF NOT EXISTS on ALTER)
  const userCols = (db.prepare("PRAGMA table_info(users)").all() as { name: string }[]).map(c => c.name);
  if (!userCols.includes('custom_avatar'))
    db.exec("ALTER TABLE users ADD COLUMN custom_avatar TEXT");
  if (!userCols.includes('profile_setup_done'))
    db.exec("ALTER TABLE users ADD COLUMN profile_setup_done INTEGER NOT NULL DEFAULT 0");

  console.log('Database initialized at', dbPath);
}
