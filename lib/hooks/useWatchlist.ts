import { useState, useEffect, useCallback } from 'react';
import { CoinData } from '@/types/portfolio';
import { useAuth } from '@/lib/auth-context';
import { 
  fetchWatchlist as fetchWatchlistFromDB, 
  addToWatchlist as addToWatchlistInDB,
  updatePriceTarget as updatePriceTargetInDB,
  removeFromWatchlist as removeFromWatchlistInDB
} from '@/lib/services/watchlist';
import { getMultipleCoinsData } from '@/lib/services/coinmarketcap';

// Define watchlist item type
export interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  icon: string;
  priceTarget?: number;
  createdAt?: string;
}

/**
 * Hook to manage a user's coin watchlist
 */
export function useWatchlist() {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch watchlist items from the database
  const fetchWatchlist = useCallback(async () => {
    if (!user) {
      setWatchlist([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch watchlist items from the database
      const watchlistItems = await fetchWatchlistFromDB();
      
      if (watchlistItems.length === 0) {
        setWatchlist([]);
        setLoading(false);
        return;
      }
      
      // Get coin IDs for price fetching
      const coinIds = watchlistItems.map(item => item.coin_id);
      
      // Fetch current prices for all coins in the watchlist
      const pricesMap = await getMultipleCoinsData(coinIds);
      
      // Map database items to WatchlistItem format with current prices
      const watchlistWithPrices = watchlistItems.map(dbItem => {
        const coinData = pricesMap[dbItem.coin_id];
        
        return {
          id: dbItem.id,
          symbol: dbItem.symbol,
          name: dbItem.name,
          price: coinData?.priceUsd || 0,
          change24h: coinData?.priceChange24h || 0,
          icon: dbItem.symbol,
          priceTarget: dbItem.price_target || undefined,
          createdAt: dbItem.created_at
        };
      });
      
      setWatchlist(watchlistWithPrices);
    } catch (err) {
      console.error('Error fetching watchlist:', err);
      setError('Failed to load watchlist. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load watchlist when user changes
  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  // Add a coin to watchlist
  const addToWatchlist = async (coin: CoinData, priceTarget: number) => {
    if (!user) return;
    
    try {
      await addToWatchlistInDB(coin, priceTarget);
      await fetchWatchlist(); // Refresh the watchlist
    } catch (err) {
      console.error('Error adding to watchlist:', err);
      setError('Failed to add coin to watchlist');
    }
  };

  // Remove a coin from watchlist
  const removeFromWatchlist = async (coinId: string) => {
    if (!user) return;
    
    try {
      await removeFromWatchlistInDB(coinId);
      setWatchlist(prev => prev.filter(coin => coin.id !== coinId));
    } catch (err) {
      console.error('Error removing from watchlist:', err);
      setError('Failed to remove coin from watchlist');
    }
  };

  // Update price target for a coin
  const updatePriceTarget = async (coinId: string, newPriceTarget: number) => {
    if (!user) return;
    
    try {
      await updatePriceTargetInDB(coinId, newPriceTarget);
      setWatchlist(prev => 
        prev.map(item => 
          item.id === coinId 
            ? { ...item, priceTarget: newPriceTarget } 
            : item
        )
      );
    } catch (err) {
      console.error('Error updating price target:', err);
      setError('Failed to update price target');
    }
  };

  // Check if a coin is in the watchlist
  const isInWatchlist = (coinId: string): boolean => {
    return watchlist.some(coin => coin.id === coinId);
  };
  
  // Get target percentage difference
  const getTargetPercentage = (coin: WatchlistItem): number => {
    if (!coin.priceTarget || coin.price === 0) return 0;
    return ((coin.priceTarget - coin.price) / coin.price) * 100;
  };

  // Refresh watchlist prices
  const refreshWatchlist = async () => {
    await fetchWatchlist();
  };

  return {
    watchlist,
    loading,
    error,
    addToWatchlist,
    removeFromWatchlist,
    updatePriceTarget,
    isInWatchlist,
    getTargetPercentage,
    refreshWatchlist
  };
} 