import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// Middleware CSRF protection
export const csrfProtection = (req: Request, res: Response, next: NextFunction): void => {
  // Générer un token CSRF pour les requêtes POST, PUT, DELETE
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const csrfToken = req.headers['x-csrf-token'] as string;

    if (!csrfToken) {
      res.status(403).json({ message: 'Token CSRF manquant' });
      return;
    }

    // En développement, accepter tous les tokens
    // En production, vérifier la validité du token
    if (process.env.NODE_ENV === 'production') {
      // TODO: Implémenter la vérification CSRF en production
      // Vérifier que le token correspond à la session utilisateur
    }
  }

  next();
};

// Middleware pour nettoyer les entrées utilisateur
export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  // Fonction récursive pour nettoyer les objets
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      // Supprimer les caractères dangereux et normaliser
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Scripts
        .replace(/<[^>]*>/g, '') // HTML tags
        .trim();
    } else if (Array.isArray(obj)) {
      return obj.map(sanitize);
    } else if (obj !== null && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitize(obj[key]);
        }
      }
      return sanitized;
    }
    return obj;
  };

  // Nettoyer body, query et params
  if (req.body && typeof req.body === 'object') {
    req.body = sanitize(req.body);
  }

  if (req.query && typeof req.query === 'object') {
    req.query = sanitize(req.query);
  }

  next();
};

// Middleware pour limiter la taille des payloads
export const payloadLimiter = (maxSize: string = '10mb') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = parseInt(req.headers['content-length'] || '0');

    if (contentLength > parseSize(maxSize)) {
      res.status(413).json({ message: 'Payload trop volumineux' });
      return;
    }

    next();
  };
};

// Fonction utilitaire pour parser les tailles
const parseSize = (size: string): number => {
  const units: { [key: string]: number } = {
    'b': 1,
    'kb': 1024,
    'mb': 1024 * 1024,
    'gb': 1024 * 1024 * 1024
  };

  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
  if (!match) return 10 * 1024 * 1024; // 10MB par défaut

  const value = parseFloat(match[1]);
  const unit = match[2] || 'b';

  return Math.floor(value * units[unit]);
};

// Middleware pour ajouter des headers de sécurité supplémentaires
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // Headers déjà gérés par Helmet, mais on peut ajouter des personnalisations
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Générer un nonce pour CSP si nécessaire
  const nonce = crypto.randomBytes(16).toString('base64');
  res.locals.nonce = nonce;

  next();
};

// Middleware pour valider les types de fichiers
export const validateFileType = (allowedTypes: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.file && !req.files) {
      next();
      return;
    }

    const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : [req.file];

    for (const file of files) {
      if (file && !allowedTypes.includes(file.mimetype)) {
        res.status(400).json({
          message: `Type de fichier non autorisé: ${file.mimetype}. Types autorisés: ${allowedTypes.join(', ')}`
        });
        return;
      }
    }

    next();
  };
};

// Middleware pour journaliser les requêtes suspectes
export const suspiciousActivityLogger = (req: Request, res: Response, next: NextFunction): void => {
  const suspiciousPatterns = [
    /\.\./,  // Path traversal
    /<script/i,  // XSS attempts
    /union.*select/i,  // SQL injection
    /eval\(/i,  // Code injection
  ];

  const checkString = JSON.stringify({
    url: req.url,
    body: req.body,
    query: req.query,
    headers: req.headers
  });

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(checkString)) {
      console.warn(`Activité suspecte détectée: ${req.method} ${req.url} from ${req.ip}`);
      // TODO: Log to security monitoring system
      break;
    }
  }

  next();
};