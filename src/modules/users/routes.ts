import { Router } from 'express';
import { UserController, avatarUploadMiddleware } from './controller';
import { authenticateToken } from '../auth/middleware';

const router = Router();

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Obtenir le profil de l'utilisateur connecté
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil utilisateur
 */
router.get('/profile', authenticateToken, UserController.getProfile);

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Mettre à jour le profil utilisateur
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               location:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profil mis à jour
 */
router.put('/profile', authenticateToken, UserController.updateProfile);

/**
 * @swagger
 * /users/avatar:
 *   post:
 *     summary: Upload d'avatar utilisateur
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar mis à jour
 */
router.post('/avatar', authenticateToken, avatarUploadMiddleware, UserController.uploadAvatar);

/**
 * @swagger
 * /users/stats:
 *   get:
 *     summary: Obtenir les statistiques de l'utilisateur
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques utilisateur
 */
router.get('/stats', authenticateToken, UserController.getUserStats);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Obtenir le profil d'un utilisateur par ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Profil utilisateur
 *       404:
 *         description: Utilisateur non trouvé
 */
router.get('/:id', UserController.getUserById);

/**
 * @swagger
 * /users/products:
 *   get:
 *     summary: Obtenir les produits de l'utilisateur connecté
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
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
 *         description: Liste des produits
 */
router.get('/products', authenticateToken, UserController.getUserProducts);

/**
 * @swagger
 * /users/report:
 *   post:
 *     summary: Signaler un utilisateur
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reportedUserId
 *               - reason
 *             properties:
 *               reportedUserId:
 *                 type: string
 *               reason:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 500
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Signalement envoyé
 */
router.post('/report', authenticateToken, UserController.reportUser);

/**
 * @swagger
 * /users/delete-account:
 *   delete:
 *     summary: Supprimer le compte utilisateur
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Compte supprimé
 */
router.delete('/delete-account', authenticateToken, UserController.deleteAccount);

export default router;