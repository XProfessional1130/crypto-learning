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

## Documentation

### Getting Started
- [Getting Started Guide](docs/getting-started.md) - Complete setup instructions for new developers

### Core Documentation
- [Database Schema](docs/database-schema.md) - Comprehensive database schema documentation
- [Admin Authentication](docs/admin-authentication.md) - Admin role implementation and security
- [Stripe Setup Guide](README-STRIPE-SETUP.md) - Subscription payment integration with Stripe
- [Team Portfolio Setup](README-SETUP.md) - Setting up and troubleshooting team portfolios

### Development Documentation
- [Server Components Implementation](docs/server-components-implementation-log.md) - Server components migration details
- [Server Component Utilization Plan](docs/server-component-utilization-plan.md) - Planning for server components
- [Server Components Measurement](docs/server-components-measurement.md) - Performance measurement
- [Ghost Migration](docs/ghost-migration.md) - Content migration from Ghost CMS
- [AI Chat Setup](docs/AI-CHAT-SETUP.md) - Setting up the AI chat functionality
- [Scheduler Setup](docs/SCHEDULER-SETUP.md) - Background job scheduling system
- [API Optimization](docs/API-OPTIMIZATION.md) - API performance optimization strategies
- [Implementation Steps](docs/IMPLEMENTATION-STEPS.md) - Step-by-step implementation guide
- [CoinMarketCap Integration](docs/COINMARKETCAP.md) - CoinMarketCap API integration

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
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   STRIPE_SECRET_KEY=your-stripe-secret-key
   SQUARE_ACCESS_TOKEN=your-square-access-token
   RADOM_API_KEY=your-radom-api-key
   FIRST_PROMOTER_API_KEY=your-firstpromoter-api-key
   OPENAI_API_KEY=your-openai-api-key
   ARKHAM_API_KEY=your-arkham-api-key
   NEXT_PUBLIC_URL=http://localhost:3000
   ```

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Supabase Setup

1. Create a new Supabase project.
2. Set up the following tables:
   - users
   - subscriptions
   - portfolios
   - watchlists
   - articles
   - discounts
   - market_updates
   - referrals
   - chat_messages

3. Enable Email Auth in Supabase Authentication settings.

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
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

## Deployment

### Deploying to Vercel

The application is configured for deployment on Vercel. Follow these steps for a successful deployment:

1. **Prepare Your Repository**
   ```bash
   # Ensure all changes are committed
   git add .
   git commit -m "Prepare for deployment"
   git push
   ```

2. **Install Vercel CLI (Optional)**
   ```bash
   npm install -g vercel
   # or locally in the project
   npm install --save-dev vercel
   ```

3. **Configure Environment Variables**
   
   Create a `.env.production` file with your production values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
   ```

4. **Deploy Using Vercel Dashboard**
   - Connect your GitHub repository to Vercel
   - Import your project
   - Configure the following settings:
     - Framework Preset: Next.js
     - Root Directory: `./`
     - Build Command: `next build`
     - Output Directory: `.next`
   - Add your environment variables in the Vercel project settings

5. **Deploy Using Vercel CLI**
   ```bash
   # Login to Vercel
   npx vercel login

   # Deploy to production
   npx vercel --prod
   ```

### Git Workflow

This project follows a structured Git workflow to ensure stable deployments and effective collaboration:

1. **Main Branch (Production)**
   - The `main` branch contains production-ready code
   - Changes to `main` are deployed automatically to the production environment
   - Direct commits to `main` are not allowed

2. **Development Branch**
   - The `development` branch is used for ongoing development
   - All features, fixes, and enhancements should be developed on this branch
   - The `development` branch is deployed to a preview environment

3. **Feature Branches**
   - For significant features, create branches from `development`
   - Use naming conventions: `feature/feature-name`, `fix/bug-name`
   - Merge feature branches back to `development` when complete

4. **Standard Workflow**
   ```bash
   # Start with development branch
   git checkout development
   git pull origin development
   
   # Create feature branch (for significant features)
   git checkout -b feature/your-feature
   
   # Make changes and commit
   git add .
   git commit -m "Descriptive message"
   
   # Push changes
   git push origin feature/your-feature
   
   # Create PR to merge into development
   
   # After testing on development, merge to main for production
   git checkout main
   git merge development
   git push origin main
   ```

For detailed guidelines, refer to the [Development Workflow Guide](docs/context-rules/development-workflow.md).

### Setting Up Authentication

To ensure the authentication flow works correctly in production:

1. **Configure Supabase Authentication**
   - Go to your Supabase dashboard
   - Navigate to Authentication → URL Configuration
   - Set Site URL to your Vercel deployment URL (e.g., `https://your-domain.vercel.app`)
   - Save the changes

2. **Update Auth Configuration**
   
   Ensure your Supabase client configuration includes PKCE flow (`src/lib/supabase.ts`):
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

3. **Implement Auth Callback**
   
   Make sure your auth callback page (`src/app/auth/callback/page.tsx`) handles PKCE flow:
   ```typescript
   export default function AuthCallback() {
     // ... existing imports ...

     useEffect(() => {
       const handleAuthCallback = async () => {
         try {
           const { data, error: sessionError } = await supabase.auth.getSession();
           
           if (sessionError) {
             setError(sessionError.message);
           } else if (data?.session) {
             router.push('/dashboard');
           } else {
             // Handle PKCE flow
             const params = new URLSearchParams(window.location.search);
             if (params.has('code')) {
               const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
                 params.get('code') || ''
               );
               
               if (exchangeError) {
                 setError(exchangeError.message);
               } else {
                 router.push('/dashboard');
               }
             } else {
               setError('No authentication code found');
             }
           }
         } catch (err: any) {
           setError(err.message);
         } finally {
           setLoading(false);
         }
       };

       handleAuthCallback();
     }, [router]);

     // ... rest of the component
   }
   ```

### Verifying Deployment

1. **Test Authentication Flow**
   - Visit your deployed site
   - Click "Sign In"
   - Enter your email
   - Check that the magic link email contains your production URL
   - Click the magic link
   - Verify successful redirect to dashboard

2. **Common Issues and Solutions**

   - **Magic Link Shows Localhost**
     - Check Supabase Site URL configuration
     - Verify `NEXT_PUBLIC_SITE_URL` environment variable
     - Ensure PKCE flow is enabled in Supabase client

   - **Auth Callback Errors**
     - Check browser console for error messages
     - Verify all environment variables are set in Vercel
     - Ensure callback route (`/auth/callback`) is accessible

   - **Deployment Fails**
     - Run `vercel build` locally to debug issues
     - Check Vercel deployment logs
     - Verify all dependencies are properly installed

### Continuous Deployment

1. **Set Up GitHub Integration**
   - Enable automatic deployments in Vercel dashboard
   - Configure branch deployments (e.g., main → production)

2. **Environment Management**
   ```bash
   # Add production environment variables
   npx vercel env add NEXT_PUBLIC_SITE_URL production
   npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
   npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
   ```

3. **Preview Deployments**
   - Every pull request gets a unique preview URL
   - Test changes before merging to production
   - Access previews via Vercel dashboard or GitHub checks

## Project Documentation

Comprehensive documentation for the project is maintained in the `docs/context-rules` directory:

- [Development Workflow](docs/context-rules/development-workflow.md) - Guidelines for the development process and Git workflow
- [Project Context](docs/context-rules/project-context.md) - Essential information about the project architecture and design
- [Common Issues](docs/context-rules/common-issues.md) - Solutions to frequently encountered problems
- [Code Quality Standards](docs/context-rules/code-quality.md) - Coding standards and technical debt management

These documents should be referenced regularly to maintain consistency across the project and ensure all development follows established best practices.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [OpenAI](https://openai.com/)
- [Vercel](https://vercel.com/)
