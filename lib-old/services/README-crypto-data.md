# Cryptocurrency Data Service

This directory contains services for fetching and managing cryptocurrency data using both Supabase and direct API calls.

## Architecture Overview

The system uses a multi-tier approach to cryptocurrency data:

1. **Primary Source: Supabase Database**: All cryptocurrency data is primarily fetched from the `crypto_market_data` table in Supabase
2. **Fallback: CoinMarketCap API**: If data is not available in Supabase, the system falls back to direct API calls
3. **Regular Updates: Background Job System**: A background job in the JobScheduler updates the Supabase table with fresh data

## Supabase Table Structure

The data is stored in the `crypto_market_data` table with the following structure:

| Column          | Type                     | Description                         |
|-----------------|--------------------------|-------------------------------------|
| id              | character varying        | Coin ID (from CoinMarketCap)        |
| symbol          | character varying        | Coin symbol (e.g., BTC, ETH)        |
| name            | character varying        | Full name (e.g., Bitcoin)           |
| price_usd       | numeric                  | Current price in USD                |
| price_btc       | numeric                  | Price in BTC terms                  |
| price_change_24h| numeric                  | 24-hour price change percentage     |
| market_cap      | numeric                  | Market capitalization               |
| volume_24h      | numeric                  | 24-hour trading volume             |
| cmc_rank        | integer                  | CoinMarketCap rank                  |
| logo_url        | character varying        | URL to the coin's logo              |
| last_updated    | timestamp with time zone | When the data was last updated      |

## Background Job Update Process

1. The `UPDATE_CRYPTO_MARKET_DATA` job runs every 30 minutes (configurable)
2. It fetches the top 200 coins from CoinMarketCap API
3. It upserts (updates existing or inserts new) the data into the Supabase table
4. The DataCacheProvider automatically fetches from this table when needed
5. The job is automatically rescheduled via the JobScheduler system

## Integration with Background Job System

The cryptocurrency data update is managed through the JobScheduler system, which provides:

1. **Job Tracking**: Jobs are tracked in the `background_jobs` table
2. **Error Handling**: Failed jobs are logged with error details
3. **Automatic Rescheduling**: Jobs are automatically rescheduled
4. **Status Reporting**: Job execution status is tracked and reported

### Scheduling the Initial Job

To schedule the initial cryptocurrency data update job, run:

```bash
# Run from project root
npx ts-node scripts/schedule-crypto-update.ts
```

## Service Files

### supabase-crypto.ts

This file contains functions for fetching cryptocurrency data from the Supabase table:

- `getBtcPriceFromSupabase()` - Get current Bitcoin price
- `getEthPriceFromSupabase()` - Get current Ethereum price
- `getGlobalDataFromSupabase()` - Calculate global market data from Supabase records
- `fetchCoinDataFromSupabase(coinId)` - Get data for a specific coin
- `fetchMultipleCoinsDataFromSupabase(coinIds)` - Get data for multiple coins
- `getTopCoinsFromSupabase(limit)` - Get top coins by market cap
- `searchCoinsFromSupabase(query)` - Search for coins by name or symbol

### coinmarketcap.ts

This file contains the original API service functions, now used as fallbacks:

- `getBtcPrice()` - Get Bitcoin price from API
- `getEthPrice()` - Get Ethereum price from API
- `getGlobalData()` - Get global market data from API
- `fetchCoinData(coinId)` - Get data for a specific coin from API
- `fetchMultipleCoinsData(coinIds)` - Get data for multiple coins from API

## API Endpoints

### update-crypto-data

- **URL**: `/api/update-crypto-data`
- **Method**: POST
- **Authentication**: Bearer token (CRON_API_KEY)
- **Purpose**: Updates the Supabase crypto_market_data table with fresh data
- **Schedule**: Runs daily at midnight UTC

## Environment Variables

The system requires the following environment variables:

- `CMC_API_KEY` - CoinMarketCap API key
- `CRON_API_KEY` - Secret key for authenticating cron job requests
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key for database access

## Benefits of This Approach

1. **API Usage Efficiency**: Drastically reduces the number of API calls to CoinMarketCap
2. **Consistent Data**: All parts of the application use the same data source
3. **Improved Performance**: Faster data fetching from Supabase vs API calls
4. **Better Reliability**: Falls back to API calls if Supabase data is unavailable
5. **Centralized Job Management**: Uses the existing background job infrastructure
6. **Automatic Failure Recovery**: Failed jobs are logged and tracked for debugging

## Integration with DataCacheProvider

The `DataCacheProvider` context has been updated to:

1. Primarily fetch data from Supabase
2. Fall back to API calls if Supabase data is missing or unavailable
3. Cache all data locally for improved performance
4. Refresh data on a 15-minute schedule or manual refresh

## Example Usage

```tsx
import { useDataCache } from '@/lib/context/data-cache-context';

function YourComponent() {
  const { 
    btcPrice, 
    ethPrice, 
    globalData, 
    getCoinData,
    getMultipleCoinsData,
    isLoading, 
    refreshData
  } = useDataCache();
  
  // The fetched data now comes from Supabase instead of API
  return (
    <div>
      <p>Bitcoin: ${btcPrice}</p>
      <p>BTC Dominance: {globalData?.btcDominance.toFixed(2)}%</p>
      <button onClick={refreshData}>Refresh</button>
    </div>
  );
}
``` 