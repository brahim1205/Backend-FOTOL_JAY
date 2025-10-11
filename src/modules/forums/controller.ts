import { Request, Response } from 'express';
import { ForumsService } from './service';
import { AuthRequest } from '../auth/middleware';

export class ForumsController {
  // Obtenir tous les forums
  static async getForums(req: Request, res: Response) {
    try {
      const filters = {
        categoryId: req.query.categoryId as string,
        locationId: req.query.locationId as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      };

      const forums = await ForumsService.getForums(filters);
      res.json({ forums });
    } catch (error: any) {
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  // Créer un forum (Admin seulement)
  static async createForum(req: AuthRequest, res: Response) {
    try {
      if (req.user!.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Accès non autorisé' });
      }

      const forum = await ForumsService.createForum(req.body);
      res.status(201).json({ forum });
    } catch (error: any) {
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  // Obtenir les posts d'un forum
  static async getForumPosts(req: Request, res: Response) {
    try {
      const { forumId } = req.params;
      const filters = {
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
        sortBy: req.query.sortBy as 'createdAt' | 'views' | 'comments',
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const posts = await ForumsService.getForumPosts(forumId, filters);
      res.json({ posts });
    } catch (error: any) {
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  // Créer un post
  static async createPost(req: AuthRequest, res: Response) {
    try {
      const { forumId } = req.params;
      const postData = {
        forumId,
        authorId: req.user!.userId,
        title: req.body.title,
        content: req.body.content,
      };

      const post = await ForumsService.createPost(postData);
      res.status(201).json({ post });
    } catch (error: any) {
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  // Obtenir un post avec ses commentaires
  static async getPost(req: Request, res: Response) {
    try {
      const { postId } = req.params;

      // Incrémenter les vues
      await ForumsService.incrementPostViews(postId);

      // Récupérer le post (simplifié - à améliorer)
      const post = await (prisma as any).post.findUnique({
        where: { id: postId },
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
        },
      });

      if (!post) {
        return res.status(404).json({ message: 'Post non trouvé' });
      }

      const comments = await ForumsService.getPostComments(postId);

      res.json({ post, comments });
    } catch (error: any) {
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  // Créer un commentaire
  static async createComment(req: AuthRequest, res: Response) {
    try {
      const { postId } = req.params;
      const commentData = {
        postId,
        authorId: req.user!.userId,
        content: req.body.content,
        parentId: req.body.parentId,
      };

      const comment = await ForumsService.createComment(commentData);
      res.status(201).json({ comment });
    } catch (error: any) {
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  // Recherche dans les forums
  static async searchPosts(req: Request, res: Response) {
    try {
      const { q: query } = req.query;
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: 'Paramètre de recherche requis' });
      }

      const filters = {
        forumId: req.query.forumId as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      };

      const posts = await ForumsService.searchPosts(query, filters);
      res.json({ posts });
    } catch (error: any) {
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
}

// Import manquant
import prisma from '../../prisma';