import { z } from 'zod';

export const sendMessageSchema = z.object({
  toUserId: z.string().cuid('ID utilisateur invalide'),
  productId: z.string().cuid('ID produit invalide').optional(),
  message: z.string().min(1, 'Message requis').max(1000, 'Message trop long'),
});

export const conversationSchema = z.object({
  productId: z.string().cuid('ID produit invalide').optional(),
  limit: z.number().min(1).max(100).optional().default(50),
  offset: z.number().min(0).optional().default(0),
});

export const offerSchema = z.object({
  toUserId: z.string().cuid('ID utilisateur invalide'),
  productId: z.string().cuid('ID produit invalide'),
  amount: z.number().positive('Montant doit être positif'),
  message: z.string().max(500, 'Message trop long').optional(),
});