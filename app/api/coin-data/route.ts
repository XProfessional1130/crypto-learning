import { NextRequest, NextResponse } from 'next/server';

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

  // Get the ID from URL search params
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  
  if (!id) {
    return NextResponse.json({ success: false, error: 'ID parameter is required' }, { status: 400 });
  }
  
  // Convert id to string in case it's an array
  const coinId = id;
  
  try {
    // Get API key from environment variable - NO NEXT_PUBLIC prefix
    const apiKey = process.env.CMC_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'API key not configured' }, { status: 500 });
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
      return NextResponse.json({ success: false, error: 'Coin not found' }, { status: 404 });
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
    
    return NextResponse.json({ success: true, data: coinData }, { status: 200 });
  } catch (error) {
    console.error('Error fetching coin data:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch coin data' }, { status: 500 });
  }
} 