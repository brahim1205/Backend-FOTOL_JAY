import prisma from '../../prisma';

export class EventsService {
  // Créer un événement/promotion
  static async createEvent(data: {
    title: string;
    description: string;
    type: string;
    startDate: Date;
    endDate: Date;
    discount?: number;
    targetUsers?: any;
    metadata?: any;
  }) {
    return await (prisma as any).event.create({
      data,
    });
  }

  // Obtenir les événements actifs
  static async getActiveEvents() {
    const now = new Date();
    return await (prisma as any).event.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Vérifier si un utilisateur est éligible à un événement
  static async isUserEligible(userId: string, eventId: string) {
    const event = await (prisma as any).event.findUnique({
      where: { id: eventId },
    });

    if (!event || !event.targetUsers) {
      return true; // Pas de critères spécifiques
    }

    // Logique simplifiée - à étendre selon les besoins
    const user = await (prisma as any).user.findUnique({
      where: { id: userId },
      select: { role: true, isVip: true },
    });

    if (event.targetUsers.vipOnly && !user.isVip) {
      return false;
    }

    return true;
  }
}