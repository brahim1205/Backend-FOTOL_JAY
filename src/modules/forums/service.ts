import prisma from '../../prisma';

export class ForumsService {
  // Créer un forum
  static async createForum(data: {
    name: string;
    description?: string;
    categoryId?: string;
    locationId?: string;
  }) {
    return await (prisma as any).forum.create({
      data,
      include: {
        category: true,
        location: true,
      },
    });
  }

  // Obtenir tous les forums
  static async getForums(filters: {
    categoryId?: string;
    locationId?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    const where: any = { isActive: true };

    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.locationId) where.locationId = filters.locationId;

    return await (prisma as any).forum.findMany({
      where,
      include: {
        category: true,
        location: true,
        _count: {
          select: { posts: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 20,
      skip: filters.offset || 0,
    });
  }

  // Créer un post
  static async createPost(data: {
    forumId: string;
    authorId: string;
    title: string;
    content: string;
  }) {
    return await (prisma as any).post.create({
      data,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
          },
        },
        forum: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: { comments: true },
        },
      },
    });
  }

  // Obtenir les posts d'un forum
  static async getForumPosts(forumId: string, filters: {
    limit?: number;
    offset?: number;
    sortBy?: 'createdAt' | 'views' | 'comments';
    sortOrder?: 'asc' | 'desc';
  } = {}) {
    const orderBy: any = {};
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';

    if (sortBy === 'comments') {
      // Pour trier par nombre de commentaires, c'est plus complexe
      // On va d'abord récupérer puis trier
    } else {
      orderBy[sortBy] = sortOrder;
    }

    const posts = await (prisma as any).post.findMany({
      where: { forumId, isLocked: false },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
          },
        },
        _count: {
          select: { comments: true },
        },
      },
      orderBy,
      take: filters.limit || 20,
      skip: filters.offset || 0,
    });

    // Tri manuel si nécessaire
    if (sortBy === 'comments') {
      posts.sort((a: any, b: any) => {
        const aCount = a._count.comments;
        const bCount = b._count.comments;
        return sortOrder === 'desc' ? bCount - aCount : aCount - bCount;
      });
    }

    return posts;
  }

  // Créer un commentaire
  static async createComment(data: {
    postId: string;
    authorId: string;
    content: string;
    parentId?: string;
  }) {
    return await (prisma as any).comment.create({
      data,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
          },
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profilePicture: true,
              },
            },
          },
        },
      },
    });
  }

  // Obtenir les commentaires d'un post
  static async getPostComments(postId: string, limit: number = 50) {
    // Récupérer les commentaires parents (sans parentId)
    const comments = await (prisma as any).comment.findMany({
      where: {
        postId,
        parentId: null,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
          },
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profilePicture: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    return comments;
  }

  // Incrémenter les vues d'un post
  static async incrementPostViews(postId: string) {
    return await (prisma as any).post.update({
      where: { id: postId },
      data: { views: { increment: 1 } },
    });
  }

  // Recherche dans les forums
  static async searchPosts(query: string, filters: {
    forumId?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    const where: any = {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { content: { contains: query, mode: 'insensitive' } },
      ],
    };

    if (filters.forumId) where.forumId = filters.forumId;

    return await (prisma as any).post.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
          },
        },
        forum: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: { comments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 20,
      skip: filters.offset || 0,
    });
  }
}