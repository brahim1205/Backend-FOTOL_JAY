import { PrismaClient } from '../../prisma';
const prisma = new PrismaClient();
import { NotificationService } from '../notifications/service';

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalProducts: number;
  approvedProducts: number;
  pendingProducts: number;
  rejectedProducts: number;
  soldProducts: number;
  totalRevenue: number;
  recentSignups: number;
  recentSales: number;
}

export class AdminService {
  static async getDashboardStats(filters?: {
    startDate?: Date;
    endDate?: Date;
  }): Promise<AdminStats> {
    const startDate = filters?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const endDate = filters?.endDate || new Date();

    try {
      // Users stats
      const totalUsers = await (prisma as any).user.count();
      const activeUsers = await (prisma as any).user.count({
        where: {
          lastLogin: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Active in last 7 days
          },
        },
      });

      // Products stats
      const totalProducts = await (prisma as any).product.count();
      const approvedProducts = await (prisma as any).product.count({
        where: { status: 'APPROVED' },
      });
      const pendingProducts = await (prisma as any).product.count({
        where: { status: 'PENDING' },
      });
      const rejectedProducts = await (prisma as any).product.count({
        where: { status: 'REJECTED' },
      });
      const soldProducts = await (prisma as any).product.count({
        where: { status: 'SOLD' },
      });

      // Revenue (simplified - you'd calculate from actual sales)
      const totalRevenue = soldProducts * 50; // Assuming average sale price

      // Recent activity
      const recentSignups = await (prisma as any).user.count({
        where: {
          registrationDate: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      const recentSales = await (prisma as any).product.count({
        where: {
          status: 'SOLD',
          publishDate: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      return {
        totalUsers,
        activeUsers,
        totalProducts,
        approvedProducts,
        pendingProducts,
        rejectedProducts,
        soldProducts,
        totalRevenue,
        recentSignups,
        recentSales,
      };
    } catch (error) {
      console.error('Erreur dans getDashboardStats:', error);
      throw error;
    }
  }

  static async getPendingProducts(limit: number = 50, offset: number = 0): Promise<any[]> {
    return (prisma as any).product.findMany({
      where: { status: 'PENDING' },
      include: {
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            reputation: true,
          },
        },
      },
      orderBy: { publishDate: 'asc' },
      take: limit,
      skip: offset,
    });
  }

  static async moderateProduct(productId: string, action: 'approve' | 'reject', reason?: string, adminId?: string): Promise<void> {
    const product = await (prisma as any).product.findUnique({
      where: { id: productId },
      include: { seller: true },
    });

    if (!product) {
      throw new Error('Produit non trouvé');
    }

    if (product.status !== 'PENDING') {
      throw new Error('Ce produit a déjà été modéré');
    }

    const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';

    await (prisma as any).product.update({
      where: { id: productId },
      data: { status: newStatus },
    });

    // Send notification to seller
    if (action === 'approve') {
      await NotificationService.notifyProductApproved(product.sellerId, product.title);
    } else if (action === 'reject' && reason) {
      await NotificationService.notifyProductRejected(product.sellerId, product.title, reason);
    }

    // Log moderation action (you could add an audit log table)
    console.log(`Admin ${adminId} ${action}d product ${productId}: ${reason || 'No reason'}`);
  }

  static async getUsers(filters: {
    role?: string;
    isVip?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    const where: any = {};

    if (filters.role) where.role = filters.role;
    if (filters.isVip !== undefined) where.isVip = filters.isVip;

    return (prisma as any).user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isVip: true,
        reputation: true,
        registrationDate: true,
        lastLogin: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: { registrationDate: 'desc' },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    });
  }

  static async moderateUser(userId: string, action: 'ban' | 'unban' | 'warn', reason: string, adminId?: string): Promise<void> {
    const user = await (prisma as any).user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    // For now, we'll just log the action
    // In a real app, you'd have a moderation/ban table
    console.log(`Admin ${adminId} ${action}ed user ${userId}: ${reason}`);

    // Send notification to user
    await NotificationService.createNotification(userId, `user_${action}`, {
      title: action === 'ban' ? 'Compte suspendu' : action === 'warn' ? 'Avertissement' : 'Compte réactivé',
      message: reason,
      adminId,
    });
  }

  static async getReportedContent(): Promise<any[]> {
    // This would require a reports table
    // For now, return empty array
    return [];
  }

  static async getSystemHealth(): Promise<{
    database: boolean;
    redis?: boolean;
    uptime: number;
    memory: NodeJS.MemoryUsage;
  }> {
    // Check database connection
    let database = false;
    try {
      await (prisma as any).$queryRaw`SELECT 1`;
      database = true;
    } catch (error) {
      console.error('Database health check failed:', error);
    }

    return {
      database,
      redis: false, // Would check Redis connection if implemented
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }

  static async cleanupExpiredProducts(): Promise<number> {
    const expiredProducts = await (prisma as any).product.findMany({
      where: {
        expiration: {
          lt: new Date(),
        },
        status: {
          not: 'SOLD',
        },
      },
    });

    if (expiredProducts.length > 0) {
      await (prisma as any).product.updateMany({
        where: {
          id: { in: expiredProducts.map((p: any) => p.id) },
        },
        data: { status: 'EXPIRED' },
      });

      // Notify sellers
      for (const product of expiredProducts) {
        await NotificationService.createNotification(product.sellerId, 'product_expired', {
          title: 'Produit expiré',
          message: `Votre produit "${product.title}" a expiré et n'est plus visible.`,
          productId: product.id,
        });
      }
    }

    return expiredProducts.length;
  }
}