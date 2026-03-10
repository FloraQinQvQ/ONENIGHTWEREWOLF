import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import path from 'path';
import passport from './config/passport';
import { sessionMiddleware } from './config/session';
import authRoutes from './routes/auth';
import roomRoutes from './routes/rooms';

const app = express();

const isProd = process.env.NODE_ENV === 'production';

// Fail fast in production if SESSION_SECRET is weak
if (isProd && (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === 'dev-secret-change-in-prod')) {
  console.error('FATAL: SESSION_SECRET is not set or is using the default dev value. Set a strong secret in production.');
  process.exit(1);
}

// Render (and most cloud hosts) sit behind a reverse proxy — required for secure cookies + correct IPs
if (isProd) app.set('trust proxy', 1);

// Security headers
app.use(helmet({
  contentSecurityPolicy: isProd ? undefined : false, // disable CSP in dev (Vite HMR needs inline scripts)
  crossOriginEmbedderPolicy: false, // allow Google OAuth redirects
}));

if (!isProd) {
  app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  }));
}

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/auth', authLimiter);
app.use('/api', apiLimiter);

// Body parsing — limit payload size to prevent large-payload DoS
app.use(express.json({ limit: '16kb' }));
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

app.get('/health', (_req, res) => res.json({ ok: true }));

// Serve React app in production
if (isProd) {
  const clientDist = path.join(__dirname, '../../../../client/dist');
  app.use(express.static(clientDist, { maxAge: '1d' }));
  app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

export default app;
