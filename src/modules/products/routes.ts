import { Router } from 'express';
import { ProductController, uploadMiddleware } from './controller';
import { authenticateToken } from '../auth/middleware';

const router = Router();

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Obtenir la liste des produits
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
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
router.get('/', ProductController.getProducts);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Obtenir un produit par ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Détails du produit
 *       404:
 *         description: Produit non trouvé
 */
router.get('/:id', ProductController.getProductById);

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Créer un nouveau produit
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - price
 *               - location
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               location:
 *                 type: string
 *               category:
 *                 type: string
 *               condition:
 *                 type: string
 *                 enum: [Neuf, Occasion]
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Produit créé
 */
router.post('/', authenticateToken, uploadMiddleware, ProductController.createProduct);

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Mettre à jour un produit
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               location:
 *                 type: string
 *               category:
 *                 type: string
 *               condition:
 *                 type: string
 *                 enum: [Neuf, Occasion]
 *     responses:
 *       200:
 *         description: Produit mis à jour
 *       403:
 *         description: Accès non autorisé
 *       404:
 *         description: Produit non trouvé
 */
router.put('/:id', authenticateToken, ProductController.updateProduct);

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Supprimer un produit
 *     tags: [Products]
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
 *         description: Produit supprimé
 *       403:
 *         description: Accès non autorisé
 *       404:
 *         description: Produit non trouvé
 */
router.delete('/:id', authenticateToken, ProductController.deleteProduct);

/**
 * @swagger
 * /products/{id}/renew:
 *   post:
 *     summary: Renouveler un produit (7 jours supplémentaires)
 *     tags: [Products]
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
 *         description: Produit renouvelé
 *       403:
 *         description: Accès non autorisé
 *       404:
 *         description: Produit non trouvé
 */
router.post('/:id/renew', authenticateToken, ProductController.renewProduct);

/**
 * @swagger
 * /products/renewable:
 *   get:
 *     summary: Obtenir les produits renouvelables du vendeur
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des produits renouvelables
 */
router.get('/renewable', authenticateToken, ProductController.getRenewableProducts);

/**
 * @swagger
 * /products/auto-expire:
 *   post:
 *     summary: Expirer automatiquement les produits (Admin seulement)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Produits expirés
 *       403:
 *         description: Accès non autorisé
 */
router.post('/auto-expire', authenticateToken, ProductController.autoExpireProducts);

export default router;