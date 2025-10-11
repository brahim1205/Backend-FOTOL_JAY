import { Router } from 'express';
import { NotificationController } from './controller';
import { authenticateToken, authorizeRoles } from '../auth/middleware';

const router = Router();

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Obtenir les notifications de l'utilisateur
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: read
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Liste des notifications
 */
router.get('/', authenticateToken, NotificationController.getNotifications);

/**
 * @swagger
 * /notifications/unread-count:
 *   get:
 *     summary: Obtenir le nombre de notifications non lues
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nombre de notifications non lues
 */
router.get('/unread-count', authenticateToken, NotificationController.getUnreadCount);

/**
 * @swagger
 * /notifications/mark-read:
 *   put:
 *     summary: Marquer des notifications comme lues
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - notificationIds
 *             properties:
 *               notificationIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Notifications marquées comme lues
 */
router.put('/mark-read', authenticateToken, NotificationController.markAsRead);

/**
 * @swagger
 * /notifications/mark-all-read:
 *   put:
 *     summary: Marquer toutes les notifications comme lues
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Toutes les notifications marquées comme lues
 */
router.put('/mark-all-read', authenticateToken, NotificationController.markAllAsRead);

/**
 * @swagger
 * /notifications/{id}:
 *   delete:
 *     summary: Supprimer une notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification supprimée
 */
router.delete('/:id', authenticateToken, NotificationController.deleteNotification);

/**
 * @swagger
 * /notifications/send:
 *   post:
 *     summary: Envoyer une notification (Admin seulement)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - type
 *               - title
 *               - message
 *             properties:
 *               userId:
 *                 type: string
 *               type:
 *                 type: string
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               payload:
 *                 type: object
 *     responses:
 *       200:
 *         description: Notification envoyée
 */
router.post('/send', authenticateToken, authorizeRoles('ADMIN', 'MODERATOR'), NotificationController.sendNotification);

export default router;