import prisma from '../../prisma';
import { NotificationService } from '../notifications/service';

export interface CreditTransaction {
  id: string;
  userId: string;
  type: 'purchase' | 'boost' | 'refund';
  amount: number;
  description: string;
  createdAt: Date;
}

export interface CreditBalance {
  userId: string;
  balance: number;
  totalEarned: number;
  totalSpent: number;
}

export class CreditService {
  static readonly BOOST_COSTS = {
    basic: 5,    // 5 crédits pour boost basique (1 jour)
    premium: 15, // 15 crédits pour boost premium (3 jours)
    urgent: 30,  // 30 crédits pour boost urgent (7 jours)
  };

  static async getCreditBalance(userId: string): Promise<CreditBalance> {
    // Dans un vrai système, on aurait une table credit_transactions
    // Pour l'instant, on utilise le champ balance de la table Credit
    let credit = await (prisma as any).credit.findUnique({
      where: { userId },
    });

    if (!credit) {
      // Créer un compte crédits si inexistant
      credit = await (prisma as any).credit.create({
        data: { userId, balance: 0 },
      });
    }

    // Simuler les totaux (dans un vrai système, on les calculerait depuis les transactions)
    return {
      userId,
      balance: credit.balance,
      totalEarned: 0, // À calculer depuis les transactions
      totalSpent: 0,  // À calculer depuis les transactions
    };
  }

  static async purchaseCredits(userId: string, amount: number, paymentMethod: string): Promise<CreditTransaction> {
    // Simuler le paiement (dans un vrai système, on intégrerait Stripe/PayPal)
    console.log(`Processing payment of ${amount}€ via ${paymentMethod} for user ${userId}`);

    // Crédits reçus = montant payé (1€ = 1 crédit)
    const creditsReceived = amount;

    // Mettre à jour le solde
    await (prisma as any).credit.upsert({
      where: { userId },
      update: { balance: { increment: creditsReceived } },
      create: { userId, balance: creditsReceived },
    });

    // Créer la transaction (simulée)
    const transaction: CreditTransaction = {
      id: `txn_${Date.now()}_${userId}`,
      userId,
      type: 'purchase',
      amount: creditsReceived,
      description: `Achat de ${creditsReceived} crédits via ${paymentMethod}`,
      createdAt: new Date(),
    };

    // Notification
    await NotificationService.createNotification(userId, 'credits_purchased', {
      title: 'Crédits achetés !',
      message: `${creditsReceived} crédits ont été ajoutés à votre compte.`,
      amount: creditsReceived,
      newBalance: await this.getCreditBalance(userId).then(b => b.balance),
    });

    return transaction;
  }

  static async boostProduct(userId: string, productId: string, boostType: 'basic' | 'premium' | 'urgent'): Promise<void> {
    const cost = this.BOOST_COSTS[boostType];

    // Vérifier le solde
    const balance = await this.getCreditBalance(userId);
    if (balance.balance < cost) {
      throw new Error(`Solde insuffisant. ${cost} crédits requis, ${balance.balance} disponibles.`);
    }

    // Vérifier que le produit existe et appartient à l'utilisateur
    const product = await (prisma as any).product.findUnique({
      where: { id: productId },
      select: { sellerId: true, title: true },
    });

    if (!product || product.sellerId !== userId) {
      throw new Error('Produit non trouvé ou accès non autorisé');
    }

    // Déduire les crédits
    await (prisma as any).credit.update({
      where: { userId },
      data: { balance: { decrement: cost } },
    });

    // Calculer la durée du boost
    const boostDuration = {
      basic: 1,
      premium: 3,
      urgent: 7,
    }[boostType];

    // Mettre à jour le produit avec la date de fin de boost
    const boostEndDate = new Date();
    boostEndDate.setDate(boostEndDate.getDate() + boostDuration);

    await (prisma as any).product.update({
      where: { id: productId },
      data: {
        // Dans un vrai système, on ajouterait un champ boostEndDate
        // Pour l'instant, on log simplement
      },
    });

    // Notification
    await NotificationService.createNotification(userId, 'product_boosted', {
      title: 'Produit boosté !',
      message: `Votre produit "${product.title}" est maintenant boosté pour ${boostDuration} jour(s).`,
      boostType,
      cost,
      duration: boostDuration,
    });

    console.log(`Product ${productId} boosted with ${boostType} for ${cost} credits`);
  }

  static async getTransactionHistory(userId: string, limit: number = 20, offset: number = 0): Promise<CreditTransaction[]> {
    // Dans un vrai système, on récupérerait depuis credit_transactions
    // Pour l'instant, on retourne un tableau vide
    return [];
  }

  static async refundCredits(userId: string, amount: number, reason: string): Promise<CreditTransaction> {
    // Vérifier le solde
    const balance = await this.getCreditBalance(userId);
    if (balance.balance < amount) {
      throw new Error('Solde insuffisant pour le remboursement');
    }

    // Déduire les crédits
    await (prisma as any).credit.update({
      where: { userId },
      data: { balance: { decrement: amount } },
    });

    // Créer la transaction de remboursement
    const transaction: CreditTransaction = {
      id: `refund_${Date.now()}_${userId}`,
      userId,
      type: 'refund',
      amount: -amount, // Négatif pour les remboursements
      description: `Remboursement: ${reason}`,
      createdAt: new Date(),
    };

    // Notification
    await NotificationService.createNotification(userId, 'credits_refunded', {
      title: 'Remboursement effectué',
      message: `${amount} crédits ont été remboursés: ${reason}`,
      amount,
      reason,
    });

    return transaction;
  }

  static async getCreditPackages(): Promise<Array<{
    id: string;
    name: string;
    credits: number;
    price: number;
    bonus?: number;
  }>> {
    return [
      { id: 'starter', name: 'Pack Starter', credits: 10, price: 10 },
      { id: 'popular', name: 'Pack Populaire', credits: 25, price: 22, bonus: 3 },
      { id: 'pro', name: 'Pack Pro', credits: 50, price: 40, bonus: 10 },
      { id: 'enterprise', name: 'Pack Enterprise', credits: 100, price: 75, bonus: 25 },
    ];
  }

  static async earnCredits(userId: string, amount: number, reason: string): Promise<void> {
    // Crédits gagnés (par exemple, parrainage, vente réussie, etc.)
    await (prisma as any).credit.upsert({
      where: { userId },
      update: { balance: { increment: amount } },
      create: { userId, balance: amount },
    });

    // Notification
    await NotificationService.createNotification(userId, 'credits_earned', {
      title: 'Crédits gagnés !',
      message: `Vous avez gagné ${amount} crédits: ${reason}`,
      amount,
      reason,
    });
  }
}