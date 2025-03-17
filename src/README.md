# Project Structure

This project follows a modern, organized file structure for a Next.js application using the App Router. The structure is designed to be intuitive, maintainable, and scalable.

## Directory Structure

```
/
├── src/                       # All source code lives here
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/            # Auth-related routes (route group)
│   │   ├── (dashboard)/       # Dashboard routes (route group)
│   │   ├── api/               # API routes
│   │   ├── page.tsx           # Home page
│   │   └── layout.tsx         # Root layout
│   ├── components/            # Reusable UI components
│   │   ├── features/          # Feature-specific components
│   │   │   ├── auth/          # Auth components
│   │   │   ├── chat/          # Chat components
│   │   │   ├── dashboard/     # Dashboard components
│   │   │   ├── home/          # Home page components
│   │   │   ├── membership/    # Membership components
│   │   │   ├── modals/        # Modal components
│   │   │   ├── navigation/    # Navigation components
│   │   │   └── team-dashboard/# Team dashboard components
│   │   ├── layouts/           # Layout components
│   │   ├── molecules/         # Molecular components (composite UI elements)
│   │   └── ui/                # UI primitives
│   │       ├── atoms/         # Atomic UI components (smallest units)
│   │       └── organisms/     # Organism components (complex UI assemblies)
│   ├── hooks/                 # React hooks
│   │   ├── auth/              # Auth-related hooks
│   │   ├── dashboard/         # Dashboard-related hooks
│   │   ├── shared/            # Shared hooks
│   │   └── ui/                # UI-related hooks
│   ├── lib/                   # Utilities and services
│   │   ├── api/               # API clients
│   │   ├── config/            # Configuration
│   │   ├── utils/             # Utility functions
│   │   └── providers/         # Context providers
│   └── types/                 # TypeScript types
├── public/                    # Static assets
├── scripts/                   # Utility scripts
├── supabase/                  # Supabase migrations and config
└── __tests__/                 # Tests organized by feature
```

## Conventions

1. **Component Organization**:
   - UI components are in `components/ui`
   - Layout components are in `components/layouts`
   - Feature-specific components are in `components/features/{feature-name}`
   - We follow a modified atomic design pattern with:
     - Atoms: Smallest UI elements (buttons, inputs)
     - Molecules: Composite UI elements
     - Organisms: Complex UI assemblies

2. **Hooks**:
   - Hooks are organized by feature area
   - UI-related hooks are in `hooks/ui`
   - Auth-related hooks are in `hooks/auth`
   - Dashboard-related hooks are in `hooks/dashboard`
   - Shared hooks are in `hooks/shared`

3. **API Routes**:
   - All API routes are in `app/api` using the App Router pattern
   - Each endpoint has its own directory with `route.ts` file

4. **Utilities and Services**:
   - API clients are in `lib/api`
   - Configuration files are in `lib/config`
   - Utility functions are in `lib/utils`
   - Context providers are in `lib/providers`

## Best Practices

- Keep components focused on a single responsibility
- Organize by feature, not by file type, when possible
- Use relative imports for components within the same feature
- Use absolute imports for shared utilities and components 