import admin from 'firebase-admin';
import prisma from '../../prisma';

// Initialize Firebase Admin SDK (optional)
let firebaseInitialized = false;
try {
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    const firebaseConfig = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    };

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(firebaseConfig),
      });
      firebaseInitialized = true;
      console.log('Firebase initialized successfully');
    }
  } else {
    console.log('Firebase not configured - push notifications disabled');
  }
} catch (error) {
  console.log('Firebase initialization failed - push notifications disabled:', (error as Error).message);
}

export interface NotificationPayload {
  title: string;
  message: string;
  type: string;
  data?: any;
}

export class NotificationService {
  static async createNotification(userId: string, type: string, payload: any): Promise<void> {
    await (prisma as any).notification.create({
      data: {
        userId,
        type,
        payload,
      },
    });
  }

  static async sendPushNotification(userId: string, notification: NotificationPayload): Promise<void> {
    if (!firebaseInitialized) {
      console.log(`Firebase not initialized - skipping push notification for user ${userId}`);
      return;
    }

    try {
      // Get user's FCM token (you'd store this in user table)
      const user = await (prisma as any).user.findUnique({
        where: { id: userId },
        select: { fcmToken: true }, // You'd need to add this field
      });

      if (!user?.fcmToken) {
        console.log(`No FCM token for user ${userId}`);
        return;
      }

      const message = {
        token: user.fcmToken,
        notification: {
          title: notification.title,
          body: notification.message,
        },
        data: {
          type: notification.type,
          ...notification.data,
        },
      };

      await admin.messaging().send(message);
      console.log(`Push notification sent to user ${userId}`);
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  static async getUserNotifications(userId: string, filters: {
    read?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    const where: any = { userId };
    if (filters.read !== undefined) where.read = filters.read;

    return (prisma as any).notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 20,
      skip: filters.offset || 0,
    });
  }

  static async markAsRead(userId: string, notificationIds: string[]): Promise<void> {
    await (prisma as any).notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId, // Ensure user can only mark their own notifications
      },
      data: { read: true },
    });
  }

  static async markAllAsRead(userId: string): Promise<void> {
    await (prisma as any).notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  static async getUnreadCount(userId: string): Promise<number> {
    const count = await (prisma as any).notification.count({
      where: { userId, read: false },
    });
    return count;
  }

  static async deleteNotification(userId: string, notificationId: string): Promise<void> {
    await (prisma as any).notification.deleteMany({
      where: {
        id: notificationId,
        userId, // Ensure user can only delete their own notifications
      },
    });
  }

  // Notification templates for common events
  static async notifyProductApproved(userId: string, productTitle: string): Promise<void> {
    const payload = {
      title: 'Produit approuvé !',
      message: `Votre produit "${productTitle}" a été approuvé et est maintenant visible.`,
      type: 'product_approved',
      data: { productTitle },
    };

    await this.createNotification(userId, 'product_approved', payload);
    await this.sendPushNotification(userId, payload);
  }

  static async notifyProductRejected(userId: string, productTitle: string, reason: string): Promise<void> {
    const payload = {
      title: 'Produit rejeté',
      message: `Votre produit "${productTitle}" a été rejeté : ${reason}`,
      type: 'product_rejected',
      data: { productTitle, reason },
    };

    await this.createNotification(userId, 'product_rejected', payload);
    await this.sendPushNotification(userId, payload);
  }

  static async notifyNewMessage(userId: string, senderName: string, productTitle: string): Promise<void> {
    const payload = {
      title: 'Nouveau message',
      message: `${senderName} vous a envoyé un message concernant "${productTitle}"`,
      type: 'new_message',
      data: { senderName, productTitle },
    };

    await this.createNotification(userId, 'new_message', payload);
    await this.sendPushNotification(userId, payload);
  }

  static async notifyProductSold(userId: string, productTitle: string, buyerName: string): Promise<void> {
    const payload = {
      title: 'Produit vendu !',
      message: `Félicitations ! "${productTitle}" a été vendu à ${buyerName}`,
      type: 'product_sold',
      data: { productTitle, buyerName },
    };

    await this.createNotification(userId, 'product_sold', payload);
    await this.sendPushNotification(userId, payload);
  }

  static async notifyVipExpired(userId: string): Promise<void> {
    const payload = {
      title: 'Abonnement VIP expiré',
      message: 'Votre abonnement VIP a expiré. Renouvelez pour bénéficier d\'avantages exclusifs.',
      type: 'vip_expired',
    };

    await this.createNotification(userId, 'vip_expired', payload);
    await this.sendPushNotification(userId, payload);
  }
}