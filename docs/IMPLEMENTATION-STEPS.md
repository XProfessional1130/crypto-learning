# API Optimization Implementation Steps

This document provides step-by-step instructions to implement the API optimization system we've created.

## What We've Built

1. **Database-Backed Cache System** (`lib/services/cache-service.ts`)
   - Stores API responses in Supabase for shared access across users
   - Configurable TTL for different data types
   - Automatic expiration handling

2. **Background Job System** (`lib/services/job-scheduler.ts`)
   - Schedules and executes jobs to proactively refresh data
   - Automatically retries failed jobs
   - Handles different job types with custom schedules

3. **Request Batching** (`lib/services/coinmarketcap.ts`)
   - Combines multiple coin requests into single API calls
   - Reduces redundant API calls through queueing

4. **API Endpoint Optimization**
   - Updated `pages/api/coin-list.ts` to use the database cache
   - Other endpoints pending updates

## Implementation Steps

### Step 1: Deploy the Database Changes

1. **Option A**: Run migrations if you have Supabase CLI set up:
   ```bash
   npx supabase migration up
   ```

2. **Option B**: Run the initialization script that creates tables:
   ```bash
   npx ts-node scripts/init-jobs-with-tables.ts
   ```

### Step 2: Update Environment Variables

Add these environment variables to your project (both locally and in Vercel):

```
JOBS_API_SECRET=your_random_secret_here
```

You should already have:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
CMC_API_KEY=your_coinmarketcap_api_key
```

### Step 3: Set Up the Scheduler

Follow the instructions in `docs/SCHEDULER-SETUP.md` to:
1. Set up a Vercel CRON job, or
2. Set up an external scheduling service

### Step 4: Test the System

Run the manual testing CLI:
```bash
npx ts-node scripts/process-jobs-cli.ts
```

This will:
1. Process any pending jobs
2. Show the status of recent jobs
3. Create helper functions in the database if needed

### Step 5: Complete the API Endpoint Updates

We've updated `pages/api/coin-list.ts`, but you should also update:

1. `pages/api/coin-data.ts`
2. `pages/api/coin-search.ts`
3. `pages/api/coin-data-batch.ts`
4. `pages/api/global-data.ts`

Use the pattern from `coin-list.ts` as a template, specifically:

```typescript
// Try to get from cache first
const cachedData = await CacheService.get<DataType>(
  cacheKey, 
  CacheService.SOURCES.COIN_MARKET_CAP
);

if (cachedData) {
  return res.status(200).json({ success: true, data: cachedData });
}

// Cache miss - fetch from API
// ... API call code ...

// Store in database cache
await CacheService.set(
  cacheKey, 
  data, 
  CacheService.SOURCES.COIN_MARKET_CAP,
  ttlMinutes
);
```

### Step 6: Monitor and Optimize

After deploying:

1. Monitor the `background_jobs` table for job status
2. Check the `api_cache` table for cache hit rates
3. Adjust TTL values and job frequencies as needed

## Troubleshooting

### If Jobs Are Not Running

1. Check Vercel logs for the CRON job
2. Make sure the `JOBS_API_SECRET` matches between your environment and the CRON job configuration
3. Verify the service role key has the necessary permissions in Supabase

### If Cache Is Not Working

1. Check database permissions for the `api_cache` table
2. Verify that the cache service is correctly importing and initializing
3. Look for error logs in your application

## Next Steps

Once the basic system is working, consider these improvements:

1. Add a Redis cache layer for even faster responses
2. Implement analytics to track cache hit rates
3. Add more sophisticated prefetching based on user behavior 