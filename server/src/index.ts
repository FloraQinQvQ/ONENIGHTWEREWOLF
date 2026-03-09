import 'dotenv/config';
import http from 'http';
import app from './app';
import { createSocketServer } from './socket';
import { initializeDatabase } from './config/database';

initializeDatabase();

const PORT = parseInt(process.env.PORT || '3001', 10);
const httpServer = http.createServer(app);

createSocketServer(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
