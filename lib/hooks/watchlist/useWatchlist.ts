import { useState, useEffect, useCallback, useRef } from 'react';
import { CoinData } from '@/types/portfolio';
import { useWatchlistData } from './useWatchlistData';
import { usePriceData } from './usePriceData';
import { logger } from '@/lib/utils/logger';

// Define watchlist item type
export interface WatchlistItem {
  id: string;
  coinId: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  icon: string;
  priceTarget?: number;
  createdAt?: string;
}

/**
 * useWatchlist - Main hook for managing a user's coin watchlist
 * Combines database operations and price data fetching
 */
export function useWatchlist() {
  // Use specialized hooks
  const {
    watchlistItems: dbItems,
    isLoading: isDbLoading,
    error: dbError,
    fetchWatchlist,
    addToWatchlist: addToWatchlistDB,
    removeFromWatchlist,
    updatePriceTarget
  } = useWatchlistData();
  
  const {
    fetchPrices,
    isLoading: isPriceLoading,
    error: priceError
  } = usePriceData();
  
  // State management
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Refs for tracking async operations
  const isMounted = useRef(true);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Merge error states from specialized hooks
  useEffect(() => {
    if (dbError) {
      setError(dbError);
    } else if (priceError) {
      setError(priceError);
    } else {
      setError(null);
    }
  }, [dbError, priceError]);
  
  // Merge loading states from specialized hooks
  useEffect(() => {
    setIsLoading(isDbLoading || isPriceLoading);
  }, [isDbLoading, isPriceLoading]);
  
  // Refresh prices for watchlist items
  const refreshPrices = useCallback(async () => {
    if (dbItems.length === 0) return;
    
    // Extract coin IDs from watchlist items
    const coinIds = dbItems.map(item => item.coinId);
    
    try {
      // Fetch latest prices
      const priceMap = await fetchPrices(coinIds);
      
      if (isMounted.current) {
        // Update watchlist items with latest prices
        setWatchlistItems(dbItems.map(item => {
          const coinData = priceMap.get(item.coinId);
          
          if (coinData) {
            return {
              ...item,
              price: coinData.price,
              change24h: coinData.percentChange24h,
              icon: coinData.image || ''
            };
          }
          
          // Keep existing data if no price update
          return item;
        }));
      }
    } catch (err) {
      logger.error('Error refreshing prices', { error: err });
      if (isMounted.current) {
        setError(err instanceof Error ? err : new Error('Failed to refresh prices'));
      }
    }
  }, [dbItems, fetchPrices]);
  
  // Add coin to watchlist with price target
  const addToWatchlist = useCallback(async (coin: CoinData, priceTarget: number) => {
    try {
      // Create watchlist item from coin data
      const newItem = {
        coinId: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        price: coin.price,
        change24h: coin.percentChange24h,
        icon: coin.image || '',
        priceTarget
      };
      
      // Add to database
      await addToWatchlistDB(newItem);
      
      // Refresh watchlist to get updated data
      await fetchWatchlist();
      
      // Refresh prices
      await refreshPrices();
      
      return true;
    } catch (err) {
      logger.error('Error adding to watchlist', { error: err });
      setError(err instanceof Error ? err : new Error('Failed to add to watchlist'));
      return false;
    }
  }, [addToWatchlistDB, fetchWatchlist, refreshPrices]);
  
  // Calculate target percentage for a watchlist item
  const getTargetPercentage = useCallback((item: WatchlistItem): number => {
    if (!item.priceTarget || item.price <= 0) return 0;
    return ((item.priceTarget - item.price) / item.price) * 100;
  }, []);
  
  // Check if a coin is in the watchlist
  const isInWatchlist = useCallback((coinId: string): boolean => {
    return watchlistItems.some(item => item.coinId === coinId);
  }, [watchlistItems]);
  
  // Setup periodic refresh
  useEffect(() => {
    // Initial refresh
    refreshPrices();
    
    // Set up interval for periodic refresh
    const refreshInterval = 60000; // 1 minute
    refreshTimerRef.current = setInterval(refreshPrices, refreshInterval);
    
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [refreshPrices]);
  
  // Update watchlist when DB items change
  useEffect(() => {
    refreshPrices();
  }, [dbItems, refreshPrices]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, []);
  
  return {
    watchlistItems,
    isLoading,
    error,
    refreshWatchlist: fetchWatchlist,
    refreshPrices,
    addToWatchlist,
    removeFromWatchlist,
    updatePriceTarget,
    isInWatchlist,
    getTargetPercentage
  };
} 