import { createClient } from 'redis';
import { logger } from './logger';

// Redis configuration based on environment
const redisConfig = {
  development: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD || '',
  },
  production: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD || '',
  }
};

const env = process.env.NODE_ENV || 'development';
const config = redisConfig[env as keyof typeof redisConfig];

// Create Redis client
const redisClient = createClient({
  url: config.url,
  password: config.password,
});

// Handle Redis client events
redisClient.on('error', (err) => {
  logger.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  logger.info('Redis Client Connected');
});

redisClient.on('ready', () => {
  logger.info('Redis Client Ready');
});

// Cache middleware
export const cacheMiddleware = async (req: any, res: any, next: any) => {
  if (req.method !== 'GET') {
    return next();
  }

  const key = getCacheKey(req);

  try {
    const cachedData = await redisClient.get(key);
    if (cachedData) {
      logger.debug(`Cache hit for key: ${key}`);
      return res.json(JSON.parse(cachedData));
    }

    logger.debug(`Cache miss for key: ${key}`);

    // Store original res.json
    const originalJson = res.json;
    res.json = function(data: any) {
      // Cache the response for 10 minutes
      redisClient.setEx(key, 600, JSON.stringify(data))
        .then(() => logger.debug(`Cached response for key: ${key}`))
        .catch(err => logger.error(`Error caching response for key ${key}:`, err));
      return originalJson.call(this, data);
    };

    next();
  } catch (error) {
    logger.error('Cache Error:', error);
    next();
  }
};

// Cache invalidation functions
export const invalidateProductCache = async () => {
  try {
    // Get all product-related cache keys
    const keys = await redisClient.keys('cache:/api/products*');
    if (keys.length > 0) {
      // Delete all product-related cache entries
      await redisClient.del(keys);
      logger.info(`Invalidated ${keys.length} product cache entries`);
    }
  } catch (error) {
    logger.error('Error invalidating product cache:', error);
  }
};

export const invalidateCategoryCache = async () => {
  try {
    // Get all category-related cache keys
    const keys = await redisClient.keys('cache:/api/categories*');
    if (keys.length > 0) {
      // Delete all category-related cache entries
      await redisClient.del(keys);
      logger.info(`Invalidated ${keys.length} category cache entries`);
    }
  } catch (error) {
    logger.error('Error invalidating category cache:', error);
  }
};

// Helper function to get cache key for a request
export const getCacheKey = (req: any) => {
  // Base key from URL
  const baseKey = `cache:${req.originalUrl}`;
  
  // Add query parameters to key if they exist
  const queryParams = req.query;
  if (Object.keys(queryParams).length > 0) {
    // Sort query parameters to ensure consistent cache keys
    const sortedParams = Object.keys(queryParams)
      .sort()
      .map(key => `${key}=${queryParams[key]}`)
      .join('&');
    return `${baseKey}?${sortedParams}`;
  }
  
  return baseKey;
};

// Initialize Redis connection
export const initRedis = async () => {
  try {
    await redisClient.connect();
    logger.info('Redis connection initialized');
  } catch (error) {
    logger.error('Failed to initialize Redis connection:', error);
    process.exit(1);
  }
};

export default redisClient; 