import prisma from '../../prisma';

export class AnalyticsService {
  // Tracking des événements
  static async trackEvent(
    userId: string | null,
    eventType: string,
    entityId?: string,
    entityType?: string,
    metadata?: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<any> {
    return await (prisma as any).analyticsEvent.create({
      data: {
        userId,
        eventType,
        entityId,
        entityType,
        metadata,
        ipAddress,
        userAgent,
      },
    });
  }

  // Obtenir les métriques du dashboard pour un vendeur
  static async getSellerDashboard(userId: string, period: 'daily' | 'weekly' | 'monthly' = 'monthly') {
    const now = new Date();
    const periodStart = this.getPeriodStart(now, period);

    const [sales, views, conversions, revenue] = await Promise.all([
      this.getMetricValue(userId, 'sales', period, periodStart, now),
      this.getMetricValue(userId, 'views', period, periodStart, now),
      this.getMetricValue(userId, 'conversions', period, periodStart, now),
      this.getMetricValue(userId, 'revenue', period, periodStart, now),
    ]);

    return {
      period,
      periodStart,
      periodEnd: now,
      metrics: {
        sales,
        views,
        conversions,
        revenue,
        conversionRate: views > 0 ? (conversions / views) * 100 : 0,
      },
    };
  }

  // Obtenir les métriques temps réel pour les admins
  static async getAdminRealtimeMetrics() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      totalProducts,
      pendingProducts,
      totalOrders,
      recentOrders,
      totalRevenue,
    ] = await Promise.all([
      (prisma as any).user.count(),
      (prisma as any).analyticsEvent.count({
        where: {
          eventType: 'user_login',
          createdAt: { gte: oneHourAgo },
        },
      }),
      (prisma as any).product.count(),
      (prisma as any).product.count({ where: { status: 'PENDING' } }),
      (prisma as any).order.count(),
      (prisma as any).order.count({
        where: { createdAt: { gte: oneHourAgo } },
      }),
      (prisma as any).transaction.aggregate({
        where: { type: 'purchase', status: 'completed' },
        _sum: { amount: true },
      }),
    ]);

    return {
      totalUsers,
      activeUsers,
      totalProducts,
      pendingProducts,
      totalOrders,
      recentOrders,
      totalRevenue: totalRevenue._sum.amount || 0,
      timestamp: now,
    };
  }

  // Générer des recommandations personnalisées
  static async getPersonalizedRecommendations(userId: string, limit: number = 10) {
    // Analyser le comportement de l'utilisateur
    const userEvents = await (prisma as any).analyticsEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Extraire les catégories préférées
    const categoryViews = userEvents
      .filter((event: any) => event.eventType === 'product_view' && event.entityType === 'product')
      .reduce((acc: Record<string, number>, event: any) => {
        // Ici on pourrait analyser les produits vus et leurs catégories
        // Pour simplifier, on retourne des produits populaires
        return acc;
      }, {} as Record<string, number>);

    // Recommandations basées sur les vues récentes
    const recommendedProducts = await (prisma as any).product.findMany({
      where: {
        status: 'APPROVED',
        // Logique de recommandation simplifiée
      },
      take: limit,
      include: {
        seller: {
          select: { firstName: true, lastName: true, profilePicture: true },
        },
        productCategory: true,
        productLocation: true,
      },
    });

    return recommendedProducts;
  }

  // Générer un rapport automatisé
  static async generateAutomatedReport(period: 'daily' | 'weekly' | 'monthly' = 'weekly') {
    const now = new Date();
    const periodStart = this.getPeriodStart(now, period);

    const [
      newUsers,
      newProducts,
      completedOrders,
      totalRevenue,
      topCategories,
      topLocations,
    ] = await Promise.all([
      (prisma as any).user.count({ where: { registrationDate: { gte: periodStart } } }),
      (prisma as any).product.count({ where: { publishDate: { gte: periodStart } } }),
      (prisma as any).order.count({
        where: {
          status: 'delivered',
          updatedAt: { gte: periodStart },
        },
      }),
      (prisma as any).transaction.aggregate({
        where: {
          type: 'purchase',
          status: 'completed',
          createdAt: { gte: periodStart },
        },
        _sum: { amount: true },
      }),
      // Top catégories (simplifié)
      (prisma as any).product.groupBy({
        by: ['categoryId'],
        where: { publishDate: { gte: periodStart } },
        _count: { categoryId: true },
        orderBy: { _count: { categoryId: 'desc' } },
        take: 5,
      }),
      // Top localisations (simplifié)
      (prisma as any).product.groupBy({
        by: ['locationId'],
        where: { publishDate: { gte: periodStart } },
        _count: { locationId: true },
        orderBy: { _count: { locationId: 'desc' } },
        take: 5,
      }),
    ]);

    return {
      period,
      periodStart,
      periodEnd: now,
      summary: {
        newUsers,
        newProducts,
        completedOrders,
        totalRevenue: totalRevenue._sum.amount || 0,
      },
      topCategories,
      topLocations,
    };
  }

  // Méthodes utilitaires
  private static getPeriodStart(now: Date, period: 'daily' | 'weekly' | 'monthly'): Date {
    const start = new Date(now);
    switch (period) {
      case 'daily':
        start.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        start.setDate(now.getDate() - now.getDay());
        start.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        break;
    }
    return start;
  }

  private static async getMetricValue(
    userId: string,
    metricType: string,
    period: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<number> {
    const existing = await (prisma as any).dashboardMetrics.findFirst({
      where: {
        userId,
        metricType,
        period,
        periodStart,
      },
    });

    if (existing) {
      return existing.value;
    }

    // Calculer la valeur basée sur les événements
    let value = 0;
    switch (metricType) {
      case 'sales':
        value = await (prisma as any).order.count({
          where: {
            sellerId: userId,
            status: 'delivered',
            createdAt: { gte: periodStart, lte: periodEnd },
          },
        });
        break;
      case 'views':
        value = await (prisma as any).analyticsEvent.count({
          where: {
            entityType: 'product',
            eventType: 'product_view',
            createdAt: { gte: periodStart, lte: periodEnd },
            // Note: Il faudrait lier les vues aux produits du vendeur
          },
        });
        break;
      case 'conversions':
        value = await (prisma as any).order.count({
          where: {
            sellerId: userId,
            createdAt: { gte: periodStart, lte: periodEnd },
          },
        });
        break;
      case 'revenue':
        const revenue = await (prisma as any).order.aggregate({
          where: {
            sellerId: userId,
            status: 'delivered',
            createdAt: { gte: periodStart, lte: periodEnd },
          },
          _sum: { totalAmount: true },
        });
        value = revenue._sum.totalAmount || 0;
        break;
    }

    // Sauvegarder la métrique
    await (prisma as any).dashboardMetrics.upsert({
      where: {
        userId_metricType_period_periodStart: {
          userId,
          metricType,
          period,
          periodStart,
        },
      },
      update: { value, updatedAt: new Date() },
      create: {
        userId,
        metricType,
        period,
        periodStart,
        periodEnd,
        value,
      },
    });

    return value;
  }
}