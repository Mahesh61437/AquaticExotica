/**
 * API Caching and Prefetching Utility 
 * Helps optimize API calls by caching results and allowing prefetching
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
  
  // Get data from cache or fetch it
  async get<T>(url: string, options?: RequestInit, maxAge?: number): Promise<T> {
    const cacheKey = url;
    const entryMaxAge = maxAge || this.maxAge;
    
    // Check if we have a valid cache entry
    const entry = this.cache.get(cacheKey);
    if (entry && Date.now() - entry.timestamp < entry.expiry) {
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
    return this.get(url, options, maxAge).then(() => {});
  }
  
  // Clear specific entry or entire cache
  clear(url?: string): void {
    if (url) {
      this.cache.delete(url);
    } else {
      this.cache.clear();
    }
  }
}

// Create a singleton instance
export const apiCache = new ApiCache();

// Function to prefetch all homepage data at once
export function prefetchHomepageData(): Promise<void> {
  return Promise.all([
    apiCache.prefetch('/api/categories'),
    apiCache.prefetch('/api/products/featured'),
    apiCache.prefetch('/api/products/trending'),
    apiCache.prefetch('/api/products/new'),
    apiCache.prefetch('/api/products/sale')
  ]).then(() => {});
}