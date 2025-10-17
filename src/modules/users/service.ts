import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { v2 as cloudinary } from 'cloudinary';
import prisma from '../../prisma';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const UPLOAD_PATH = process.env.UPLOAD_PATH || './uploads';
const AVATAR_PATH = path.join(UPLOAD_PATH, 'avatars');

// Ensure avatar directory exists
if (!fs.existsSync(AVATAR_PATH)) {
  fs.mkdirSync(AVATAR_PATH, { recursive: true });
}

// Multer configuration for avatars
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, AVATAR_PATH);
  },
  filename: (req, file, cb) => {
    const uniqueName = `avatar-${uuidv4()}.webp`;
    cb(null, uniqueName);
  },
});

const avatarFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Seuls les fichiers image sont autorisés'));
  }
};

export const avatarUpload = multer({
  storage: avatarStorage,
  fileFilter: avatarFileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
});

export class UserService {
  static async getUserById(id: string): Promise<any> {
    return (prisma as any).user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        location: true,
        profilePicture: true,
        role: true,
        reputation: true,
        isVip: true,
        registrationDate: true,
        lastLogin: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
    });
  }

  static async updateProfile(userId: string, updateData: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    location?: string;
  }): Promise<any> {
    return (prisma as any).user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        location: true,
        profilePicture: true,
        role: true,
        reputation: true,
        isVip: true,
        registrationDate: true,
        lastLogin: true,
      },
    });
  }

  static async uploadAvatar(userId: string, file: Express.Multer.File): Promise<string> {
    try {
      const user = await (prisma as any).user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      // Delete old avatar from Cloudinary if exists
      if (user.profilePicture) {
        try {
          const publicId = this.extractPublicIdFromUrl(user.profilePicture);
          if (publicId) {
            await cloudinary.uploader.destroy(publicId);
          }
        } catch (error) {
          console.error(`Erreur lors de la suppression de l'ancien avatar:`, error);
        }
      }

      // Process new avatar
      const buffer = await sharp(file.path)
        .resize(200, 200, { fit: 'cover' })
        .webp({ quality: 80 })
        .toBuffer();

      // Upload to Cloudinary
      const result = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            folder: 'avatars',
            public_id: `avatar-${uuidv4()}`,
            format: 'webp',
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(buffer);
      });

      // Delete temp file
      fs.unlinkSync(file.path);

      // Update user profile
      await (prisma as any).user.update({
        where: { id: userId },
        data: { profilePicture: result.secure_url },
      });

      return result.secure_url;
    } catch (error) {
      // Clean up temp file if processing failed
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw error;
    }
  }

  static extractPublicIdFromUrl(url: string): string | null {
    // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z]+$/);
    return match ? match[1] : null;
  }

  static async getUserProducts(userId: string, filters: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    const where: any = { sellerId: userId };
    if (filters.status) where.status = filters.status;

    return (prisma as any).product.findMany({
      where,
      include: {
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { publishDate: 'desc' },
      take: filters.limit || 20,
      skip: filters.offset || 0,
    });
  }

  static async getUserStats(userId: string): Promise<{
    totalProducts: number;
    activeProducts: number;
    soldProducts: number;
    totalViews: number;
    reputation: number;
  }> {
    const products = await (prisma as any).product.findMany({
      where: { sellerId: userId },
      select: {
        status: true,
        views: true,
      },
    });

    const stats = {
      totalProducts: products.length,
      activeProducts: products.filter((p: any) => p.status === 'APPROVED').length,
      soldProducts: products.filter((p: any) => p.status === 'SOLD').length,
      totalViews: products.reduce((sum: number, p: any) => sum + p.views, 0),
      reputation: 0, // Will be calculated based on reviews
    };

    // Get user reputation
    const user = await (prisma as any).user.findUnique({
      where: { id: userId },
      select: { reputation: true },
    });

    if (user) {
      stats.reputation = user.reputation;
    }

    return stats;
  }

  static async reportUser(reporterId: string, reportedUserId: string, reason: string, description?: string): Promise<void> {
    // In a real app, you'd have a reports table
    // For now, we'll just log it (you can extend this)
    console.log(`User ${reporterId} reported user ${reportedUserId}: ${reason}`, description);

    // You could send notification to admins here
    // await NotificationService.notifyAdmins('user_reported', { reporterId, reportedUserId, reason, description });
  }

  static async deleteAccount(userId: string): Promise<void> {
    const user = await (prisma as any).user.findUnique({ where: { id: userId } });

    // Delete avatar from Cloudinary if exists
    if (user?.profilePicture) {
      try {
        const publicId = this.extractPublicIdFromUrl(user.profilePicture);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      } catch (error) {
        console.error(`Erreur lors de la suppression de l'avatar:`, error);
      }
    }

    // Soft delete - mark as inactive instead of hard delete
    await (prisma as any).user.update({
      where: { id: userId },
      data: {
        email: `deleted_${userId}@deleted.com`,
        firstName: 'Deleted',
        lastName: 'User',
        phone: null,
        profilePicture: null,
        // Keep other data for legal/compliance reasons
      },
    });
  }
}