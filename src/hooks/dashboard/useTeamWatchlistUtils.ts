import { useCallback } from 'react';
import { WatchlistItem } from '@/lib/api/team-watchlist';

export function useTeamWatchlistUtils() {
  // Calculate target percentage (useful for watchlist items with price targets)
  const getTargetPercentage = useCallback((item: WatchlistItem): number => {
    if (!item.priceTarget || !item.price) return 0;
    
    // Calculate percentage to reach the target from current price
    return ((item.priceTarget - item.price) / item.price) * 100;
  }, []);

  return {
    getTargetPercentage
  };
} 