import { Request, Response } from 'express';
import { LikeService } from './like-service';
import { AuthRequest } from '../auth/middleware';

export class LikeController {
  static async likeProduct(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { productId } = req.params;

      const like = await LikeService.likeProduct(userId, productId);

      res.json({
        message: 'Produit liké avec succès',
        like,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  static async unlikeProduct(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { productId } = req.params;

      await LikeService.unlikeProduct(userId, productId);

      res.json({ message: 'Like retiré avec succès' });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  static async getProductLikes(req: Request, res: Response) {
    try {
      const { productId } = req.params;
      const likes = await LikeService.getProductLikes(productId);

      res.json({ likes: likes.length });
    } catch (error: any) {
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  static async hasUserLiked(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { productId } = req.params;

      const hasLiked = await LikeService.hasUserLiked(userId, productId);

      res.json({ hasLiked });
    } catch (error: any) {
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
}