import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { upsertUser, getUserById } from '../db/users';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/auth/google/callback',
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const user = upsertUser({
          id: profile.id,
          email: profile.emails?.[0]?.value || '',
          display_name: profile.displayName,
          avatar_url: profile.photos?.[0]?.value || null,
        });
        done(null, user);
      } catch (err) {
        done(err as Error);
      }
    }
  )
);

passport.serializeUser((user: Express.User, done) => {
  done(null, (user as { id: string }).id);
});

passport.deserializeUser((id: string, done) => {
  const user = getUserById(id);
  done(null, user || false);
});

export default passport;
