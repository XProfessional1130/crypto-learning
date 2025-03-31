# Getting Started with LearningCrypto

This guide helps you set up the platform for development and deployment.

## Prerequisites

- Node.js v18+
- npm or yarn
- Git
- Accounts for: Supabase, Stripe, Radom, OpenAI

## Setup Steps

### 1. Clone Repository

```bash
git clone https://github.com/your-username/lc-platform.git
cd lc-platform
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

Add your values:

```
# Admin API
ADMIN_API_KEY=your_secure_admin_api_key
CRON_SECRET=your_secure_cron_secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY=monthly_price_id
NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY=yearly_price_id

# App URL
NEXT_PUBLIC_URL=http://localhost:3000
```

### 4. Set Up Database

**Option A: SQL Editor**
1. Log in to Supabase dashboard
2. Go to SQL Editor
3. Run base tables script, then migration scripts

**Option B: Supabase CLI**
1. Install CLI: `npm install -g supabase`
2. Link project: `supabase link --project-ref your-project-ref`
3. Run migrations: `supabase db push`

### 5. Create Admin User

```bash
npm run create-first-admin your.email@example.com
```

### 6. Set Up Integrations

Follow these guides for specific features:
- [Stripe Setup](../README-STRIPE-SETUP.md)
- [Team Portfolio](../README-SETUP.md)
- [AI Chat Setup](./AI-CHAT-SETUP.md)

### 7. Start Development

```bash
npm run dev
```

Your app runs at [http://localhost:3000](http://localhost:3000).

## Common Issues

### Supabase Connection

- Check environment variables
- Verify IP isn't blocked
- Confirm project is active

### Multiple Client Warnings

If you see "Multiple GoTrueClient instances detected":
- Use singleton from `lib/services/supabase-client.ts`
- Update duplicate client instantiations

### API Rate Limiting

- Implement caching
- Use background jobs for heavy operations
- Reduce API call frequency

## Testing

### Run Tests

```bash
npm run test
# or
npm run test:watch
```

### Test Stripe Webhooks

1. Install Stripe CLI
2. Login: `stripe login`
3. Forward events: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
4. Test cards:
   - Success: `4242 4242 4242 4242`
   - Failure: `4000 0000 0000 0002`

## Deployment

### Vercel Deployment

1. Push code to Git repository
2. Connect to Vercel
3. Set environment variables
4. Deploy

See [README.md](../README.md#deployment) for detailed steps.

## Feature Setup

For specific features, see:
- [Admin Authentication](./admin-authentication.md)
- [Database Schema](./database-schema.md)
- [Scheduler Setup](./SCHEDULER-SETUP.md)
- [API Optimization](./API-OPTIMIZATION.md)
- [CoinMarketCap Integration](./COINMARKETCAP.md)

## Next Steps

After setup:
1. Create test users
2. Add sample content
3. Explore admin dashboard
4. Test user flows
5. Set up CI/CD 