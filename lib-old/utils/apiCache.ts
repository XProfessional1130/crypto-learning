/**
 * apiCache - Utility for caching API calls to improve performance
 * Provides in-memory caching with TTL (time to live)
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries in the cache
}

class ApiCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private ttl: number;
  private maxSize: number;
  
  constructor(options: CacheOptions = {}) {
    this.ttl = options.ttl || 5 * 60 * 1000; // Default: 5 minutes
    this.maxSize = options.maxSize || 100; // Default: 100 entries
  }
  
  /**
   * Get a value from the cache
   * @param key - Cache key
   * @returns The cached value or undefined if not found or expired
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }
    
    const now = Date.now();
    
    // Check if the entry has expired
    if (now - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }
    
    return entry.data as T;
  }
  
  /**
   * Set a value in the cache
   * @param key - Cache key
   * @param data - Data to cache
   */
  set<T>(key: string, data: T): void {
    // Ensure we don't exceed the maximum cache size
    if (this.cache.size >= this.maxSize) {
      // Remove the oldest entry
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }
  
  /**
   * Delete a value from the cache
   * @param key - Cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Get the number of entries in the cache
   */
  get size(): number {
    return this.cache.size;
  }
}

// Create a singleton instance
const apiCache = new ApiCache();

/**
 * Wrap a fetch call with caching
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @param cacheOptions - Cache options
 * @returns The fetch response
 */
export async function cachedFetch<T>(
  url: string,
  options: RequestInit = {},
  cacheOptions: { ttl?: number; bypassCache?: boolean } = {}
): Promise<T> {
  const { ttl, bypassCache } = cacheOptions;
  
  // Create a cache key from the URL and options
  const cacheKey = `${url}-${JSON.stringify(options)}`;
  
  // Check if we should bypass the cache
  if (!bypassCache) {
    // Try to get from cache
    const cachedData = apiCache.get<T>(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }
  }
  
  // Fetch the data
  const response = await fetch(url, options);
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  // Cache the data
  if (!bypassCache) {
    // If a custom TTL is provided, create a new cache instance with that TTL
    if (ttl) {
      const customCache = new ApiCache({ ttl });
      customCache.set(cacheKey, data);
    } else {
      apiCache.set(cacheKey, data);
    }
  }
  
  return data as T;
}

export default apiCache; 