import { useCallback } from 'react';
import { useAuth } from '@/lib/providers/auth-provider';
import { CoinData } from '@/types/portfolio';
import { 
  addToTeamWatchlist,
  updateTeamWatchlistPriceTarget,
  removeFromTeamWatchlist
} from '@/lib/api/team-watchlist';
import { useToast } from '@/hooks/useToast';

// Admin ID for permission checks
const TEAM_ADMIN_ID = process.env.NEXT_PUBLIC_TEAM_ADMIN_ID || '529cfde5-d8c3-4a6a-a9dc-5bb67fb039b5';

export function useTeamWatchlistActions(
  fetchTeamWatchlist: (forceFetch?: boolean) => Promise<void>
) {
  const { user } = useAuth();
  const toast = useToast();

  // Add a coin to the team watchlist (admin only)
  const addToWatchlist = useCallback(async (coinData: CoinData, priceTarget?: number) => {
    console.log('addToWatchlist called with:', { coinData, priceTarget });
    
    if (!user) {
      console.error('User not authenticated');
      toast({
        title: 'Error',
        description: 'You must be logged in to perform this action',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return { success: false };
    }

    console.log('Current user ID:', user.id);
    console.log('TEAM_ADMIN_ID:', TEAM_ADMIN_ID);
    
    if (user.id !== TEAM_ADMIN_ID) {
      console.error('User is not admin');
      toast({
        title: 'Error',
        description: 'Only the admin can modify the team watchlist',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return { success: false };
    }

    console.log('User is admin, proceeding with addToTeamWatchlist');
    
    try {
      const result = await addToTeamWatchlist(coinData, priceTarget);
      console.log('addToTeamWatchlist result:', result);
      
      if (result.success) {
        // Refresh the watchlist to get the updated data
        await fetchTeamWatchlist(true);
        
        toast({
          title: 'Success',
          description: 'Coin added to team watchlist',
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
      console.error('Error adding coin to team watchlist:', error);
      
      toast({
        title: 'Error',
        description: 'Failed to add coin to team watchlist',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      
      return { success: false, message: 'An unexpected error occurred' };
    }
  }, [user, toast, fetchTeamWatchlist]);

  // Update a coin's price target in the team watchlist (admin only)
  const updatePriceTarget = useCallback(async (itemId: string, priceTarget: number) => {
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
        description: 'Only the admin can modify the team watchlist',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return { success: false };
    }

    try {
      const result = await updateTeamWatchlistPriceTarget(itemId, priceTarget);
      
      if (result.success) {
        // Refresh the watchlist to get the updated data
        await fetchTeamWatchlist(true);
        
        toast({
          title: 'Success',
          description: 'Price target updated in team watchlist',
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
      console.error('Error updating coin in team watchlist:', error);
      
      toast({
        title: 'Error',
        description: 'Failed to update coin in team watchlist',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      
      return { success: false, message: 'An unexpected error occurred' };
    }
  }, [user, toast, fetchTeamWatchlist]);

  // Remove a coin from the team watchlist (admin only)
  const removeFromWatchlist = useCallback(async (itemId: string) => {
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
        description: 'Only the admin can modify the team watchlist',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return { success: false };
    }

    try {
      const result = await removeFromTeamWatchlist(itemId);
      
      if (result.success) {
        // Refresh the watchlist to get the updated data
        await fetchTeamWatchlist(true);
        
        toast({
          title: 'Success',
          description: 'Coin removed from team watchlist',
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
      console.error('Error removing coin from team watchlist:', error);
      
      toast({
        title: 'Error',
        description: 'Failed to remove coin from team watchlist',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      
      return { success: false, message: 'An unexpected error occurred' };
    }
  }, [user, toast, fetchTeamWatchlist]);

  return {
    addToWatchlist,
    updatePriceTarget,
    removeFromWatchlist
  };
} 