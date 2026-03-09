import type { Socket } from 'socket.io';
import type { RequestHandler } from 'express';

export function createSocketAuthMiddleware(sessionMiddleware: RequestHandler) {
  return (socket: Socket, next: (err?: Error) => void) => {
    sessionMiddleware(socket.request as any, {} as any, (err?: unknown) => {
      if (err) return next(err as Error);
      const session = (socket.request as any).session;
      const userId = session?.passport?.user;
      if (!userId) return next(new Error('Unauthorized'));
      socket.data.userId = userId;
      next();
    });
  };
}
