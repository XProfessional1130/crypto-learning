import type { NextApiRequest, NextApiResponse } from 'next';

type CoinDataResponse = {
  success: boolean;
  data?: any;
  error?: string;
}

// Simple in-memory store for rate limiting
// In production, use Redis or similar for distributed rate limiting
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 20; // 20 requests per minute
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
  res: NextApiResponse<CoinDataResponse>
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

  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ success: false, error: 'ID parameter is required' });
  }
  
  // Convert id to string in case it's an array
  const coinId = Array.isArray(id) ? id[0] : id;
  
  try {
    // Get API key from environment variable - NO NEXT_PUBLIC prefix
    const apiKey = process.env.CMC_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ success: false, error: 'API key not configured' });
    }
    
    // Make request to CoinMarketCap
    const response = await fetch(`https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?id=${coinId}`, {
      headers: {
        'X-CMC_PRO_API_KEY': apiKey,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`CoinMarketCap API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.data || !data.data[coinId]) {
      return res.status(404).json({ success: false, error: 'Coin not found' });
    }
    
    const coin = data.data[coinId];
    const usdQuote = coin.quote.USD;
    
    const coinData = {
      id: coin.id.toString(),
      symbol: coin.symbol,
      name: coin.name,
      priceUsd: usdQuote.price,
      priceBtc: 0,
      priceChange24h: usdQuote.percent_change_24h || 0,
      marketCap: usdQuote.market_cap || 0,
      logoUrl: `https://s2.coinmarketcap.com/static/img/coins/64x64/${coin.id}.png`,
      chain: coin.platform?.name || 'Various',
      liquidity: usdQuote.volume_24h || 0,
      cmcRank: coin.cmc_rank,
      slug: coin.slug
    };
    
    return res.status(200).json({ success: true, data: coinData });
  } catch (error) {
    console.error('Error fetching coin data:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch coin data' });
  }
} 