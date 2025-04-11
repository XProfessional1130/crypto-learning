# Learning Crypto Platform Documentation

This is the central documentation hub for the Learning Crypto Platform. We've organized documentation into key sections to help you quickly find what you need.

> **Note**: This documentation has been simplified and consolidated to make it more maintainable and easier to navigate. Many previously separate documents have been merged into more comprehensive guides.

## Core Documentation

| Document | Description |
|----------|-------------|
| [Architecture](ARCHITECTURE.md) | System architecture, code organization, and design patterns |
| [Database](DATABASE.md) | Database schema, relationships, and access controls |
| [Getting Started](getting-started.md) | Setup guide for new developers |

## Features

| Feature | Description |
|---------|-------------|
| [User Management](features/users.md) | User authentication, profiles, and access control |
| [Portfolio System](features/portfolio.md) | User and team portfolio functionality |
| [Watchlist System](features/watchlist.md) | User and team watchlist functionality |
| [Crypto Data](features/crypto-data.md) | Market data integration and management |
| [AI Chat](features/ai-chat.md) | AI assistant implementation |
| [Payments](features/payments.md) | Stripe and Radom integration |
| [User Tiers](features/user-tiers.md) | Subscription tiers and feature access control |

## Development Guides

| Guide | Description |
|-------|-------------|
| [Deployment](guides/deployment.md) | Deployment process and environments |
| [Testing](guides/testing.md) | Testing strategy and implementation |
| [Troubleshooting](guides/troubleshooting.md) | Common issues and solutions |
| [Server Components](guides/server-components.md) | Server component implementation strategy |
| [Authentication](guides/authentication.md) | Authentication system and user management |
| [Optimization](guides/optimization.md) | API and performance optimization strategies |

## Coding Standards

We follow these core principles in our codebase:

1. **Simple Solutions**: Choose simple, readable code over complex implementations
2. **Code Reuse**: Avoid duplication and leverage existing components
3. **Environment Awareness**: Write code that functions across dev, test, and prod
4. **Clean Architecture**: Maintain separation of concerns
5. **File Size Limits**: Keep files under 300 lines for maintainability
6. **No Mocks in Production**: Use mock data only for testing

## Directory Structure

The main application structure:

```
/src
  /app           # Next.js App Router routes and pages
  /components    # Reusable UI components
  /lib           # Core logic and utilities
    /api         # API client functions
    /providers   # React context providers
    /supabase    # Supabase configuration
    /utils       # Utility functions
  /hooks         # Custom React hooks
  /types         # TypeScript type definitions
```

## Quick Links

- [Main README](../README.md) - Project overview
- [Getting Started](getting-started.md) - Setup instructions
- [Architecture](ARCHITECTURE.md) - System architecture
- [Database](DATABASE.md) - Database documentation 