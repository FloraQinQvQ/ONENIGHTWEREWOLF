import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { sessionMiddleware } from './config/session';
import { createSocketAuthMiddleware } from './socket/middleware/socketAuth';
import { registerRoomHandlers } from './socket/handlers/roomHandlers';
import { registerGameHandlers } from './socket/handlers/gameHandlers';

export function createSocketServer(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  io.use(createSocketAuthMiddleware(sessionMiddleware));

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id} (user: ${socket.data.userId})`);

    registerRoomHandlers(io, socket);
    registerGameHandlers(io, socket);

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}
