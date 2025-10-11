import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { v2 as cloudinary } from 'cloudinary';
import { PrismaClient, Product } from '../../prisma';
import prisma from '../../prisma';

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
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
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
  static async processImages(files: Express.Multer.File[]): Promise<string[]> {
    const imageUrls: string[] = [];

    for (const file of files) {
      try {
        // Process image with sharp to buffer
        const buffer = await sharp(file.path)
          .resize(800, 600, { fit: 'inside' })
          .webp({ quality: 80 })
          .toBuffer();

        // Upload to Cloudinary
        const result = await new Promise<any>((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              folder: 'products',
              public_id: uuidv4(),
              format: 'webp',
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(buffer);
        });

        // Delete original file
        fs.unlinkSync(file.path);

        imageUrls.push(result.secure_url);
      } catch (error) {
        // Clean up original file if processing failed
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        throw new Error(`Erreur lors du traitement de l'image ${file.originalname}: ${error}`);
      }
    }

    return imageUrls;
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
    // Set expiration to 7 days from now
    const expiration = new Date();
    expiration.setDate(expiration.getDate() + 7);

    return (prisma as any).product.create({
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
  }): Promise<Product[]> {
    const where: any = {};

    if (filters.category) where.category = filters.category;
    if (filters.location) where.location = { contains: filters.location };
    if (filters.minPrice || filters.maxPrice) {
      where.price = {};
      if (filters.minPrice) where.price.gte = filters.minPrice;
      if (filters.maxPrice) where.price.lte = filters.maxPrice;
    }
    if (filters.status) where.status = filters.status;
    if (filters.sellerId) where.sellerId = filters.sellerId;

    return (prisma as any).product.findMany({
      where,
      include: {
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            reputation: true,
          },
        },
      },
      orderBy: { publishDate: 'desc' },
      take: filters.limit || 20,
      skip: filters.offset || 0,
    });
  }

  static async getProductById(id: string): Promise<Product | null> {
    return (prisma as any).product.findUnique({
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
      },
    });
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
    return (prisma as any).product.update({
      where: { id },
      data: updateData,
    });
  }

  static async deleteProduct(id: string): Promise<void> {
    const product = await (prisma as any).product.findUnique({ where: { id } });
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

      await (prisma as any).product.delete({ where: { id } });
    }
  }

  static extractPublicIdFromUrl(url: string): string | null {
    // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z]+$/);
    return match ? match[1] : null;
  }

  static async incrementViews(id: string): Promise<void> {
    await (prisma as any).product.update({
      where: { id },
      data: { views: { increment: 1 } },
    });
  }

  static async renewProduct(id: string, sellerId: string): Promise<Product> {
    const product = await (prisma as any).product.findUnique({
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
    const updatedProduct = await (prisma as any).product.update({
      where: { id },
      data: {
        expiration: newExpiration,
        renewalCount: { increment: 1 },
        status: 'APPROVED', // Remettre en approuvé si nécessaire
      },
    });

    return updatedProduct;
  }

  static async getRenewableProducts(sellerId: string): Promise<Product[]> {
    // Produits qui expirent dans moins de 24h et qui peuvent encore être renouvelés
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    return await (prisma as any).product.findMany({
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
  }

  static async autoExpireProducts(): Promise<number> {
    // Marquer les produits expirés comme EXPIRED
    const result = await (prisma as any).product.updateMany({
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

    return result.count;
  }
}