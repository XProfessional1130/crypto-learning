import type { NextApiRequest, NextApiResponse } from 'next';

type GlobalDataResponse = {
  success: boolean;
  data?: {
    btcDominance: number;
    ethDominance: number;
    totalMarketCap: number;
    totalVolume24h: number;
  };
  error?: string;
}

// Simple in-memory store for rate limiting
// In production, use Redis or similar for distributed rate limiting
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 10; // 10 requests per minute
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
  res: NextApiResponse<GlobalDataResponse>
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
  
  try {
    // Get API key from environment variable
    const apiKey = process.env.CMC_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ success: false, error: 'API key not configured' });
    }
    
    // Make request to CoinMarketCap Global Metrics endpoint
    const response = await fetch('https://pro-api.coinmarketcap.com/v1/global-metrics/quotes/latest', {
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
    
    // Extract the data we need
    const globalData = {
      btcDominance: data.data.btc_dominance || 0,
      ethDominance: data.data.eth_dominance || 0,
      totalMarketCap: data.data.quote?.USD?.total_market_cap || 0,
      totalVolume24h: data.data.quote?.USD?.total_volume_24h || 0
    };
    
    return res.status(200).json({ success: true, data: globalData });
  } catch (error) {
    console.error('Error fetching global data:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch global market data' });
  }
} 