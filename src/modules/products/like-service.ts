import { PrismaClient } from '../../prisma';

const prisma = new PrismaClient();

export class LikeService {
  static async likeProduct(userId: string, productId: string) {
    // Vérifier si le produit existe
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error('Produit non trouvé');
    }

    // Vérifier si l'utilisateur a déjà liké ce produit
    const existingLike = await prisma.like.findUnique({
      where: {
        productId_userId: {
          productId,
          userId,
        },
      },
    });

    if (existingLike) {
      throw new Error('Produit déjà liké');
    }

    // Créer le like
    const like = await prisma.like.create({
      data: {
        userId,
        productId,
      },
    });

    return like;
  }

  static async unlikeProduct(userId: string, productId: string) {
    const like = await prisma.like.findUnique({
      where: {
        productId_userId: {
          productId,
          userId,
        },
      },
    });

    if (!like) {
      throw new Error('Like non trouvé');
    }

    await prisma.like.delete({
      where: {
        productId_userId: {
          productId,
          userId,
        },
      },
    });
  }

  static async getProductLikes(productId: string) {
    return await prisma.like.findMany({
      where: { productId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  static async hasUserLiked(userId: string, productId: string): Promise<boolean> {
    const like = await prisma.like.findUnique({
      where: {
        productId_userId: {
          productId,
          userId,
        },
      },
    });

    return !!like;
  }

  static async getUserLikes(userId: string) {
    return await prisma.like.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            seller: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}