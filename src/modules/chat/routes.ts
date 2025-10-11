import { Router } from 'express';
import { ChatController } from './controller';
import { authenticateToken } from '../auth/middleware';

const router = Router();

/**
 * @swagger
 * /chat/messages:
 *   post:
 *     summary: Envoyer un message
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - toUserId
 *               - message
 *             properties:
 *               toUserId:
 *                 type: string
 *               productId:
 *                 type: string
 *               message:
 *                 type: string
 *                 maxLength: 1000
 *     responses:
 *       201:
 *         description: Message envoyé
 */
router.post('/messages', authenticateToken, ChatController.sendMessage);

/**
 * @swagger
 * /chat/conversations:
 *   get:
 *     summary: Obtenir la liste des conversations
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des conversations
 */
router.get('/conversations', authenticateToken, ChatController.getConversations);

/**
 * @swagger
 * /chat/conversations/{userId}:
 *   get:
 *     summary: Obtenir une conversation spécifique
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Conversation
 */
router.get('/conversations/:userId', authenticateToken, ChatController.getConversation);

/**
 * @swagger
 * /chat/messages/{userId}:
 *   get:
 *     summary: Obtenir les messages avec un utilisateur
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Messages
 */
router.get('/messages/:userId', authenticateToken, ChatController.getMessages);

/**
 * @swagger
 * /chat/offer:
 *   post:
 *     summary: Faire une offre pour un produit
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - toUserId
 *               - productId
 *               - amount
 *             properties:
 *               toUserId:
 *                 type: string
 *               productId:
 *                 type: string
 *               amount:
 *                 type: number
 *                 minimum: 0
 *               message:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       201:
 *         description: Offre envoyée
 */
router.post('/offer', authenticateToken, ChatController.makeOffer);

/**
 * @swagger
 * /chat/block/{userId}:
 *   post:
 *     summary: Bloquer un utilisateur
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Utilisateur bloqué
 */
router.post('/block/:userId', authenticateToken, ChatController.blockUser);

/**
 * @swagger
 * /chat/report/{userId}:
 *   post:
 *     summary: Signaler une conversation
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Conversation signalée
 */
router.post('/report/:userId', authenticateToken, ChatController.reportConversation);

export default router;