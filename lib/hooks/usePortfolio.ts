import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { PortfolioSummary, PortfolioItemWithPrice } from '@/types/portfolio';
import { 
  getUserPortfolio,
  addCoinToPortfolio,
  updateCoinAmount,
  removeCoinFromPortfolio,
  updatePreferredCurrency
} from '@/lib/services/portfolio';
import { searchCoins, cleanupCaches } from '@/lib/services/coinmarketcap';
import { useToast } from '@/lib/hooks/useToast';

// Refresh intervals and cache settings
const AUTO_REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes instead of 5
const CACHE_CLEANUP_INTERVAL = 30 * 60 * 1000; // 30 minutes
const MIN_FETCH_INTERVAL = 60 * 1000; // 1 minute minimum between fetches
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache duration

// Global cache for sharing data between hook instances
const globalCache: {
  portfolioData: { [userId: string]: { data: PortfolioSummary, timestamp: number } }
} = {
  portfolioData: {}
};

export function usePortfolio() {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preferredCurrency, setPreferredCurrency] = useState<'USD' | 'BTC'>('USD');
  const toast = useToast();
  const lastFetchRef = useRef<number>(0);
  const localCacheRef = useRef<{data: PortfolioSummary, timestamp: number} | null>(null);

  // Fetch portfolio data with caching and throttling
  const fetchPortfolio = useCallback(async (forceFetch = false) => {
    if (!user) {
      setPortfolio(null);
      setLoading(false);
      return;
    }

    const now = Date.now();
    const userId = user.id;
    const timeSinceLastFetch = now - lastFetchRef.current;
    const globalCacheForUser = globalCache.portfolioData[userId];
    
    // Determine if we can use the cache
    const canUseGlobalCache = !forceFetch && 
      globalCacheForUser && 
      (now - globalCacheForUser.timestamp) < CACHE_DURATION;
      
    const canUseLocalCache = !forceFetch && 
      localCacheRef.current && 
      (now - localCacheRef.current.timestamp) < CACHE_DURATION;
    
    // If in cooldown and we have some cache, use it
    if (!forceFetch && timeSinceLastFetch < MIN_FETCH_INTERVAL) {
      if (canUseGlobalCache) {
        setPortfolio(globalCacheForUser.data);
        setLoading(false);
        console.log('Using global portfolio cache (in cooldown)');
        return;
      } else if (canUseLocalCache) {
        setPortfolio(localCacheRef.current!.data);
        setLoading(false);
        console.log('Using local portfolio cache (in cooldown)');
        return;
      }
      // If no cache but in cooldown, we'll continue but log it
      console.log('Skipping portfolio fetch - too soon since last fetch');
    }
    
    // If not in cooldown but cache is still fresh, use it and do background refresh
    if (!forceFetch && (canUseGlobalCache || canUseLocalCache)) {
      // Set data from cache immediately
      if (canUseGlobalCache) {
        setPortfolio(globalCacheForUser.data);
      } else if (canUseLocalCache) {
        setPortfolio(localCacheRef.current!.data);
      }
      
      // Only do background refresh if we're not in the cooldown
      if (timeSinceLastFetch >= MIN_FETCH_INTERVAL) {
        console.log('Using cache and fetching portfolio in background');
        // Don't show loading indicator for background refresh
        setLoading(false);
        
        // Start background refresh
        backgroundRefresh();
        return;
      } else {
        // Just use the cache
        setLoading(false);
        return;
      }
    }

    // Full refresh needed
    setLoading(true);
    setError(null);
    lastFetchRef.current = now;

    try {
      console.log(`Fetching portfolio for user ${user.id}...`);
      const data = await getUserPortfolio(user.id);
      console.log(`Portfolio fetched successfully with ${data.items.length} items`);
      
      // Update state and caches
      setPortfolio(data);
      localCacheRef.current = { data, timestamp: now };
      globalCache.portfolioData[userId] = { data, timestamp: now };
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching portfolio:', err);
      setError('Failed to load portfolio');
      
      // Fall back to cache on error if available
      if (globalCacheForUser) {
        setPortfolio(globalCacheForUser.data);
      } else if (localCacheRef.current) {
        setPortfolio(localCacheRef.current.data);
      }
      
      toast({
        title: 'Error',
        description: 'Failed to load portfolio',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      
      setLoading(false);
    }
  }, [user, toast]);
  
  // Background refresh function that doesn't update loading state
  const backgroundRefresh = async () => {
    if (!user) return;
    
    lastFetchRef.current = Date.now();
    
    try {
      console.log(`Background refreshing portfolio for user ${user.id}...`);
      const data = await getUserPortfolio(user.id);
      
      // Update state and caches
      setPortfolio(data);
      const now = Date.now();
      localCacheRef.current = { data, timestamp: now };
      globalCache.portfolioData[user.id] = { data, timestamp: now };
      
      console.log('Background portfolio refresh completed');
    } catch (err) {
      console.error('Background portfolio refresh failed:', err);
      // Don't set error state for background refreshes
    }
  };

  useEffect(() => {
    // Initial fetch when component mounts or user changes
    if (user) {
      console.log('User authenticated, fetching portfolio...');
      fetchPortfolio(true); // Force fetch on initial load
    }
    
    // Set up refresh interval (now 10 minutes instead of 5)
    const refreshIntervalId = setInterval(() => {
      if (user) {
        console.log('Auto-refreshing portfolio...');
        backgroundRefresh(); // Use background refresh for intervals
      }
    }, AUTO_REFRESH_INTERVAL);
    
    // Set up cache cleanup interval
    const cacheCleanupIntervalId = setInterval(() => {
      console.log('Cleaning up coin data caches...');
      cleanupCaches();
    }, CACHE_CLEANUP_INTERVAL);
    
    return () => {
      clearInterval(refreshIntervalId);
      clearInterval(cacheCleanupIntervalId);
    };
  }, [user]);

  // Add a coin to the portfolio with optimistic UI updates
  const addCoin = useCallback(async (coinId: string, amount: number) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to add coins',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return { success: false };
    }

    try {
      console.log(`Adding coin ${coinId} to portfolio...`);
      const result = await addCoinToPortfolio(user.id, coinId, amount);
      
      if (result.success) {
        console.log('Coin added successfully, refreshing portfolio...');
        
        // Force fetch to get the updated portfolio data
        await fetchPortfolio(true);
        console.log('Portfolio refreshed successfully after adding coin');
        
        toast({
          title: 'Success',
          description: 'Coin added to portfolio',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        console.error('Failed to add coin:', result.message);
        toast({
          title: 'Error',
          description: result.message || 'Failed to add coin',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error adding coin:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return { success: false };
    }
  }, [user, toast, fetchPortfolio]);

  // Update the amount of a coin with optimistic UI updates
  const updateAmount = useCallback(async (portfolioItemId: string, amount: number) => {
    if (!user) return { success: false };

    // Optimistically update the UI
    if (portfolio) {
      const updatedItems = portfolio.items.map(item => 
        item.id === portfolioItemId 
          ? { ...item, amount } 
          : item
      );
      
      // Recalculate totals (simplified)
      const updatedPortfolio = {
        ...portfolio,
        items: updatedItems
      };
      
      // Update local state immediately
      setPortfolio(updatedPortfolio);
    }

    try {
      const result = await updateCoinAmount(user.id, portfolioItemId, amount);
      
      if (result.success) {
        // Fetch updated data (background)
        backgroundRefresh();
        
        toast({
          title: 'Success',
          description: 'Amount updated',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // Revert optimistic update
        await fetchPortfolio(true);
        
        toast({
          title: 'Error',
          description: result.message || 'Failed to update amount',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error updating amount:', error);
      
      // Revert optimistic update
      await fetchPortfolio(true);
      
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return { success: false };
    }
  }, [user, portfolio, toast, fetchPortfolio]);

  // Remove a coin with optimistic UI updates
  const removeCoin = useCallback(async (portfolioItemId: string) => {
    if (!user) return { success: false };

    // Store original portfolio for rollback
    const originalPortfolio = portfolio;

    // Optimistically update the UI if we have a portfolio
    if (portfolio) {
      const updatedItems = portfolio.items.filter(item => item.id !== portfolioItemId);
      
      // Create a simplified updated portfolio
      const updatedPortfolio = {
        ...portfolio,
        items: updatedItems
      };
      
      // Update local state immediately
      setPortfolio(updatedPortfolio);
    }

    try {
      const result = await removeCoinFromPortfolio(user.id, portfolioItemId);
      
      if (result.success) {
        // Fetch accurate data in background
        backgroundRefresh();
        
        toast({
          title: 'Success',
          description: 'Coin removed from portfolio',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // Revert optimistic update
        if (originalPortfolio) {
          setPortfolio(originalPortfolio);
        } else {
          await fetchPortfolio(true);
        }
        
        toast({
          title: 'Error',
          description: result.message || 'Failed to remove coin',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error removing coin:', error);
      
      // Revert optimistic update
      if (originalPortfolio) {
        setPortfolio(originalPortfolio);
      } else {
        await fetchPortfolio(true);
      }
      
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return { success: false };
    }
  }, [user, portfolio, toast, fetchPortfolio]);

  // Update preferred currency with optimistic UI updates
  const changeCurrency = useCallback(async (currency: 'USD' | 'BTC') => {
    if (!user) return { success: false };

    // Update local state immediately
    setPreferredCurrency(currency);

    try {
      // In a real implementation, you might need to update this for each item
      // or have a user-level setting. This is simplified.
      const result = { success: true };
      
      return result;
    } catch (error) {
      console.error('Error changing currency:', error);
      
      // Revert the optimistic update
      setPreferredCurrency(preferredCurrency);
      
      toast({
        title: 'Error',
        description: 'Failed to update currency preference',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return { success: false };
    }
  }, [user, preferredCurrency, toast]);

  // Search for coins with caching
  const searchForCoins = useCallback(async (query: string) => {
    try {
      return await searchCoins(query);
    } catch (error) {
      console.error('Error searching for coins:', error);
      toast({
        title: 'Error',
        description: 'Failed to search for coins',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return [];
    }
  }, [toast]);

  // Force refresh portfolio data
  const refreshPortfolio = useCallback(() => {
    return fetchPortfolio(true);
  }, [fetchPortfolio]);

  return {
    portfolio,
    loading,
    error,
    preferredCurrency,
    addCoin,
    updateAmount,
    removeCoin,
    changeCurrency,
    searchForCoins,
    refreshPortfolio
  };
} 