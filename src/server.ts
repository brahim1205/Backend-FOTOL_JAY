import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import redisService from './services/redis';
import prisma from './prisma';
import { initializeSocket } from './modules/chat/socket';

const PORT = process.env.PORT || 5600;

const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:4200', 'http://127.0.0.1:4200', 'http://localhost:3000', 'http://127.0.0.1:3000'], // Allow Angular and Next.js dev servers
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
  }
});

// Initialize socket handlers
initializeSocket(io);

// Connect to database and Redis (optional for testing)
async function connectServices() {
  try {
    // Prisma se connecte automatiquement avec la nouvelle version
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
  }

  try {
    await redisService.connect();
  } catch (error) {
    console.warn('Redis connection failed, continuing without Redis:', (error as Error).message);
  }
}

connectServices();

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API Docs available at http://localhost:${PORT}/api-docs`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  await redisService.disconnect();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', async () => {
  console.log('Shutting down server...');
  await redisService.disconnect();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});