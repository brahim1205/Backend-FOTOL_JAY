import { z } from 'zod';

export const purchaseCreditsSchema = z.object({
  amount: z.number().min(1, 'Montant minimum 1€').max(500, 'Montant maximum 500€'),
  paymentMethod: z.enum(['stripe', 'paypal', 'mobile_money']),
});

export const creditTransactionSchema = z.object({
  type: z.enum(['purchase', 'boost', 'refund']),
  amount: z.number().positive('Montant doit être positif'),
  description: z.string().max(255, 'Description trop longue'),
});

export const boostProductSchema = z.object({
  productId: z.string().cuid('ID produit invalide'),
  boostType: z.enum(['basic', 'premium', 'urgent']),
});