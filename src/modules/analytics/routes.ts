import { Router } from 'express';
import { AnalyticsController } from './controller';
import { authenticateToken } from '../auth/middleware';
import { trackEventSchema, dashboardQuerySchema, recommendationsQuerySchema, reportQuerySchema } from './validation';

const router = Router();

/**
 * @swagger
 * /analytics/dashboard:
 *   get:
 *     summary: Obtenir le dashboard analytics du vendeur
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *     responses:
 *       200:
 *         description: Dashboard analytics
 */
router.get('/dashboard', authenticateToken, AnalyticsController.getSellerDashboard);

/**
 * @swagger
 * /analytics/realtime:
 *   get:
 *     summary: Obtenir les métriques temps réel (Admin seulement)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Métriques temps réel
 *       403:
 *         description: Accès non autorisé
 */
router.get('/realtime', authenticateToken, AnalyticsController.getRealtimeMetrics);

/**
 * @swagger
 * /analytics/recommendations:
 *   get:
 *     summary: Obtenir des recommandations personnalisées
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *     responses:
 *       200:
 *         description: Recommandations personnalisées
 */
router.get('/recommendations', authenticateToken, AnalyticsController.getPersonalizedRecommendations);

/**
 * @swagger
 * /analytics/report:
 *   get:
 *     summary: Générer un rapport automatisé (Admin seulement)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *     responses:
 *       200:
 *         description: Rapport automatisé
 *       403:
 *         description: Accès non autorisé
 */
router.get('/report', authenticateToken, AnalyticsController.getAutomatedReport);

/**
 * @swagger
 * /analytics/track:
 *   post:
 *     summary: Tracker un événement
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventType
 *             properties:
 *               eventType:
 *                 type: string
 *                 example: "product_view"
 *               entityId:
 *                 type: string
 *               entityType:
 *                 type: string
 *                 enum: [product, user, category, order]
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Événement tracké
 */
router.post('/track', authenticateToken, AnalyticsController.trackEvent);

export default router;