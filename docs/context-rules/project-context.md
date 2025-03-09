# LearningCrypto Platform Context

This document provides essential context about the LearningCrypto Platform codebase, architecture, and design decisions. It serves as a reference for understanding the project structure and development approach.

## Project Overview

LearningCrypto is an AI-driven crypto education platform that combines personalized learning with portfolio tracking and market analytics. The platform is built with modern web technologies and follows a structured architecture designed for scalability and maintainability.

## Tech Stack

- **Frontend Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database/Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Magic Email Link)
- **Deployment**: Vercel
- **Payment Processing**: 
  - Crypto: Radom
  - Fiat: Stripe (primary), Square (secondary)
- **Integrations**:
  - AI Chat: OpenAI API
  - Charts: TradingView
  - Onchain Analytics: Arkham API
  - Referral Program: FirstPromoter

## Architecture

The application follows a client-side rendering approach with server components where appropriate. The architecture is structured around the Next.js App Router paradigm with the following key components:

### Core Components

1. **Authentication System**
   - Magic link authentication through Supabase
   - Protected routes requiring authentication
   - User session management

2. **Dashboard**
   - Portfolio tracking and visualization
   - Market analytics and insights
   - User-specific data and preferences

3. **Education System**
   - AI-powered chat for personalized learning
   - Educational resources and articles
   - Learning paths and progress tracking

4. **Resource Library**
   - Articles and guides
   - Video content
   - External resource links

5. **Discount/Deal System**
   - Exclusive offers for platform users
   - Affiliate and referral links
   - Service discounts

### Data Flow

1. **User Authentication**
   - User requests magic link
   - Email with magic link sent to user
   - User clicks link and is redirected to callback page
   - Token exchanged for session
   - User redirected to dashboard

2. **Data Fetching**
   - Client-side requests to Supabase
   - Server-side data fetching for protected resources
   - Real-time updates using Supabase subscriptions

3. **External API Integration**
   - OpenAI for AI chat functionality
   - TradingView for chart embedding
   - Arkham for on-chain analytics
   - Payment processors for handling transactions

## Folder Structure

```
lc-platform/
├── /app                  # Next.js App Router routes and pages
│   ├── /api              # API routes
│   ├── /auth             # Authentication routes
│   ├── /dashboard        # User dashboard
│   ├── /lc-dashboard     # LearningCrypto team dashboard
│   ├── /chat             # AI chat interface
│   ├── /resources        # Educational resources
│   ├── /discounts        # Discount/deal listings
│   └── /components       # Reusable React components
├── /lib                  # Utility functions and shared code
│   ├── /supabase.ts      # Supabase client configuration
│   ├── /auth-context.tsx # Authentication context provider
│   └── /utils            # Helper functions
├── /public               # Static assets
├── /types                # TypeScript type definitions
└── /docs                 # Documentation
    └── /context-rules    # Project context and guidelines
```

## Key Design Decisions

1. **Next.js App Router**
   - Chosen for its modern approach to routing and server components
   - Enables better SEO through server-side rendering where needed
   - Simplified data fetching with React Server Components

2. **Supabase for Backend**
   - Provides a complete backend solution with minimal setup
   - Built-in authentication, database, and real-time subscriptions
   - PostgreSQL database for robust data storage and relationships

3. **Tailwind CSS for Styling**
   - Utility-first approach for rapid UI development
   - Consistent design system through customization
   - Responsive design built into the framework

4. **Magic Link Authentication**
   - Passwordless experience for improved security and UX
   - Simplifies onboarding process for non-technical users
   - Reduces friction in the authentication flow

5. **AI-Powered Learning**
   - Personalized education through conversational AI
   - Adaptive learning based on user interactions
   - Makes complex crypto concepts more accessible

## Environment Configuration

- Development and production environments managed through Vercel
- Environment variables stored securely in Vercel and locally in `.env.local`
- Feature flags for controlled rollout of new functionality

## Testing Strategy

- Component testing with React Testing Library
- Integration testing for critical flows
- End-to-end testing for key user journeys
- Manual testing in preview environments before production deployment

## Performance Considerations

- Image optimization through Next.js Image component
- Code splitting and lazy loading for optimized bundle sizes
- Caching strategies for frequently accessed data
- CDN delivery through Vercel Edge Network

## Accessibility

- Semantic HTML structure throughout the application
- ARIA attributes for interactive elements
- Keyboard navigation support
- Color contrast compliance with WCAG guidelines

## Security Measures

- Authentication through trusted providers (Supabase)
- HTTPS for all communications
- Environment variable protection
- Regular dependency updates
- Content Security Policy implementation

---

This context document should be regularly updated as the project evolves to maintain an accurate representation of the codebase and architecture. 