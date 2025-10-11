import { z } from 'zod';

export const createForumSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(100, 'Nom trop long'),
  description: z.string().max(500, 'Description trop longue').optional(),
  categoryId: z.string().cuid('ID catégorie invalide').optional(),
  locationId: z.string().cuid('ID localisation invalide').optional(),
});

export const createPostSchema = z.object({
  title: z.string().min(1, 'Titre requis').max(200, 'Titre trop long'),
  content: z.string().min(1, 'Contenu requis').max(10000, 'Contenu trop long'),
});

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Contenu requis').max(2000, 'Contenu trop long'),
  parentId: z.string().cuid('ID parent invalide').optional(),
});

export const forumIdSchema = z.object({
  forumId: z.string().cuid('ID forum invalide'),
});

export const postIdSchema = z.object({
  postId: z.string().cuid('ID post invalide'),
});

export const searchQuerySchema = z.object({
  q: z.string().min(1, 'Recherche requise'),
  forumId: z.string().cuid('ID forum invalide').optional(),
  limit: z.string().regex(/^\d+$/).transform(val => parseInt(val)).optional().default(20),
  offset: z.string().regex(/^\d+$/).transform(val => parseInt(val)).optional().default(0),
});