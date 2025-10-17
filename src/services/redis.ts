import { createClient, RedisClientType } from 'redis';

class RedisService {
  private client: RedisClientType;
  private isConnected: boolean = false;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      console.log('Redis connected successfully');
      this.isConnected = true;
    });

    this.client.on('disconnect', () => {
      console.log('Redis disconnected');
      this.isConnected = false;
    });
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      try {
        await this.client.connect();
      } catch (error) {
        console.warn('Redis connection failed, continuing without Redis:', (error as Error).message);
      }
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.disconnect();
    }
  }

  // Cache methods
  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!this.isConnected) return;

    try {
      const serializedValue = JSON.stringify(value);
      if (ttl) {
        await this.client.setEx(key, ttl, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    if (!this.isConnected) return null;

    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isConnected) return;

    try {
      await this.client.del(key);
    } catch (error) {
      console.error('Redis del error:', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isConnected) return false;

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  }

  // Session management
  async setSession(sessionId: string, data: any, ttl: number = 3600): Promise<void> {
    const key = `session:${sessionId}`;
    await this.set(key, data, ttl);
  }

  async getSession(sessionId: string): Promise<any> {
    const key = `session:${sessionId}`;
    return await this.get(key);
  }

  async deleteSession(sessionId: string): Promise<void> {
    const key = `session:${sessionId}`;
    await this.del(key);
  }

  // Cache for API responses
  async setCache(key: string, data: any, ttl: number = 300): Promise<void> {
    const cacheKey = `cache:${key}`;
    await this.set(cacheKey, data, ttl);
  }

  async getCache<T = any>(key: string): Promise<T | null> {
    const cacheKey = `cache:${key}`;
    return await this.get<T>(cacheKey);
  }

  async invalidateCache(pattern: string): Promise<void> {
    if (!this.isConnected) return;

    try {
      // Simple pattern matching (in production, use SCAN for better performance)
      const keys = await this.client.keys(`cache:${pattern}*`);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      console.error('Redis invalidate cache error:', error);
    }
  }

  // Rate limiting
  async checkRateLimit(identifier: string, limit: number, window: number): Promise<boolean> {
    if (!this.isConnected) return true; // Allow if Redis is down

    try {
      const key = `ratelimit:${identifier}`;
      const current = await this.client.incr(key);

      if (current === 1) {
        await this.client.expire(key, window);
      }

      return current <= limit;
    } catch (error) {
      console.error('Redis rate limit error:', error);
      return true; // Allow on error
    }
  }

  // User online status
  async setUserOnline(userId: string): Promise<void> {
    const key = `user:online:${userId}`;
    await this.set(key, { online: true, lastSeen: new Date() }, 300); // 5 minutes
  }

  async setUserOffline(userId: string): Promise<void> {
    const key = `user:online:${userId}`;
    await this.del(key);
  }

  async isUserOnline(userId: string): Promise<boolean> {
    const key = `user:online:${userId}`;
    const data = await this.get(key);
    return !!data;
  }

  async getOnlineUsers(): Promise<string[]> {
    if (!this.isConnected) return [];

    try {
      const keys = await this.client.keys('user:online:*');
      return keys.map(key => key.replace('user:online:', ''));
    } catch (error) {
      console.error('Redis get online users error:', error);
      return [];
    }
  }

  // Analytics counters
  async incrementCounter(key: string, amount: number = 1): Promise<void> {
    if (!this.isConnected) return;

    try {
      const counterKey = `counter:${key}`;
      await this.client.incrBy(counterKey, amount);
    } catch (error) {
      console.error('Redis increment counter error:', error);
    }
  }

  async getCounter(key: string): Promise<number> {
    if (!this.isConnected) return 0;

    try {
      const counterKey = `counter:${key}`;
      const value = await this.client.get(counterKey);
      return value ? parseInt(value, 10) : 0;
    } catch (error) {
      console.error('Redis get counter error:', error);
      return 0;
    }
  }

  // Lock mechanism for critical operations
  async acquireLock(lockKey: string, ttl: number = 30): Promise<boolean> {
    if (!this.isConnected) return true;

    try {
      const result = await this.client.set(lockKey, 'locked', {
        NX: true,
        EX: ttl,
      });
      return result === 'OK';
    } catch (error) {
      console.error('Redis acquire lock error:', error);
      return false;
    }
  }

  async releaseLock(lockKey: string): Promise<void> {
    if (!this.isConnected) return;

    try {
      await this.client.del(lockKey);
    } catch (error) {
      console.error('Redis release lock error:', error);
    }
  }
}

// Export singleton instance
export const redisService = new RedisService();
export default redisService;