import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { PortfolioSummary } from '@/types/portfolio';
import { 
  getUserPortfolio,
  addCoinToPortfolio,
  updateCoinAmount,
  removeCoinFromPortfolio,
  updatePreferredCurrency
} from '@/lib/services/portfolio';
import { searchCoins } from '@/lib/services/coinmarketcap';
import { useToast } from '@chakra-ui/react';

export function usePortfolio() {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preferredCurrency, setPreferredCurrency] = useState<'USD' | 'BTC'>('USD');
  const toast = useToast();

  const fetchPortfolio = async () => {
    if (!user) {
      setPortfolio(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

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
    // Initial fetch when component mounts or user changes
    if (user) {
      console.log('User authenticated, fetching portfolio...');
      fetchPortfolio();
    }
    
    // Set up refresh interval (5 minutes)
    const intervalId = setInterval(() => {
      if (user) {
        console.log('Auto-refreshing portfolio...');
        fetchPortfolio();
      }
    }, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
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
    refreshPortfolio: fetchPortfolio
  };
} 