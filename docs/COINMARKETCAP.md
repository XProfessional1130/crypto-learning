# CoinMarketCap API Integration

This project uses the CoinMarketCap API for fetching cryptocurrency data. The integration provides several key features:

- Searching for coins by name or symbol
- Fetching detailed coin information
- Getting current prices and market data
- Supporting portfolio valuation

## API Key Management

The CoinMarketCap API key is stored in the environment variables:

- Development: stored in `.env.local` as `NEXT_PUBLIC_CMC_API_KEY`
- Production: should be set in the hosting environment (e.g., Vercel environment variables)

## Architecture

The CoinMarketCap API is accessed through a server-side proxy to avoid CORS issues and protect the API key:

1. **Client-side service** (`/lib/services/coinmarketcap.ts`): Provides functions for the frontend components to use
2. **Server-side API routes**:
   - `/pages/api/coin-search.ts`: Handles searching for coins 
   - `/pages/api/coin-data.ts`: Fetches data for specific coins

This proxy approach offers several benefits:
- Avoids CORS issues that occur with direct client-side API access
- Better protects the API key from being exposed in client code
- Allows for server-side caching and rate limiting

## Rate Limits

CoinMarketCap has rate limits that should be respected:

- Basic plan: 10,000 credits per month
- Credit usage varies by endpoint

## Implementation Details

The implementation includes:
- Caching to reduce API calls for frequent requests
- Error handling to manage API failures gracefully
- Data transformation to match our application's data models

## Endpoints Used

1. `/cryptocurrency/listings/latest`: For searching and listing coins
2. `/cryptocurrency/quotes/latest`: For getting detailed coin data

## Error Handling

The service includes error handling to manage API failures gracefully:
- Network errors
- Rate limiting
- Invalid data

## Future Improvements

Potential improvements to consider:
- Implement more comprehensive server-side caching
- Add support for more CoinMarketCap endpoints
- Set up rate limiting on our API routes to prevent abuse 