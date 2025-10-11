import { z } from 'zod';

export const trackEventSchema = z.object({
  eventType: z.string().min(1, 'Type d\'événement requis'),
  entityId: z.string().optional(),
  entityType: z.enum(['product', 'user', 'category', 'order']).optional(),
  metadata: z.any().optional(),
});

export const dashboardQuerySchema = z.object({
  period: z.enum(['daily', 'weekly', 'monthly']).optional().default('monthly'),
});

export const recommendationsQuerySchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(val => parseInt(val)).optional().default(10),
});

export const reportQuerySchema = z.object({
  period: z.enum(['daily', 'weekly', 'monthly']).optional().default('weekly'),
});