# Learning Crypto Platform Documentation

This directory contains comprehensive documentation for the Learning Crypto Platform. Use this guide to find specific documentation about different aspects of the platform.

## Core Documentation

| Document | Description |
|----------|-------------|
| [Architecture](ARCHITECTURE.md) | Overview of application architecture, code organization, and design patterns |
| [Database](DATABASE.md) | Database schema, table relationships, and RLS policies |

## Setup Guides

| Guide | Description |
|-------|-------------|
| [Getting Started](getting-started.md) | Initial setup for developers |
| [Admin Authentication](admin-authentication.md) | Setting up and managing admin access |
| [AI Chat Setup](AI-CHAT-SETUP.md) | Configuration for the AI assistant features |

## Feature Documentation

| Feature | Documentation |
|---------|---------------|
| [Portfolio Management](portfolio.md) | User and team portfolio functionality |
| [Watchlist](watchlist.md) | User and team watchlist functionality |
| [Cryptocurrency Data](crypto-data.md) | Cryptocurrency data sources and management |
| [Background Jobs](jobs.md) | Scheduled tasks and background processing |
| [Subscriptions](subscriptions.md) | User subscription management (Stripe and Radom) |

## API Documentation

| API | Documentation |
|-----|---------------|
| [Authentication API](api/auth.md) | User authentication endpoints |
| [Portfolio API](api/portfolio.md) | Portfolio management endpoints |
| [Watchlist API](api/watchlist.md) | Watchlist management endpoints |
| [Market Data API](api/market-data.md) | Cryptocurrency market data endpoints |

## Development Guides

| Guide | Description |
|-------|-------------|
| [Coding Standards](coding-standards.md) | Coding conventions and best practices |
| [Testing Guide](testing.md) | Testing strategy and examples |
| [Deployment](deployment.md) | Deployment process and environments |
| [Contributing](contributing.md) | Guidelines for contributing to the project |

## Troubleshooting

| Guide | Description |
|-------|-------------|
| [Common Issues](troubleshooting.md) | Solutions to common problems |
| [Database Troubleshooting](database-troubleshooting.md) | Database-specific issues and solutions |
| [Authentication Issues](auth-troubleshooting.md) | Authentication-related problems and fixes |

## External Services Integration

| Integration | Documentation |
|-------------|---------------|
| [Stripe Integration](stripe-integration.md) | Stripe payment processing setup |
| [Radom Integration](radom-integration.md) | Radom crypto payment processing setup |
| [OpenAI Integration](openai-integration.md) | OpenAI API integration details |
| [CoinMarketCap Integration](coinmarketcap-integration.md) | CoinMarketCap API integration |

## Architecture Diagrams

| Diagram | Description |
|---------|-------------|
| [System Overview](diagrams/system-overview.md) | High-level system architecture |
| [Data Flow](diagrams/data-flow.md) | Data flow between components |
| [Authentication Flow](diagrams/auth-flow.md) | User authentication process |
| [Database Schema](diagrams/db-schema.md) | Visual database schema representation |

## Getting Started

- [Getting Started Guide](getting-started.md) - Setup instructions for new developers

## Core Documentation

- [Database Schema](database-schema.md) - Database tables documentation
- [Admin Authentication](admin-authentication.md) - Admin role implementation

## Feature Documentation

- [Scheduler Setup](SCHEDULER-SETUP.md) - Background job system
- [API Optimization](API-OPTIMIZATION.md) - API performance strategies

## Setup Guides

- [Stripe Setup](../README-STRIPE-SETUP.md) - Stripe payment integration
- [Team Portfolio Setup](../README-SETUP.md) - Team portfolios setup

## Development Guides

- [Server Components Implementation](server-components-implementation-log.md) - Migration details
- [Server Component Plan](server-component-utilization-plan.md) - Planning
- [Server Components Measurement](server-components-measurement.md) - Performance measurement
- [Ghost Migration](ghost-migration.md) - Content migration from Ghost CMS
- [Implementation Steps](IMPLEMENTATION-STEPS.md) - Step-by-step guide

## Coding Standards

1. **Simple Solutions**: Choose simple, readable options
2. **Code Reuse**: Avoid duplication
3. **Multiple Environments**: Support dev, test, and prod
4. **File Size Limits**: Keep files under 300 lines
5. **No Mock Data in Production**: Mock only for tests
6. **Clean Architecture**: Clear separation of concerns

See [Tech Stack](../.cursor/rules/techstack.mdc) and [Coding Preferences](../.cursor/rules/codingpref.mdc) for more details.

## Support & Troubleshooting

If you encounter issues:

1. Check the [Getting Started Guide](getting-started.md#common-setup-issues)
2. Review feature-specific documentation
3. Contact the development team 