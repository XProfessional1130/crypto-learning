import { useTeamPortfolioData } from './useTeamPortfolioData';
import { useTeamPortfolioActions } from './useTeamPortfolioActions';

export function useTeamPortfolio() {
  // Get portfolio data and loading state
  const { 
    portfolio, 
    loading, 
    error, 
    isAdmin,
    fetchTeamPortfolio,
    backgroundRefresh
  } = useTeamPortfolioData();

  // Get portfolio operations (add, update, remove)
  const { 
    addCoin, 
    updateAmount, 
    removeCoin 
  } = useTeamPortfolioActions(fetchTeamPortfolio);

  // Return the combined hook interface
  return {
    portfolio,
    loading,
    error,
    isAdmin,
    refreshPortfolio: fetchTeamPortfolio, // Alias for backwards compatibility
    addCoin,
    updateAmount,
    removeCoin
  };
}

// Export individual hooks for direct usage if needed
export { useTeamPortfolioData, useTeamPortfolioActions }; 