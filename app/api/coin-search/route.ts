import { NextRequest, NextResponse } from 'next/server';

type CoinSearchResponse = {
  success: boolean;
  data?: any[];
  error?: string;
}

// Simple in-memory store for rate limiting
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

  const url = new URL(req.url);
  const query = url.searchParams.get('query');
  
  if (!query) {
    return NextResponse.json({ success: false, error: 'Query parameter is required' }, { status: 400 });
  }
  
  try {
    // Get API key from environment variable
    const apiKey = process.env.CMC_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'API key not configured' }, { status: 500 });
    }
    
    // Make request to CoinMarketCap
    const response = await fetch(`https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=500`, {
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
      return NextResponse.json({ success: false, error: 'Invalid response from CoinMarketCap' }, { status: 500 });
    }
    
    // Filter results by query (case insensitive)
    const searchQuery = query.toLowerCase();
    const results = data.data
      .filter((coin: any) => {
        const name = (coin.name || '').toLowerCase();
        const symbol = (coin.symbol || '').toLowerCase();
        const slug = (coin.slug || '').toLowerCase();
        
        return name.includes(searchQuery) || 
               symbol.includes(searchQuery) || 
               slug.includes(searchQuery);
      })
      .slice(0, 20) // Limit to top 20 matches
      .map((coin: any) => {
        const usdQuote = coin.quote.USD;
        
        return {
          id: coin.id.toString(),
          symbol: coin.symbol,
          name: coin.name,
          priceUsd: usdQuote.price,
          priceChange24h: usdQuote.percent_change_24h || 0,
          marketCap: usdQuote.market_cap || 0,
          volume24h: usdQuote.volume_24h || 0,
          cmcRank: coin.cmc_rank,
          slug: coin.slug,
          logoUrl: `https://s2.coinmarketcap.com/static/img/coins/64x64/${coin.id}.png`
        };
      });
    
    return NextResponse.json({ success: true, data: results }, { status: 200 });
  } catch (error) {
    console.error('Error searching coins:', error);
    return NextResponse.json({ success: false, error: 'Failed to search coins' }, { status: 500 });
  }
} 