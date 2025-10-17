import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '../../prisma';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET!;

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    console.log('🔐 [AuthMiddleware] Vérification token - Header présent:', !!authHeader, 'Token présent:', !!token);

    if (!token) {
      console.log('❌ [AuthMiddleware] Token manquant');
      res.status(401).json({ message: 'Token d\'authentification manquant' });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    console.log('✅ [AuthMiddleware] Token décodé:', { userId: decoded.userId, email: decoded.email });

    // Vérifier que l'utilisateur existe toujours
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, lockedUntil: true }
    });

    console.log('👤 [AuthMiddleware] Utilisateur trouvé:', !!user);

    if (!user) {
      console.log('❌ [AuthMiddleware] Utilisateur non trouvé:', decoded.userId);
      res.status(401).json({ message: 'Utilisateur non trouvé' });
      return;
    }

    // Vérifier si le compte est verrouillé
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      console.log('🚫 [AuthMiddleware] Compte verrouillé:', user.lockedUntil);
      res.status(423).json({ message: 'Compte temporairement verrouillé' });
      return;
    }

    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    console.log('✅ [AuthMiddleware] Authentification réussie pour:', user.email);
    next();
  } catch (error: any) {
    console.log('❌ [AuthMiddleware] Erreur authentification:', error.name, error.message);
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({ message: 'Token expiré' });
    } else if (error.name === 'JsonWebTokenError') {
      res.status(401).json({ message: 'Token invalide' });
    } else {
      res.status(500).json({ message: 'Erreur d\'authentification' });
    }
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentification requise' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Permissions insuffisantes' });
      return;
    }

    next();
  };
};

export const requireAdmin = requireRole(['ADMIN']);
export const requireModerator = requireRole(['ADMIN', 'MODERATOR']);
export const requireVIP = requireRole(['ADMIN', 'MODERATOR', 'VIP', 'PRO']);

export const authorizeRoles = (...roles: string[]) => requireRole(roles);