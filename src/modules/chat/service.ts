import prisma from '../../prisma';
import { NotificationService } from '../notifications/service';

export interface ChatMessage {
  id: string;
  fromUserId: string;
  toUserId: string;
  productId?: string;
  message: string;
  createdAt: Date;
  fromUser: {
    id: string;
    firstName: string;
    lastName: string;
  };
  product?: {
    id: string;
    title: string;
  };
}

export class ChatService {
  static async sendMessage(fromUserId: string, toUserId: string, message: string, productId?: string): Promise<ChatMessage> {
    // Vérifier que les utilisateurs existent
    const [fromUser, toUser] = await Promise.all([
      (prisma as any).user.findUnique({ where: { id: fromUserId } }),
      (prisma as any).user.findUnique({ where: { id: toUserId } }),
    ]);

    if (!fromUser || !toUser) {
      throw new Error('Utilisateur non trouvé');
    }

    // Vérifier que le produit existe si fourni
    if (productId) {
      const product = await (prisma as any).product.findUnique({ where: { id: productId } });
      if (!product) {
        throw new Error('Produit non trouvé');
      }
    }

    const chatMessage = await (prisma as any).chatMessage.create({
      data: {
        fromUserId,
        toUserId,
        productId,
        message,
      },
      include: {
        fromUser: {
          select: { id: true, firstName: true, lastName: true },
        },
        product: {
          select: { id: true, title: true },
        },
      },
    });

    // Envoyer notification au destinataire
    await NotificationService.notifyNewMessage(
      toUserId,
      fromUser.firstName + ' ' + fromUser.lastName,
      productId ? chatMessage.product?.title || 'un produit' : 'un message'
    );

    return chatMessage;
  }

  static async getConversation(userId: string, otherUserId: string, productId?: string): Promise<ChatMessage[]> {
    const where: any = {
      OR: [
        { fromUserId: userId, toUserId: otherUserId },
        { fromUserId: otherUserId, toUserId: userId },
      ],
    };

    if (productId) {
      where.productId = productId;
    }

    return (prisma as any).chatMessage.findMany({
      where,
      include: {
        fromUser: {
          select: { id: true, firstName: true, lastName: true },
        },
        product: {
          select: { id: true, title: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  static async getUserConversations(userId: string): Promise<any[]> {
    // Récupérer tous les utilisateurs avec qui l'utilisateur a conversé
    const conversations = await (prisma as any).chatMessage.findMany({
      where: {
        OR: [
          { fromUserId: userId },
          { toUserId: userId },
        ],
      },
      include: {
        fromUser: {
          select: { id: true, firstName: true, lastName: true, profilePicture: true },
        },
        toUser: {
          select: { id: true, firstName: true, lastName: true, profilePicture: true },
        },
        product: {
          select: { id: true, title: true, images: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Grouper par conversation (user + product)
    const conversationMap = new Map();

    conversations.forEach((msg: any) => {
      const otherUser = msg.fromUserId === userId ? msg.toUser : msg.fromUser;
      const key = `${otherUser.id}-${msg.productId || 'general'}`;

      if (!conversationMap.has(key)) {
        conversationMap.set(key, {
          otherUser,
          product: msg.product,
          lastMessage: msg,
          unreadCount: 0,
          messageCount: 0,
        });
      }

      const conv = conversationMap.get(key);
      conv.messageCount++;

      // Compter les messages non lus (messages reçus après le dernier message lu)
      if (msg.toUserId === userId) {
        conv.unreadCount++;
      }
    });

    return Array.from(conversationMap.values()).sort((a, b) =>
      new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
    );
  }

  static async getMessagesBetweenUsers(userId1: string, userId2: string, productId?: string, limit: number = 50, offset: number = 0): Promise<ChatMessage[]> {
    const where: any = {
      OR: [
        { fromUserId: userId1, toUserId: userId2 },
        { fromUserId: userId2, toUserId: userId1 },
      ],
    };

    if (productId) {
      where.productId = productId;
    }

    return (prisma as any).chatMessage.findMany({
      where,
      include: {
        fromUser: {
          select: { id: true, firstName: true, lastName: true },
        },
        product: {
          select: { id: true, title: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  static async makeOffer(fromUserId: string, toUserId: string, productId: string, amount: number, message?: string): Promise<ChatMessage> {
    // Vérifier que le produit existe et appartient au destinataire
    const product = await (prisma as any).product.findUnique({
      where: { id: productId },
      include: { seller: true },
    });

    if (!product) {
      throw new Error('Produit non trouvé');
    }

    if (product.sellerId !== toUserId) {
      throw new Error('Ce produit n\'appartient pas à cet utilisateur');
    }

    const offerMessage = `💰 Offre de ${amount}€ pour "${product.title}"${message ? `\n\n${message}` : ''}`;

    return this.sendMessage(fromUserId, toUserId, offerMessage, productId);
  }

  static async blockUser(userId: string, blockedUserId: string): Promise<void> {
    // Pour l'instant, on log simplement (dans un vrai système, on aurait une table blocks)
    console.log(`User ${userId} blocked user ${blockedUserId}`);

    // Notification à l'utilisateur bloqué
    await NotificationService.createNotification(blockedUserId, 'user_blocked', {
      title: 'Utilisateur bloqué',
      message: 'Un utilisateur vous a bloqué. Vous ne pouvez plus lui envoyer de messages.',
    });
  }

  static async reportConversation(userId: string, otherUserId: string, reason: string): Promise<void> {
    // Signaler la conversation pour modération
    console.log(`User ${userId} reported conversation with ${otherUserId}: ${reason}`);

    // Dans un vrai système, cela déclencherait un processus de modération
    // await AdminService.reportConversation(userId, otherUserId, reason);
  }
}