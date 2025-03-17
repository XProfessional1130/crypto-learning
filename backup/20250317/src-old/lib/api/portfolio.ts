import { PortfolioItem, PortfolioItemWithPrice, PortfolioSummary } from '@/types/portfolio';
import { fetchMultipleCoinsData } from './coinmarketcap';
import { fetchMultipleCoinsDataFromSupabase } from './supabase-crypto';
import supabase from './supabase-client';

const PORTFOLIO_LIMIT = 30;

/**
 * Get coin data using the global data cache helper if available
 * This avoids direct API calls when cached data is available
 */
async function getCoinDataWithFallback(coinIds: string[], forceRefresh = false) {
  try {
    // Check if this is a re-navigation attempt based on timing
    const isNavigationRequest = typeof window !== 'undefined' && 
      window.performance && 
      performance.navigation && 
      (performance.navigation.type === 1 || // Reload
       (document.referrer && document.referrer.includes(window.location.host))); // Back navigation
    
    // Always log key information
    const verbose = process.env.NODE_ENV === 'development';
    if (verbose) {
      console.log(`Portfolio: Getting data for ${coinIds.length} coins, ` + 
                 `forceRefresh=${forceRefresh}, ` + 
                 `potentialNavigation=${isNavigationRequest}`);
    }
    
    // Try to get from the window global cache if it exists (set by DataCacheProvider)
    // Skip cache if forceRefresh is true or if this seems to be a navigation
    if (!forceRefresh && !isNavigationRequest && 
        typeof window !== 'undefined' && window.__LC_DATA_CACHE_HELPER__) {
      if (verbose) {
        console.log('Using DataCache helper for portfolio coin prices');
      }
      const cachedData = await window.__LC_DATA_CACHE_HELPER__(coinIds);
      if (cachedData && Object.keys(cachedData).length > 0) {
        return cachedData;
      }
    }
    
    // First try Supabase
    if (verbose) {
      console.log('Trying Supabase for portfolio coin prices');
    }
    try {
      const supabaseData = await fetchMultipleCoinsDataFromSupabase(coinIds);
      if (supabaseData && Object.keys(supabaseData).length > 0) {
        return supabaseData;
      }
    } catch (err) {
      console.warn('Failed to get coin data from Supabase:', err);
    }
    
    // Fall back to direct API call
    if (verbose) {
      console.log('Falling back to API for portfolio coin prices');
    }
    return await fetchMultipleCoinsData(coinIds);
  } catch (error) {
    console.error('Error getting coin data:', error);
    // Return empty object as fallback
    return {};
  }
}

export async function getUserPortfolio(userId: string, forceRefresh = false): Promise<PortfolioSummary> {
  try {
    const { data: portfolioItems, error } = await supabase
      .from('user_portfolios')
      .select('*')
      .eq('user_id', userId);
      
    if (error) throw error;
    if (!portfolioItems || portfolioItems.length === 0) {
      return {
        totalValueUsd: 0,
        totalValueBtc: 0,
        dailyChangePercentage: 0,
        dailyChangeUsd: 0,
        dailyChangeBtc: 0,
        items: []
      };
    }
    
    console.log('Fetching portfolio for user', userId, 'with', portfolioItems.length, 'items');
    
    // Get all coin prices - ensure IDs are strings
    const coinIds = portfolioItems.map(item => String(item.coin_id));
    
    // Use the function that checks cache first, passing the forceRefresh flag
    const coinsData = await getCoinDataWithFallback(coinIds, forceRefresh);
    
    let totalValueUsd = 0;
    let totalValueBtc = 0;
    let totalPrevValueUsd = 0;
    let totalPrevValueBtc = 0;
    
    const items: PortfolioItemWithPrice[] = portfolioItems.map(item => {
      // Ensure we're looking up with a string ID
      const coinStringId = String(item.coin_id);
      const coinData = coinsData[coinStringId];
      
      // Guard against missing or invalid price data
      const priceUsd = coinData?.priceUsd || 0;
      const priceBtc = coinData?.priceBtc || 0;
      const priceChange24h = coinData?.priceChange24h || 0;
      
      // Compute values with safety guards
      const valueUsd = item.amount * priceUsd;
      const valueBtc = item.amount * priceBtc;
      const prevValueUsd = priceChange24h !== 0 
        ? valueUsd / (1 + priceChange24h / 100) 
        : valueUsd;
      const prevValueBtc = priceChange24h !== 0
        ? valueBtc / (1 + priceChange24h / 100)
        : valueBtc;
      
      totalValueUsd += valueUsd;
      totalValueBtc += valueBtc;
      totalPrevValueUsd += prevValueUsd;
      totalPrevValueBtc += prevValueBtc;
      
      return {
        id: item.id,
        userId: item.user_id,
        coinId: item.coin_id,
        coinSymbol: item.coin_symbol,
        coinName: item.coin_name,
        amount: item.amount,
        preferredCurrency: item.preferred_currency as 'USD' | 'BTC',
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        priceUsd,
        priceBtc,
        valueUsd,
        valueBtc,
        priceChange24h,
        percentage: 0, // Will be calculated after total is known
        marketCap: coinData?.marketCap || 0,
        logoUrl: coinData?.logoUrl
      };
    });
    
    // Calculate daily change with safety guards
    const dailyChangeUsd = totalValueUsd - totalPrevValueUsd;
    const dailyChangeBtc = totalValueBtc - totalPrevValueBtc;
    const dailyChangePercentage = totalPrevValueUsd > 0 
      ? ((totalValueUsd - totalPrevValueUsd) / totalPrevValueUsd) * 100 
      : 0;
    
    // Calculate percentages
    items.forEach(item => {
      item.percentage = totalValueUsd > 0 ? (item.valueUsd / totalValueUsd) * 100 : 0;
    });
    
    console.log('Portfolio fetched successfully with', items.length, 'items');
    
    return {
      totalValueUsd,
      totalValueBtc,
      dailyChangePercentage,
      dailyChangeUsd,
      dailyChangeBtc,
      items
    };
    
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    throw error;
  }
}

export async function addCoinToPortfolio(
  userId: string, 
  coinId: string, 
  amount: number
): Promise<{ success: boolean; message?: string }> {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    if (!coinId) {
      throw new Error('Coin ID is required');
    }
    
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }
    
    // Check if this user has reached the portfolio limit
    const { count, error: countError } = await supabase
      .from('user_portfolios')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
      
    if (countError) {
      throw countError;
    }
    
    if (count !== null && count >= PORTFOLIO_LIMIT) {
      return {
        success: false,
        message: `You've reached the limit of ${PORTFOLIO_LIMIT} portfolio items. Please remove some before adding more.`
      };
    }
    
    // Check if the user already has this coin in their portfolio
    const { data: existingItems, error: existingError } = await supabase
      .from('user_portfolios')
      .select('*')
      .eq('user_id', userId)
      .eq('coin_id', coinId);
      
    if (existingError) {
      throw existingError;
    }
    
    if (existingItems && existingItems.length > 0) {
      return {
        success: false,
        message: 'This coin is already in your portfolio. Edit the existing entry instead.'
      };
    }
    
    // Get coin data to validate and store name/symbol
    let coinData;
    try {
      // Use the cache-aware function to get coin data
      const coinsData = await getCoinDataWithFallback([coinId]);
      coinData = coinsData[coinId];
      
      if (!coinData) {
        return {
          success: false,
          message: 'Could not fetch coin data. Please try again later.'
        };
      }
    } catch (error) {
      console.error('Error fetching coin data:', error);
      return {
        success: false,
        message: 'Error fetching coin information. Please try again later.'
      };
    }
    
    // Add new coin
    console.log(`Adding new coin to portfolio: ${coinData.symbol}`);
    const { error: insertError } = await supabase
      .from('user_portfolios')
      .insert({
        user_id: userId,
        coin_id: coinId,
        coin_symbol: coinData.symbol,
        coin_name: coinData.name,
        amount,
        preferred_currency: 'USD'
      });
      
    if (insertError) {
      console.error('Error inserting new coin:', insertError);
      return { success: false, message: 'Failed to add coin to portfolio' };
    }
    
    console.log(`Successfully added ${coinData.symbol} to portfolio`);
    return { success: true };
    
  } catch (error) {
    console.error('Error adding coin to portfolio:', error);
    return { success: false, message: 'An unexpected error occurred' };
  }
}

export async function updateCoinAmount(
  userId: string,
  portfolioItemId: string,
  amount: number
): Promise<{ success: boolean; message?: string }> {
  try {
    if (amount <= 0) {
      return { success: false, message: 'Amount must be greater than zero' };
    }
    
    const { error } = await supabase
      .from('user_portfolios')
      .update({ 
        amount,
        updated_at: new Date().toISOString()
      })
      .eq('id', portfolioItemId)
      .eq('user_id', userId);
      
    if (error) throw error;
    return { success: true };
    
  } catch (error) {
    console.error('Error updating coin amount:', error);
    return { success: false, message: 'An unexpected error occurred' };
  }
}

export async function removeCoinFromPortfolio(
  userId: string,
  portfolioItemId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const { error } = await supabase
      .from('user_portfolios')
      .delete()
      .eq('id', portfolioItemId)
      .eq('user_id', userId);
      
    if (error) throw error;
    return { success: true };
    
  } catch (error) {
    console.error('Error removing coin from portfolio:', error);
    return { success: false, message: 'An unexpected error occurred' };
  }
}

export async function updatePreferredCurrency(
  userId: string,
  portfolioItemId: string,
  currency: 'USD' | 'BTC'
): Promise<{ success: boolean; message?: string }> {
  try {
    const { error } = await supabase
      .from('user_portfolios')
      .update({ 
        preferred_currency: currency,
        updated_at: new Date().toISOString()
      })
      .eq('id', portfolioItemId)
      .eq('user_id', userId);
      
    if (error) throw error;
    return { success: true };
    
  } catch (error) {
    console.error('Error updating preferred currency:', error);
    return { success: false, message: 'An unexpected error occurred' };
  }
} 