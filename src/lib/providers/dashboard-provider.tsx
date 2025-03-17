'use client';

import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useDashboardData } from '@/hooks/dashboard/useDashboardData';
import { GlobalData } from '@/lib/api/coinmarketcap';

// Define the context shape
interface DashboardContextType {
  // Market data
  btcPrice: number | null;
  ethPrice: number | null;
  globalData: GlobalData | null;
  
  // Loading states
  loading: boolean;
  isRefreshing: boolean;
  
  // Error handling
  error: string | null;
  
  // Actions
  refreshData: () => Promise<void>;
}

// Create the context with default values
const DashboardContext = createContext<DashboardContextType>({
  btcPrice: null,
  ethPrice: null,
  globalData: null,
  loading: true,
  isRefreshing: false,
  error: null,
  refreshData: async () => {}
});

// Provider component that wraps the app or specific sections
export function DashboardProvider({ 
  children,
  autoRefresh = true,
  refreshInterval = 5 * 60 * 1000
}: { 
  children: ReactNode;
  autoRefresh?: boolean;
  refreshInterval?: number;
}) {
  // Use the hook for dashboard data
  const {
    btcPrice,
    ethPrice,
    globalData,
    loading,
    error,
    isRefreshing,
    refreshData
  } = useDashboardData(autoRefresh, refreshInterval);

  // Create a memoized value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    // Market data
    btcPrice,
    ethPrice,
    globalData,
    
    // Loading states
    loading,
    isRefreshing,
    
    // Error handling
    error,
    
    // Actions
    refreshData
  }), [
    btcPrice, 
    ethPrice, 
    globalData, 
    loading, 
    isRefreshing, 
    error, 
    refreshData
  ]);

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
}

// Custom hook for using the dashboard context
export function useDashboard() {
  const context = useContext(DashboardContext);
  
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  
  return context;
} 