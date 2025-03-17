import supabase from './supabase-client';
import { CoinData } from '@/types/portfolio';
import { GlobalData } from './coinmarketcap';

// Helper function to check if table exists (to avoid redundant checks)
let tableExistsCache: Record<string, boolean> = {};

/**
 * Check if a table exists without excessive querying
 */
async function checkTableExists(tableName: string): Promise<boolean> {
  // Return from cache if we've already checked
  if (tableExistsCache[tableName] !== undefined) {
    return tableExistsCache[tableName];
  }
  
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('count')
      .limit(1);
      
    const exists = !error || error.code !== '42P01';
    // Cache the result
    tableExistsCache[tableName] = exists;
    return exists;
  } catch (error) {
    // Cache negative result to avoid repeated failures
    tableExistsCache[tableName] = false;
    return false;
  }
}

/**
 * Fetch Bitcoin price from Supabase
 */
export async function getBtcPriceFromSupabase(): Promise<number> {
  try {
    // Check if table exists before proceeding
    const tableExists = await checkTableExists('crypto_market_data');
    if (!tableExists) {
      return 0;
    }
    
    // Query the data - don't use single() which causes errors when no rows are found
    const { data, error } = await supabase
      .from('crypto_market_data')
      .select('price_usd')
      .eq('symbol', 'BTC')
      .limit(1);

    if (error) {
      return 0;
    }
    
    // Check if we got any results
    if (!data || data.length === 0) {
      return 0;
    }
    
    // Return the first result's price
    return data[0]?.price_usd || 0;
  } catch (error) {
    return 0;
  }
}

/**
 * Fetch Ethereum price from Supabase
 */
export async function getEthPriceFromSupabase(): Promise<number> {
  try {
    // Check if table exists before proceeding
    const tableExists = await checkTableExists('crypto_market_data');
    if (!tableExists) {
      return 0;
    }
    
    // Query the data - don't use single() which causes errors when no rows are found
    const { data, error } = await supabase
      .from('crypto_market_data')
      .select('price_usd')
      .eq('symbol', 'ETH')
      .limit(1);

    if (error) {
      return 0;
    }
    
    // Check if we got any results
    if (!data || data.length === 0) {
      return 0;
    }
    
    // Return the first result's price
    return data[0]?.price_usd || 0;
  } catch (error) {
    return 0;
  }
}

/**
 * Calculate global market data from Supabase
 */
export async function getGlobalDataFromSupabase(): Promise<GlobalData> {
  try {
    // Check if table exists before proceeding
    const tableExists = await checkTableExists('crypto_market_data');
    if (!tableExists) {
      return {
        btcDominance: 0,
        ethDominance: 0,
        totalMarketCap: 0,
        totalVolume24h: 0
      };
    }
    
    // Get all market data needed for calculations
    const { data: marketData, error: marketError } = await supabase
      .from('crypto_market_data')
      .select('symbol, market_cap, volume_24h');

    if (marketError || !marketData || marketData.length === 0) {
      return {
        btcDominance: 0,
        ethDominance: 0,
        totalMarketCap: 0,
        totalVolume24h: 0
      };
    }

    // Calculate totals
    const totalMarketCap = marketData.reduce((sum, coin) => sum + (coin.market_cap || 0), 0);
    const totalVolume24h = marketData.reduce((sum, coin) => sum + (coin.volume_24h || 0), 0);
    
    // Find BTC and ETH data
    const btcData = marketData.find(coin => coin.symbol === 'BTC');
    const ethData = marketData.find(coin => coin.symbol === 'ETH');
    
    const btcMarketCap = btcData?.market_cap || 0;
    const ethMarketCap = ethData?.market_cap || 0;

    // Calculate dominance percentages
    const btcDominance = totalMarketCap > 0 ? (btcMarketCap / totalMarketCap) * 100 : 0;
    const ethDominance = totalMarketCap > 0 ? (ethMarketCap / totalMarketCap) * 100 : 0;

    return {
      btcDominance,
      ethDominance,
      totalMarketCap,
      totalVolume24h
    };
  } catch (error) {
    return {
      btcDominance: 0,
      ethDominance: 0,
      totalMarketCap: 0,
      totalVolume24h: 0
    };
  }
}

/**
 * Fetch coin data from Supabase
 */
export async function fetchCoinDataFromSupabase(coinId: string): Promise<CoinData | null> {
  try {
    // Check if table exists before proceeding
    const tableExists = await checkTableExists('crypto_market_data');
    if (!tableExists) {
      return null;
    }
    
    const { data, error } = await supabase
      .from('crypto_market_data')
      .select('*')
      .eq('id', coinId)
      .limit(1);

    if (error || !data || data.length === 0) {
      return null;
    }

    // Map to CoinData format
    const coinData: CoinData = {
      id: data[0].id,
      name: data[0].name,
      symbol: data[0].symbol,
      priceUsd: data[0].price_usd || 0,
      priceBtc: data[0].price_btc || 0,
      priceChange24h: data[0].price_change_24h || 0,
      marketCap: data[0].market_cap || 0,
      volume24h: data[0].volume_24h || 0,
      logoUrl: data[0].logo_url
    };

    return coinData;
  } catch (error) {
    return null;
  }
}

/**
 * Fetch multiple coins data from Supabase
 */
export async function fetchMultipleCoinsDataFromSupabase(coinIds: string[]): Promise<Record<string, CoinData>> {
  if (!coinIds || coinIds.length === 0) {
    return {};
  }

  try {
    // Check if table exists before proceeding
    const tableExists = await checkTableExists('crypto_market_data');
    if (!tableExists) {
      return {};
    }

    // Ensure all coinIds are strings and deduplicate them
    const uniqueCoinIds = Array.from(new Set(coinIds.map(id => String(id))));
    
    const { data, error } = await supabase
      .from('crypto_market_data')
      .select('id, name, symbol, price_usd, price_btc, price_change_24h, market_cap, volume_24h, logo_url')
      .in('id', uniqueCoinIds);

    if (error || !data || data.length === 0) {
      return {};
    }

    // Map to CoinData format
    const results: Record<string, CoinData> = {};
    data.forEach(coin => {
      results[coin.id] = {
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol,
        priceUsd: coin.price_usd || 0,
        priceBtc: coin.price_btc || 0,
        priceChange24h: coin.price_change_24h || 0,
        marketCap: coin.market_cap || 0,
        volume24h: coin.volume_24h || 0,
        logoUrl: coin.logo_url
      };
    });

    // Log which coins were missing if any
    const missingCoinIds = uniqueCoinIds.filter(id => !results[id]);
    if (missingCoinIds.length > 0) {
      console.warn(`Missing data for coins: ${missingCoinIds.join(', ')}`);
    }

    return results;
  } catch (error) {
    console.error('Error fetching multiple coins data from Supabase:', error);
    return {};
  }
}

/**
 * Get top coins from Supabase
 */
export async function getTopCoinsFromSupabase(limit: number = 100): Promise<CoinData[]> {
  try {
    const { data, error } = await supabase
      .from('crypto_market_data')
      .select('*')
      .order('market_cap', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error querying top coins:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Map to CoinData format
    return data.map(coin => ({
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol,
      priceUsd: coin.price_usd || 0,
      priceBtc: coin.price_btc || 0,
      priceChange24h: coin.price_change_24h || 0,
      marketCap: coin.market_cap || 0,
      volume24h: coin.volume_24h || 0,
      logoUrl: coin.logo_url
    }));
  } catch (error) {
    console.error('Error fetching top coins from Supabase:', error);
    return [];
  }
}

/**
 * Search coins from Supabase
 */
export async function searchCoinsFromSupabase(query: string, limit: number = 20): Promise<CoinData[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    // Get lowercase query for case-insensitive search
    const lowerQuery = query.toLowerCase();
    
    const { data, error } = await supabase
      .from('crypto_market_data')
      .select('*')
      .or(`name.ilike.%${lowerQuery}%,symbol.ilike.%${lowerQuery}%`)
      .order('market_cap', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error searching coins:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Map to CoinData format
    return data.map(coin => ({
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol,
      priceUsd: coin.price_usd || 0,
      priceBtc: coin.price_btc || 0,
      priceChange24h: coin.price_change_24h || 0,
      marketCap: coin.market_cap || 0,
      volume24h: coin.volume_24h || 0,
      logoUrl: coin.logo_url
    }));
  } catch (error) {
    console.error('Error searching coins from Supabase:', error);
    return [];
  }
} 