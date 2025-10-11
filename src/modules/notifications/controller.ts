import { Request, Response } from 'express';
import { NotificationService } from './service';
import { sendNotificationSchema, notificationIdSchema, markAsReadSchema } from './validation';
import { AuthRequest } from '../auth/middleware';

export class NotificationController {
  static async getNotifications(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const filters = {
        read: req.query.read ? req.query.read === 'true' : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      };

      const notifications = await NotificationService.getUserNotifications(userId, filters);
      const unreadCount = await NotificationService.getUnreadCount(userId);

      res.json({
        notifications,
        unreadCount,
        pagination: {
          limit: filters.limit,
          offset: filters.offset,
        },
      });
    } catch (error: any) {
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  static async markAsRead(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { notificationIds } = markAsReadSchema.parse(req.body);

      await NotificationService.markAsRead(userId, notificationIds);
      res.json({ message: 'Notifications marquées comme lues' });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Données invalides', errors: error.errors });
      }
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  static async markAllAsRead(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      await NotificationService.markAllAsRead(userId);
      res.json({ message: 'Toutes les notifications marquées comme lues' });
    } catch (error: any) {
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  static async getUnreadCount(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const count = await NotificationService.getUnreadCount(userId);
      res.json({ unreadCount: count });
    } catch (error: any) {
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  static async deleteNotification(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { id } = notificationIdSchema.parse(req.params);

      await NotificationService.deleteNotification(userId, id);
      res.json({ message: 'Notification supprimée' });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'ID invalide' });
      }
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  // Admin endpoints for sending notifications
  static async sendNotification(req: Request, res: Response) {
    try {
      const validatedData = sendNotificationSchema.parse(req.body);

      await NotificationService.createNotification(
        validatedData.userId,
        validatedData.type,
        {
          title: validatedData.title,
          message: validatedData.message,
          ...validatedData.payload,
        }
      );

      // Send push notification
      await NotificationService.sendPushNotification(validatedData.userId, {
        title: validatedData.title,
        message: validatedData.message,
        type: validatedData.type,
        data: validatedData.payload,
      });

      res.json({ message: 'Notification envoyée avec succès' });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Données invalides', errors: error.errors });
      }
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
}