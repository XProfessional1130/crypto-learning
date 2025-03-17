import { useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { searchCoins } from '@/lib/services/coinmarketcap';
import { useToast } from '@/lib/hooks/useToast';

export function usePortfolioUtils() {
  const { user } = useAuth();
  const toast = useToast();
  const [preferredCurrency, setPreferredCurrency] = useState<'USD' | 'BTC'>('USD');

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

  return {
    preferredCurrency,
    changeCurrency,
    searchForCoins
  };
} 