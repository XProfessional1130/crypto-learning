import { useTeamData } from '@/lib/providers/team-data-provider';

// Export the hook as a wrapper around our new context
export function useTeamPortfolio() {
  // Get all portfolio-related data and methods from our context
  const {
    portfolio,
    portfolioLoading: loading,
    portfolioError: error,
    isAdmin,
    refreshPortfolio,
    addCoin,
    updateAmount,
    removeCoin
  } = useTeamData();

  // Return the same interface for backward compatibility
  return {
    portfolio,
    loading,
    error,
    isAdmin,
    refreshPortfolio,
    addCoin,
    updateAmount,
    removeCoin
  };
} 