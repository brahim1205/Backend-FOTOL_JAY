import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '../../prisma';

const prisma = new PrismaClient();

interface AuthUser {
  id: string;
  email: string;
  password: string;
  role: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-jwt-secret-for-development';
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || 'fallback-refresh-secret-for-development';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserWithTokens extends AuthUser {
  tokens: AuthTokens;
}

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateTokens(user: AuthUser): AuthTokens {
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
  }

  static verifyAccessToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Token invalide');
    }
  }

  static verifyRefreshToken(token: string): any {
    try {
      return jwt.verify(token, REFRESH_SECRET);
    } catch (error) {
      throw new Error('Refresh token invalide');
    }
  }

  static async register(userData: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    role?: string;
  }): Promise<UserWithTokens> {
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new Error('Email déjà utilisé');
    }

    const hashedPassword = await this.hashPassword(userData.password);

    // Set role based on frontend selection (passed from signup form)
    let role: string = 'USER';
    if (userData.role) {
      // Normalize role to uppercase and map frontend values to backend enum
      const normalizedRole = userData.role.toUpperCase();
      console.log('Role received from frontend:', userData.role);
      console.log('Normalized role:', normalizedRole);

      if (normalizedRole === 'VENDEUR') {
        role = 'VENDEUR';
        console.log('Setting role to VENDEUR');
      } else if (normalizedRole === 'VIP') {
        role = 'VIP';
        console.log('Setting role to VIP');
      } else if (normalizedRole === 'ADMIN') {
        role = 'ADMIN';
        console.log('Setting role to ADMIN');
      } else if (normalizedRole === 'MODERATOR') {
        role = 'MODERATOR';
        console.log('Setting role to MODERATOR');
      } else if (normalizedRole === 'PRO') {
        role = 'PRO';
        console.log('Setting role to PRO');
      } else {
        role = 'USER';
        console.log('Setting role to USER (default)');
      }
    }
    console.log('Final role to be saved:', role);

    const user = await prisma.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        phone: userData.phone || null,
        role: role as any,
      },
    });

    const tokens = this.generateTokens(user);

    return { ...user, tokens };
  }

  static async login(email: string, password: string): Promise<UserWithTokens> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('Email ou mot de passe incorrect');
    }

    const isValidPassword = await this.verifyPassword(password, user.password);

    if (!isValidPassword) {
      throw new Error('Email ou mot de passe incorrect');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const tokens = this.generateTokens(user);

    return { ...user, tokens };
  }

  static async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    const payload = this.verifyRefreshToken(refreshToken);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    return this.generateTokens(user);
  }

  static async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    const isValidOldPassword = await this.verifyPassword(oldPassword, user.password);
    if (!isValidOldPassword) {
      throw new Error('Ancien mot de passe incorrect');
    }

    const hashedNewPassword = await this.hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });
  }
}
