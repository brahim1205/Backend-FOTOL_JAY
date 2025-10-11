import { Request, Response } from 'express';
import { AnalyticsService } from './service';
import { AuthRequest } from '../auth/middleware';

export class AnalyticsController {
  // Dashboard vendeur
  static async getSellerDashboard(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const period = (req.query.period as 'daily' | 'weekly' | 'monthly') || 'monthly';

      const dashboard = await AnalyticsService.getSellerDashboard(userId, period);
      res.json({ dashboard });
    } catch (error: any) {
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  // Métriques temps réel pour admins
  static async getRealtimeMetrics(req: AuthRequest, res: Response) {
    try {
      // Vérifier que l'utilisateur est admin
      if (req.user!.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Accès non autorisé' });
      }

      const metrics = await AnalyticsService.getAdminRealtimeMetrics();
      res.json({ metrics });
    } catch (error: any) {
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  // Recommandations personnalisées
  static async getPersonalizedRecommendations(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const recommendations = await AnalyticsService.getPersonalizedRecommendations(userId, limit);
      res.json({ recommendations });
    } catch (error: any) {
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  // Rapport automatisé
  static async getAutomatedReport(req: AuthRequest, res: Response) {
    try {
      // Vérifier que l'utilisateur est admin
      if (req.user!.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Accès non autorisé' });
      }

      const period = (req.query.period as 'daily' | 'weekly' | 'monthly') || 'weekly';
      const report = await AnalyticsService.generateAutomatedReport(period);
      res.json({ report });
    } catch (error: any) {
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  // Tracking d'événement (endpoint pour le frontend)
  static async trackEvent(req: AuthRequest, res: Response) {
    try {
      const { eventType, entityId, entityType, metadata } = req.body;
      const userId = req.user?.userId || null;
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      const event = await AnalyticsService.trackEvent(
        userId,
        eventType,
        entityId,
        entityType,
        metadata,
        ipAddress,
        userAgent
      );

      res.json({ event });
    } catch (error: any) {
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
}