import redisService from './redis';
import { LoggerService } from './logger';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
}

export class CacheService {
  private static readonly DEFAULT_TTL = 3600; // 1 hour
  private static readonly PREFIX = 'fotoljay:';

  static async get<T>(key: string): Promise<T | null> {
    try {
      const fullKey = this.getFullKey(key);
      const data = await redisService.get(fullKey);

      if (!data) return null;

      const parsed = JSON.parse(data);
      LoggerService.debug(`Cache hit for key: ${key}`);
      return parsed;
    } catch (error) {
      LoggerService.logError(error as Error, 'CacheService.get');
      return null;
    }
  }

  static async set(key: string, value: any, options: CacheOptions = {}): Promise<void> {
    try {
      const fullKey = this.getFullKey(key, options.prefix);
      const ttl = options.ttl || this.DEFAULT_TTL;

      await redisService.set(fullKey, value, ttl);
      LoggerService.debug(`Cache set for key: ${key} with TTL: ${ttl}s`);
    } catch (error) {
      LoggerService.logError(error as Error, 'CacheService.set');
    }
  }

  static async del(key: string, prefix?: string): Promise<void> {
    try {
      const fullKey = this.getFullKey(key, prefix);
      await redisService.del(fullKey);
      LoggerService.debug(`Cache deleted for key: ${key}`);
    } catch (error) {
      LoggerService.logError(error as Error, 'CacheService.del');
    }
  }

  static async exists(key: string, prefix?: string): Promise<boolean> {
    try {
      const fullKey = this.getFullKey(key, prefix);
      return await redisService.exists(fullKey);
    } catch (error) {
      LoggerService.logError(error as Error, 'CacheService.exists');
      return false;
    }
  }

  static async expire(key: string, ttl: number, prefix?: string): Promise<void> {
    try {
      const fullKey = this.getFullKey(key, prefix);
      // Utiliser set avec TTL pour simuler expire
      const currentValue = await redisService.get(fullKey);
      if (currentValue !== null) {
        await redisService.set(fullKey, currentValue, ttl);
      }
      LoggerService.debug(`Cache expiration set for key: ${key} to ${ttl}s`);
    } catch (error) {
      LoggerService.logError(error as Error, 'CacheService.expire');
    }
  }

  // Méthodes spécifiques à l'application
  static async getUserProfile(userId: string) {
    return this.get(`user:profile:${userId}`);
  }

  static async setUserProfile(userId: string, profile: any) {
    return this.set(`user:profile:${userId}`, profile, { ttl: 1800 });
  }

  static async getProduct(productId: string) {
    return this.get(`product:${productId}`);
  }

  static async setProduct(productId: string, product: any) {
    return this.set(`product:${productId}`, product, { ttl: 3600 });
  }

  static async invalidateUserCache(userId: string): Promise<void> {
    const keys = [
      `user:profile:${userId}`,
      `user:products:${userId}`,
      `user:stats:${userId}`
    ];

    for (const key of keys) {
      await this.del(key);
    }
  }

  static async invalidateProductCache(productId: string): Promise<void> {
    const keys = [
      `product:${productId}`,
      `product:views:${productId}`,
      `product:similar:${productId}`
    ];

    for (const key of keys) {
      await this.del(key);
    }
  }

  static async getProductsList(filters: any, page: number = 1, limit: number = 20) {
    const cacheKey = `products:list:${JSON.stringify(filters)}:page${page}:limit${limit}`;
    return this.get(cacheKey);
  }

  static async setProductsList(filters: any, page: number, limit: number, products: any) {
    const cacheKey = `products:list:${JSON.stringify(filters)}:page${page}:limit${limit}`;
    return this.set(cacheKey, products, { ttl: 600 });
  }

  static async getSearchResults(query: string, filters: any) {
    const cacheKey = `search:${query}:${JSON.stringify(filters)}`;
    return this.get(cacheKey);
  }

  static async setSearchResults(query: string, filters: any, results: any) {
    const cacheKey = `search:${query}:${JSON.stringify(filters)}`;
    return this.set(cacheKey, results, { ttl: 300 });
  }

  // Cache pour les statistiques
  static async getStats(type: string, period: string) {
    return this.get(`stats:${type}:${period}`);
  }

  static async setStats(type: string, period: string, data: any) {
    return this.set(`stats:${type}:${period}`, data, { ttl: 1800 });
  }

  // Nettoyer le cache par pattern
  static async clearPattern(pattern: string): Promise<void> {
    try {
      // Cette méthode nécessiterait une implémentation plus avancée avec Redis SCAN
      // Pour l'instant, on log juste l'intention
      LoggerService.info(`Cache clear requested for pattern: ${pattern}`);
    } catch (error) {
      LoggerService.logError(error as Error, 'CacheService.clearPattern');
    }
  }

  private static getFullKey(key: string, customPrefix?: string): string {
    const prefix = customPrefix || this.PREFIX;
    return `${prefix}${key}`;
  }

  // Warm up cache for frequently accessed data
  static async warmupCache(): Promise<void> {
    try {
      LoggerService.info('Starting cache warmup...');

      // TODO: Implémenter le préchargement des données fréquemment accédées
      // - Produits populaires
      // - Catégories principales
      // - Statistiques générales

      LoggerService.info('Cache warmup completed');
    } catch (error) {
      LoggerService.logError(error as Error, 'CacheService.warmupCache');
    }
  }
}