import winston from 'winston';
import path from 'path';

// Définir les niveaux de log personnalisés
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Ajouter les couleurs à winston
winston.addColors(colors);

// Format personnalisé pour les logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Format JSON pour la production
const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Configuration des transports
const transports = [
  // Console pour développement
  new winston.transports.Console({
    format,
    level: process.env.LOG_LEVEL || 'debug',
  }),

  // Fichier d'erreurs
  new winston.transports.File({
    filename: path.join(process.env.LOG_FILE || './logs/error.log'),
    level: 'error',
    format: jsonFormat,
  }),

  // Fichier général
  new winston.transports.File({
    filename: path.join(process.env.LOG_FILE || './logs/app.log'),
    format: jsonFormat,
  }),
];

// Créer l'instance logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format,
  transports,
});

// Méthodes utilitaires pour les logs métier
export class LoggerService {
  static error(message: string, meta?: any): void {
    logger.error(message, meta);
  }

  static warn(message: string, meta?: any): void {
    logger.warn(message, meta);
  }

  static info(message: string, meta?: any): void {
    logger.info(message, meta);
  }

  static http(message: string, meta?: any): void {
    logger.http(message, meta);
  }

  static debug(message: string, meta?: any): void {
    logger.debug(message, meta);
  }

  // Logs spécifiques à l'application
  static auth(message: string, userId?: string, meta?: any): void {
    logger.info(`AUTH: ${message}`, { userId, ...meta });
  }

  static payment(message: string, userId?: string, amount?: number, meta?: any): void {
    logger.info(`PAYMENT: ${message}`, { userId, amount, ...meta });
  }

  static product(message: string, productId?: string, userId?: string, meta?: any): void {
    logger.info(`PRODUCT: ${message}`, { productId, userId, ...meta });
  }

  static chat(message: string, userId?: string, room?: string, meta?: any): void {
    logger.info(`CHAT: ${message}`, { userId, room, ...meta });
  }

  static admin(message: string, adminId?: string, action?: string, meta?: any): void {
    logger.info(`ADMIN: ${message}`, { adminId, action, ...meta });
  }

  // Log des erreurs avec stack trace
  static logError(error: Error, context?: string, meta?: any): void {
    logger.error(`${context || 'ERROR'}: ${error.message}`, {
      stack: error.stack,
      ...meta
    });
  }

  // Log des requêtes HTTP
  static logRequest(method: string, url: string, statusCode: number, duration: number, userId?: string): void {
    const level = statusCode >= 400 ? 'warn' : 'http';
    logger.log(level, `${method} ${url} ${statusCode} - ${duration}ms`, { userId, method, url, statusCode, duration });
  }
}

export default logger;