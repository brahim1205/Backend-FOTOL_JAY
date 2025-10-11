import http from 'http';
import { Server as SocketServer } from 'socket.io';
import cron from 'node-cron';
import app from './app';
const { PrismaClient } = require('./prisma/index.js');
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
import { initializeSocket } from './modules/chat/socket';
import { ProductService } from './modules/products/service';

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = new SocketServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Initialize Socket.io
initializeSocket(io);

// Connect to database (optional for testing)
async function connectDB() {
  try {
    console.log('Prisma instance:', typeof prisma, prisma);
    if (!prisma) {
      throw new Error('Prisma client is undefined');
    }
    await (prisma as any).$connect();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    console.log('Server will start without database connection');
  }
}

connectDB();

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API Docs available at http://localhost:${PORT}/api-docs`);
});

// Scheduled tasks
// Expire products automatically every hour
cron.schedule('0 * * * *', async () => {
  try {
    console.log('Running automatic product expiration...');
    const expiredCount = await ProductService.autoExpireProducts();
    if (expiredCount > 0) {
      console.log(`${expiredCount} products automatically expired`);
    }
  } catch (error) {
    console.error('Error in automatic product expiration:', error);
  }
});

// Clean up old analytics events (keep only last 90 days) - run daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  try {
    console.log('Cleaning up old analytics events...');
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const result = await (prisma as any).analyticsEvent.deleteMany({
      where: {
        createdAt: {
          lt: ninetyDaysAgo,
        },
      },
    });

    if (result.count > 0) {
      console.log(`Cleaned up ${result.count} old analytics events`);
    }
  } catch (error) {
    console.error('Error cleaning up analytics events:', error);
  }
});

console.log('Scheduled tasks initialized');

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  await (prisma as any).$disconnect();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});