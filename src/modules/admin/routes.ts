import { Router } from 'express';
import { AdminController } from './controller';
import { authenticateToken, authorizeRoles } from '../auth/middleware';

const router = Router();

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     summary: Obtenir les statistiques du dashboard admin
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Statistiques du dashboard
 */
router.get('/stats', authenticateToken, authorizeRoles('ADMIN'), AdminController.getDashboardStats);

/**
 * @swagger
 * /admin/products/pending:
 *   get:
 *     summary: Obtenir les produits en attente de modération
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Liste des produits en attente
 */
router.get('/products/pending', authenticateToken, authorizeRoles('ADMIN', 'MODERATOR'), AdminController.getPendingProducts);

/**
 * @swagger
 * /admin/products/moderate:
 *   post:
 *     summary: Modérer un produit (approuver/rejeter)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - action
 *             properties:
 *               productId:
 *                 type: string
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Produit modéré
 */
router.post('/products/moderate', authenticateToken, authorizeRoles('ADMIN', 'MODERATOR'), AdminController.moderateProduct);

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Obtenir la liste des utilisateurs
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *       - in: query
 *         name: isVip
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
 *         description: Liste des utilisateurs
 */
router.get('/users', authenticateToken, authorizeRoles('ADMIN'), AdminController.getUsers);

/**
 * @swagger
 * /admin/users/moderate:
 *   post:
 *     summary: Modérer un utilisateur (ban/warn/unban)
 *     tags: [Admin]
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
 *               - action
 *               - reason
 *             properties:
 *               userId:
 *                 type: string
 *               action:
 *                 type: string
 *                 enum: [ban, unban, warn]
 *               reason:
 *                 type: string
 *               duration:
 *                 type: number
 *     responses:
 *       200:
 *         description: Utilisateur modéré
 */
router.post('/users/moderate', authenticateToken, authorizeRoles('ADMIN'), AdminController.moderateUser);

/**
 * @swagger
 * /admin/health:
 *   get:
 *     summary: Vérifier la santé du système
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: État du système
 */
router.get('/health', authenticateToken, authorizeRoles('ADMIN'), AdminController.getSystemHealth);

/**
 * @swagger
 * /admin/cleanup:
 *   post:
 *     summary: Nettoyer les produits expirés
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Produits expirés nettoyés
 */
router.post('/cleanup', authenticateToken, authorizeRoles('ADMIN'), AdminController.cleanupExpiredProducts);

export default router;