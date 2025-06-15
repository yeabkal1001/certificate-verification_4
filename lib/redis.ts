import { createClient, RedisClientType } from 'redis';
import { logger } from './logger';

// Redis client configuration
const redisUrl = process.env.REDIS_URL || 'redis://redis:6379';

// Redis connection options for horizontal scaling
const redisOptions = {
  url: redisUrl,
  socket: {
    reconnectStrategy: (retries: number) => {
      // Exponential backoff with max delay of 10 seconds
      const delay = Math.min(Math.pow(2, retries) * 100, 10000);
      logger.info(`Redis reconnecting in ${delay}ms (attempt ${retries})`);
      return delay;
    },
    connectTimeout: 10000, // 10 seconds
    keepAlive: 5000, // 5 seconds
  },
  // Enable client tracking for better cache invalidation across instances
  clientTrackingOptions: {
    mode: 'on',
  },
};

// Create Redis client with connection pool
const redisClient = createClient(redisOptions);

// Handle Redis connection events
redisClient.on('error', (err) => {
  logger.error('Redis connection error', { error: err.message });
});

redisClient.on('connect', () => {
  logger.info('Redis client connected');
});

redisClient.on('reconnecting', () => {
  logger.info('Redis client reconnecting');
});

redisClient.on('ready', () => {
  logger.info('Redis client ready');
});

// Redis client pool for horizontal scaling
class RedisClientPool {
  private static instance: RedisClientPool;
  private clients: Map<string, RedisClientType> = new Map();
  private maxClients: number = parseInt(process.env.REDIS_MAX_CLIENTS || '10', 10);
  private currentConnections: number = 0;

  private constructor() {}

  public static getInstance(): RedisClientPool {
    if (!RedisClientPool.instance) {
      RedisClientPool.instance = new RedisClientPool();
    }
    return RedisClientPool.instance;
  }

  public async getClient(clientId: string = 'default'): Promise<RedisClientType> {
    // Return existing client if available
    if (this.clients.has(clientId) && this.clients.get(clientId)!.isOpen) {
      return this.clients.get(clientId)!;
    }

    // Create new client if under max limit
    if (this.currentConnections < this.maxClients) {
      const newClient = createClient(redisOptions);
      
      // Connect the client
      await newClient.connect();
      
      // Store the client
      this.clients.set(clientId, newClient);
      this.currentConnections++;
      
      logger.info(`Created new Redis client (${clientId}), total: ${this.currentConnections}`);
      
      return newClient;
    }

    // If at max limit, return the default client
    logger.warn(`Redis client pool at max capacity (${this.maxClients}), using default client`);
    return redisClient;
  }

  public async releaseClient(clientId: string): Promise<void> {
    if (this.clients.has(clientId)) {
      const client = this.clients.get(clientId)!;
      
      // Disconnect the client
      if (client.isOpen) {
        await client.disconnect();
      }
      
      // Remove from pool
      this.clients.delete(clientId);
      this.currentConnections--;
      
      logger.info(`Released Redis client (${clientId}), total: ${this.currentConnections}`);
    }
  }

  public getStats(): { totalClients: number, activeClients: number } {
    return {
      totalClients: this.currentConnections,
      activeClients: this.clients.size
    };
  }
}

// Export Redis client pool
export const redisPool = RedisClientPool.getInstance();

// Connect to Redis
const connectRedis = async (clientId?: string): Promise<RedisClientType> => {
  if (clientId) {
    return redisPool.getClient(clientId);
  }
  
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
  return redisClient;
};

// Cache helper functions
export const cacheUtils = {
  /**
   * Get a value from the cache
   * @param key - Cache key
   * @param clientId - Optional client ID for the Redis pool
   * @returns The cached value or null if not found
   */
  async get<T>(key: string, clientId?: string): Promise<T | null> {
    try {
      const client = await connectRedis(clientId);
      const data = await client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Redis get error', { error, key });
      return null;
    }
  },

  /**
   * Set a value in the cache
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time to live in seconds (optional)
   * @param clientId - Optional client ID for the Redis pool
   */
  async set<T>(key: string, value: T, ttl?: number, clientId?: string): Promise<void> {
    try {
      const client = await connectRedis(clientId);
      const stringValue = JSON.stringify(value);
      
      if (ttl) {
        await client.set(key, stringValue, { EX: ttl });
      } else {
        await client.set(key, stringValue);
      }
      
      // Publish cache update event for other instances
      await client.publish('cache:update', JSON.stringify({ key, action: 'set' }));
    } catch (error) {
      logger.error('Redis set error', { error, key });
    }
  },

  /**
   * Delete a value from the cache
   * @param key - Cache key
   * @param clientId - Optional client ID for the Redis pool
   */
  async del(key: string, clientId?: string): Promise<void> {
    try {
      const client = await connectRedis(clientId);
      await client.del(key);
      
      // Publish cache invalidation event for other instances
      await client.publish('cache:invalidate', JSON.stringify({ key, action: 'del' }));
    } catch (error) {
      logger.error('Redis delete error', { error, key });
    }
  },

  /**
   * Delete multiple values from the cache using a pattern
   * @param pattern - Key pattern to match (e.g., "user:*")
   * @param clientId - Optional client ID for the Redis pool
   */
  async delByPattern(pattern: string, clientId?: string): Promise<void> {
    try {
      const client = await connectRedis(clientId);
      const keys = await client.keys(pattern);
      
      if (keys.length > 0) {
        await client.del(keys);
        logger.info(`Deleted ${keys.length} keys matching pattern: ${pattern}`);
        
        // Publish cache invalidation event for other instances
        await client.publish('cache:invalidate', JSON.stringify({ pattern, action: 'delByPattern' }));
      }
    } catch (error) {
      logger.error('Redis delete by pattern error', { error, pattern });
    }
  },

  /**
   * Check if a key exists in the cache
   * @param key - Cache key
   * @param clientId - Optional client ID for the Redis pool
   * @returns True if the key exists, false otherwise
   */
  async exists(key: string, clientId?: string): Promise<boolean> {
    try {
      const client = await connectRedis(clientId);
      return (await client.exists(key)) === 1;
    } catch (error) {
      logger.error('Redis exists error', { error, key });
      return false;
    }
  },

  /**
   * Get the remaining TTL for a key in seconds
   * @param key - Cache key
   * @param clientId - Optional client ID for the Redis pool
   * @returns TTL in seconds or -1 if the key has no TTL, -2 if the key doesn't exist
   */
  async ttl(key: string, clientId?: string): Promise<number> {
    try {
      const client = await connectRedis(clientId);
      return await client.ttl(key);
    } catch (error) {
      logger.error('Redis TTL error', { error, key });
      return -2;
    }
  },

  /**
   * Increment a counter in Redis
   * @param key - Counter key
   * @param increment - Amount to increment (default: 1)
   * @param clientId - Optional client ID for the Redis pool
   * @returns The new value
   */
  async increment(key: string, increment: number = 1, clientId?: string): Promise<number> {
    try {
      const client = await connectRedis(clientId);
      return await client.incrBy(key, increment);
    } catch (error) {
      logger.error('Redis increment error', { error, key });
      return 0;
    }
  },

  /**
   * Get cache stats
   * @param clientId - Optional client ID for the Redis pool
   * @returns Redis info and pool stats
   */
  async getStats(clientId?: string): Promise<any> {
    try {
      const client = await connectRedis(clientId);
      const redisInfo = await client.info('memory');
      const poolStats = redisPool.getStats();
      
      return {
        redis: redisInfo,
        pool: poolStats
      };
    } catch (error) {
      logger.error('Redis stats error', { error });
      return null;
    }
  },
  
  /**
   * Setup cache invalidation listener for cross-instance coordination
   * This should be called once during application startup
   */
  async setupInvalidationListener(): Promise<void> {
    try {
      // Create a dedicated subscriber client
      const subscriber = createClient(redisOptions);
      await subscriber.connect();
      
      // Subscribe to cache invalidation channel
      await subscriber.subscribe('cache:invalidate', async (message) => {
        try {
          const data = JSON.parse(message);
          logger.info('Received cache invalidation', { data });
          
          if (data.action === 'del' && data.key) {
            // Delete from local cache
            const client = await connectRedis();
            await client.del(data.key);
          } else if (data.action === 'delByPattern' && data.pattern) {
            // Delete by pattern from local cache
            const client = await connectRedis();
            const keys = await client.keys(data.pattern);
            if (keys.length > 0) {
              await client.del(keys);
            }
          }
        } catch (error) {
          logger.error('Error processing cache invalidation', { error, message });
        }
      });
      
      // Subscribe to cache update channel
      await subscriber.subscribe('cache:update', async (message) => {
        logger.debug('Received cache update notification', { message });
      });
      
      logger.info('Cache invalidation listener setup complete');
    } catch (error) {
      logger.error('Failed to setup cache invalidation listener', { error });
    }
  }
};

// Setup cache invalidation listener on module import
cacheUtils.setupInvalidationListener().catch(error => {
  logger.error('Failed to initialize cache invalidation listener', { error });
});

export default redisClient;