import { Router } from 'express';
import { VipController } from './controller';
import { authenticateToken } from '../auth/middleware';

const router = Router();

/**
 * @swagger
 * /vip/plans:
 *   get:
 *     summary: Obtenir les plans VIP disponibles
 *     tags: [VIP]
 *     responses:
 *       200:
 *         description: Liste des plans VIP
 */
router.get('/plans', VipController.getVipPlans);

/**
 * @swagger
 * /vip/benefits:
 *   get:
 *     summary: Obtenir les avantages VIP
 *     tags: [VIP]
 *     responses:
 *       200:
 *         description: Avantages VIP
 */
router.get('/benefits', VipController.getVipBenefits);

/**
 * @swagger
 * /vip/subscribe:
 *   post:
 *     summary: S'abonner au VIP
 *     tags: [VIP]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - plan
 *               - paymentMethod
 *             properties:
 *               plan:
 *                 type: string
 *                 enum: [monthly, yearly]
 *               paymentMethod:
 *                 type: string
 *                 enum: [stripe, paypal, mobile_money]
 *     responses:
 *       201:
 *         description: Abonnement VIP créé
 */
router.post('/subscribe', authenticateToken, VipController.subscribeVip);

/**
 * @swagger
 * /vip/status:
 *   get:
 *     summary: Obtenir le statut VIP
 *     tags: [VIP]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statut VIP
 */
router.get('/status', authenticateToken, VipController.getVipStatus);

/**
 * @swagger
 * /vip/cancel:
 *   post:
 *     summary: Annuler l'abonnement VIP
 *     tags: [VIP]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Abonnement annulé
 */
router.post('/cancel', authenticateToken, VipController.cancelVip);

/**
 * @swagger
 * /vip/boost/{productId}:
 *   post:
 *     summary: Booster un produit (VIP seulement)
 *     tags: [VIP]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Produit boosté
 */
router.post('/boost/:productId', authenticateToken, VipController.boostProduct);

/**
 * @swagger
 * /vip/check-expired:
 *   post:
 *     summary: Vérifier les abonnements VIP expirés (Admin)
 *     tags: [VIP]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Abonnements expirés traités
 */
router.post('/check-expired', authenticateToken, VipController.checkExpiredVips);

export default router;