import { z } from 'zod';

export const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'Prénom requis').optional(),
  lastName: z.string().min(1, 'Nom requis').optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
});

export const userIdSchema = z.object({
  id: z.string().regex(/^cm[a-z0-9]{20,}$/, 'ID utilisateur invalide'),
});

export const reportUserSchema = z.object({
  reportedUserId: z.string().regex(/^cm[a-z0-9]{20,}$/, 'ID utilisateur invalide'),
  reason: z.string().min(10, 'Raison trop courte').max(500, 'Raison trop longue'),
  description: z.string().optional(),
});