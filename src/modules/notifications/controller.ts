import { Request, Response } from 'express';
import { NotificationService } from './service';
import { AuthRequest } from '../auth/middleware';

export class NotificationController {
  static async getNotifications(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { read, limit, offset } = req.query;

      const filters = {
        read: read === 'true' ? true : read === 'false' ? false : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      };

      const notifications = await NotificationService.getUserNotifications(userId, filters);
      const unreadCount = await NotificationService.getUnreadCount(userId);

      res.json({
        notifications,
        unreadCount,
      });
    } catch (error: any) {
      console.error('Erreur dans getNotifications:', error);
      res.status(500).json({ message: error.message || 'Erreur serveur' });
    }
  }

  static async markAsRead(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { notificationIds } = req.body;

      if (!Array.isArray(notificationIds)) {
        return res.status(400).json({ message: 'notificationIds doit être un tableau' });
      }

      await NotificationService.markAsRead(userId, notificationIds);

      res.json({ message: 'Notifications marquées comme lues' });
    } catch (error: any) {
      console.error('Erreur dans markAsRead:', error);
      res.status(500).json({ message: error.message || 'Erreur serveur' });
    }
  }

  static async markAllAsRead(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;

      await NotificationService.markAllAsRead(userId);

      res.json({ message: 'Toutes les notifications marquées comme lues' });
    } catch (error: any) {
      console.error('Erreur dans markAllAsRead:', error);
      res.status(500).json({ message: error.message || 'Erreur serveur' });
    }
  }

  static async getUnreadCount(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;

      const unreadCount = await NotificationService.getUnreadCount(userId);

      res.json({ unreadCount });
    } catch (error: any) {
      console.error('Erreur dans getUnreadCount:', error);
      res.status(500).json({ message: error.message || 'Erreur serveur' });
    }
  }

  static async deleteNotification(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { notificationId } = req.params;

      await NotificationService.deleteNotification(userId, notificationId);

      res.json({ message: 'Notification supprimée' });
    } catch (error: any) {
      console.error('Erreur dans deleteNotification:', error);
      res.status(500).json({ message: error.message || 'Erreur serveur' });
    }
  }

  // Endpoint pour mettre à jour le FCM token
  static async updateFCMToken(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { fcmToken } = req.body;

      if (!fcmToken) {
        return res.status(400).json({ message: 'FCM token requis' });
      }

      const { PrismaClient } = await import('../../prisma');
      const prisma = new PrismaClient();

      await (prisma as any).user.update({
        where: { id: userId },
        data: { fcmToken },
      });

      res.json({ message: 'FCM token mis à jour' });
    } catch (error: any) {
      console.error('Erreur dans updateFCMToken:', error);
      res.status(500).json({ message: error.message || 'Erreur serveur' });
    }
  }

  // Endpoint pour supprimer le FCM token (logout)
  static async removeFCMToken(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;

      const { PrismaClient } = await import('../../prisma');
      const prisma = new PrismaClient();

      await (prisma as any).user.update({
        where: { id: userId },
        data: { fcmToken: null },
      });

      res.json({ message: 'FCM token supprimé' });
    } catch (error: any) {
      console.error('Erreur dans removeFCMToken:', error);
      res.status(500).json({ message: error.message || 'Erreur serveur' });
    }
  }

  // Endpoint admin pour envoyer des notifications
  static async sendNotification(req: AuthRequest, res: Response) {
    try {
      const { userId, type, title, message, payload } = req.body;

      await NotificationService.createNotification(userId, type, {
        title,
        message,
        ...payload,
      });

      await NotificationService.sendPushNotification(userId, {
        title,
        message,
        type,
        data: payload,
      });

      res.json({ message: 'Notification envoyée' });
    } catch (error: any) {
      console.error('Erreur dans sendNotification:', error);
      res.status(500).json({ message: error.message || 'Erreur serveur' });
    }
  }
}