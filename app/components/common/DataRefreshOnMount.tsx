'use client';

import { useEffect } from 'react';
import { useDataCache } from '@/lib/context/data-cache-context';

/**
 * Component that refreshes data when mounted
 * This is useful for pages that need fresh data on load
 */
export function DataRefreshOnMount() {
  const { refreshData } = useDataCache();

  useEffect(() => {
    // Refresh data on mount
    const refreshOnMount = async () => {
      try {
        console.log('DataRefreshOnMount: Refreshing data...');
        await refreshData();
        console.log('DataRefreshOnMount: Data refresh complete');
      } catch (err) {
        console.error('DataRefreshOnMount: Error refreshing data:', err);
      }
    };
    
    refreshOnMount();
  }, [refreshData]);

  // This component doesn't render anything
  return null;
}

export default DataRefreshOnMount; 