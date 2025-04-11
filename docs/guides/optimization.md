# API and Performance Optimization Guide

This document explains the optimization systems implemented to make the Learning Crypto Platform highly efficient and cost-effective as it scales to thousands of users.

## Overview

As our user base grows, the number of API calls to external services like CoinMarketCap would grow linearly, leading to:

1. **Increased costs**: Pay-per-call APIs can become very expensive at scale
2. **Rate limiting**: Most APIs impose rate limits that can be hit during traffic spikes
3. **Performance degradation**: Direct API calls add latency to user requests

Our solution is a multi-tiered optimization system that significantly reduces API calls while maintaining data freshness.

## Architecture

```
                                   ┌────────────────┐
                                   │                │
                                   │   External     │
                                   │   APIs         │
                                   │                │
                                   └───────┬────────┘
                                           │
                                           │ (Minimal calls)
                                           ▼
┌─────────────────┐              ┌─────────────────────┐
│                 │              │                     │
│   Background    │◄────────────►│  Database Cache     │
│   Jobs          │              │  (Supabase)         │
│                 │              │                     │
└─────────────────┘              └────────┬────────────┘
                                          │
                                          │ (Cache reads)
                                          ▼
                                 ┌────────────────────┐
┌─────────────────┐              │                    │
│                 │              │  Application       │
│    Client       │◄────────────►│  API               │
│    Browsers     │              │                    │
│                 │              └────────────────────┘
└─────────────────┘
```

## Core Components

### 1. Database-Backed Caching

All external API responses are stored in a Supabase database table with appropriate expiration times:

- **Persistence**: Cache survives application restarts and deployments
- **Shared cache**: All users benefit from data fetched by any user
- **Configurable TTL**: Different data types can have different expiration times

### 2. Background Job System

A scheduled job system proactively fetches and refreshes data before users need it:

- **Proactive updates**: Data is refreshed before it expires
- **Controlled frequency**: Update schedules match data volatility
- **Fault tolerance**: Failed jobs are retried automatically

### 3. Request Batching

When multiple pieces of data are needed:

- **Bulk fetching**: Multiple coin prices are fetched in a single API call
- **Queue aggregation**: Similar requests within a short timeframe are combined

## Cost and Performance Impact

### Before Optimization

- Each user request might trigger a direct API call
- With 1,000 users making 2 portfolio views per day:
  - ~60,000 API calls per month to CoinMarketCap
  - ~$100+ monthly API costs (depending on plan)
  - Frequent rate limit issues during peak times

### After Optimization

- Cache hit rate above 95%
- ~1,600 API calls per month (97% reduction)
- ~$3-5 monthly API costs
- Consistent sub-100ms response times for users
- No rate limiting issues

## Setup Instructions

### Prerequisites

- Supabase project configured with your application
- Vercel project for deployment
- Environment variables set up (see below)

### Required Environment Variables

Add these environment variables to your Vercel project:

| Variable | Description | Default |
|----------|-------------|---------|
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key from Supabase | |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key for client-side operations | |
| `JOBS_API_SECRET` | A strong randomly generated string to secure the jobs API | |
| `CMC_API_KEY` | Your CoinMarketCap API key | |
| `CACHE_ENABLED` | Master switch for the cache system | `true` |
| `COIN_CACHE_TTL_MINUTES` | How long to cache coin data | `15` |
| `GLOBAL_DATA_CACHE_TTL_MINUTES` | How long to cache global market data | `60` |
| `JOBS_ENABLED` | Whether to run background jobs | `true` |

### Step 1: Initialize the Job System

After deploying your project to Vercel, you need to initialize the job system:

1. Clone your repository locally
2. Make sure your environment variables are set up in a `.env.local` file
3. Run the initialization script:

```bash
npx ts-node scripts/init-jobs-with-tables.ts
```

### Step 2: Set Up Vercel Cron Jobs

Vercel offers built-in CRON job functionality that we'll use to trigger our background jobs:

1. Go to your Vercel dashboard
2. Select your project
3. Navigate to Settings > Cron Jobs
4. Add a new Cron Job with the following settings:

   - **Name**: Process Background Jobs
   - **Frequency**: */5 * * * * (every 5 minutes)
   - **HTTP Method**: POST
   - **Path**: /api/jobs/process-pending
   - **Headers**: 
     - Name: Authorization
     - Value: Bearer YOUR_JOBS_API_SECRET

Replace `YOUR_JOBS_API_SECRET` with the value you set in the environment variables.

### Alternative: External Cron Service

If you prefer not to use Vercel's Cron Jobs or need more control, you can use:

#### Option 1: GitHub Actions

Create a GitHub Actions workflow:

```yaml
# .github/workflows/trigger-jobs.yml
name: Trigger Background Jobs

on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes

jobs:
  trigger:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger API endpoint
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.JOBS_API_SECRET }}" \
            https://your-app.vercel.app/api/jobs/process-pending
```

#### Option 2: External Cron Service

Services like [Cronitor](https://cronitor.io/) or [Cron-job.org](https://cron-job.org/) can be used to ping your endpoint on a schedule.

## Monitoring and Maintenance

### Database Tables

The database tables provide insights into system performance:

- `api_cache`: Track cache hit rates and data freshness
- `background_jobs`: Monitor job success rates and errors

### Checking Job Status

Query the `background_jobs` table in Supabase:

```sql
-- Recent job runs
SELECT job_type, status, created_at, completed_at
FROM background_jobs
ORDER BY created_at DESC
LIMIT 20;

-- Failed jobs
SELECT job_type, error, created_at
FROM background_jobs
WHERE status = 'failed'
ORDER BY created_at DESC;
```

### Regular Maintenance Tasks

1. Review the job logs for persistent errors
2. Monitor cache hit rates to optimize TTL values
3. Adjust job frequencies based on data volatility

## Troubleshooting

### Common Issues

1. **Jobs not running**: Check the Vercel logs and ensure the CRON job is correctly configured
2. **Database errors**: Make sure your Supabase service role key has the necessary permissions
3. **API errors**: Verify your API keys are correctly set and not expired
4. **Rate limiting**: Adjust cache TTL values to reduce API call frequency

### Debugging

To enable detailed logs, set `DEBUG=true` in your environment variables or append `?debug=true` to the job URL when testing manually.

## Extending the System

### Adding New Job Types

To add new job types:

1. Add a new job type to `JobType` enum in `lib/services/job-scheduler.ts`
2. Implement the processing function in the `JobScheduler` class
3. Update the initialization script to include the new job type

### Future Improvements

Potential future enhancements:

1. **Redis caching**: Add a Redis layer for even faster in-memory access
2. **Data versioning**: Track data changes over time for analytics
3. **Predictive prefetching**: Use machine learning to predict which data users will need
4. **Webhook integration**: Subscribe to data provider webhooks for real-time updates

## Security Considerations

- Never expose your `JOBS_API_SECRET` or `SUPABASE_SERVICE_ROLE_KEY`
- Use HTTPS for all API calls
- Consider IP whitelisting for the jobs endpoint if possible 