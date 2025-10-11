import prisma from '../../prisma';
import { NotificationService } from '../notifications/service';

export interface VipPlan {
  id: string;
  name: string;
  price: number;
  duration: number; // in months
  features: string[];
}

export interface VipSubscription {
  id: string;
  userId: string;
  plan: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  autoRenew: boolean;
}

export class VipService {
  static readonly VIP_PLANS: Record<string, VipPlan> = {
    monthly: {
      id: 'monthly',
      name: 'VIP Mensuel',
      price: 9.99,
      duration: 1,
      features: [
        'Badge VIP',
        'Priorité d\'affichage',
        'Annonces illimitées',
        'Support prioritaire',
        'Statistiques détaillées',
      ],
    },
    yearly: {
      id: 'yearly',
      name: 'VIP Annuel',
      price: 99.99,
      duration: 12,
      features: [
        'Tous les avantages mensuels',
        'Économie de 17%',
        'Badge VIP Premium',
        'Accès anticipé aux nouvelles features',
        'Support téléphonique',
      ],
    },
  };

  static async subscribeVip(userId: string, plan: 'monthly' | 'yearly', paymentMethod: string): Promise<VipSubscription> {
    const planDetails = this.VIP_PLANS[plan];
    if (!planDetails) {
      throw new Error('Plan VIP invalide');
    }

    // Vérifier que l'utilisateur n'est pas déjà VIP
    const existingVip = await (prisma as any).user.findUnique({
      where: { id: userId },
      select: { isVip: true },
    });

    if (existingVip?.isVip) {
      throw new Error('Utilisateur déjà VIP');
    }

    // Calculer les dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + planDetails.duration);

    // Mettre à jour le statut VIP de l'utilisateur
    await (prisma as any).user.update({
      where: { id: userId },
      data: { isVip: true },
    });

    // Créer l'abonnement (dans un vrai système, on stockerait cela)
    const subscription: VipSubscription = {
      id: `vip_${userId}_${Date.now()}`,
      userId,
      plan,
      startDate,
      endDate,
      isActive: true,
      autoRenew: false,
    };

    // Notification de bienvenue VIP
    await NotificationService.createNotification(userId, 'vip_welcome', {
      title: '🎉 Bienvenue dans le Club VIP !',
      message: `Félicitations ! Vous bénéficiez maintenant de tous les avantages ${planDetails.name}.`,
      plan: plan,
      features: planDetails.features,
    });

    return subscription;
  }

  static async getVipStatus(userId: string): Promise<{
    isVip: boolean;
    plan?: string;
    endDate?: Date;
    features?: string[];
  }> {
    const user = await (prisma as any).user.findUnique({
      where: { id: userId },
      select: { isVip: true },
    });

    if (!user?.isVip) {
      return { isVip: false };
    }

    // Dans un vrai système, on récupérerait les détails depuis la table subscriptions
    // Pour l'instant, on simule
    const plan = 'monthly'; // À récupérer depuis la DB
    const planDetails = this.VIP_PLANS[plan];
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // Simulé

    return {
      isVip: true,
      plan,
      endDate,
      features: planDetails.features,
    };
  }

  static async cancelVip(userId: string, reason?: string): Promise<void> {
    const user = await (prisma as any).user.findUnique({
      where: { id: userId },
      select: { isVip: true },
    });

    if (!user?.isVip) {
      throw new Error('Utilisateur n\'est pas VIP');
    }

    // Désactiver le statut VIP
    await (prisma as any).user.update({
      where: { id: userId },
      data: { isVip: false },
    });

    // Notification d'annulation
    await NotificationService.createNotification(userId, 'vip_cancelled', {
      title: 'Abonnement VIP annulé',
      message: 'Votre abonnement VIP a été annulé. Vous pouvez vous réabonner à tout moment.',
      reason: reason || 'Demande utilisateur',
    });
  }

  static async checkExpiredVips(): Promise<number> {
    // Dans un vrai système, on vérifierait les abonnements expirés
    // Pour l'instant, on simule
    const expiredUsers = await (prisma as any).user.findMany({
      where: { isVip: true },
      select: { id: true },
    });

    let expiredCount = 0;

    for (const user of expiredUsers) {
      // Simuler l'expiration (dans un vrai système, on comparerait avec endDate)
      const shouldExpire = Math.random() > 0.8; // 20% chance d'expirer

      if (shouldExpire) {
        await this.cancelVip(user.id, 'Expiration automatique');
        expiredCount++;
      }
    }

    return expiredCount;
  }

  static async getVipPlans(): Promise<VipPlan[]> {
    return Object.values(this.VIP_PLANS);
  }

  static async getVipBenefits(): Promise<{
    displayPriority: boolean;
    unlimitedProducts: boolean;
    prioritySupport: boolean;
    detailedStats: boolean;
    premiumBadge: boolean;
  }> {
    return {
      displayPriority: true,
      unlimitedProducts: true,
      prioritySupport: true,
      detailedStats: true,
      premiumBadge: true,
    };
  }

  static async boostProduct(userId: string, productId: string): Promise<void> {
    // Vérifier que l'utilisateur est VIP
    const user = await (prisma as any).user.findUnique({
      where: { id: userId },
      select: { isVip: true },
    });

    if (!user?.isVip) {
      throw new Error('Fonctionnalité réservée aux membres VIP');
    }

    // Vérifier que le produit appartient à l'utilisateur
    const product = await (prisma as any).product.findUnique({
      where: { id: productId },
      select: { sellerId: true, status: true },
    });

    if (!product || product.sellerId !== userId) {
      throw new Error('Produit non trouvé ou accès non autorisé');
    }

    // Boost le produit (par exemple, augmenter la priorité)
    // Dans un vrai système, on pourrait avoir un champ boostEndDate
    console.log(`Product ${productId} boosted for VIP user ${userId}`);
  }
}