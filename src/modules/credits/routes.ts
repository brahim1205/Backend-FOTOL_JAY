import { Router } from 'express';
import { CreditController } from './controller';
import { authenticateToken } from '../auth/middleware';

const router = Router();

/**
 * @swagger
 * /credits/balance:
 *   get:
 *     summary: Obtenir le solde de crédits
 *     tags: [Credits]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Solde de crédits
 */
router.get('/balance', authenticateToken, CreditController.getCreditBalance);

/**
 * @swagger
 * /credits/purchase:
 *   post:
 *     summary: Acheter des crédits
 *     tags: [Credits]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - paymentMethod
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 500
 *               paymentMethod:
 *                 type: string
 *                 enum: [stripe, paypal, mobile_money]
 *     responses:
 *       201:
 *         description: Crédits achetés
 */
router.post('/purchase', authenticateToken, CreditController.purchaseCredits);

/**
 * @swagger
 * /credits/boost:
 *   post:
 *     summary: Booster un produit avec des crédits
 *     tags: [Credits]
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
 *               - boostType
 *             properties:
 *               productId:
 *                 type: string
 *               boostType:
 *                 type: string
 *                 enum: [basic, premium, urgent]
 *     responses:
 *       200:
 *         description: Produit boosté
 */
router.post('/boost', authenticateToken, CreditController.boostProduct);

/**
 * @swagger
 * /credits/history:
 *   get:
 *     summary: Obtenir l'historique des transactions
 *     tags: [Credits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Historique des transactions
 */
router.get('/history', authenticateToken, CreditController.getTransactionHistory);

/**
 * @swagger
 * /credits/packages:
 *   get:
 *     summary: Obtenir les packs de crédits disponibles
 *     tags: [Credits]
 *     responses:
 *       200:
 *         description: Packs de crédits
 */
router.get('/packages', CreditController.getCreditPackages);

/**
 * @swagger
 * /credits/earn:
 *   post:
 *     summary: Gagner des crédits (Admin/Système)
 *     tags: [Credits]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - reason
 *             properties:
 *               amount:
 *                 type: number
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Crédits gagnés
 */
router.post('/earn', authenticateToken, CreditController.earnCredits);

/**
 * @swagger
 * /credits/refund:
 *   post:
 *     summary: Remboursement de crédits (Admin)
 *     tags: [Credits]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - reason
 *             properties:
 *               amount:
 *                 type: number
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Remboursement effectué
 */
router.post('/refund', authenticateToken, CreditController.refundCredits);

export default router;