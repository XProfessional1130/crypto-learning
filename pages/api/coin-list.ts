import { NextApiRequest, NextApiResponse } from 'next';
import { CoinData } from '@/types/portfolio';
import { getClientIp } from '@/lib/utils/api-helpers';
import { CacheService } from '@/lib/services/cache-service';

// Define response type
interface CoinListResponse {
  success: boolean;
  data?: CoinData[];
  error?: string;
}

// Rate limiting parameters
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds
const MAX_REQUESTS_PER_WINDOW = 10;  // 10 requests per minute

// Store request counts by IP
const ipRequestCounts = new Map<string, { count: number; timestamp: number }>();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CoinListResponse>
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Basic rate limiting with a longer window and stricter limit
  const clientIp = getClientIp(req);
  const now = Date.now();
  const clientRateLimit = ipRequestCounts.get(clientIp);
  
  // Reset count if window has expired
  if (clientRateLimit && now - clientRateLimit.timestamp > RATE_LIMIT_WINDOW) {
    ipRequestCounts.set(clientIp, { count: 1, timestamp: now });
  } 
  // Increment count if exists
  else if (clientRateLimit) {
    // Check if rate limit exceeded
    if (clientRateLimit.count >= MAX_REQUESTS_PER_WINDOW) {
      return res.status(429).json({ 
        success: false, 
        error: 'Rate limit exceeded. Please try again later.' 
      });
    }
    
    clientRateLimit.count += 1;
  } 
  // Initialize new client
  else {
    ipRequestCounts.set(clientIp, { count: 1, timestamp: now });
  }

  try {
    // Get limit from query params or default to 100
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
    // Make sure limit is reasonable
    const safeLimit = Math.min(Math.max(limit, 10), 200);
    
    // Create a cache key based on the limit
    const cacheKey = `coin_list_${safeLimit}`;
    
    // Try to get from cache first - cache for 30 minutes (slightly higher than in-memory cache)
    const cachedData = await CacheService.get<CoinData[]>(
      cacheKey, 
      CacheService.SOURCES.COIN_MARKET_CAP
    );
    
    if (cachedData) {
      console.log(`Serving coin list from database cache (limit: ${safeLimit})`);
      return res.status(200).json({ success: true, data: cachedData });
    }
    
    // Cache miss - fetch from CoinMarketCap API
    console.log(`Cache miss for coin list (limit: ${safeLimit}), fetching from CoinMarketCap`);
    
    // Get API key from environment variable
    const apiKey = process.env.CMC_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ success: false, error: 'API key not configured' });
    }
    
    // Make request to CoinMarketCap
    const response = await fetch(`https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=${safeLimit}`, {
      headers: {
        'X-CMC_PRO_API_KEY': apiKey,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`CoinMarketCap API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.data || !Array.isArray(data.data)) {
      return res.status(500).json({ success: false, error: 'Invalid response from CoinMarketCap' });
    }
    
    // Map to our CoinData format
    const coinList = data.data.map((coin: any) => {
      const usdQuote = coin.quote.USD;
      
      return {
        id: coin.id.toString(),
        symbol: coin.symbol,
        name: coin.name,
        priceUsd: usdQuote.price,
        priceBtc: 0, // CMC doesn't directly provide this
        priceChange24h: usdQuote.percent_change_24h || 0,
        marketCap: usdQuote.market_cap || 0,
        logoUrl: `https://s2.coinmarketcap.com/static/img/coins/64x64/${coin.id}.png`,
        chain: coin.platform?.name || 'Various',
        liquidity: usdQuote.volume_24h || 0,
        cmcRank: coin.cmc_rank,
        slug: coin.slug
      };
    });
    
    // Store in database cache
    await CacheService.set(
      cacheKey, 
      coinList, 
      CacheService.SOURCES.COIN_MARKET_CAP,
      30 // Cache for 30 minutes
    );
    
    return res.status(200).json({ success: true, data: coinList });
  } catch (error) {
    console.error('Error fetching coin list:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch coin list' });
  }
} 