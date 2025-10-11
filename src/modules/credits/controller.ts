import { Request, Response } from 'express';
import { CreditService } from './service';
import { purchaseCreditsSchema, boostProductSchema } from './validation';
import { AuthRequest } from '../auth/middleware';

export class CreditController {
  static async getCreditBalance(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const balance = await CreditService.getCreditBalance(userId);

      res.json({ balance });
    } catch (error: any) {
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  static async purchaseCredits(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { amount, paymentMethod } = purchaseCreditsSchema.parse(req.body);

      const transaction = await CreditService.purchaseCredits(userId, amount, paymentMethod);

      res.status(201).json({
        message: 'Crédits achetés avec succès',
        transaction,
      });
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
      const { productId, boostType } = boostProductSchema.parse({ ...req.params, ...req.body });

      await CreditService.boostProduct(userId, productId, boostType);

      res.json({ message: 'Produit boosté avec succès' });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Données invalides', errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  }

  static async getTransactionHistory(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

      const transactions = await CreditService.getTransactionHistory(userId, limit, offset);

      res.json({ transactions });
    } catch (error: any) {
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  static async getCreditPackages(req: Request, res: Response) {
    try {
      const packages = await CreditService.getCreditPackages();
      res.json({ packages });
    } catch (error: any) {
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  static async earnCredits(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { amount, reason } = req.body;

      if (!amount || !reason) {
        return res.status(400).json({ message: 'Montant et raison requis' });
      }

      await CreditService.earnCredits(userId, amount, reason);

      res.json({ message: `${amount} crédits gagnés` });
    } catch (error: any) {
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  static async refundCredits(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { amount, reason } = req.body;

      if (!amount || !reason) {
        return res.status(400).json({ message: 'Montant et raison requis' });
      }

      const transaction = await CreditService.refundCredits(userId, amount, reason);

      res.json({
        message: 'Remboursement effectué',
        transaction,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}