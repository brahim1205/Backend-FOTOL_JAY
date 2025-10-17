import { Request, Response } from 'express';
import { PaymentService } from './service';
import { AuthRequest } from '../auth/middleware';

export class PaymentController {
  static async createPayment(req: AuthRequest, res: Response) {
    try {
      const { amount, currency = 'XOF', description, type, metadata } = req.body;
      const userId = req.user!.userId;

      const result = await PaymentService.createPayment({
        amount: parseFloat(amount),
        currency,
        description,
        userId,
        type,
        metadata,
      });

      res.json({
        message: 'Paiement créé avec succès',
        payment: {
          transactionId: result.paymentTransaction.id,
          amount: result.paymentTransaction.amount,
          currency: result.paymentTransaction.currency,
          status: result.paymentTransaction.status,
        },
        paydunya: {
          token: (result.invoice as any).token,
          url: (result.invoice as any).url,
        },
      });
    } catch (error: any) {
      console.error('Erreur dans createPayment:', error);
      res.status(500).json({ message: error.message || 'Erreur serveur' });
    }
  }

  static async getPaymentStatus(req: AuthRequest, res: Response) {
    try {
      const { transactionId } = req.params;
      const userId = req.user!.userId;

      const payment = await PaymentService.getPaymentStatus(transactionId);

      // Vérifier que l'utilisateur est propriétaire de la transaction
      if (payment.userId !== userId) {
        return res.status(403).json({ message: 'Accès non autorisé' });
      }

      res.json({ payment });
    } catch (error: any) {
      console.error('Erreur dans getPaymentStatus:', error);
      res.status(500).json({ message: error.message || 'Erreur serveur' });
    }
  }

  static async handleCallback(req: Request, res: Response) {
    try {
      const callbackData = req.body;

      console.log('PayDunya callback received:', callbackData);

      await PaymentService.processCallback(callbackData);

      // PayDunya attend une réponse spécifique
      res.json({ status: 'success' });
    } catch (error: any) {
      console.error('Erreur dans handleCallback:', error);
      res.status(500).json({ status: 'error', message: error.message });
    }
  }

  static async refundPayment(req: AuthRequest, res: Response) {
    try {
      const { transactionId, reason } = req.body;
      const userId = req.user!.userId;

      // Vérifier que l'utilisateur est propriétaire de la transaction
      const payment = await PaymentService.getPaymentStatus(transactionId);
      if (payment.userId !== userId) {
        return res.status(403).json({ message: 'Accès non autorisé' });
      }

      await PaymentService.refundPayment(transactionId, reason);

      res.json({ message: 'Demande de remboursement envoyée' });
    } catch (error: any) {
      console.error('Erreur dans refundPayment:', error);
      res.status(500).json({ message: error.message || 'Erreur serveur' });
    }
  }

  // Endpoint pour les achats de crédits
  static async purchaseCredits(req: AuthRequest, res: Response) {
    try {
      const { amount } = req.body;
      const userId = req.user!.userId;

      const result = await PaymentService.createPayment({
        amount: parseFloat(amount),
        currency: 'XOF',
        description: `Achat de ${amount} crédits`,
        userId,
        type: 'credit_purchase',
        metadata: { credits: amount },
      });

      res.json({
        message: 'Paiement de crédits créé',
        payment: {
          transactionId: result.paymentTransaction.id,
          amount: result.paymentTransaction.amount,
          credits: amount,
        },
        paydunya: {
          token: (result.invoice as any).token,
          url: (result.invoice as any).url,
        },
      });
    } catch (error: any) {
      console.error('Erreur dans purchaseCredits:', error);
      res.status(500).json({ message: error.message || 'Erreur serveur' });
    }
  }

  // Endpoint pour les abonnements VIP
  static async subscribeVip(req: AuthRequest, res: Response) {
    try {
      const { plan = 'monthly' } = req.body;
      const userId = req.user!.userId;

      const { VipService } = await import('../vip/service');
      const planDetails = VipService.VIP_PLANS[plan];

      if (!planDetails) {
        return res.status(400).json({ message: 'Plan VIP invalide' });
      }

      const result = await PaymentService.createPayment({
        amount: planDetails.price,
        currency: 'XOF',
        description: `Abonnement VIP ${planDetails.name}`,
        userId,
        type: 'vip_subscription',
        metadata: { plan, planDetails },
      });

      res.json({
        message: 'Paiement VIP créé',
        payment: {
          transactionId: result.paymentTransaction.id,
          plan,
          amount: result.paymentTransaction.amount,
          features: planDetails.features,
        },
        paydunya: {
          token: (result.invoice as any).token,
          url: (result.invoice as any).url,
        },
      });
    } catch (error: any) {
      console.error('Erreur dans subscribeVip:', error);
      res.status(500).json({ message: error.message || 'Erreur serveur' });
    }
  }
}