/**
 * Server-side caching with Redis (Upstash)
 * Provides persistent cache for server-side API calls with TTL support
 */

import { Redis } from "@upstash/redis";

interface CacheEntry {
  data: any;
  timestamp: number;
  expiry: number;
}

class ServerCache {
  private redis: Redis;
  private cache: Map<string, CacheEntry> = new Map();
  private isReady: boolean = false;
  private readyPromise: Promise<void>;
  private defaultTTL: number = 10 * 60 * 1000; // 10 minutes TTL
  private keyPrefix: string = 'aquatic:cache:';
  
  constructor() {
    // Configure Redis using environment variables if available
    const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.REDIS_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    
    if (redisUrl && redisToken) {
      this.redis = new Redis({
        url: redisUrl,
        token: redisToken,
      });
      console.log("[server-cache] Redis initialized with environment variables");
    } else {
      console.warn("[server-cache] Redis credentials not found, using in-memory cache only");
      // Create dummy Redis implementation that just uses memory
      this.redis = {
        get: async () => null,
        set: async () => "OK",
        del: async () => 0,
        keys: async () => [],
        expire: async () => 0,
      } as any;
    }
    
    this.readyPromise = this.initialize();
    
    // Set up periodic cleanup
    setInterval(() => {
      this.cleanupExpiredEntries().catch(err => {
        console.error('[server-cache] Failed to clean up expired cache entries:', err);
      });
    }, 5 * 60 * 1000); // Run every 5 minutes
  }
  
  private async initialize(): Promise<void> {
    try {
      await this.loadFromRedis();
      this.isReady = true;
    } catch (error) {
      console.error('[server-cache] Failed to initialize server cache:', error);
      this.isReady = true; // Mark as ready even on failure to not block
    }
  }
  
  private async loadFromRedis(): Promise<void> {
    try {
      // Get all cache keys
      const pattern = `${this.keyPrefix}*`;
      let keys: string[] = [];
      
      try {
        keys = await this.redis.keys(pattern);
      } catch (err) {
        console.warn('[server-cache] Error listing cache keys:', err);
        return;
      }
      
      const now = Date.now();
      let loadedCount = 0;
      
      for (const redisKey of keys) {
        try {
          const entryStr = await this.redis.get(redisKey);
          
          if (typeof entryStr === 'string') {
            try {
              const entry = JSON.parse(entryStr) as CacheEntry;
              const key = redisKey.replace(this.keyPrefix, '');
              
              // Check if expired
              if (now - entry.timestamp < entry.expiry) {
                this.cache.set(key, entry);
                loadedCount++;
              } else {
                // Expired, delete it
                try {
                  await this.redis.del(redisKey);
                } catch (err) {
                  // Ignore deletion errors
                }
              }
            } catch (err) {
              // Skip invalid JSON
              console.warn(`[server-cache] Invalid cache entry for ${redisKey}:`, err);
            }
          }
        } catch (err) {
          // Skip errors
          console.warn(`[server-cache] Error retrieving key ${redisKey}:`, err);
        }
      }
      
      console.log(`[server-cache] Loaded ${loadedCount} cached responses from Redis`);
    } catch (error) {
      console.warn('[server-cache] Failed to load cache from Redis:', error);
    }
  }
  
  private async cleanupExpiredEntries(): Promise<void> {
    try {
      // Get all cache keys
      const pattern = `${this.keyPrefix}*`;
      let keys: string[] = [];
      
      try {
        keys = await this.redis.keys(pattern);
      } catch (err) {
        console.warn('[server-cache] Error listing cache keys:', err);
        return;
      }
      
      const now = Date.now();
      let deletedCount = 0;
      
      for (const redisKey of keys) {
        try {
          const entryStr = await this.redis.get(redisKey);
          
          if (typeof entryStr === 'string') {
            try {
              const entry = JSON.parse(entryStr) as CacheEntry;
              
              // Check if expired
              if (now - entry.timestamp >= entry.expiry) {
                // Expired, delete it
                try {
                  await this.redis.del(redisKey);
                  deletedCount++;
                } catch (err) {
                  // Ignore deletion errors
                }
              }
            } catch (err) {
              // Invalid JSON, delete it
              try {
                await this.redis.del(redisKey);
                deletedCount++;
              } catch (delErr) {
                // Ignore deletion errors
              }
            }
          }
        } catch (err) {
          // Skip errors
        }
      }
      
      if (deletedCount > 0) {
        console.log(`[server-cache] Cleaned up ${deletedCount} expired cache entries`);
      }
    } catch (error) {
      console.warn('[server-cache] Failed to clean up expired entries:', error);
    }
  }
  
  // Set a cache entry with optional TTL
  async set(key: string, data: any, ttl: number = this.defaultTTL): Promise<void> {
    await this.waitForReady();
    
    try {
      const entry: CacheEntry = {
        data,
        timestamp: Date.now(),
        expiry: ttl
      };
      
      // Update in-memory cache
      this.cache.set(key, entry);
      
      // Save to Redis
      const redisKey = `${this.keyPrefix}${key}`;
      try {
        // Save entry with JSON
        await this.redis.set(redisKey, JSON.stringify(entry));
        
        // Set expiration in Redis
        const expirySeconds = Math.ceil(ttl / 1000);
        await this.redis.expire(redisKey, expirySeconds);
      } catch (err) {
        console.warn(`[server-cache] Failed to save cache entry to Redis:`, err);
      }
    } catch (error) {
      console.warn(`[server-cache] Failed to cache '${key}':`, error);
    }
  }
  
  // Get a cache entry if it exists and is not expired
  async get<T>(key: string): Promise<T | null> {
    await this.waitForReady();
    
    // Check in-memory cache first
    const entry = this.cache.get(key);
    if (entry && Date.now() - entry.timestamp < entry.expiry) {
      return entry.data as T;
    }
    
    // If not in memory, check Redis
    try {
      const redisKey = `${this.keyPrefix}${key}`;
      const entryStr = await this.redis.get(redisKey);
      
      if (typeof entryStr === 'string') {
        try {
          const entry = JSON.parse(entryStr) as CacheEntry;
          
          // Check if expired
          if (Date.now() - entry.timestamp < entry.expiry) {
            // Update in-memory cache and return
            this.cache.set(key, entry);
            return entry.data as T;
          } else {
            // Expired, delete from Redis
            try {
              await this.redis.del(redisKey);
            } catch (err) {
              // Ignore deletion errors
            }
          }
        } catch (err) {
          // Invalid JSON
          console.warn(`[server-cache] Invalid cache entry for ${key}:`, err);
        }
      }
    } catch (error) {
      console.warn(`[server-cache] Failed to get '${key}' from Redis:`, error);
    }
    
    return null;
  }
  
  // Delete a cache entry
  async delete(key: string): Promise<void> {
    await this.waitForReady();
    
    // Remove from in-memory cache
    this.cache.delete(key);
    
    // Remove from Redis
    try {
      const redisKey = `${this.keyPrefix}${key}`;
      await this.redis.del(redisKey);
    } catch (error) {
      console.warn(`[server-cache] Failed to delete '${key}' from Redis:`, error);
    }
  }
  
  // Clear all cache entries
  async clear(): Promise<void> {
    await this.waitForReady();
    
    // Clear in-memory cache
    this.cache.clear();
    
    // Clear all from Redis
    try {
      const pattern = `${this.keyPrefix}*`;
      const keys = await this.redis.keys(pattern);
      
      for (const redisKey of keys) {
        try {
          await this.redis.del(redisKey);
        } catch (err) {
          // Ignore deletion errors
        }
      }
    } catch (error) {
      console.warn('[server-cache] Failed to clear cache from Redis:', error);
    }
  }
  
  // Wait for the cache to be ready
  async waitForReady(): Promise<void> {
    if (this.isReady) return;
    return this.readyPromise;
  }
  
  // Helper to get or set cache entries
  async getOrSet<T>(key: string, fetchFn: () => Promise<T>, ttl: number = this.defaultTTL): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }
    
    // Not in cache, fetch fresh data
    console.log(`[cache-miss] Fetching fresh ${key} data`);
    const data = await fetchFn();
    
    // Cache for next time
    await this.set(key, data, ttl);
    
    return data;
  }
}

// Create singleton instance
export const serverCache = new ServerCache();