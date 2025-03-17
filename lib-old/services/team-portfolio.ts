import { PortfolioItemWithPrice, PortfolioSummary, CoinData } from '@/types/portfolio';
import { getMultipleCoinsData, fetchMultipleCoinsData } from './coinmarketcap';
import supabase from './supabase-client';

// Admin ID is still needed for checking permissions
const TEAM_ADMIN_ID = process.env.NEXT_PUBLIC_TEAM_ADMIN_ID || '529cfde5-d8c3-4a6a-a9dc-5bb67fb039b5';

/**
 * Fetch the team portfolio from the dedicated team_portfolio table
 */
export async function getTeamPortfolio(): Promise<PortfolioSummary> {
  try {
    console.log('Attempting to fetch team portfolio from team_portfolio table');
    
    // Check if team_portfolio table exists by making a small query
    const { data: tableCheckData, error: tableCheckError } = await supabase
      .from('team_portfolio')
      .select('id')
      .limit(1);
    
    if (tableCheckError) {
      console.error('Error checking team_portfolio table:', tableCheckError);
      console.log('The team_portfolio table may not exist yet. Please run the database migrations.');
      
      // Return empty portfolio
      return createEmptyPortfolio();
    }
    
    console.log('Connected to team_portfolio table successfully');
    
    // Fetch all portfolio items from the team_portfolio table
    const { data: portfolioItems, error } = await supabase
      .from('team_portfolio')
      .select('*');
      
    if (error) {
      console.error('Error fetching team portfolio items:', error);
      return createEmptyPortfolio();
    }
    
    if (!portfolioItems || portfolioItems.length === 0) {
      console.log('No portfolio items found in the team portfolio.');
    }
    
    return processPortfolioItems(portfolioItems || []);
    
  } catch (error) {
    console.error('Error fetching team portfolio:', error);
    return createEmptyPortfolio();
  }
}

/**
 * Add a coin to the team portfolio
 * Only admin users can call this function successfully
 */
export async function addCoinToTeamPortfolio(coinData: CoinData, amount: number): Promise<{success: boolean, message: string}> {
  try {
    // Verify the user is the admin
    const session = await supabase.auth.getSession();
    const currentUserId = session.data.session?.user?.id;
    
    if (!currentUserId || currentUserId !== TEAM_ADMIN_ID) {
      console.error('Only the admin can modify the team portfolio');
      return { success: false, message: 'Only the admin can modify the team portfolio' };
    }
    
    // Insert the coin into the team portfolio
    const { data, error } = await supabase
      .from('team_portfolio')
      .insert({
        coin_id: coinData.id,
        coin_symbol: coinData.symbol,
        coin_name: coinData.name,
        amount: amount,
        preferred_currency: 'USD'
      })
      .select('*')
      .single();
      
    if (error) {
      console.error('Error adding coin to team portfolio:', error);
      return { success: false, message: 'Failed to add coin to team portfolio' };
    }
    
    return { success: true, message: 'Coin added to team portfolio successfully' };
    
  } catch (error) {
    console.error('Error adding coin to team portfolio:', error);
    return { success: false, message: 'An unexpected error occurred' };
  }
}

/**
 * Update a coin's amount in the team portfolio
 * Only admin users can call this function successfully
 */
export async function updateTeamPortfolioCoinAmount(itemId: string, amount: number): Promise<{success: boolean, message: string}> {
  try {
    // Verify the user is the admin
    const session = await supabase.auth.getSession();
    const currentUserId = session.data.session?.user?.id;
    
    if (!currentUserId || currentUserId !== TEAM_ADMIN_ID) {
      console.error('Only the admin can modify the team portfolio');
      return { success: false, message: 'Only the admin can modify the team portfolio' };
    }
    
    // Update the coin amount
    const { data, error } = await supabase
      .from('team_portfolio')
      .update({ amount })
      .eq('id', itemId)
      .select('*')
      .single();
      
    if (error) {
      console.error('Error updating coin in team portfolio:', error);
      return { success: false, message: 'Failed to update coin in team portfolio' };
    }
    
    return { success: true, message: 'Coin updated in team portfolio successfully' };
    
  } catch (error) {
    console.error('Error updating coin in team portfolio:', error);
    return { success: false, message: 'An unexpected error occurred' };
  }
}

/**
 * Remove a coin from the team portfolio
 * Only admin users can call this function successfully
 */
export async function removeFromTeamPortfolio(itemId: string): Promise<{success: boolean, message: string}> {
  try {
    // Verify the user is the admin
    const session = await supabase.auth.getSession();
    const currentUserId = session.data.session?.user?.id;
    
    if (!currentUserId || currentUserId !== TEAM_ADMIN_ID) {
      console.error('Only the admin can modify the team portfolio');
      return { success: false, message: 'Only the admin can modify the team portfolio' };
    }
    
    // Delete the coin from the team portfolio
    const { error } = await supabase
      .from('team_portfolio')
      .delete()
      .eq('id', itemId);
      
    if (error) {
      console.error('Error removing coin from team portfolio:', error);
      return { success: false, message: 'Failed to remove coin from team portfolio' };
    }
    
    return { success: true, message: 'Coin removed from team portfolio successfully' };
    
  } catch (error) {
    console.error('Error removing coin from team portfolio:', error);
    return { success: false, message: 'An unexpected error occurred' };
  }
}

/**
 * Creates an empty portfolio object
 */
function createEmptyPortfolio(): PortfolioSummary {
  return {
    totalValueUsd: 0,
    totalValueBtc: 0,
    dailyChangePercentage: 0,
    dailyChangeUsd: 0,
    dailyChangeBtc: 0,
    items: []
  };
}

/**
 * Process portfolio items and calculate totals
 */
async function processPortfolioItems(portfolioItems: any[]): Promise<PortfolioSummary> {
  if (!portfolioItems || portfolioItems.length === 0) {
    console.log('No portfolio items found in team portfolio.');
    return createEmptyPortfolio();
  }
  
  // Get all coin prices - ensure IDs are strings
  const coinIds = portfolioItems.map(item => String(item.coin_id));
  const coinsData = await fetchMultipleCoinsData(coinIds);
  
  let totalValueUsd = 0;
  let totalValueBtc = 0;
  let totalPrevValueUsd = 0;
  let totalPrevValueBtc = 0;
  
  const items: PortfolioItemWithPrice[] = portfolioItems.map((item: any) => {
    // Ensure we're looking up with a string ID
    const coinStringId = String(item.coin_id);
    const coinData = coinsData[coinStringId];
    const valueUsd = item.amount * (coinData?.priceUsd || 0);
    const valueBtc = item.amount * (coinData?.priceBtc || 0);
    const prevValueUsd = valueUsd / (1 + (coinData?.priceChange24h || 0) / 100);
    const prevValueBtc = valueBtc / (1 + (coinData?.priceChange24h || 0) / 100);
    
    totalValueUsd += valueUsd;
    totalValueBtc += valueBtc;
    totalPrevValueUsd += prevValueUsd;
    totalPrevValueBtc += prevValueBtc;
    
    return {
      id: item.id,
      userId: TEAM_ADMIN_ID, // Use the admin ID as the userId to satisfy the type
      coinId: item.coin_id,
      coinSymbol: item.coin_symbol,
      coinName: item.coin_name,
      amount: item.amount,
      preferredCurrency: item.preferred_currency as 'USD' | 'BTC',
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      priceUsd: coinData?.priceUsd || 0,
      priceBtc: coinData?.priceBtc || 0,
      valueUsd,
      valueBtc,
      priceChange24h: coinData?.priceChange24h || 0,
      percentage: 0, // Will be calculated after total is known
      marketCap: coinData?.marketCap || 0,
      logoUrl: coinData?.logoUrl
    };
  });
  
  // Calculate daily change
  const dailyChangeUsd = totalValueUsd - totalPrevValueUsd;
  const dailyChangeBtc = totalValueBtc - totalPrevValueBtc;
  const dailyChangePercentage = totalPrevValueUsd > 0 
    ? ((totalValueUsd - totalPrevValueUsd) / totalPrevValueUsd) * 100 
    : 0;
  
  // Calculate percentages
  items.forEach(item => {
    item.percentage = totalValueUsd > 0 ? (item.valueUsd / totalValueUsd) * 100 : 0;
  });
  
  return {
    totalValueUsd,
    totalValueBtc,
    dailyChangePercentage,
    dailyChangeUsd,
    dailyChangeBtc,
    items
  };
}

/**
 * Process portfolio items using the DataCacheProvider 
 * This should be used in React components
 * 
 * Example usage in a component:
 * 
 * ```tsx
 * import { useEffect, useState } from 'react'; 
 * import { useDataCache } from '@/lib/context/data-cache-context';
 * import { processTeamPortfolioWithCache } from '@/lib/services/team-portfolio';
 * 
 * function PortfolioComponent() {
 *   const [portfolio, setPortfolio] = useState(null);
 *   const { getMultipleCoinsData } = useDataCache();
 *   
 *   useEffect(() => {
 *     async function loadPortfolio() {
 *       const { data: portfolioItems } = await supabase.from('team_portfolio').select('*');
 *       const processedPortfolio = await processTeamPortfolioWithCache(portfolioItems, getMultipleCoinsData);
 *       setPortfolio(processedPortfolio);
 *     }
 *     
 *     loadPortfolio();
 *   }, [getMultipleCoinsData]);
 *   
 *   // Render portfolio
 * }
 * ```
 */
export async function processTeamPortfolioWithCache(
  portfolioItems: any[], 
  getCoinsDataFn: (coinIds: string[]) => Promise<Record<string, CoinData>>
): Promise<PortfolioSummary> {
  if (!portfolioItems || portfolioItems.length === 0) {
    return createEmptyPortfolio();
  }
  
  // Get all coin prices using the provided function (from DataCacheProvider)
  const coinIds = portfolioItems.map(item => String(item.coin_id));
  const coinsData = await getCoinsDataFn(coinIds);
  
  let totalValueUsd = 0;
  let totalValueBtc = 0;
  let totalPrevValueUsd = 0;
  let totalPrevValueBtc = 0;
  
  const items: PortfolioItemWithPrice[] = portfolioItems.map((item: any) => {
    // Ensure we're looking up with a string ID
    const coinStringId = String(item.coin_id);
    const coinData = coinsData[coinStringId];
    const valueUsd = item.amount * (coinData?.priceUsd || 0);
    const valueBtc = item.amount * (coinData?.priceBtc || 0);
    const prevValueUsd = valueUsd / (1 + (coinData?.priceChange24h || 0) / 100);
    const prevValueBtc = valueBtc / (1 + (coinData?.priceChange24h || 0) / 100);
    
    totalValueUsd += valueUsd;
    totalValueBtc += valueBtc;
    totalPrevValueUsd += prevValueUsd;
    totalPrevValueBtc += prevValueBtc;
    
    return {
      id: item.id,
      userId: TEAM_ADMIN_ID,
      coinId: item.coin_id,
      coinSymbol: item.coin_symbol,
      coinName: item.coin_name,
      amount: item.amount,
      preferredCurrency: item.preferred_currency as 'USD' | 'BTC',
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      priceUsd: coinData?.priceUsd || 0,
      priceBtc: coinData?.priceBtc || 0,
      valueUsd,
      valueBtc,
      priceChange24h: coinData?.priceChange24h || 0,
      percentage: 0,
      marketCap: coinData?.marketCap || 0,
      logoUrl: coinData?.logoUrl
    };
  });
  
  // Calculate daily change
  const dailyChangeUsd = totalValueUsd - totalPrevValueUsd;
  const dailyChangeBtc = totalValueBtc - totalPrevValueBtc;
  const dailyChangePercentage = totalPrevValueUsd > 0 
    ? ((totalValueUsd - totalPrevValueUsd) / totalPrevValueUsd) * 100 
    : 0;
  
  // Calculate percentages
  items.forEach(item => {
    item.percentage = totalValueUsd > 0 ? (item.valueUsd / totalValueUsd) * 100 : 0;
  });
  
  return {
    totalValueUsd,
    totalValueBtc,
    dailyChangePercentage,
    dailyChangeUsd,
    dailyChangeBtc,
    items
  };
} 