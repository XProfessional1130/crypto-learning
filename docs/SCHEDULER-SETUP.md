# Setting Up the API Optimization Scheduler

This document explains how to set up the scheduler system for API optimization, which is essential for minimizing API costs as your user base grows.

## Overview

The scheduler system proactively refreshes data from external APIs and stores it in a database cache, significantly reducing the number of direct API calls needed. This is especially important for APIs with usage-based pricing like CoinMarketCap.

## Prerequisites

- Supabase project configured with your application
- Vercel project for deployment
- Environment variables set up (see below)

## Required Environment Variables

Add these environment variables to your Vercel project:

| Variable | Description |
|----------|-------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key from Supabase (has higher permissions) |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key for client-side operations |
| `JOBS_API_SECRET` | A strong randomly generated string to secure the jobs API |
| `CMC_API_KEY` | Your CoinMarketCap API key |

## Step 1: Initialize the Job System

After deploying your project to Vercel, you need to initialize the job system:

1. Clone your repository locally
2. Make sure your environment variables are set up in a `.env.local` file
3. Run the initialization script:

```bash
npx ts-node scripts/init-jobs-with-tables.ts
```

## Step 2: Set Up Vercel Cron Jobs

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

## Alternative: External Cron Service

If you prefer not to use Vercel's Cron Jobs or need more control, you can use an external service:

### Option 1: GitHub Actions

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

### Option 2: External Cron Service

Services like [Cronitor](https://cronitor.io/) or [Cron-job.org](https://cron-job.org/) can be used to ping your endpoint on a schedule.

## Monitoring

Check the job status by querying the `background_jobs` table in Supabase:

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

## Troubleshooting

### Common Issues

1. **Jobs not running**: Check the Vercel logs and ensure the CRON job is correctly configured
2. **Database errors**: Make sure your Supabase service role key has the necessary permissions
3. **API errors**: Verify your API keys are correctly set and not expired

### Debugging

To enable detailed logs, set `DEBUG=true` in your environment variables or append `?debug=true` to the job URL when testing manually.

## Extending the System

To add new job types:

1. Add a new job type to `JobType` enum in `lib/services/job-scheduler.ts`
2. Implement the processing function in the `JobScheduler` class
3. Update the initialization script to include the new job type

## Security Considerations

- Never expose your `JOBS_API_SECRET` or `SUPABASE_SERVICE_ROLE_KEY`
- Use HTTPS for all API calls
- Consider IP whitelisting for the jobs endpoint if possible 