import { createClient } from '@supabase/supabase-js';
import { PortfolioItem, PortfolioItemWithPrice, PortfolioSummary } from '@/types/portfolio';
import { getCoinData, getMultipleCoinsData, getBtcPrice } from './coinmarketcap';

const PORTFOLIO_LIMIT = 30;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getUserPortfolio(userId: string): Promise<PortfolioSummary> {
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
    
    // Get all coin prices - ensure IDs are strings
    const coinIds = portfolioItems.map(item => String(item.coin_id));
    const coinsData = await getMultipleCoinsData(coinIds);
    
    let totalValueUsd = 0;
    let totalValueBtc = 0;
    let totalPrevValueUsd = 0;
    let totalPrevValueBtc = 0;
    
    const items: PortfolioItemWithPrice[] = portfolioItems.map(item => {
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
        userId: item.user_id,
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
  if (!userId || !coinId || amount <= 0) {
    console.error('Invalid input for addCoinToPortfolio:', { userId, coinId, amount });
    return { success: false, message: 'Invalid input parameters' };
  }

  // Ensure coinId is a string (sometimes IDs can be passed as numbers)
  const coinIdString = String(coinId);
  
  try {
    console.log(`Adding coin ${coinIdString} to portfolio for user ${userId}`);
    
    // Check portfolio limit
    const { count, error: countError } = await supabase
      .from('user_portfolios')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    if (countError) {
      console.error('Error counting portfolio items:', countError);
      return { success: false, message: 'Failed to check portfolio limit' };
    }
      
    if (count && count >= PORTFOLIO_LIMIT) {
      return { success: false, message: 'Portfolio limit of 30 coins reached' };
    }
    
    // Check if coin already exists - using maybeSingle() instead of single() to handle empty results better
    const { data: existingCoin, error: existingError } = await supabase
      .from('user_portfolios')
      .select('*')
      .eq('user_id', userId)
      .eq('coin_id', coinIdString)
      .maybeSingle();
    
    if (existingError) {
      console.error('Error checking for existing coin:', existingError);
      return { success: false, message: 'Failed to check if coin already exists' };
    }
      
    if (existingCoin) {
      console.log(`Coin ${coinIdString} already exists, updating amount`);
      // Update existing coin amount
      const { error: updateError } = await supabase
        .from('user_portfolios')
        .update({ 
          amount: existingCoin.amount + amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingCoin.id);
        
      if (updateError) {
        console.error('Error updating existing coin:', updateError);
        return { success: false, message: 'Failed to update coin amount' };
      }
      return { success: true };
    }
    
    // Get coin data
    console.log(`Fetching data for coin ${coinIdString}`);
    const coinData = await getCoinData(coinIdString);
    if (!coinData) {
      console.error(`Failed to fetch data for coin ${coinIdString}`);
      return { success: false, message: 'Failed to fetch coin data' };
    }
    
    // Add new coin
    console.log(`Adding new coin to portfolio: ${coinData.symbol}`);
    const { error: insertError } = await supabase
      .from('user_portfolios')
      .insert({
        user_id: userId,
        coin_id: coinIdString,
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