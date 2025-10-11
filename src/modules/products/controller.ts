import { Request, Response } from 'express';
import { ProductService, upload } from './service';
import { createProductSchema, updateProductSchema, productIdSchema } from './validation';
import { AuthRequest } from '../auth/middleware';

export class ProductController {
  static async createProduct(req: AuthRequest, res: Response) {
    try {
      const validatedData = createProductSchema.parse(req.body);
      const sellerId = req.user!.userId;

      let imageUrls: string[] = [];
      if (req.files && Array.isArray(req.files)) {
        imageUrls = await ProductService.processImages(req.files);
      }

      const product = await ProductService.createProduct({
        ...validatedData,
        images: imageUrls,
        sellerId,
      });

      res.status(201).json({
        message: 'Produit créé avec succès',
        product,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Données invalides', errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  }

  static async getProducts(req: Request, res: Response) {
    try {
      const filters = {
        category: req.query.category as string,
        location: req.query.location as string,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
        status: req.query.status as string,
        sellerId: req.query.sellerId as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      };

      const products = await ProductService.getProducts(filters);
      res.json({ products });
    } catch (error: any) {
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  static async getProductById(req: Request, res: Response) {
    try {
      const { id } = productIdSchema.parse(req.params);
      const product = await ProductService.getProductById(id);

      if (!product) {
        return res.status(404).json({ message: 'Produit non trouvé' });
      }

      // Increment views
      await ProductService.incrementViews(id);

      res.json({ product });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'ID invalide' });
      }
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  static async updateProduct(req: AuthRequest, res: Response) {
    try {
      const { id } = productIdSchema.parse(req.params);
      const validatedData = updateProductSchema.parse(req.body);

      const product = await ProductService.getProductById(id);
      if (!product) {
        return res.status(404).json({ message: 'Produit non trouvé' });
      }

      if (product.sellerId !== req.user!.userId) {
        return res.status(403).json({ message: 'Accès non autorisé' });
      }

      const updatedProduct = await ProductService.updateProduct(id, validatedData);
      res.json({
        message: 'Produit mis à jour',
        product: updatedProduct,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Données invalides', errors: error.errors });
      }
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  static async deleteProduct(req: AuthRequest, res: Response) {
    try {
      const { id } = productIdSchema.parse(req.params);

      const product = await ProductService.getProductById(id);
      if (!product) {
        return res.status(404).json({ message: 'Produit non trouvé' });
      }

      if (product.sellerId !== req.user!.userId) {
        return res.status(403).json({ message: 'Accès non autorisé' });
      }

      await ProductService.deleteProduct(id);
      res.json({ message: 'Produit supprimé' });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'ID invalide' });
      }
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  static async renewProduct(req: AuthRequest, res: Response) {
    try {
      const { id } = productIdSchema.parse(req.params);
      const sellerId = req.user!.userId;

      const product = await ProductService.renewProduct(id, sellerId);
      res.json({
        message: 'Produit renouvelé avec succès',
        product,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'ID invalide' });
      }
      res.status(500).json({ message: error.message });
    }
  }

  static async getRenewableProducts(req: AuthRequest, res: Response) {
    try {
      const sellerId = req.user!.userId;
      const products = await ProductService.getRenewableProducts(sellerId);
      res.json({ products });
    } catch (error: any) {
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  static async autoExpireProducts(req: AuthRequest, res: Response) {
    try {
      // Vérifier que l'utilisateur est admin
      if (req.user!.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Accès non autorisé' });
      }

      const expiredCount = await ProductService.autoExpireProducts();
      res.json({
        message: `${expiredCount} produits expirés automatiquement`,
        expiredCount,
      });
    } catch (error: any) {
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
}

// Middleware for handling file uploads
export const uploadMiddleware = upload.array('images', 5); // Max 5 images