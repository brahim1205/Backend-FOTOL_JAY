import { z } from 'zod';

export const sendNotificationSchema = z.object({
  userId: z.string().cuid('ID utilisateur invalide'),
  type: z.string().min(1, 'Type requis'),
  title: z.string().min(1, 'Titre requis'),
  message: z.string().min(1, 'Message requis'),
  payload: z.any().optional(),
});

export const notificationIdSchema = z.object({
  id: z.string().cuid('ID notification invalide'),
});

export const markAsReadSchema = z.object({
  notificationIds: z.array(z.string().cuid()).min(1, 'Au moins une notification requise'),
});