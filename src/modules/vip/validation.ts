import { z } from 'zod';

export const subscribeVipSchema = z.object({
  plan: z.enum(['monthly', 'yearly']),
  paymentMethod: z.enum(['stripe', 'paypal', 'mobile_money']),
});

export const vipStatusSchema = z.object({
  userId: z.string().cuid('ID utilisateur invalide').optional(),
});

export const cancelVipSchema = z.object({
  reason: z.string().max(500, 'Raison trop longue').optional(),
});