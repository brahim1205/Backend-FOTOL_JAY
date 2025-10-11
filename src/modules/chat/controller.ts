import { Request, Response } from 'express';
import { ChatService } from './service';
import { sendMessageSchema, conversationSchema, offerSchema } from './validation';
import { AuthRequest } from '../auth/middleware';

export class ChatController {
  static async sendMessage(req: AuthRequest, res: Response) {
    try {
      const fromUserId = req.user!.userId;
      const { toUserId, productId, message } = sendMessageSchema.parse(req.body);

      const chatMessage = await ChatService.sendMessage(fromUserId, toUserId, message, productId);

      res.status(201).json({
        message: 'Message envoyé avec succès',
        chatMessage,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Données invalides', errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  }

  static async getConversations(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const conversations = await ChatService.getUserConversations(userId);

      res.json({ conversations });
    } catch (error: any) {
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  static async getConversation(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const otherUserId = req.params.userId;
      const productId = req.query.productId as string;

      const messages = await ChatService.getConversation(userId, otherUserId, productId);

      res.json({ messages });
    } catch (error: any) {
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  static async getMessages(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const otherUserId = req.params.userId;
      const productId = req.query.productId as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

      const messages = await ChatService.getMessagesBetweenUsers(userId, otherUserId, productId, limit, offset);

      res.json({ messages });
    } catch (error: any) {
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  static async makeOffer(req: AuthRequest, res: Response) {
    try {
      const fromUserId = req.user!.userId;
      const { toUserId, productId, amount, message } = offerSchema.parse(req.body);

      const offerMessage = await ChatService.makeOffer(fromUserId, toUserId, productId, amount, message);

      res.status(201).json({
        message: 'Offre envoyée avec succès',
        offerMessage,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Données invalides', errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  }

  static async blockUser(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const blockedUserId = req.params.userId;

      await ChatService.blockUser(userId, blockedUserId);

      res.json({ message: 'Utilisateur bloqué avec succès' });
    } catch (error: any) {
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  static async reportConversation(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const otherUserId = req.params.userId;
      const { reason } = req.body;

      if (!reason || typeof reason !== 'string' || reason.length < 10) {
        return res.status(400).json({ message: 'Raison requise (minimum 10 caractères)' });
      }

      await ChatService.reportConversation(userId, otherUserId, reason);

      res.json({ message: 'Conversation signalée avec succès' });
    } catch (error: any) {
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
}