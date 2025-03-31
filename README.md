# LearningCrypto Platform

LearningCrypto is an AI-driven crypto education platform that combines personalized learning with portfolio tracking and market analytics. This platform is built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Features

- **AI-Powered Education**: Chat with AI assistants (Tobo & Heido) to learn about crypto concepts in a way that suits your learning style.
- **Portfolio Tracking**: Monitor your crypto investments with professional portfolio tools.
- **Market Analytics**: Access real-time market data, on-chain analytics, and expert analysis.
- **Team Insights**: Get access to the LearningCrypto team's portfolio, watchlist, and market analysis.
- **Educational Resources**: Browse articles and guides on various crypto topics.
- **Exclusive Discounts**: Access special deals and referral links for crypto services and products.
- **Referral Program**: Earn rewards by referring friends to the platform.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend/Database**: Supabase (PostgreSQL, Authentication, Realtime)
- **Authentication**: Supabase Auth (Magic Email Link)
- **Crypto Payments**: Radom (subscription payments)
- **Fiat Payments**: Stripe (primary), Square (secondary)
- **Referral Tracking**: FirstPromoter
- **AI Chat**: OpenAI API
- **Analytics/Charts**: TradingView (embedded charts)
- **Onchain Analytics**: Arkham API
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn
- Supabase account
- OpenAI API key
- Stripe account (for fiat payments)
- Radom account (for crypto payments)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/lc-platform.git
   cd lc-platform
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory with the following variables:
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

   # Radom API for crypto payments
   RADOM_API_KEY=your_radom_api_key

   # FirstPromoter for referral tracking
   FIRST_PROMOTER_API_KEY=your_firstpromoter_api_key

   # OpenAI for AI chat
   OPENAI_API_KEY=your_openai_api_key

   # Arkham for onchain analytics
   ARKHAM_API_KEY=your_arkham_api_key

   # Application URL for redirects
   NEXT_PUBLIC_URL=http://localhost:3000
   ```

4. Run the automated setup script:
   ```bash
   npm run setup
   ```
   This script will:
   - Verify all required environment variables
   - Apply database migrations and fixes
   - Set up proper authentication and subscription relationships
   - Clean up unnecessary files
   - Build the project to verify everything works

5. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Database Setup

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

### Creating Your First Admin User

After setting up the database, create your first admin user:

```bash
npm run create-first-admin your.email@example.com
```

## Feature Setup Guides

### Stripe Subscription Setup

Follow these steps to set up Stripe subscriptions:

1. **Create Products in Stripe**
   - Log in to your Stripe dashboard
   - Go to Products → Create product
   - Create two products:
     - Monthly Subscription ($29.99/month)
     - Annual Subscription ($299.99/year)
   - Note the Price IDs and add them to your environment variables

2. **Set Up Stripe Webhooks**
   - In the Stripe dashboard, go to Developers → Webhooks
   - Add an endpoint: `https://your-domain.com/api/stripe/webhook`
   - Listen for these events:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
   - Save the endpoint and add the signing secret to your environment variables

3. **Testing Stripe Locally**
   - Install the [Stripe CLI](https://stripe.com/docs/stripe-cli)
   - Login to Stripe: `stripe login`
   - Forward events: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
   - Use test cards:
     - Successful payment: `4242 4242 4242 4242`
     - Failed payment: `4000 0000 0000 0002`

### Team Portfolio Setup

The team portfolio feature displays portfolio data from a designated admin user:

1. **Database Setup**
   - Option 1: Run the `supabase/db-setup.sql` script in the SQL Editor
   - Option 2: Use existing migrations with `npx supabase migration up`

2. **Configuration**
   - Set the `NEXT_PUBLIC_TEAM_ADMIN_EMAIL` environment variable to the admin's email
   - The admin manages their portfolio through the regular interface
   - The LC dashboard displays this portfolio as the "Team Portfolio" for all users

3. **Troubleshooting**
   - If you see warnings about "Multiple GoTrueClient instances," ensure all code imports from `lib/services/supabase-client.ts`
   - For API rate limiting issues, implement caching for API endpoints

### AI Chat Setup

To set up the AI chat functionality:

1. Configure your OpenAI API key in the environment variables
2. Follow the instructions in `docs/AI-CHAT-SETUP.md` for setting up:
   - Chat system with Tobo and Heido personalities
   - Background knowledge base
   - User message handling

### Scheduled Jobs Setup

For background jobs and scheduled tasks:

1. Configure the `CRON_SECRET` environment variable
2. Set up the scheduler as detailed in `docs/SCHEDULER-SETUP.md`
3. Test your scheduled jobs locally before deployment

## Project Structure

```
lc-platform/
├── /src
│   ├── /app                  # Next.js App Router routes
│   │   ├── /api              # API routes (e.g., payments, referrals)
│   │   ├── /auth             # Authentication routes (signin, callback)
│   │   ├── /dashboard        # User dashboard page
│   │   ├── /lc-dashboard     # LC dashboard page
│   │   ├── /chat             # AI chat page
│   │   ├── /about            # About page
│   │   ├── /resources        # Resources page (public articles)
│   │   ├── /discounts        # Discounts/Deals page (referral links)
│   │   └── /components       # Reusable React components
│   ├── /lib                  # Utility functions (Supabase client, auth)
│   └── /types                # TypeScript type definitions
├── /public                   # Static assets
├── /docs                     # Documentation
├── /supabase                 # Supabase migrations and configuration
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

## Deployment

### Deploying to Vercel

1. **Prepare Your Repository**
   ```bash
   # Ensure all changes are committed
   git add .
   git commit -m "Prepare for deployment"
   git push
   ```

2. **Configure Environment Variables**
   
   Create a `.env.production` file with your production values and add these to your Vercel project settings.

3. **Deploy Using Vercel Dashboard**
   - Connect your GitHub repository to Vercel
   - Import your project
   - Configure settings:
     - Framework Preset: Next.js
     - Root Directory: `./`
     - Build Command: `next build`
     - Output Directory: `.next`

4. **Deploy Using Vercel CLI**
   ```bash
   # Login to Vercel
   npx vercel login

   # Deploy to production
   npx vercel --prod
   ```

### Setting Up Authentication for Production

1. **Configure Supabase Authentication**
   - Go to your Supabase dashboard → Authentication → URL Configuration
   - Set Site URL to your Vercel deployment URL
   - Save the changes

2. **Update Auth Configuration**
   
   Ensure your Supabase client includes PKCE flow:
   ```typescript
   export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
     auth: {
       autoRefreshToken: true,
       persistSession: true,
       detectSessionInUrl: true,
       flowType: 'pkce',
     }
   });
   ```

3. **Verify Deployment**
   - Test the authentication flow
   - Check for common issues:
     - Magic link shows localhost URL
     - Auth callback errors
     - Deployment failures

### Git Workflow

This project follows a structured Git workflow:

1. **Main Branch (Production)**
   - Production-ready code
   - Automatic deployment to production
   - No direct commits allowed

2. **Development Branch**
   - Ongoing development
   - Deployed to preview environment

3. **Feature Branches**
   - Created from development branch
   - Naming convention: `feature/feature-name`, `fix/bug-name`
   - Merged back to development when complete

4. **Standard Workflow**
   ```bash
   # Start with development branch
   git checkout development
   git pull origin development
   
   # Create feature branch
   git checkout -b feature/your-feature
   
   # Make changes and commit
   git add .
   git commit -m "Descriptive message"
   
   # Push changes
   git push origin feature/your-feature
   
   # Create PR to merge into development
   
   # After testing, merge to main for production
   git checkout main
   git merge development
   git push origin main
   ```

## Common Issues and Solutions

### Supabase Connection Issues
- Verify environment variables
- Check that your IP is not blocked
- Ensure your Supabase project is active

### Multiple Supabase Client Warnings
- Use the singleton pattern in `lib/services/supabase-client.ts`
- Update any duplicate client instantiations

### API Rate Limiting
- Implement caching for API calls
- Use the background job system for heavy operations
- Reduce the frequency of API calls

### Authentication Problems
- Check Supabase Site URL configuration
- Verify `NEXT_PUBLIC_SITE_URL` environment variable
- Ensure PKCE flow is enabled in Supabase client

## Coding Standards

Our codebase follows specific coding standards:

1. **Simplicity First**: We prefer simple, readable solutions over complex ones
2. **Code Reuse**: Avoid duplicating functionality that exists elsewhere
3. **Environment Awareness**: Code should account for different environments (dev, test, prod)
4. **File Size Limits**: Keep files under 200-300 lines; refactor larger files
5. **No Mock Data in Production**: Only use mock data for testing
6. **Clean Architecture**: Maintain clear separation of concerns

## Documentation

Comprehensive documentation is available in the `docs/` directory:

- [Getting Started Guide](docs/getting-started.md)
- [Database Schema](docs/database-schema.md)
- [Admin Authentication](docs/admin-authentication.md)
- [AI Chat Setup](docs/AI-CHAT-SETUP.md)
- [Scheduler Setup](docs/SCHEDULER-SETUP.md)
- [API Optimization](docs/API-OPTIMIZATION.md)
- [CoinMarketCap Integration](docs/COINMARKETCAP.md)
- [Server Components Implementation](docs/server-components-implementation-log.md)
- [Development Workflow](docs/context-rules/development-workflow.md)

## Testing

Run tests with:

```bash
npm run test
# or
npm run test:watch
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [OpenAI](https://openai.com/)
- [Vercel](https://vercel.com/)
