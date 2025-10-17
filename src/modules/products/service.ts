import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { v2 as cloudinary } from 'cloudinary';
import { PrismaClient } from '../../prisma';

const prisma = new PrismaClient();

type Product = unknown; // Temporary type

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const UPLOAD_PATH = process.env.UPLOAD_PATH || './uploads';

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_PATH)) {
  fs.mkdirSync(UPLOAD_PATH, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_PATH);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// File filter for images
const fileFilter = (req: unknown, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Seuls les fichiers image sont autorisés'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

export class ProductService {
  static async processImages(images: string[]): Promise<string[]> {
    const imageUrls: string[] = [];

    for (const imageData of images) {
      try {
        // Check if it's a base64 data URL
        if (typeof imageData === 'string' && imageData.startsWith('data:image/')) {
          // For development/demo purposes, return the base64 data URL directly
          // This allows users to see their actual captured photos
          imageUrls.push(imageData);

          console.log(`Base64 image stored directly: ${imageData.substring(0, 50)}...`);

          // Uncomment the code below when Cloudinary is properly configured
          /*
          // Process image with sharp to buffer
          const processedBuffer = await sharp(buffer)
            .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 80 })
            .toBuffer();

          // Upload to Cloudinary with retry logic
          const result = await this.uploadToCloudinary(processedBuffer, `image-${Date.now()}.webp`);

          imageUrls.push((result as { secure_url: string }).secure_url);
          */
        } else if (typeof imageData === 'string') {
          // Assume it's already a URL
          imageUrls.push(imageData);
        }

      } catch (error) {
        console.error(`Erreur lors du traitement de l'image:`, error);
        throw new Error(`Erreur lors du traitement de l'image`);
      }
    }

    return imageUrls;
  }

  static async processFileImages(files: Express.Multer.File[]): Promise<string[]> {
    const imageUrls: string[] = [];

    for (const file of files) {
      const tempPath = file.path;
      try {
        // Validate file type
        if (!file.mimetype.startsWith('image/')) {
          throw new Error('Type de fichier non supporté');
        }

        // For development/demo purposes, return a placeholder URL instead of uploading to Cloudinary
        const placeholderUrls = [
          'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop'
        ];

        // Return a random placeholder URL for demo purposes
        const randomUrl = placeholderUrls[Math.floor(Math.random() * placeholderUrls.length)];
        imageUrls.push(randomUrl);

        console.log(`File ${file.originalname} processed with placeholder URL: ${randomUrl}`);

      } catch (error) {
        console.error(`Erreur lors du traitement de l'image ${file.originalname}:`, error);
        throw new Error(`Erreur lors du traitement de l'image ${file.originalname}`);
      } finally {
        // Clean up original file
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
      }
    }

    return imageUrls;
  }

  private static async uploadToCloudinary(buffer: Buffer, filename: string, retries = 3): Promise<unknown> {
    for (let i = 0; i < retries; i++) {
      try {
        return await new Promise<any>((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              folder: 'products',
              public_id: uuidv4(),
              format: 'webp',
              timeout: 60000, // 60 seconds timeout
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(buffer);
        });
      } catch (error) {
        if (i === retries - 1) throw error;
        console.warn(`Tentative ${i + 1} échouée pour ${filename}, nouvelle tentative...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
      }
    }
  }

  static async createProduct(productData: {
    title: string;
    description: string;
    price: number;
    location: string;
    category?: string;
    condition?: string;
    images: string[];
    sellerId: string;
  }): Promise<Product> {
    try {
      // Set expiration to 7 days from now
      const expiration = new Date();
      expiration.setDate(expiration.getDate() + 7);

      return prisma.product.create({
        data: {
          title: productData.title,
          description: productData.description,
          price: productData.price,
          images: productData.images,
          location: productData.location,
          category: productData.category,
          condition: productData.condition,
          sellerId: productData.sellerId,
          expiration,
        },
      });
    } catch (error) {
      console.error('Erreur lors de la création du produit:', error);
      throw new Error('Impossible de créer le produit');
    }
  }

  static async getProducts(filters: {
    category?: string;
    location?: string;
    minPrice?: number;
    maxPrice?: number;
    status?: string;
    sellerId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ products: Product[]; total: number }> {
    try {
      const where: Record<string, unknown> = {};

      if (filters.category) where.category = filters.category;
      if (filters.location) where.location = { contains: filters.location };
      if (filters.minPrice || filters.maxPrice) {
        where.price = {};
        if (filters.minPrice) (where.price as { gte?: number }).gte = filters.minPrice;
        if (filters.maxPrice) (where.price as { lte?: number }).lte = filters.maxPrice;
      }
      if (filters.status) where.status = filters.status;
      if (filters.sellerId) where.sellerId = filters.sellerId;

      // Default to APPROVED status if not specified, unless sellerId is provided
      if (!filters.status && !filters.sellerId) {
        where.status = 'APPROVED';
      }

      // Construire l'ordre de tri : produits VIP en premier, puis par date
      const orderBy = [
        // Produits avec boost actif en premier
        {
          boost: {
            isActive: 'desc' as const,
          },
        },
        // Puis par date de publication
        { publishDate: 'desc' as const },
      ];

      const products = await prisma.product.findMany({
        where,
        include: {
          seller: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              reputation: true,
              isVip: true,
            },
          },
          boost: {
            select: {
              isActive: true,
              boostType: true,
            },
          },
        },
        orderBy,
        take: Math.min(filters.limit || 20, 100), // Max 100 items per request
        skip: filters.offset || 0,
      });

      // Get total count for pagination
      const total = await prisma.product.count({ where });

      return { products, total };
    } catch (error) {
      console.error('Erreur lors de la récupération des produits:', error);
      throw new Error('Impossible de récupérer les produits');
    }
  }

  static async getProductById(id: string): Promise<Product | null> {
    try {
      return prisma.product.findUnique({
        where: { id },
        include: {
          seller: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              reputation: true,
              phone: true,
            },
          },
          messages: {
            include: {
              fromUser: {
                select: { id: true, firstName: true, lastName: true },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
          _count: {
            select: { favorites: true },
          },
        },
      });
    } catch (error) {
      console.error('Erreur lors de la récupération du produit:', error);
      throw new Error('Produit non trouvé');
    }
  }

  static async updateProduct(id: string, updateData: Partial<{
    title: string;
    description: string;
    price: number;
    location: string;
    category: string;
    condition: string;
    images: string[];
  }>): Promise<Product> {
    try {
      return prisma.product.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du produit:', error);
      throw new Error('Impossible de mettre à jour le produit');
    }
  }

  static async deleteProduct(id: string): Promise<void> {
    try {
      const product = await prisma.product.findUnique({ where: { id } });
      if (product) {
        // Delete associated images from Cloudinary
        const images = product.images as string[];
        for (const imageUrl of images) {
          try {
            const publicId = this.extractPublicIdFromUrl(imageUrl);
            if (publicId) {
              await cloudinary.uploader.destroy(publicId);
            }
          } catch (error) {
            console.error(`Erreur lors de la suppression de l'image ${imageUrl}:`, error);
          }
        }

        await prisma.product.delete({ where: { id } });
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du produit:', error);
      throw new Error('Impossible de supprimer le produit');
    }
  }

  static extractPublicIdFromUrl(url: string): string | null {
    // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z]+$/);
    return match ? match[1] : null;
  }

  static async incrementViews(id: string): Promise<void> {
    try {
      await prisma.product.update({
        where: { id },
        data: { views: { increment: 1 } },
      });
    } catch (error) {
      console.error('Erreur lors de l\'incrémentation des vues:', error);
      // Ne pas throw ici car ce n'est pas critique
    }
  }

  static async renewProduct(id: string, sellerId: string): Promise<Product> {
    try {
      const product = await prisma.product.findUnique({
        where: { id },
      });

      if (!product) {
        throw new Error('Produit non trouvé');
      }

      if (product.sellerId !== sellerId) {
        throw new Error('Vous n\'êtes pas autorisé à renouveler ce produit');
      }

      if (product.status !== 'APPROVED') {
        throw new Error('Seuls les produits approuvés peuvent être renouvelés');
      }

      // Limiter à 3 renouvellements maximum
      const maxRenewals = 3;
      if (product.renewalCount >= maxRenewals) {
        throw new Error(`Ce produit a déjà été renouvelé ${maxRenewals} fois (limite atteinte)`);
      }

      // Calculer la nouvelle date d'expiration (7 jours à partir de maintenant)
      const newExpiration = new Date();
      newExpiration.setDate(newExpiration.getDate() + 7);

      // Mettre à jour le produit
      const updatedProduct = await prisma.product.update({
        where: { id },
        data: {
          expiration: newExpiration,
          renewalCount: { increment: 1 },
          status: 'APPROVED', // Remettre en approuvé si nécessaire
        },
      });

      return updatedProduct;
    } catch (error) {
      console.error('Erreur lors du renouvellement du produit:', error);
      throw error; // Re-throw pour que le controller gère l'erreur
    }
  }

  static async getRenewableProducts(sellerId: string): Promise<Product[]> {
    try {
      // Produits qui expirent dans moins de 24h et qui peuvent encore être renouvelés
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      return await prisma.product.findMany({
        where: {
          sellerId,
          status: 'APPROVED',
          expiration: {
            lte: tomorrow,
          },
          renewalCount: {
            lt: 3, // Moins de 3 renouvellements
          },
        },
        orderBy: { expiration: 'asc' },
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des produits renouvelables:', error);
      throw new Error('Impossible de récupérer les produits renouvelables');
    }
  }

  static async autoExpireProducts(): Promise<number> {
    try {
      // Marquer les produits expirés comme EXPIRED
      const result = await prisma.product.updateMany({
        where: {
          status: 'APPROVED',
          expiration: {
            lt: new Date(),
          },
        },
        data: {
          status: 'EXPIRED',
        },
      });

      return result.count || 0;
    } catch (error) {
      console.error('Erreur lors de l\'expiration automatique des produits:', error);
      return 0;
    }
  }

  static async getPendingProducts(): Promise<Product[]> {
    try {
      return await prisma.product.findMany({
        where: {
          status: 'PENDING',
        },
        include: {
          seller: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
        },
        orderBy: { publishDate: 'desc' },
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des produits en attente:', error);
      throw new Error('Impossible de récupérer les produits en attente');
    }
  }

  static async approveProduct(id: string): Promise<Product> {
    try {
      return await prisma.product.update({
        where: { id },
        data: { status: 'APPROVED' },
        include: {
          seller: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('Erreur lors de l\'approbation du produit:', error);
      throw new Error('Impossible d\'approuver le produit');
    }
  }

  static async rejectProduct(id: string): Promise<Product> {
    try {
      return await prisma.product.update({
        where: { id },
        data: { status: 'REJECTED' },
        include: {
          seller: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('Erreur lors du rejet du produit:', error);
      throw new Error('Impossible de rejeter le produit');
    }
  }

  static async toggleLike(productId: string, userId: string): Promise<boolean> {
    try {
      // Check if like already exists
      const existingLike = await prisma.like.findUnique({
        where: {
          productId_userId: {
            productId,
            userId,
          },
        },
      });

      if (existingLike) {
        // Unlike: remove the like
        await prisma.like.delete({
          where: {
            productId_userId: {
              productId,
              userId,
            },
          },
        });
        return false; // Not liked anymore
      } else {
        // Like: create the like
        await prisma.like.create({
          data: {
            productId,
            userId,
          },
        });
        return true; // Now liked
      }
    } catch (error) {
      console.error('Erreur lors du toggle like:', error);
      throw new Error('Impossible de modifier le like');
    }
  }
}