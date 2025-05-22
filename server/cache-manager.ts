/**
 * Server-side caching with Replit Database
 * Provides persistent cache for server-side API calls with TTL support
 */

import Client from '@replit/database';

interface CacheEntry {
  data: any;
  timestamp: number;
  expiry: number;
}

class ServerCache {
  private db: Client;
  private cache: Map<string, CacheEntry> = new Map();
  private isReady: boolean = false;
  private readyPromise: Promise<void>;
  private defaultTTL: number = 10 * 60 * 1000; // 10 minutes TTL

  constructor() {
    this.db = new Client();
    this.readyPromise = this.initialize();
    
    // Set up periodic cleanup
    setInterval(() => {
      this.cleanupExpiredEntries().catch(err => {
        console.error('Failed to clean up expired cache entries:', err);
      });
    }, 5 * 60 * 1000); // Run every 5 minutes
  }

  private async initialize(): Promise<void> {
    try {
      // Load existing cache
      await this.loadFromDatabase();
      this.isReady = true;
    } catch (error) {
      console.error('Failed to initialize server cache:', error);
      this.isReady = true; // Mark as ready even on failure to not block
    }
  }

  private async loadFromDatabase(): Promise<void> {
    try {
      // Get all cache keys
      let keys: string[] = [];
      try {
        const keysResult = await this.db.list('srv_cache:');
        if (Array.isArray(keysResult)) {
          keys = keysResult;
        }
      } catch (err) {
        console.warn('[server-cache] Error listing cache keys:', err);
        return;
      }
      
      const now = Date.now();
      let loadedCount = 0;
      
      for (const dbKey of keys) {
        // Check if this entry is expired
        let expiryStr: unknown;
        try {
          expiryStr = await this.db.get(`srv_expire:${dbKey}`);
        } catch (err) {
          continue; // Skip if can't get expiry
        }
        
        const expiry = typeof expiryStr === 'string' ? parseInt(expiryStr, 10) : 0;
        
        if (expiry && now > expiry) {
          // Expired, delete it
          try {
            await this.db.delete(dbKey);
            await this.db.delete(`srv_expire:${dbKey}`);
          } catch (err) {
            // Ignore deletion errors
          }
          continue;
        }
        
        // Not expired, load it
        let entryStr: unknown;
        try {
          entryStr = await this.db.get(dbKey);
        } catch (err) {
          continue; // Skip if can't get entry
        }
        
        if (typeof entryStr === 'string') {
          try {
            const entry = JSON.parse(entryStr) as CacheEntry;
            const key = dbKey.replace('srv_cache:', '');
            
            // Double-check expiry based on the entry's timestamp + expiry
            if (now - entry.timestamp < entry.expiry) {
              this.cache.set(key, entry);
              loadedCount++;
            } else {
              // Expired, delete it
              try {
                await this.db.delete(dbKey);
                await this.db.delete(`srv_expire:${dbKey}`);
              } catch (err) {
                // Ignore deletion errors
              }
            }
          } catch (err) {
            // Skip invalid JSON
            console.warn(`[server-cache] Invalid cache entry for ${dbKey}:`, err);
          }
        }
      }
      
      console.log(`[server-cache] Loaded ${loadedCount} cached responses from Replit Database`);
    } catch (error) {
      console.warn('[server-cache] Failed to load cache from database:', error);
    }
  }

  private async cleanupExpiredEntries(): Promise<void> {
    try {
      const now = Date.now();
      let expireKeys: string[] = [];
      try {
        const keysResult = await this.db.list('srv_expire:');
        if (Array.isArray(keysResult)) {
          expireKeys = keysResult;
        }
      } catch (err) {
        console.warn('[server-cache] Error listing expire keys:', err);
        return;
      }
      
      let deletedCount = 0;
      
      for (const expireKey of expireKeys) {
        let expiryStr: unknown;
        try {
          expiryStr = await this.db.get(expireKey);
        } catch (err) {
          continue; // Skip if can't get expiry
        }
        
        const expiry = typeof expiryStr === 'string' ? parseInt(expiryStr, 10) : 0;
        
        if (now > expiry) {
          // Expired, delete it and its associated cache entry
          const cacheKey = expireKey.replace('srv_expire:', 'srv_cache:');
          try {
            await this.db.delete(cacheKey);
            await this.db.delete(expireKey);
            deletedCount++;
          } catch (err) {
            // Ignore deletion errors
          }
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
      
      // Save to database
      const dbKey = `srv_cache:${key}`;
      try {
        await this.db.set(dbKey, JSON.stringify(entry));
        
        // Set expiration
        const expiresAt = entry.timestamp + entry.expiry;
        await this.db.set(`srv_expire:${dbKey}`, expiresAt.toString());
      } catch (err) {
        console.warn(`[server-cache] Failed to save cache entry to DB:`, err);
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
    
    // If not in memory, check database
    try {
      const dbKey = `srv_cache:${key}`;
      let entryStr: unknown;
      try {
        entryStr = await this.db.get(dbKey);
      } catch (err) {
        return null; // Can't get entry
      }
      
      if (typeof entryStr === 'string') {
        try {
          const entry = JSON.parse(entryStr) as CacheEntry;
          
          // Check if expired
          if (Date.now() - entry.timestamp < entry.expiry) {
            // Update in-memory cache and return
            this.cache.set(key, entry);
            return entry.data as T;
          } else {
            // Expired, delete from database
            try {
              await this.db.delete(dbKey);
              await this.db.delete(`srv_expire:${dbKey}`);
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
      console.warn(`[server-cache] Failed to get '${key}' from database:`, error);
    }
    
    return null;
  }
  
  // Delete a cache entry
  async delete(key: string): Promise<void> {
    await this.waitForReady();
    
    // Remove from in-memory cache
    this.cache.delete(key);
    
    // Remove from database
    try {
      const dbKey = `srv_cache:${key}`;
      try {
        await this.db.delete(dbKey);
        await this.db.delete(`srv_expire:${dbKey}`);
      } catch (err) {
        console.warn(`[server-cache] Failed to delete cache entry from DB:`, err);
      }
    } catch (error) {
      console.warn(`[server-cache] Failed to delete '${key}' from database:`, error);
    }
  }
  
  // Clear all cache entries
  async clear(): Promise<void> {
    await this.waitForReady();
    
    // Clear in-memory cache
    this.cache.clear();
    
    // Clear all from database
    try {
      let cacheKeys: string[] = [];
      try {
        const keysResult = await this.db.list('srv_cache:');
        if (Array.isArray(keysResult)) {
          cacheKeys = keysResult;
        }
      } catch (err) {
        console.warn('[server-cache] Error listing cache keys:', err);
        return;
      }
      
      for (const key of cacheKeys) {
        try {
          await this.db.delete(key);
          await this.db.delete(`srv_expire:${key}`);
        } catch (err) {
          // Ignore deletion errors
        }
      }
    } catch (error) {
      console.warn('[server-cache] Failed to clear cache from database:', error);
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
    const data = await fetchFn();
    
    // Cache for next time
    await this.set(key, data, ttl);
    
    return data;
  }
}

// Create singleton instance
export const serverCache = new ServerCache();