/**
 * Advanced API Caching System with localStorage Support
 * Provides efficient browser-based caching for optimal performance
 */

interface CacheEntry {
  data: any;
  timestamp: number;
  expiry: number;
}

class ApiCache {
  private cache: Map<string, CacheEntry> = new Map();
  private fetchPromises: Map<string, Promise<any>> = new Map();
  private maxAge: number = 10 * 60 * 1000; // 10 minutes default TTL as requested
  private storageKey = 'aquaticexotica_api_cache';
  private isReady: boolean = false;
  private readyPromise: Promise<void>;
  
  constructor() {
    this.readyPromise = this.initialize();
  }
  
  // Initialize the cache
  private async initialize(): Promise<void> {
    try {
      // Only use localStorage in browser
      if (typeof window !== 'undefined') {
        this.loadCacheFromLocalStorage();
        
        // Set up event listener to save cache before page unload
        window.addEventListener('beforeunload', () => {
          this.saveCacheToLocalStorage();
        });
        
        // Set up periodic cleanup of expired entries
        setInterval(() => {
          this.cleanupExpiredEntries();
        }, 60 * 1000); // Run cleanup every minute
      }
      
      this.isReady = true;
    } catch (error) {
      console.error('Failed to initialize API cache:', error);
      this.isReady = true; // Mark as ready even if failed, so we don't block the app
    }
  }
  
  // Save cache to localStorage (browser environment)
  private saveCacheToLocalStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    
    try {
      // Convert Map to array of entries for serialization
      const cacheData = Array.from(this.cache.entries())
        .filter(([_, entry]) => {
          // Only save entries that are still valid
          return Date.now() - entry.timestamp < entry.expiry;
        });
      
      window.localStorage.setItem(this.storageKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to save API cache to localStorage:', error);
    }
  }
  
  // Load cache from localStorage (browser environment)
  private loadCacheFromLocalStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    
    try {
      const storedCache = window.localStorage.getItem(this.storageKey);
      if (!storedCache) return;
      
      const cacheData = JSON.parse(storedCache) as [string, CacheEntry][];
      
      // Filter out expired entries
      const now = Date.now();
      cacheData.forEach(([key, entry]) => {
        if (now - entry.timestamp < entry.expiry) {
          this.cache.set(key, entry);
        }
      });
      
      console.log(`Loaded ${this.cache.size} cached API responses from local storage`);
    } catch (error) {
      console.warn('Failed to load API cache from localStorage:', error);
    }
  }
  
  // Cleanup expired entries from the cache
  private cleanupExpiredEntries(): void {
    try {
      const now = Date.now();
      let removed = 0;
      
      // Check each cache entry and remove expired ones
      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp >= entry.expiry) {
          this.cache.delete(key);
          removed++;
        }
      }
      
      if (removed > 0) {
        // Update localStorage
        this.saveCacheToLocalStorage();
      }
    } catch (error) {
      console.warn('Failed to clean up expired cache entries:', error);
    }
  }
  
  // Wait for the cache to be ready
  async waitForReady(): Promise<void> {
    if (this.isReady) return;
    return this.readyPromise;
  }
  
  // Get data from cache or fetch it
  async get<T>(url: string, options?: RequestInit, maxAge?: number): Promise<T> {
    await this.waitForReady();
    
    const cacheKey = url;
    const entryMaxAge = maxAge || this.maxAge;
    
    // Check if we have a valid cache entry
    const entry = this.cache.get(cacheKey);
    if (entry && Date.now() - entry.timestamp < entry.expiry) {
      // Return cached data immediately
      return entry.data as T;
    }
    
    // Check if we're already fetching this URL
    if (this.fetchPromises.has(cacheKey)) {
      return this.fetchPromises.get(cacheKey) as Promise<T>;
    }
    
    // Start a new fetch
    const fetchPromise = fetch(url, options)
      .then(response => {
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        // Store in memory cache
        const entry: CacheEntry = {
          data,
          timestamp: Date.now(),
          expiry: entryMaxAge
        };
        
        this.cache.set(cacheKey, entry);
        this.fetchPromises.delete(cacheKey);
        
        // Save to localStorage
        if (typeof window !== 'undefined') {
          this.saveCacheToLocalStorage();
        }
        
        return data as T;
      })
      .catch(error => {
        this.fetchPromises.delete(cacheKey);
        throw error;
      });
    
    this.fetchPromises.set(cacheKey, fetchPromise);
    return fetchPromise;
  }
  
  // Prefetch data and store in cache
  prefetch(url: string, options?: RequestInit, maxAge?: number): Promise<void> {
    // Use a longer cache time for prefetched data (30 minutes or the specified maxAge)
    const prefetchMaxAge = maxAge || 30 * 60 * 1000;
    return this.get(url, options, prefetchMaxAge).then(() => {});
  }
  
  // Clear specific entry or entire cache
  async clear(url?: string): Promise<void> {
    await this.waitForReady();
    
    if (url) {
      // Clear specific entry
      this.cache.delete(url);
    } else {
      // Clear entire cache
      this.cache.clear();
    }
    
    // Update localStorage
    if (typeof window !== 'undefined') {
      this.saveCacheToLocalStorage();
    }
  }
  
  // Get a fresh copy, bypassing the cache
  async getFresh<T>(url: string, options?: RequestInit): Promise<T> {
    // Clear any existing cache for this URL
    await this.clear(url);
    
    // Use default maxAge
    return this.get<T>(url, options);
  }
}

// Create a singleton instance
export const apiCache = new ApiCache();

// Function to prefetch all homepage data at once
export function prefetchHomepageData(): Promise<void> {
  // Use a longer cache time for prefetched data (30 minutes)
  const prefetchTTL = 30 * 60 * 1000;
  
  return Promise.all([
    // Prefetch all required homepage data in parallel
    apiCache.prefetch('/api/categories', undefined, prefetchTTL),
    apiCache.prefetch('/api/products/featured', undefined, prefetchTTL),
    apiCache.prefetch('/api/products/trending', undefined, prefetchTTL),
    apiCache.prefetch('/api/products/new', undefined, prefetchTTL),
    apiCache.prefetch('/api/products/sale', undefined, prefetchTTL)
  ]).then(() => {
    console.log('Homepage data prefetched successfully');
  }).catch(error => {
    // Log but don't throw to avoid breaking app startup
    console.error('Failed to prefetch homepage data:', error);
  });
}

// Function to clear cache when user logs in/out
export function clearUserDependentCache(): void {
  apiCache.clear('/api/auth/me').catch(err => {
    console.warn('Failed to clear user cache:', err);
  });
}