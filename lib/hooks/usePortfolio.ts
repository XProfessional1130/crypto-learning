import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { PortfolioSummary } from '@/types/portfolio';
import { 
  getUserPortfolio,
  addCoinToPortfolio,
  updateCoinAmount,
  removeCoinFromPortfolio,
  updatePreferredCurrency
} from '@/lib/services/portfolio';
import { searchCoins, initCoinDataService, cleanupCaches } from '@/lib/services/coinmarketcap';
import { useToast } from '@/lib/hooks/useToast';

// Refresh intervals
const AUTO_REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes instead of 5
const CACHE_CLEANUP_INTERVAL = 30 * 60 * 1000; // 30 minutes

export function usePortfolio() {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preferredCurrency, setPreferredCurrency] = useState<'USD' | 'BTC'>('USD');
  const toast = useToast();
  const lastFetchRef = useRef<number>(0);
  const MIN_FETCH_INTERVAL = 60 * 1000; // 1 minute minimum between fetches

  const fetchPortfolio = async (forceFetch = false) => {
    if (!user) {
      setPortfolio(null);
      setLoading(false);
      return;
    }

    // Implement throttling to avoid excessive fetches
    const now = Date.now();
    if (!forceFetch && now - lastFetchRef.current < MIN_FETCH_INTERVAL) {
      console.log('Skipping portfolio fetch - too soon since last fetch');
      return;
    }

    setLoading(true);
    setError(null);
    lastFetchRef.current = now;

    try {
      console.log(`Fetching portfolio for user ${user.id}...`);
      const data = await getUserPortfolio(user.id);
      console.log(`Portfolio fetched successfully with ${data.items.length} items`);
      setPortfolio(data);
    } catch (err) {
      console.error('Error fetching portfolio:', err);
      setError('Failed to load portfolio');
      toast({
        title: 'Error',
        description: 'Failed to load portfolio',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initialize the coin data service when the component mounts
    initCoinDataService()
      .then(() => console.log('Coin data service initialized'))
      .catch(err => console.error('Failed to initialize coin data service:', err));
    
    // Initial fetch when component mounts or user changes
    if (user) {
      console.log('User authenticated, fetching portfolio...');
      fetchPortfolio(true); // Force fetch on initial load
    }
    
    // Set up refresh interval (now 10 minutes instead of 5)
    const refreshIntervalId = setInterval(() => {
      if (user) {
        console.log('Auto-refreshing portfolio...');
        fetchPortfolio();
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

  const addCoin = async (coinId: string, amount: number) => {
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
        
        // Make sure to await the portfolio refresh
        try {
          await fetchPortfolio();
          console.log('Portfolio refreshed successfully after adding coin');
        } catch (refreshError) {
          console.error('Error refreshing portfolio after adding coin:', refreshError);
          // Don't return an error here, as the coin was still added successfully
        }
        
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
  };

  const updateAmount = async (portfolioItemId: string, amount: number) => {
    if (!user) return { success: false };

    try {
      const result = await updateCoinAmount(user.id, portfolioItemId, amount);
      
      if (result.success) {
        await fetchPortfolio();
        toast({
          title: 'Success',
          description: 'Amount updated',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
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
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return { success: false };
    }
  };

  const removeCoin = async (portfolioItemId: string) => {
    if (!user) return { success: false };

    try {
      const result = await removeCoinFromPortfolio(user.id, portfolioItemId);
      
      if (result.success) {
        await fetchPortfolio();
        toast({
          title: 'Success',
          description: 'Coin removed from portfolio',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
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
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return { success: false };
    }
  };

  const changeCurrency = async (portfolioItemId: string, currency: 'USD' | 'BTC') => {
    if (!user) return { success: false };

    try {
      const result = await updatePreferredCurrency(user.id, portfolioItemId, currency);
      
      if (result.success) {
        setPreferredCurrency(currency);
        await fetchPortfolio();
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Failed to update currency preference',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error changing currency:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return { success: false };
    }
  };

  const searchForCoins = async (query: string) => {
    if (!query.trim()) {
      return [];
    }
    
    try {
      console.log(`Searching for coins with query: ${query} from usePortfolio hook`);
      const results = await searchCoins(query);
      console.log(`Search returned ${results.length} results from usePortfolio hook`);
      
      return results;
    } catch (error) {
      console.error('Error searching coins in usePortfolio:', error);
      toast({
        title: 'Error',
        description: 'Failed to search for coins',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return [];
    }
  };

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
    refreshPortfolio: () => fetchPortfolio(true) // Force refresh when explicitly called
  };
} 