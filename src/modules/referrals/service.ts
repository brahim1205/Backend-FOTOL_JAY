import { v4 as uuidv4 } from 'uuid';
import prisma from '../../prisma';

export class ReferralsService {
  // Générer un code de parrainage pour un utilisateur
  static async generateReferralCode(userId: string): Promise<any> {
    const code = uuidv4().substring(0, 8).toUpperCase();

    // Vérifier l'unicité (simplifié)
    const existing = await (prisma as any).referral.findUnique({
      where: { code },
    });

    if (existing) {
      return this.generateReferralCode(userId); // Retry
    }

    return await (prisma as any).referral.create({
      data: {
        referrerId: userId,
        referredId: userId, // Temporaire, sera mis à jour
        code,
        status: 'pending',
      },
    });
  }

  // Traiter un parrainage
  static async processReferral(referrerCode: string, newUserId: string) {
    const referral = await (prisma as any).referral.findUnique({
      where: { code: referrerCode },
    });

    if (!referral || referral.status !== 'pending') {
      throw new Error('Code de parrainage invalide');
    }

    // Mettre à jour le parrainage
    await (prisma as any).referral.update({
      where: { id: referral.id },
      data: {
        referredId: newUserId,
        status: 'completed',
        completedAt: new Date(),
      },
    });

    // Créditer les récompenses (simplifié)
    await this.giveReferralRewards(referral.referrerId, newUserId);

    return referral;
  }

  // Donner les récompenses de parrainage
  private static async giveReferralRewards(referrerId: string, referredId: string) {
    const rewardAmount = 50; // 50 crédits par exemple

    // Créditer le parrain
    await (prisma as any).credit.upsert({
      where: { userId: referrerId },
      update: { balance: { increment: rewardAmount } },
      create: { userId: referrerId, balance: rewardAmount },
    });

    // Créditer le parrainé
    await (prisma as any).credit.upsert({
      where: { userId: referredId },
      update: { balance: { increment: rewardAmount } },
      create: { userId: referredId, balance: rewardAmount },
    });
  }

  // Obtenir les statistiques de parrainage d'un utilisateur
  static async getReferralStats(userId: string) {
    const [referrals, earnings] = await Promise.all([
      (prisma as any).referral.findMany({
        where: { referrerId: userId },
        include: {
          referred: {
            select: { firstName: true, lastName: true },
          },
        },
      }),
      (prisma as any).credit.findUnique({
        where: { userId },
        select: { balance: true },
      }),
    ]);

    return {
      totalReferrals: referrals.length,
      completedReferrals: referrals.filter((r: any) => r.status === 'completed').length,
      pendingReferrals: referrals.filter((r: any) => r.status === 'pending').length,
      totalEarnings: earnings?.balance || 0,
      referrals,
    };
  }
}