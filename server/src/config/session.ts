import session from 'express-session';
import { db } from './database';

// Minimal SQLite session store using the existing DB connection
class SqliteSessionStore extends session.Store {
  private cleanup: ReturnType<typeof setInterval>;

  constructor() {
    super();
    // Clean up expired sessions every 15 minutes
    this.cleanup = setInterval(() => {
      db.prepare('DELETE FROM sessions WHERE expired_at < ?').run(Math.floor(Date.now() / 1000));
    }, 15 * 60 * 1000);
    this.cleanup.unref?.();
  }

  get(sid: string, cb: (err: unknown, session?: session.SessionData | null) => void) {
    try {
      const row = db.prepare('SELECT sess, expired_at FROM sessions WHERE sid = ?').get(sid) as
        | { sess: string; expired_at: number }
        | undefined;
      if (!row) return cb(null, null);
      if (row.expired_at < Math.floor(Date.now() / 1000)) {
        this.destroy(sid, () => {});
        return cb(null, null);
      }
      cb(null, JSON.parse(row.sess));
    } catch (e) {
      cb(e);
    }
  }

  set(sid: string, session: session.SessionData, cb?: (err?: unknown) => void) {
    try {
      const maxAge = session.cookie?.maxAge ?? 86400;
      const expiredAt = Math.floor(Date.now() / 1000) + Math.floor(maxAge / 1000);
      db.prepare(
        'INSERT INTO sessions (sid, sess, expired_at) VALUES (?, ?, ?) ON CONFLICT(sid) DO UPDATE SET sess = excluded.sess, expired_at = excluded.expired_at'
      ).run(sid, JSON.stringify(session), expiredAt);
      cb?.();
    } catch (e) {
      cb?.(e);
    }
  }

  destroy(sid: string, cb?: (err?: unknown) => void) {
    try {
      db.prepare('DELETE FROM sessions WHERE sid = ?').run(sid);
      cb?.();
    } catch (e) {
      cb?.(e);
    }
  }
}

export const sessionMiddleware = session({
  store: new SqliteSessionStore(),
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-prod',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
});
