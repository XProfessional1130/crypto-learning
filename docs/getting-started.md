# Getting Started with LearningCrypto Platform

This guide will help you set up the LearningCrypto platform for local development, testing, and deployment.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.x or later)
- **npm** or **yarn**
- **Git**
- A **Supabase** account
- A **Stripe** account (for fiat payments)
- A **Radom** account (for crypto payments)
- An **OpenAI** API key (for AI chat)

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/lc-platform.git
cd lc-platform
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory based on the `.env.example` file:

```bash
cp .env.example .env.local
```

Fill in the required values:

```
# Admin API for secure operations
ADMIN_API_KEY=your_secure_admin_api_key

# Cron job secret for scheduled tasks
CRON_SECRET=your_secure_cron_secret

# Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY=your_stripe_monthly_price_id
NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY=your_stripe_yearly_price_id

# Application URL for redirects
NEXT_PUBLIC_URL=http://localhost:3000
```

### 4. Set Up Supabase Database

#### Option A: Using the SQL Editor

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Run the following migrations in order:
   - First run the base tables creation script
   - Then run any additional migration scripts

#### Option B: Using the Supabase CLI

1. Install the Supabase CLI if you haven't already:
   ```bash
   npm install -g supabase
   ```

2. Link your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

3. Run the migrations:
   ```bash
   supabase db push
   ```

### 5. Set Up Your First Admin User

After setting up the database, create your first admin user:

```bash
npm run create-first-admin your.email@example.com
```

### 6. Set Up Stripe Integration

Follow the detailed instructions in [README-STRIPE-SETUP.md](../README-STRIPE-SETUP.md) to:

1. Create products and pricing plans in Stripe
2. Set up webhook endpoints
3. Update your environment variables with the relevant keys

### 7. Set Up Team Portfolio

Follow the instructions in [README-SETUP.md](../README-SETUP.md) to set up the team portfolio feature.

### 8. Set Up AI Chat Integration

Follow the instructions in [AI-CHAT-SETUP.md](./AI-CHAT-SETUP.md) to:

1. Configure OpenAI API access
2. Set up the chat system with Tobo and Heido personalities

### 9. Run the Development Server

```bash
npm run dev
# or
yarn dev
```

Your application should now be running at [http://localhost:3000](http://localhost:3000).

## Common Setup Issues

### Supabase Connection Issues

If you encounter connection issues with Supabase:

1. Verify your environment variables are correct
2. Check that your IP address is not blocked in Supabase
3. Ensure your Supabase project is active

### Multiple Supabase Client Warnings

If you see warnings about "Multiple GoTrueClient instances detected":

- We've implemented a singleton pattern in `lib/services/supabase-client.ts`
- All Supabase client usage should import from this file
- Update any duplicate client instantiations

### API Rate Limiting

If you're encountering rate limit errors:

1. Implement appropriate caching for API calls
2. Use the background job system for heavy operations
3. Reduce the frequency of API calls where possible

## Testing

### Running Tests

```bash
npm run test
# or
npm run test:watch
```

### Testing Stripe Webhooks Locally

1. Install the Stripe CLI
2. Login: `stripe login`
3. Forward events: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
4. Use test cards:
   - Successful payment: `4242 4242 4242 4242`
   - Failed payment: `4000 0000 0000 0002`

## Deployment

### Deploying to Vercel

1. Push your code to a Git repository
2. Connect the repository to Vercel
3. Configure your environment variables in the Vercel dashboard
4. Deploy! 

For more detailed deployment instructions, see the main [README.md](../README.md#deployment).

## Feature-Specific Setup

For detailed setup of specific features, refer to the following guides:

- [Admin Authentication System](./admin-authentication.md)
- [Database Schema Documentation](./database-schema.md)
- [Scheduler Setup](./SCHEDULER-SETUP.md)
- [API Optimization](./API-OPTIMIZATION.md)
- [CoinMarketCap Integration](./COINMARKETCAP.md)

## Getting Help

If you encounter issues not covered in this guide:

1. Check the project issues on GitHub
2. Consult the existing documentation
3. Reach out to the development team

## Next Steps

After successfully setting up the platform, consider:

1. Creating test users
2. Adding sample content
3. Exploring the admin dashboard
4. Testing the user flows
5. Setting up CI/CD pipelines 