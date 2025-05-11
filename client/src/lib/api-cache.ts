/**
 * Enhanced API Caching and Prefetching Utility 
 * Optimizes API calls with advanced caching and prefetching strategies
 */

interface CacheEntry {
  data: any;
  timestamp: number;
  expiry: number;
}

class ApiCache {
  private cache: Map<string, CacheEntry> = new Map();
  private fetchPromises: Map<string, Promise<any>> = new Map();
  private maxAge: number = 5 * 60 * 1000; // 5 minutes default
  private storageKey = 'aquaticexotica_api_cache';
  
  constructor() {
    // Load cache from localStorage on initialization
    this.loadCacheFromStorage();
    
    // Set up event listener to save cache before page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.saveCacheToStorage();
      });
    }
  }
  
  // Save cache to localStorage
  private saveCacheToStorage(): void {
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
  
  // Load cache from localStorage
  private loadCacheFromStorage(): void {
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
      
      console.log(`Loaded ${this.cache.size} cached API responses from storage`);
    } catch (error) {
      console.warn('Failed to load API cache from localStorage:', error);
    }
  }
  
  // Get data from cache or fetch it
  async get<T>(url: string, options?: RequestInit, maxAge?: number): Promise<T> {
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
        // Store in cache
        this.cache.set(cacheKey, {
          data,
          timestamp: Date.now(),
          expiry: entryMaxAge
        });
        this.fetchPromises.delete(cacheKey);
        
        // Save to localStorage after important cache updates
        if (url.includes('/categories') || url.includes('/products')) {
          this.saveCacheToStorage();
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
  
  // Prefetch data and store in cache (with a longer maxAge for prefetched data)
  prefetch(url: string, options?: RequestInit, maxAge?: number): Promise<void> {
    // Use a longer cache time for prefetched data (30 minutes)
    const prefetchMaxAge = maxAge || 30 * 60 * 1000;
    return this.get(url, options, prefetchMaxAge).then(() => {});
  }
  
  // Clear specific entry or entire cache
  clear(url?: string): void {
    if (url) {
      this.cache.delete(url);
    } else {
      this.cache.clear();
    }
    
    // Update localStorage
    this.saveCacheToStorage();
  }
  
  // Get a fresh copy, bypassing the cache
  async getFresh<T>(url: string, options?: RequestInit): Promise<T> {
    // Clear any existing cache for this URL
    this.clear(url);
    
    // Use default maxAge
    return this.get<T>(url, options);
  }
}

// Create a singleton instance
export const apiCache = new ApiCache();

// Function to prefetch all homepage data at once
export function prefetchHomepageData(): Promise<void> {
  return Promise.all([
    // Only prefetch categories and not the products since we're not showing them on the homepage anymore
    apiCache.prefetch('/api/categories', undefined, 60 * 60 * 1000), // 1 hour cache
  ]).then(() => {
    console.log('Homepage data prefetched successfully');
  });
}

// Function to clear cache when user logs in/out (useful for personalized content)
export function clearUserDependentCache(): void {
  apiCache.clear('/api/auth/me');
  // Add other user-dependent endpoints here
}