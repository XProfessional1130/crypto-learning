# CoinMarketCap API Integration

This project uses the CoinMarketCap API for fetching cryptocurrency data. The integration provides several key features:

- Searching for coins by name or symbol
- Fetching detailed coin information
- Getting current prices and market data
- Supporting portfolio valuation

## API Key Management

The CoinMarketCap API key is stored in the environment variables:

- Development: stored in `.env.local` as `CMC_API_KEY` (server-side only)
- Production: should be set in the hosting environment (e.g., Vercel environment variables)

> **Important Security Note**: The API key is intentionally NOT prefixed with `NEXT_PUBLIC_` to ensure it remains server-side only and is not exposed to the client.

## Architecture

The CoinMarketCap API is accessed through a server-side proxy to avoid CORS issues and protect the API key:

1. **Client-side service** (`/lib/services/coinmarketcap.ts`): Provides functions for the frontend components to use
2. **Server-side API routes with security measures**:
   - `/pages/api/coin-search.ts`: Handles searching for coins 
   - `/pages/api/coin-data.ts`: Fetches data for specific coins
   - Both endpoints implement rate limiting to prevent abuse

This proxy approach offers several benefits:
- Avoids CORS issues that occur with direct client-side API access
- Keeps the API key secure by preventing client-side access
- Allows for server-side caching and rate limiting
- Protects against API abuse through rate limiting

## Rate Limits

Two levels of rate limiting are implemented:

1. **Internal rate limiting**: 
   - Coin search: 10 requests per minute per IP
   - Coin data: 20 requests per minute per IP

2. **CoinMarketCap rate limits**:
   - Basic plan: 10,000 credits per month
   - Credit usage varies by endpoint

## Implementation Details

The implementation includes:
- Server-side only API key access
- Rate limiting to prevent abuse
- Client IP tracking for security
- Caching to reduce API calls for frequent requests
- Error handling to manage API failures gracefully

## Endpoints Used

1. `/cryptocurrency/listings/latest`: For searching and listing coins
2. `/cryptocurrency/quotes/latest`: For getting detailed coin data

## Error Handling

The service includes error handling to manage API failures gracefully:
- Network errors
- Rate limiting (both internal and CMC)
- Invalid data
- Missing API keys

## Future Improvements

Potential improvements to consider:
- Implement more comprehensive server-side caching
- Add support for more CoinMarketCap endpoints
- Replace in-memory rate limiting with Redis for distributed deployments
- Add request logging for security auditing 