import { Request, Response } from 'express';
import { VipService } from './service';
import { subscribeVipSchema, vipStatusSchema, cancelVipSchema } from './validation';
import { AuthRequest } from '../auth/middleware';

export class VipController {
  static async getVipPlans(req: Request, res: Response) {
    try {
      const plans = await VipService.getVipPlans();
      res.json({ plans });
    } catch (error: any) {
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  static async getVipBenefits(req: Request, res: Response) {
    try {
      const benefits = await VipService.getVipBenefits();
      res.json({ benefits });
    } catch (error: any) {
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  static async subscribeVip(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { plan, paymentMethod } = subscribeVipSchema.parse(req.body);

      const subscription = await VipService.subscribeVip(userId, plan, paymentMethod);

      res.status(201).json({
        message: 'Abonnement VIP activé avec succès',
        subscription,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Données invalides', errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  }

  static async getVipStatus(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const status = await VipService.getVipStatus(userId);

      res.json({ status });
    } catch (error: any) {
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  static async cancelVip(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { reason } = cancelVipSchema.parse(req.body);

      await VipService.cancelVip(userId, reason);

      res.json({ message: 'Abonnement VIP annulé avec succès' });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Données invalides', errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  }

  static async boostProduct(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { productId } = req.params;

      if (!productId) {
        return res.status(400).json({ message: 'ID produit requis' });
      }

      await VipService.boostProduct(userId, productId);

      res.json({ message: 'Produit boosté avec succès' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async checkExpiredVips(req: Request, res: Response) {
    try {
      const expiredCount = await VipService.checkExpiredVips();
      res.json({ message: `${expiredCount} abonnements VIP expirés traités` });
    } catch (error: any) {
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
}