# LearningCrypto Platform Documentation

Welcome to the LearningCrypto Platform documentation. This index provides an overview of all available documentation to help you navigate the codebase more effectively.

## Getting Started

- [Getting Started Guide](getting-started.md) - Complete setup instructions for new developers

## Core System Documentation

- [Database Schema](database-schema.md) - Comprehensive documentation of all database tables
- [Admin Authentication](admin-authentication.md) - Admin role implementation and security details

## Feature-Specific Documentation

- [AI Chat Setup](AI-CHAT-SETUP.md) - Setting up the AI chat functionality
- [Scheduler Setup](SCHEDULER-SETUP.md) - Background job scheduling system
- [API Optimization](API-OPTIMIZATION.md) - API performance optimization strategies
- [CoinMarketCap Integration](COINMARKETCAP.md) - CoinMarketCap API integration

## Setup Guides

- [Stripe Setup Guide](../README-STRIPE-SETUP.md) - Subscription payment integration with Stripe
- [Team Portfolio Setup](../README-SETUP.md) - Setting up and troubleshooting team portfolios

## Development Guides

- [Server Components Implementation](server-components-implementation-log.md) - Server components migration details
- [Server Component Utilization Plan](server-component-utilization-plan.md) - Planning for server components
- [Server Components Measurement](server-components-measurement.md) - Performance measurement
- [Ghost Migration](ghost-migration.md) - Content migration from Ghost CMS
- [Implementation Steps](IMPLEMENTATION-STEPS.md) - Step-by-step implementation guide

## Coding Standards

Our codebase follows specific coding standards:

1. **Simplicity First**: We prefer simple, readable solutions over complex ones
2. **Code Reuse**: Avoid duplicating functionality that exists elsewhere
3. **Environment Awareness**: Code should account for different environments (dev, test, prod)
4. **File Size Limits**: Keep files under 200-300 lines; refactor larger files
5. **No Mock Data in Production**: Only use mock data for testing
6. **Clean Architecture**: Maintain clear separation of concerns

For more details, see the [Tech Stack](../.cursor/rules/techstack.mdc) and [Coding Preferences](../.cursor/rules/codingpref.mdc) guides.

## Support & Troubleshooting

If you encounter issues not covered in the documentation:

1. Check the common troubleshooting tips in the [Getting Started Guide](getting-started.md#common-setup-issues)
2. Review the appropriate feature-specific documentation
3. Reach out to the development team 