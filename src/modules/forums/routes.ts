import { Router } from 'express';
import { ForumsController } from './controller';
import { authenticateToken } from '../auth/middleware';

const router = Router();

/**
 * @swagger
 * /forums:
 *   get:
 *     summary: Obtenir tous les forums
 *     tags: [Forums]
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *       - in: query
 *         name: locationId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Liste des forums
 */
router.get('/', ForumsController.getForums);

/**
 * @swagger
 * /forums:
 *   post:
 *     summary: Créer un forum (Admin)
 *     tags: [Forums]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               categoryId:
 *                 type: string
 *               locationId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Forum créé
 */
router.post('/', authenticateToken, ForumsController.createForum);

/**
 * @swagger
 * /forums/{forumId}/posts:
 *   get:
 *     summary: Obtenir les posts d'un forum
 *     tags: [Forums]
 *     parameters:
 *       - in: path
 *         name: forumId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Liste des posts
 */
router.get('/:forumId/posts', ForumsController.getForumPosts);

/**
 * @swagger
 * /forums/{forumId}/posts:
 *   post:
 *     summary: Créer un post dans un forum
 *     tags: [Forums]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: forumId
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
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Post créé
 */
router.post('/:forumId/posts', authenticateToken, ForumsController.createPost);

/**
 * @swagger
 * /forums/posts/{postId}:
 *   get:
 *     summary: Obtenir un post avec ses commentaires
 *     tags: [Forums]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post avec commentaires
 */
router.get('/posts/:postId', ForumsController.getPost);

/**
 * @swagger
 * /forums/posts/{postId}/comments:
 *   post:
 *     summary: Ajouter un commentaire à un post
 *     tags: [Forums]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
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
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *               parentId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Commentaire ajouté
 */
router.post('/posts/:postId/comments', authenticateToken, ForumsController.createComment);

/**
 * @swagger
 * /forums/search:
 *   get:
 *     summary: Rechercher dans les forums
 *     tags: [Forums]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: forumId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Résultats de recherche
 */
router.get('/search', ForumsController.searchPosts);

export default router;