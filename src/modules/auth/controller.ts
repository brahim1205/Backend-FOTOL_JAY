import { Request, Response } from 'express';
import { AuthService } from './service';
import { registerSchema, loginSchema, refreshTokenSchema, changePasswordSchema } from './validation';
import { AuthRequest } from './middleware';

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const validatedData = registerSchema.parse(req.body);
      const result = await AuthService.register(validatedData);

      // Don't send password in response
      const { password, ...userWithoutPassword } = result;

      res.status(201).json({
        message: 'Utilisateur créé avec succès',
        user: userWithoutPassword,
        tokens: result.tokens,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Données invalides', errors: error.errors });
      }
      res.status(400).json({ message: error.message });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const result = await AuthService.login(email, password);

      const { password: _, ...userWithoutPassword } = result;

      res.json({
        message: 'Connexion réussie',
        user: userWithoutPassword,
        tokens: result.tokens,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Données invalides', errors: error.errors });
      }
      res.status(401).json({ message: error.message });
    }
  }

  static async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = refreshTokenSchema.parse(req.body);
      const tokens = await AuthService.refreshAccessToken(refreshToken);

      res.json({
        message: 'Token rafraîchi',
        tokens,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Données invalides', errors: error.errors });
      }
      res.status(401).json({ message: error.message });
    }
  }

  static async changePassword(req: AuthRequest, res: Response) {
    try {
      const { oldPassword, newPassword } = changePasswordSchema.parse(req.body);
      const userId = req.user!.userId;

      await AuthService.changePassword(userId, oldPassword, newPassword);

      res.json({ message: 'Mot de passe changé avec succès' });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Données invalides', errors: error.errors });
      }
      res.status(400).json({ message: error.message });
    }
  }

  static async getProfile(req: AuthRequest, res: Response) {
    try {
      // Profile is already in req.user from middleware
      res.json({ user: req.user });
    } catch (error: any) {
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
}