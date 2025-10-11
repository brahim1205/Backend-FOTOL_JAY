import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { ChatService } from './service';

const JWT_SECRET = process.env.JWT_SECRET!;

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export const initializeSocket = (io: Server) => {
  io.use((socket: AuthenticatedSocket, next: (err?: Error) => void) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      socket.userId = decoded.userId;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log('User connected:', socket.userId);

    // Join user's room for private messages
    socket.join(socket.userId!);

    // Handle sending message
    socket.on('sendMessage', async (data: { toUserId: string; productId?: string; message: string }) => {
      try {
        const message = await ChatService.sendMessage(
          socket.userId!,
          data.toUserId,
          data.message,
          data.productId
        );

        // Send to recipient
        io.to(data.toUserId).emit('newMessage', message);

        // Send back to sender
        socket.emit('messageSent', message);
      } catch (error: any) {
        socket.emit('error', { message: error.message || 'Failed to send message' });
      }
    });

    // Handle making offer
    socket.on('makeOffer', async (data: { toUserId: string; productId: string; amount: number; message?: string }) => {
      try {
        const offerMessage = await ChatService.makeOffer(
          socket.userId!,
          data.toUserId,
          data.productId,
          data.amount,
          data.message
        );

        // Send to recipient
        io.to(data.toUserId).emit('newOffer', offerMessage);

        // Send back to sender
        socket.emit('offerSent', offerMessage);
      } catch (error: any) {
        socket.emit('error', { message: error.message || 'Failed to send offer' });
      }
    });

    // Handle typing indicator
    socket.on('typing', (data: { toUserId: string; isTyping: boolean }) => {
      socket.to(data.toUserId).emit('userTyping', {
        userId: socket.userId,
        isTyping: data.isTyping,
      });
    });

    // Handle joining conversation room
    socket.on('joinConversation', (data: { otherUserId: string; productId?: string }) => {
      const roomName = `conversation_${[socket.userId, data.otherUserId].sort().join('_')}_${data.productId || 'general'}`;
      socket.join(roomName);
      socket.emit('joinedConversation', { roomName });
    });

    // Handle leaving conversation room
    socket.on('leaveConversation', (data: { otherUserId: string; productId?: string }) => {
      const roomName = `conversation_${[socket.userId, data.otherUserId].sort().join('_')}_${data.productId || 'general'}`;
      socket.leave(roomName);
      socket.emit('leftConversation', { roomName });
    });

    // Handle user online status
    socket.on('userOnline', () => {
      socket.broadcast.emit('userStatusChanged', {
        userId: socket.userId,
        status: 'online',
      });
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.userId);

      // Notify others that user went offline
      socket.broadcast.emit('userStatusChanged', {
        userId: socket.userId,
        status: 'offline',
      });
    });
  });
};