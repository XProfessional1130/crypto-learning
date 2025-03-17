import { useTeamData } from '@/lib/providers/team-data-provider';

// Export the hook as a wrapper around our new context
export function useTeamWatchlist() {
  // Get all watchlist-related data and methods from our context
  const {
    watchlist,
    watchlistLoading: loading,
    watchlistError: error,
    isAdmin,
    refreshWatchlist,
    addToWatchlist,
    updatePriceTarget,
    removeFromWatchlist,
    getTargetPercentage,
    isInWatchlist
  } = useTeamData();

  // Return the same interface for backward compatibility
  return {
    watchlist,
    loading,
    error,
    isAdmin,
    refreshWatchlist,
    addToWatchlist,
    updatePriceTarget,
    removeFromWatchlist,
    getTargetPercentage,
    isInWatchlist
  };
}

// Helper function for type checks
export { type WatchlistItem } from '@/hooks/useWatchlist'; 