import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../../prisma';
import { User } from '../../prisma';

const JWT_SECRET = process.env.JWT_SECRET!;
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET!;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateTokens(user: User): AuthTokens {
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
    firstName: string;
    lastName: string;
    phone?: string;
  }): Promise<User & { tokens: AuthTokens }> {
    const existingUser = await (prisma as any).user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new Error('Email déjà utilisé');
    }

    const hashedPassword = await this.hashPassword(userData.password);

    // Set role to ADMIN if email contains 'admin'
    const role = userData.email.includes('admin') ? 'ADMIN' : 'USER';

    const user = await (prisma as any).user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        role: role,
      },
    });

    const tokens = this.generateTokens(user);

    return { ...user, tokens };
  }

  static async login(email: string, password: string): Promise<User & { tokens: AuthTokens }> {
    const user = await (prisma as any).user.findUnique({
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
    await (prisma as any).user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const tokens = this.generateTokens(user);

    return { ...user, tokens };
  }

  static async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    const payload = this.verifyRefreshToken(refreshToken);

    const user = await (prisma as any).user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    return this.generateTokens(user);
  }

  static async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await (prisma as any).user.findUnique({
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

    await (prisma as any).user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });
  }
}