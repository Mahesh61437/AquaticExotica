/**
 * Advanced API Caching System with localStorage Support
 * Provides efficient browser-based caching for optimal performance
 */

// --- CACHING TOGGLE ---
// Set to false to disable all browser-side caching entirely.
const CACHING_ENABLED = false;

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
      // Skip storage interaction if caching disabled
      if (CACHING_ENABLED && typeof window !== 'undefined') {
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
    if (!CACHING_ENABLED) return;
    
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
    if (!CACHING_ENABLED) return;
    
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
    if (!CACHING_ENABLED) return;
    
    try {
      const now = Date.now();
      let removed = 0;
      
      // Check each cache entry and remove expired ones
      for (const [key, entry] of Array.from(this.cache.entries())) {
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
    
    const cacheKey = buildUrl(url);
    const entryMaxAge = maxAge || this.maxAge;
    
    // Check if we have a valid cache entry
    const entry = CACHING_ENABLED ? this.cache.get(cacheKey) : undefined;
    if (CACHING_ENABLED && entry && Date.now() - entry.timestamp < entry.expiry) {
      // Return cached data immediately
      return entry.data as T;
    }
    
    // Check if we're already fetching this URL
    if (CACHING_ENABLED && this.fetchPromises.has(cacheKey)) {
      return this.fetchPromises.get(cacheKey) as Promise<T>;
    }
    
    // Start a new fetch
    const fetchPromise = fetch(buildUrl(url), options)
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
        
        if (CACHING_ENABLED) {
          this.cache.set(cacheKey, entry);
          this.fetchPromises.delete(cacheKey);
        }
        
        // Save to localStorage
        if (typeof window !== 'undefined') {
          this.saveCacheToLocalStorage();
        }
        
        return data as T;
      })
      .catch(error => {
        if (CACHING_ENABLED) {
          this.fetchPromises.delete(cacheKey);
        }
        throw error;
      });
    
    if (CACHING_ENABLED) {
      this.fetchPromises.set(cacheKey, fetchPromise);
    }
    return fetchPromise;
  }
  
  // Prefetch data and store in cache
  prefetch(url: string, options?: RequestInit, maxAge?: number): Promise<void> {
    // If caching is disabled just perform a normal fetch and ignore result
    if (!CACHING_ENABLED) {
      return fetch(buildUrl(url), options).then(() => {});
    }
    const prefetchMaxAge = maxAge || 30 * 60 * 1000;
    return this.get(url, options, prefetchMaxAge).then(() => {});
  }
  
  // Clear specific entry or entire cache
  async clear(url?: string): Promise<void> {
    await this.waitForReady();
    
    if (CACHING_ENABLED) {
      if (url) {
        this.cache.delete(buildUrl(url));
      } else {
        this.cache.clear();
      }
    }
    
    // Update localStorage
    if (typeof window !== 'undefined') {
      this.saveCacheToLocalStorage();
    }
  }
  
  // Get a fresh copy, bypassing the cache
  async getFresh<T>(url: string, options?: RequestInit): Promise<T> {
    if (CACHING_ENABLED) {
      await this.clear(url);
    }
    return this.get<T>(url, options);
  }
}

// Create a singleton instance
export const apiCache = new ApiCache();

// Function to prefetch only categories for homepage
export function prefetchHomepageData(): Promise<void> {
  // Use a longer cache time for prefetched data (30 minutes)
  const prefetchTTL = 30 * 60 * 1000;
  
  if (!CACHING_ENABLED) return Promise.resolve();
  return apiCache.prefetch('/api/categories', undefined, prefetchTTL)
    .then(() => {
      console.log('Categories data prefetched successfully');
    })
    .catch(error => {
      // Log but don't throw to avoid breaking app startup
      console.error('Failed to prefetch categories data:', error);
    });
}

// Function to clear cache when user logs in/out
export function clearUserDependentCache(): void {
  apiCache.clear('/api/auth/me').catch(err => {
    console.warn('Failed to clear user cache:', err);
  });
}// Base URL for API calls (set via environment variable VITE_API_BASE)
export const API_BASE: string = (typeof import.meta.env.VITE_API_BASE === 'string' && import.meta.env.VITE_API_BASE !== '') ? import.meta.env.VITE_API_BASE.replace(/\/+$/, '') : 'http://127.0.0.1:4000';

// Helper to prepend API_BASE to relative paths
export function buildUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}

