import type { NextApiRequest, NextApiResponse } from 'next';

type CoinDataBatchResponse = {
  success: boolean;
  data?: Record<string, any>;
  error?: string;
}

// Simple in-memory store for rate limiting
// In production, use Redis or similar for distributed rate limiting
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 5; // Only 5 batch requests per minute (which can include up to 100 coins each)
const ipRequestCounts = new Map<string, { count: number; timestamp: number }>();

// Helper function to get client IP address
const getClientIp = (req: NextApiRequest): string => {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded 
    ? (typeof forwarded === 'string' ? forwarded : forwarded[0])
    : req.socket.remoteAddress || 'unknown';
  return typeof ip === 'string' ? ip : 'unknown';
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CoinDataBatchResponse>
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Basic rate limiting
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

  const { ids } = req.query;
  
  if (!ids) {
    return res.status(400).json({ success: false, error: 'IDs parameter is required' });
  }
  
  // Convert to array in case it's a string
  const coinIds = Array.isArray(ids) ? ids[0].split(',') : ids.split(',');
  
  if (coinIds.length === 0) {
    return res.status(400).json({ success: false, error: 'At least one ID must be provided' });
  }
  
  if (coinIds.length > 100) {
    return res.status(400).json({ 
      success: false, 
      error: 'Maximum of 100 IDs can be requested at once' 
    });
  }
  
  try {
    // Get API key from environment variable
    const apiKey = process.env.CMC_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ success: false, error: 'API key not configured' });
    }
    
    // Make request to CoinMarketCap
    const idString = coinIds.join(',');
    const response = await fetch(`https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?id=${idString}`, {
      headers: {
        'X-CMC_PRO_API_KEY': apiKey,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`CoinMarketCap API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.data) {
      return res.status(500).json({ success: false, error: 'Invalid response from CoinMarketCap' });
    }
    
    // Process the data into a more usable format
    const coinsData: Record<string, any> = {};
    
    for (const coinId of Object.keys(data.data)) {
      const coin = data.data[coinId];
      const usdQuote = coin.quote.USD;
      
      coinsData[coinId] = {
        id: coin.id.toString(),
        symbol: coin.symbol,
        name: coin.name,
        priceUsd: usdQuote.price,
        priceBtc: 0, // We'll calculate this if needed client-side
        priceChange24h: usdQuote.percent_change_24h || 0,
        marketCap: usdQuote.market_cap || 0,
        logoUrl: `https://s2.coinmarketcap.com/static/img/coins/64x64/${coin.id}.png`,
        chain: coin.platform?.name || 'Various',
        liquidity: usdQuote.volume_24h || 0,
        cmcRank: coin.cmc_rank,
        slug: coin.slug
      };
    }
    
    return res.status(200).json({ success: true, data: coinsData });
  } catch (error) {
    console.error('Error fetching batch coin data:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch coin data' });
  }
} 