import express from 'express';
import cors from 'cors';
import path from 'path';
import passport from './config/passport';
import { sessionMiddleware } from './config/session';
import authRoutes from './routes/auth';
import roomRoutes from './routes/rooms';

const app = express();

const isProd = process.env.NODE_ENV === 'production';

if (!isProd) {
  app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  }));
}

app.use(express.json());
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

app.get('/health', (_req, res) => res.json({ ok: true }));

// Serve React app in production
if (isProd) {
  const clientDist = path.join(__dirname, '../../../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

export default app;
