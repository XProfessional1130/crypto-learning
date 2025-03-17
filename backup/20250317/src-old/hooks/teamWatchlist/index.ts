import { useTeamWatchlistData } from './useTeamWatchlistData';
import { useTeamWatchlistActions } from './useTeamWatchlistActions';
import { useTeamWatchlistUtils } from './useTeamWatchlistUtils';

export function useTeamWatchlist() {
  // Get watchlist data and loading state
  const { 
    watchlist, 
    loading, 
    error, 
    isAdmin,
    isInWatchlist,
    fetchTeamWatchlist,
    backgroundRefresh
  } = useTeamWatchlistData();

  // Get watchlist operations (add, update, remove)
  const { 
    addToWatchlist, 
    updatePriceTarget, 
    removeFromWatchlist 
  } = useTeamWatchlistActions(fetchTeamWatchlist);

  // Get utility functions
  const { 
    getTargetPercentage 
  } = useTeamWatchlistUtils();

  // Return the combined hook interface
  return {
    watchlist,
    loading,
    error,
    isAdmin,
    isInWatchlist,
    refreshWatchlist: fetchTeamWatchlist, // Alias for backwards compatibility
    getTargetPercentage,
    addToWatchlist,
    updatePriceTarget,
    removeFromWatchlist
  };
}

// Export individual hooks for direct usage if needed
export { useTeamWatchlistData, useTeamWatchlistActions, useTeamWatchlistUtils }; 