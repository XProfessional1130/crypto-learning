# LC Platform Project Context

## Project Overview
Learning Crypto (LC) Platform is a comprehensive educational platform focused on cryptocurrency and blockchain technology education. The platform combines content management, portfolio tracking, and AI-assisted learning.

## Technical Stack
- **Frontend**: Next.js
- **Backend**: Supabase (PostgreSQL)
- **Hosting**: Vercel
- **Payment Processing**:
  - Fiat: Stripe
  - Crypto: Radom

## Core Features

### 1. Content Management
- Educational articles and tutorials
- Multi-tier content access (public/member/paid)
- SEO optimization
- Content categorization and tagging

### 2. User Management
- Authentication via Supabase
- Role-based access (user/admin)
- Profile management
- Subscription tracking

### 3. Portfolio Tools
- Cryptocurrency holdings tracking
- Watchlist functionality
- Price alerts
- Performance analytics

### 4. AI Integration
- AI-powered chat assistants
  - Tobo: Technical analysis focus
  - Heido: Educational focus
- OpenAI integration
- Conversation history tracking

### 5. Subscription System
- Tiered access levels
- Multiple payment methods
  - Fiat via Stripe
  - Crypto via Radom
- Subscription management

### 6. Background Processing
- Automated data updates
- Email campaign management
- System maintenance tasks
- API data caching

## Architecture Overview

### Frontend Architecture
1. **Next.js App Router**
   - Server and client components
   - API routes for backend integration
   - Server-side rendering for performance

2. **Component Structure**
   - Atomic design principles
   - Reusable UI components
   - Responsive design

### Backend Architecture
1. **Supabase Integration**
   - PostgreSQL database
   - Row Level Security
   - Real-time subscriptions
   - Storage for media

2. **API Layer**
   - RESTful endpoints
   - WebSocket connections
   - Rate limiting
   - Caching strategy

### Security Implementation
1. **Authentication**
   - Supabase Auth
   - JWT tokens
   - Role-based access

2. **Data Protection**
   - Row Level Security
   - Input validation
   - SQL injection prevention
   - XSS protection

## Development Workflow

### Code Organization
- Feature-based structure
- Shared components and utilities
- Type safety with TypeScript
- Consistent naming conventions

### Testing Strategy
- Unit tests for components
- Integration tests for features
- E2E tests for critical paths
- Performance monitoring

### Deployment Process
1. Development environment
2. Staging verification
3. Production deployment
4. Monitoring and logging

## External Integrations

### Third-party Services
1. **Payment Processing**
   - Stripe API integration
   - Radom crypto payments
   - Webhook handling

2. **AI Services**
   - OpenAI API
   - Custom AI models
   - Conversation management

3. **Cryptocurrency Data**
   - Price feeds
   - Market data
   - Trading signals

### API Dependencies
- CoinMarketCap API
- OpenAI GPT API
- Stripe API
- Radom API

## Maintenance & Monitoring

### Regular Tasks
- Database backups
- Performance optimization
- Security updates
- Content moderation

### Monitoring Systems
- Error tracking
- Performance metrics
- User analytics
- System health checks

## Future Roadmap

### Planned Features
- Advanced portfolio analytics
- Social learning features
- Mobile application
- Enhanced AI capabilities

### Scalability Plans
- Database optimization
- Caching improvements
- Load balancing
- Geographic distribution

## Documentation Structure
- API documentation
- Database schema
- Component library
- Deployment guides
- Security protocols 