import { Router, Request, Response } from 'express';
import passport from '../config/passport';
import { upsertUser, updateDisplayName, updateProfile, deleteUser } from '../db/users';

const router = Router();

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=auth_failed` }),
  (_req: Request, res: Response) => {
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/welcome`);
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
  const user = req.user as { id: string; display_name: string; email: string; avatar_url: string | null; custom_avatar: string | null; profile_setup_done: number };
  res.json({
    userId: user.id,
    displayName: user.display_name,
    email: user.email,
    avatarUrl: user.avatar_url,
    customAvatar: user.custom_avatar ?? null,
    profileSetupDone: user.profile_setup_done === 1,
  });
});

router.patch('/me', (req: Request, res: Response) => {
  if (!req.user) { res.status(401).json({ error: 'Not authenticated' }); return; }
  const { displayName, customAvatar } = req.body as { displayName?: string; customAvatar?: string | null };
  if (!displayName || !displayName.trim()) { res.status(400).json({ error: 'displayName required' }); return; }
  const trimmed = displayName.trim().slice(0, 32);
  const u = req.user as { id: string };
  const updated = updateDisplayName(u.id, trimmed);
  if (!updated) { res.status(500).json({ error: 'Update failed' }); return; }
  (req.user as any).display_name = trimmed;
  res.json({ userId: updated.id, displayName: updated.display_name, email: updated.email, avatarUrl: updated.avatar_url, customAvatar: updated.custom_avatar ?? null, profileSetupDone: updated.profile_setup_done === 1 });
});

router.post('/profile', (req: Request, res: Response) => {
  if (!req.user) { res.status(401).json({ error: 'Not authenticated' }); return; }
  const { displayName, customAvatar } = req.body as { displayName?: string; customAvatar?: string | null };
  if (!displayName || !displayName.trim()) { res.status(400).json({ error: 'displayName required' }); return; }
  const trimmed = displayName.trim().slice(0, 32);
  const avatar = typeof customAvatar === 'string' ? customAvatar.slice(0, 8) : null;
  const u = req.user as { id: string };
  const updated = updateProfile(u.id, trimmed, avatar);
  if (!updated) { res.status(500).json({ error: 'Update failed' }); return; }
  (req.user as any).display_name = trimmed;
  (req.user as any).custom_avatar = avatar;
  (req.user as any).profile_setup_done = 1;
  res.json({ userId: updated.id, displayName: updated.display_name, email: updated.email, avatarUrl: updated.avatar_url, customAvatar: updated.custom_avatar ?? null, profileSetupDone: true });
});

router.delete('/me', (req: Request, res: Response) => {
  if (!req.user) { res.status(401).json({ error: 'Not authenticated' }); return; }
  const { id } = req.user as { id: string };
  deleteUser(id);
  req.logout(() => {
    req.session.destroy(() => {
      res.json({ ok: true });
    });
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
      res.json({ ok: true, userId: user.id, displayName: user.display_name, profileSetupDone: user.profile_setup_done === 1 });
    });
  });
}

export default router;
