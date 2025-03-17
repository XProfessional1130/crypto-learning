import { useCallback } from 'react';
import { useAuth } from '@/lib/providers/auth-provider';
import { PortfolioSummary } from '@/types/portfolio';
import { 
  addCoinToPortfolio,
  updateCoinAmount,
  removeCoinFromPortfolio
} from '@/lib/api/portfolio';
import { useToast } from '@/hooks/useToast';

export function usePortfolioActions(
  portfolio: PortfolioSummary | null,
  setPortfolio: React.Dispatch<React.SetStateAction<PortfolioSummary | null>>,
  fetchPortfolio: (forceFetch?: boolean) => Promise<void>,
  backgroundRefresh: () => Promise<void>
) {
  const { user } = useAuth();
  const toast = useToast();

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
  }, [user, portfolio, toast, fetchPortfolio, backgroundRefresh, setPortfolio]);

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
  }, [user, portfolio, toast, fetchPortfolio, backgroundRefresh, setPortfolio]);

  return {
    addCoin,
    updateAmount,
    removeCoin
  };
} 