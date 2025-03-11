# Team Portfolio Setup Guide

This guide will help you set up the team portfolio feature correctly.

## Database Setup

The team portfolio feature is currently encountering an error because the required database tables are missing. Here's how to fix it:

### Option 1: Run the Database Setup Script

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Copy the contents of the `supabase/db-setup.sql` file
4. Paste it into the SQL Editor and run it
5. This will create the required `user_portfolios` table and add some test data

### Option 2: Use the Existing Migrations

If you prefer to use the migration system:

1. Navigate to your project root
2. Run the Supabase migrations:
   ```
   npx supabase migration up
   ```

## Understanding the Team Portfolio Feature

The team portfolio feature displays portfolio data from a designated admin user. Here's how it works:

1. The admin user (defined by the `NEXT_PUBLIC_TEAM_ADMIN_EMAIL` environment variable) manages their portfolio through the regular user interface.
2. The LC dashboard then displays this portfolio as the "Team Portfolio" for all users.

### Current Limitations

- The feature is simplified to handle the case where the database tables don't exist yet.
- In the simplified mode, it will show an empty portfolio with appropriate messages in the console.
- Once your database has the right tables, it will automatically start working.

## Troubleshooting

### Multiple Supabase Client Warnings

If you're seeing warnings about "Multiple GoTrueClient instances detected":

- We've implemented a singleton pattern in `lib/services/supabase-client.ts`
- All Supabase client usage should import from this file
- If you're creating additional Supabase clients elsewhere, update those imports to use the shared client

### API Rate Limiting Issues

If you're seeing errors related to rate limiting (429 Too Many Requests):

- We've improved the coin data initialization to avoid duplicate requests
- You may need to add rate limiting to your API routes
- Consider adding caching to the API endpoints to reduce the number of requests 