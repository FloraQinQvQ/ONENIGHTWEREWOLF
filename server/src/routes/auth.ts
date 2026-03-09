import { Router, Request, Response } from 'express';
import passport from '../config/passport';
import { upsertUser } from '../db/users';

const router = Router();

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=auth_failed` }),
  (_req: Request, res: Response) => {
    res.redirect(process.env.CLIENT_URL || 'http://localhost:5173');
  }
);

router.post('/logout', (req: Request, res: Response) => {
  req.logout(() => {
    req.session.destroy(() => {
      res.json({ ok: true });
    });
  });
});

router.get('/me', (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const user = req.user as { id: string; display_name: string; email: string; avatar_url: string | null };
  res.json({
    userId: user.id,
    displayName: user.display_name,
    email: user.email,
    avatarUrl: user.avatar_url,
  });
});

// DEV ONLY: create a test session without Google OAuth
if (process.env.NODE_ENV !== 'production') {
  router.post('/dev/login', (req: Request, res: Response) => {
    const { id, name } = req.body as { id?: string; name?: string };
    if (!id || !name) { res.status(400).json({ error: 'id and name required' }); return; }
    const user = upsertUser({ id, email: `${id}@test.local`, display_name: name, avatar_url: null });
    req.login(user, (err) => {
      if (err) { res.status(500).json({ error: String(err) }); return; }
      res.json({ ok: true, userId: user.id, displayName: user.display_name });
    });
  });
}

export default router;
