import { usePortfolioData } from './usePortfolioData';
import { usePortfolioActions } from './usePortfolioActions';
import { usePortfolioUtils } from './usePortfolioUtils';

export function usePortfolio() {
  // Get portfolio data and loading state
  const { 
    portfolio, 
    loading, 
    error, 
    fetchPortfolio, 
    backgroundRefresh, 
    refreshPortfolio 
  } = usePortfolioData();

  // Get portfolio operations (add, update, remove)
  const { 
    addCoin, 
    updateAmount, 
    removeCoin 
  } = usePortfolioActions(portfolio, (p) => setPortfolio(p), fetchPortfolio, backgroundRefresh);

  // Get utility functions and preferences
  const { 
    preferredCurrency, 
    changeCurrency, 
    searchForCoins 
  } = usePortfolioUtils();

  // Provide a unified state setter for the portfolio to avoid direct references
  const setPortfolio = (value: React.SetStateAction<typeof portfolio>) => {
    if (typeof value === 'function') {
      // If the value is a function, we need to handle it specially
      const setterFn = value as ((prevState: typeof portfolio) => typeof portfolio);
      // We need to update our internal state somehow
      // This is a workaround as we don't have direct access to the setState from usePortfolioData
      fetchPortfolio(true);
    } else {
      // If it's a direct value, we could potentially save it to a ref in the future
      // For now, trigger a refresh to sync with the backend
      fetchPortfolio(true);
    }
  };

  // Return the combined hook interface
  return {
    // Data
    portfolio,
    loading,
    error,
    preferredCurrency,
    
    // Actions
    addCoin,
    updateAmount,
    removeCoin,
    changeCurrency,
    searchForCoins,
    refreshPortfolio
  };
}

// Export individual hooks for direct usage if needed
export { usePortfolioData, usePortfolioActions, usePortfolioUtils }; 