import { Router } from 'express';
import { PaymentController } from './controller';
import { authenticateToken } from '../auth/middleware';

const router = Router();

/**
 * @swagger
 * /payments/create:
 *   post:
 *     summary: Créer un paiement
 *     tags: [Payments]
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
 *               - description
 *               - type
 *             properties:
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *                 default: XOF
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [credit_purchase, vip_subscription, product_sale]
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Paiement créé
 */
router.post('/create', authenticateToken, PaymentController.createPayment);

/**
 * @swagger
 * /payments/credits:
 *   post:
 *     summary: Acheter des crédits
 *     tags: [Payments]
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
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Montant en XOF (1€ = 1 crédit)
 *     responses:
 *       200:
 *         description: Paiement de crédits créé
 */
router.post('/credits', authenticateToken, PaymentController.purchaseCredits);

/**
 * @swagger
 * /payments/vip:
 *   post:
 *     summary: S'abonner au VIP
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               plan:
 *                 type: string
 *                 enum: [monthly, yearly]
 *                 default: monthly
 *     responses:
 *       200:
 *         description: Paiement VIP créé
 */
router.post('/vip', authenticateToken, PaymentController.subscribeVip);

/**
 * @swagger
 * /payments/{transactionId}/status:
 *   get:
 *     summary: Obtenir le statut d'un paiement
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Statut du paiement
 */
router.get('/:transactionId/status', authenticateToken, PaymentController.getPaymentStatus);

/**
 * @swagger
 * /payments/refund:
 *   post:
 *     summary: Demander un remboursement
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transactionId
 *               - reason
 *             properties:
 *               transactionId:
 *                 type: string
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Remboursement demandé
 */
router.post('/refund', authenticateToken, PaymentController.refundPayment);

/**
 * @swagger
 * /payments/callback:
 *   post:
 *     summary: Callback PayDunya (interne)
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Callback traité
 */
router.post('/callback', PaymentController.handleCallback);

export default router;