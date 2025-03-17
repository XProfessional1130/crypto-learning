import { NextRequest, NextResponse } from 'next/server';

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
const getClientIp = (req: NextRequest): string => {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded 
    ? forwarded.split(',')[0]
    : 'unknown';
  return ip;
};

export async function GET(
  req: NextRequest
) {
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
      return NextResponse.json({ 
        success: false, 
        error: 'Rate limit exceeded. Please try again later.' 
      }, { status: 429 });
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
      console.error('CoinMarketCap API key not configured');
      return NextResponse.json({ success: false, error: 'API key not configured' }, { status: 500 });
    }
    
    // Make request to CoinMarketCap Global Metrics endpoint
    console.log('Fetching data from CoinMarketCap Global Metrics endpoint...');
    const response = await fetch('https://pro-api.coinmarketcap.com/v1/global-metrics/quotes/latest', {
      headers: {
        'X-CMC_PRO_API_KEY': apiKey,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Could not read error response');
      console.error(`CoinMarketCap API error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`CoinMarketCap API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.data) {
      console.error('Invalid response from CoinMarketCap:', data);
      return NextResponse.json({ success: false, error: 'Invalid response from CoinMarketCap' }, { status: 500 });
    }
    
    // Log the received data for debugging
    console.log('CoinMarketCap response data structure:', {
      btc_dominance_exists: 'btc_dominance' in data.data,
      eth_dominance_exists: 'eth_dominance' in data.data,
      btc_dominance_value: data.data.btc_dominance,
      eth_dominance_value: data.data.eth_dominance,
    });
    
    // Extract the data we need
    const globalData = {
      btcDominance: data.data.btc_dominance ?? 0,
      ethDominance: data.data.eth_dominance ?? 0,
      totalMarketCap: data.data.quote?.USD?.total_market_cap ?? 0,
      totalVolume24h: data.data.quote?.USD?.total_volume_24h ?? 0
    };
    
    console.log('Sending global market data to client:', globalData);
    return NextResponse.json({ success: true, data: globalData }, { status: 200 });
  } catch (error) {
    console.error('Error fetching global data:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch global market data' }, { status: 500 });
  }
} 