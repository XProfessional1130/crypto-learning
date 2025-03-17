import { supabase } from '@/lib/supabase';
import { createServiceClient } from '@/lib/supabase';

// Define cache entry structure
export interface CacheEntry {
  key: string;
  data: any;
  expires_at: string;
  source: string;
}

export class CacheService {
  // Cache sources
  static SOURCES = {
    COIN_MARKET_CAP: 'coinmarketcap',
    DEX_SCREENER: 'dexscreener',
    NEWS: 'news',
    GLOBAL_DATA: 'global_data',
  };

  /**
   * Get data from cache
   * @param key Cache key
   * @param source Source identifier (e.g., 'coinmarketcap')
   * @returns Cached data or null if not found or expired
   */
  static async get<T>(key: string, source: string): Promise<T | null> {
    try {
      // Use the service client for better performance
      const adminClient = createServiceClient();
      
      const { data, error } = await adminClient
        .from('api_cache')
        .select('data, expires_at')
        .eq('key', key)
        .eq('source', source)
        .single();

      if (error || !data) {
        return null;
      }

      // Check if cache has expired
      if (new Date(data.expires_at) < new Date()) {
        // Cache expired, return null
        console.log(`Cache expired for ${source}:${key}`);
        return null;
      }

      return data.data as T;
    } catch (error) {
      console.error(`Error retrieving from cache (${source}:${key}):`, error);
      return null;
    }
  }

  /**
   * Store data in cache
   * @param key Cache key
   * @param data Data to cache
   * @param source Source identifier (e.g., 'coinmarketcap')
   * @param ttlMinutes Time to live in minutes
   */
  static async set(key: string, data: any, source: string, ttlMinutes: number = 15): Promise<void> {
    try {
      // Calculate expiration time
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + ttlMinutes);

      // Use the service client for better performance
      const adminClient = createServiceClient();
      
      const { error } = await adminClient
        .from('api_cache')
        .upsert({
          key,
          data,
          source,
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'key,source' });

      if (error) {
        throw error;
      }
      
      console.log(`Cached ${source}:${key} for ${ttlMinutes} minutes`);
    } catch (error) {
      console.error(`Error storing in cache (${source}:${key}):`, error);
    }
  }

  /**
   * Delete expired cache entries
   * Should be run as a scheduled job
   */
  static async cleanupExpiredEntries(): Promise<number> {
    try {
      // Use the service client for better performance
      const adminClient = createServiceClient();
      
      const { data, error } = await adminClient
        .from('api_cache')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select('key');

      if (error) {
        throw error;
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Error cleaning up expired cache entries:', error);
      return 0;
    }
  }
} 