import { useCallback } from 'react';
import { useAuth } from '@/lib/providers/auth-provider';
import { CoinData } from '@/types/portfolio';
import { 
  addCoinToTeamPortfolio, 
  updateTeamPortfolioCoinAmount, 
  removeFromTeamPortfolio 
} from '@/lib/api/team-portfolio';
import { useToast } from '@/hooks/useToast';

// Admin ID for permission checks
const TEAM_ADMIN_ID = process.env.NEXT_PUBLIC_TEAM_ADMIN_ID || '529cfde5-d8c3-4a6a-a9dc-5bb67fb039b5';

export function useTeamPortfolioActions(
  fetchTeamPortfolio: (forceFetch?: boolean) => Promise<void>
) {
  const { user } = useAuth();
  const toast = useToast();

  // Add a coin to the team portfolio (admin only)
  const addCoin = useCallback(async (coinData: CoinData, amount: number) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to perform this action',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return { success: false };
    }

    if (user.id !== TEAM_ADMIN_ID) {
      toast({
        title: 'Error',
        description: 'Only the admin can modify the team portfolio',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return { success: false };
    }

    try {
      const result = await addCoinToTeamPortfolio(coinData, amount);
      
      if (result.success) {
        // Refresh the portfolio to get the updated data
        await fetchTeamPortfolio(true);
        
        toast({
          title: 'Success',
          description: 'Coin added to team portfolio',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Error',
          description: result.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error adding coin to team portfolio:', error);
      
      toast({
        title: 'Error',
        description: 'Failed to add coin to team portfolio',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      
      return { success: false, message: 'An unexpected error occurred' };
    }
  }, [user, toast, fetchTeamPortfolio]);

  // Update a coin's amount in the team portfolio (admin only)
  const updateAmount = useCallback(async (itemId: string, amount: number) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to perform this action',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return { success: false };
    }

    if (user.id !== TEAM_ADMIN_ID) {
      toast({
        title: 'Error',
        description: 'Only the admin can modify the team portfolio',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return { success: false };
    }

    try {
      const result = await updateTeamPortfolioCoinAmount(itemId, amount);
      
      if (result.success) {
        // Refresh the portfolio to get the updated data
        await fetchTeamPortfolio(true);
        
        toast({
          title: 'Success',
          description: 'Coin amount updated in team portfolio',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Error',
          description: result.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error updating coin in team portfolio:', error);
      
      toast({
        title: 'Error',
        description: 'Failed to update coin in team portfolio',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      
      return { success: false, message: 'An unexpected error occurred' };
    }
  }, [user, toast, fetchTeamPortfolio]);

  // Remove a coin from the team portfolio (admin only)
  const removeCoin = useCallback(async (itemId: string) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to perform this action',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return { success: false };
    }

    if (user.id !== TEAM_ADMIN_ID) {
      toast({
        title: 'Error',
        description: 'Only the admin can modify the team portfolio',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return { success: false };
    }

    try {
      const result = await removeFromTeamPortfolio(itemId);
      
      if (result.success) {
        // Refresh the portfolio to get the updated data
        await fetchTeamPortfolio(true);
        
        toast({
          title: 'Success',
          description: 'Coin removed from team portfolio',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Error',
          description: result.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error removing coin from team portfolio:', error);
      
      toast({
        title: 'Error',
        description: 'Failed to remove coin from team portfolio',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      
      return { success: false, message: 'An unexpected error occurred' };
    }
  }, [user, toast, fetchTeamPortfolio]);

  return {
    addCoin,
    updateAmount,
    removeCoin
  };
} 