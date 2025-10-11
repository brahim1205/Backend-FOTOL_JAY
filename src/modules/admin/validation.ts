import { z } from 'zod';

export const productModerationSchema = z.object({
  productId: z.string().cuid('ID produit invalide'),
  action: z.enum(['approve', 'reject']),
  reason: z.string().optional(),
});

export const userModerationSchema = z.object({
  userId: z.string().cuid('ID utilisateur invalide'),
  action: z.enum(['ban', 'unban', 'warn']),
  reason: z.string().min(10, 'Raison requise').max(500, 'Raison trop longue'),
  duration: z.number().optional(), // in days for bans
});

export const statsFiltersSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  period: z.enum(['day', 'week', 'month', 'year']).optional(),
});