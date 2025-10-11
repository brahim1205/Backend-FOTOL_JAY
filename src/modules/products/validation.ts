import { z } from 'zod';

export const createProductSchema = z.object({
  title: z.string().min(1, 'Titre requis').max(100, 'Titre trop long'),
  description: z.string().min(10, 'Description trop courte').max(1000, 'Description trop longue'),
  price: z.number().positive('Prix doit être positif'),
  location: z.string().min(1, 'Localisation requise'),
  category: z.string().optional(),
  condition: z.enum(['Neuf', 'Occasion']).optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const productIdSchema = z.object({
  id: z.string().cuid('ID invalide'),
});