# Team Portfolio Setup

Setup guide for the team portfolio feature.

## Database Setup

Fix missing database tables with one of these options:

### Option 1: SQL Script

1. Log in to Supabase dashboard
2. Go to SQL Editor
3. Copy and run `supabase/db-setup.sql`
4. Creates `user_portfolios` table with test data

### Option 2: Migrations

Run from project root:
```
npx supabase migration up
```

## How It Works

- Team portfolio shows a designated admin's portfolio to all users
- Admin is defined by `NEXT_PUBLIC_TEAM_ADMIN_EMAIL` environment variable
- Admin manages their portfolio through regular interface
- All users see this as "Team Portfolio" on LC dashboard

## Limitations

- Simplified mode shows empty portfolio if tables don't exist
- Full functionality requires proper database setup

## Troubleshooting

### Multiple Client Warnings

If "Multiple GoTrueClient instances detected":
- Use singleton from `lib/services/supabase-client.ts`
- Update any duplicate client imports

### Rate Limiting Issues

If encountering 429 errors:
- Add rate limiting to API routes
- Implement caching to reduce requests