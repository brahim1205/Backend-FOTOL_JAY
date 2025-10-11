import { Request, Response } from 'express';
import { UserService, avatarUpload } from './service';
import { updateProfileSchema, userIdSchema, reportUserSchema } from './validation';
import { AuthRequest } from '../auth/middleware';

export class UserController {
  static async getProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const user = await UserService.getUserById(userId);

      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      res.json({ user });
    } catch (error: any) {
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  static async updateProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const validatedData = updateProfileSchema.parse(req.body);

      const user = await UserService.updateProfile(userId, validatedData);
      res.json({
        message: 'Profil mis à jour avec succès',
        user,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Données invalides', errors: error.errors });
      }
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  static async uploadAvatar(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;

      if (!req.file) {
        return res.status(400).json({ message: 'Aucun fichier fourni' });
      }

      const avatarUrl = await UserService.uploadAvatar(userId, req.file);
      res.json({
        message: 'Avatar mis à jour avec succès',
        avatarUrl,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Erreur lors de l\'upload' });
    }
  }

  static async getUserById(req: Request, res: Response) {
    try {
      const { id } = userIdSchema.parse(req.params);
      const user = await UserService.getUserById(id);

      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      res.json({ user });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'ID invalide' });
      }
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  static async getUserProducts(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const filters = {
        status: req.query.status as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      };

      const products = await UserService.getUserProducts(userId, filters);
      res.json({ products });
    } catch (error: any) {
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  static async getUserStats(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const stats = await UserService.getUserStats(userId);
      res.json({ stats });
    } catch (error: any) {
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  static async reportUser(req: AuthRequest, res: Response) {
    try {
      const reporterId = req.user!.userId;
      const validatedData = reportUserSchema.parse(req.body);

      await UserService.reportUser(reporterId, validatedData.reportedUserId, validatedData.reason, validatedData.description);

      res.json({ message: 'Signalement envoyé avec succès' });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Données invalides', errors: error.errors });
      }
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  static async deleteAccount(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      await UserService.deleteAccount(userId);

      res.json({ message: 'Compte supprimé avec succès' });
    } catch (error: any) {
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
}

// Middleware for avatar upload
export const avatarUploadMiddleware = avatarUpload.single('avatar');