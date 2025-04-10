# Learning Crypto Platform

An AI-driven cryptocurrency education and portfolio management platform built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Features

- **AI Chat**: Learn about cryptocurrency with AI assistants
- **Portfolio Tracking**: Monitor cryptocurrency investments
- **Market Analytics**: Real-time market data and on-chain analytics
- **Team Insights**: View the team's portfolio and analysis
- **Resources**: Articles and guides on crypto topics
- **Exclusive Discounts**: Special deals for crypto services
- **Referral Program**: Earn rewards for referrals

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Payments**: Radom (crypto), Stripe (fiat)
- **AI**: OpenAI API
- **Analytics**: TradingView, Arkham API
- **Deployment**: Vercel

## Documentation

We maintain comprehensive documentation to help developers understand and contribute to the project:

- [**Architecture**](docs/ARCHITECTURE.md): Detailed overview of application architecture and design patterns
- [**Database**](docs/DATABASE.md): Database schema, table relationships, and RLS policies
- [**Getting Started**](docs/getting-started.md): Setup guide for new developers
- [**Admin Authentication**](docs/admin-authentication.md): Admin access and permissions
- [**AI Chat Setup**](docs/AI-CHAT-SETUP.md): How to configure the AI chat feature
- [**More guides...**](docs/README.md)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase, OpenAI, Stripe, and Radom accounts

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/lc-platform.git
   cd lc-platform
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file with:
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
   NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY=your_stripe_monthly_price_id
   NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY=your_stripe_yearly_price_id

   # External Services
   RADOM_API_KEY=your_radom_api_key
   FIRST_PROMOTER_API_KEY=your_firstpromoter_api_key
   OPENAI_API_KEY=your_openai_api_key
   ARKHAM_API_KEY=your_arkham_api_key
   CMC_API_KEY=your_coinmarketcap_api_key

   # App URL
   NEXT_PUBLIC_URL=http://localhost:3000
   ```

4. Run setup script:
   ```bash
   npm run setup
   ```

5. Start development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

### Database Setup

#### Option A: SQL Editor
1. Log in to Supabase dashboard
2. Go to SQL Editor
3. Run base tables script, then migration scripts

#### Option B: Supabase CLI
1. Install CLI: `npm install -g supabase`
2. Link project: `supabase link --project-ref your-project-ref`
3. Run migrations: `supabase db push`

### Create Admin User

```bash
npm run create-first-admin your.email@example.com
```

## Project Structure

```
lc-platform/
├── /src                      # Application source code
│   ├── /app                  # Next.js routes and page components
│   │   ├── /api              # API routes
│   │   ├── /auth             # Authentication routes
│   │   ├── /dashboard        # User dashboard routes
│   │   ├── /lc-dashboard     # Team dashboard routes
│   │   ├── /chat             # AI chat interface
│   │   ├── /about            # About page
│   │   ├── /resources        # Articles and resources
│   │   └── /discounts        # Deals page
│   ├── /components           # Reusable UI components
│   ├── /lib                  # Core application logic and utilities
│   │   ├── /api              # API client functions and data fetching
│   │   ├── /providers        # React context providers
│   │   ├── /supabase         # Supabase client configuration
│   │   ├── /utils            # Utility functions
│   │   ├── /config           # Application configuration
│   │   └── /hoc              # Higher-order components
│   ├── /hooks                # Custom React hooks
│   ├── /types                # TypeScript type definitions
│   ├── /styles               # Global styles
│   └── /scripts              # Utility scripts
├── /public                   # Static assets
├── /docs                     # Documentation
├── /supabase                 # Database migrations and config
│   └── /migrations           # Database migration files
├── /__tests__                # Test files
├── /scripts                  # Development and deployment scripts
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

## Deployment

### Deploy to Vercel

1. **Prepare**:
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push
   ```

2. **Set Environment Variables** in the Vercel dashboard

3. **Deploy**:
   - Connect GitHub repo to Vercel, or
   - Use CLI: `npx vercel --prod`

### Production Auth Setup

1. **Configure Supabase Auth**:
   - Set Site URL to your Vercel deployment URL

2. **Update Client**:
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

3. **Test Authentication Flow**

## Git Workflow

- **main**: Production code (no direct commits)
- **development**: Ongoing development
- **Feature Branches**: `feature/name` or `fix/name`

## Common Issues and Troubleshooting

- **Supabase Connection**: Check environment variables and IP access
- **Multiple Client Warnings**: Use singleton pattern
- **API Rate Limiting**: Implement caching
- **Auth Problems**: Check Supabase Site URL and PKCE flow
- **Database Issues**: Check [Database Troubleshooting](docs/DATABASE.md#troubleshooting)

## Coding Standards

1. **Simplicity First**: Simple over complex solutions
2. **Reuse Code**: Avoid duplication
3. **Environment Awareness**: Handle dev/test/prod differences
4. **File Size**: Keep under 200-300 lines
5. **No Mock Data in Production**: Only for testing

## Testing

```bash
npm run test
# or
npm run test:watch
```

## License

MIT License - see LICENSE file.
