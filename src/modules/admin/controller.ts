import { Request, Response } from 'express';
import { AdminService } from './service';
import { productModerationSchema, userModerationSchema, statsFiltersSchema } from './validation';
import { AuthRequest } from '../auth/middleware';

export class AdminController {
  static async getDashboardStats(req: AuthRequest, res: Response) {
    try {
      const filters = statsFiltersSchema.parse(req.query);
      const stats = await AdminService.getDashboardStats({
        startDate: filters.startDate ? new Date(filters.startDate) : undefined,
        endDate: filters.endDate ? new Date(filters.endDate) : undefined,
      });

      res.json({ stats });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Filtres invalides', errors: error.errors });
      }
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  static async getPendingProducts(req: AuthRequest, res: Response) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

      const products = await AdminService.getPendingProducts(limit, offset);
      res.json({ products });
    } catch (error: any) {
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  static async moderateProduct(req: AuthRequest, res: Response) {
    try {
      const { productId, action, reason } = productModerationSchema.parse(req.body);
      const adminId = req.user!.userId;

      await AdminService.moderateProduct(productId, action, reason, adminId);
      res.json({ message: `Produit ${action === 'approve' ? 'approuvé' : 'rejeté'}` });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Données invalides', errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  }

  static async getUsers(req: AuthRequest, res: Response) {
    try {
      const filters = {
        role: req.query.role as string,
        isVip: req.query.isVip ? req.query.isVip === 'true' : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      };

      const users = await AdminService.getUsers(filters);
      res.json({ users });
    } catch (error: any) {
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  static async moderateUser(req: AuthRequest, res: Response) {
    try {
      const { userId, action, reason } = userModerationSchema.parse(req.body);
      const adminId = req.user!.userId;

      await AdminService.moderateUser(userId, action, reason, adminId);
      res.json({ message: `Utilisateur ${action === 'ban' ? 'banni' : action === 'unban' ? 'débanni' : 'averti'}` });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Données invalides', errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  }

  static async getSystemHealth(req: AuthRequest, res: Response) {
    try {
      const health = await AdminService.getSystemHealth();
      res.json({ health });
    } catch (error: any) {
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  static async cleanupExpiredProducts(req: AuthRequest, res: Response) {
    try {
      const cleanedCount = await AdminService.cleanupExpiredProducts();
      res.json({ message: `${cleanedCount} produits expirés nettoyés` });
    } catch (error: any) {
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
}