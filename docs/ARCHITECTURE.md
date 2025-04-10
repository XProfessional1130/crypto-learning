# Architecture Documentation

This document outlines the architecture, code organization, and key components of the Learning Crypto Platform.

## Technology Stack

The application is built using the following technologies:

- **Frontend**: Next.js with TypeScript
- **Backend**: Supabase (PostgreSQL database + serverless functions)
- **Hosting**: Vercel
- **Payment Processing**: 
  - Stripe for fiat payments
  - Radom for cryptocurrency payments
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS

## Application Structure

The codebase follows a modular structure with clear separation of concerns:

```
/src
  /app           # Next.js App Router routes and page components
  /components    # Reusable UI components
  /lib           # Core application logic and utilities
    /api         # API client functions and data fetching
    /providers   # React context providers
    /supabase    # Supabase client configuration
    /utils       # Utility functions
    /config      # Application configuration
    /hoc         # Higher-order components
  /hooks         # Custom React hooks
  /types         # TypeScript type definitions
  /styles        # Global styles and Tailwind configuration
  /scripts       # Utility scripts for development and deployment
```

## Core Modules

### Authentication System

Authentication is handled via Supabase Auth, with client integration in:
- `src/lib/api/auth.ts`: Authentication API functions
- `src/lib/providers/auth-provider.tsx`: React context for authentication state

### Cryptocurrency Data

Real-time and historical cryptocurrency data is fetched from:
1. CoinMarketCap API (for initial data)
2. Supabase database (for cached data)

Key components:
- `src/lib/api/coinmarketcap.ts`: Functions for fetching cryptocurrency data
- `src/lib/api/supabase-crypto.ts`: Functions to interact with cryptocurrency data in Supabase
- `src/types/portfolio.ts`: Type definitions for cryptocurrency and portfolio data

### Portfolio Management

Users can create and manage cryptocurrency portfolios:
- `src/lib/api/portfolio.ts`: Portfolio management functions
- `src/lib/api/team-portfolio.ts`: Team portfolio management functions
- `src/components/portfolio/`: UI components for portfolio display and management

### Watchlist Management

Users can create and manage cryptocurrency watchlists:
- `src/lib/api/watchlist.ts`: Watchlist management functions
- `src/lib/api/team-watchlist.ts`: Team watchlist management functions
- `src/components/watchlist/`: UI components for watchlist display and management

### AI Chat Features

The platform includes AI chat capabilities:
- `src/lib/api/openai.ts`: OpenAI API integration
- `src/lib/api/openai-assistant.ts`: OpenAI Assistants API integration
- `src/lib/api/chat-history.ts`: Chat history management

### Background Jobs

Background jobs are managed to keep data up-to-date:
- `src/lib/api/job-scheduler.ts`: Scheduled job management
- `src/app/api/jobs/`: API routes for job execution

## Data Flow

### Frontend to Backend Flow

1. **User Interface**: User interactions with React components
2. **API Clients**: `src/lib/api/` functions called by components or hooks
3. **Supabase**: Data queries/mutations to Supabase database
4. **External APIs**: Calls to external services when needed (CoinMarketCap, OpenAI)

### Data Refreshing Flow

1. **Background Jobs**: Scheduled jobs update cryptocurrency data regularly
2. **Client Caching**: Data is cached in the frontend for performance
3. **Real-time Updates**: Supabase real-time subscriptions used for critical data

## Authentication and Authorization

### Authentication Flow

1. User signs up/logs in via Supabase Auth
2. JWT token is stored and managed by the auth provider
3. Token is included in all Supabase requests
4. Server-side routes check for valid session

### Authorization

Row Level Security (RLS) policies in Supabase control data access:
- Users can only view/edit their own data
- Team members can access shared team data
- Admins have elevated privileges

## Key Design Patterns

### API Layer Pattern

All database and external API interactions are abstracted through an API layer in `src/lib/api/`:
- Consistent error handling
- Type safety
- Centralized data transformation

### Context Providers

React Context is used for global state management:
- `AuthProvider`: User authentication state
- `DataCacheProvider`: Cached cryptocurrency data
- `ThemeProvider`: UI theme settings

### Error Handling

Consistent error handling approach:
- Try/catch blocks with specific error types
- Error logging
- Graceful degradation for users

## Performance Considerations

### Data Caching

- API responses are cached in the `api_cache` table
- React Query used for client-side data caching
- Stale-while-revalidate pattern for data freshness

### Code Splitting

- Next.js automatic code splitting for pages/components
- Dynamic imports for large dependencies

## Deployment and Environments

### Environment Configuration

The application supports multiple environments:
- Development: Local development environment
- Test: Testing environment
- Production: Live environment

Environment variables are managed via `.env.*` files and Vercel environment settings.

### CI/CD Pipeline

Continuous integration and deployment through:
1. GitHub Actions for testing
2. Vercel for preview deployments
3. Production deployment on main branch merges

## Extensibility

The application is designed to be extensible:

### Adding New Features

1. Define types in `/types`
2. Create API functions in `/lib/api`
3. Create React hooks in `/hooks`
4. Build UI components in `/components`
5. Integrate into pages in `/app`

### Adding Database Tables

1. Create migration in `supabase/migrations`
2. Define RLS policies
3. Create TypeScript interfaces in `/types`
4. Create API functions in `/lib/api`

## Monitoring and Logging

- Client-side error logging
- Supabase database logs
- Vercel monitoring tools

## Testing Strategy

- Unit tests with Jest
- Component tests with React Testing Library
- Integration tests focused on critical flows
- End-to-end tests for key user journeys

## Security Considerations

- All user data is protected by RLS policies
- Authentication via secure JWT tokens
- API rate limiting
- Input validation on all user inputs
- Regular security updates for dependencies 