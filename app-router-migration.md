# App Router Migration Guide

This document outlines the process of migrating from a mixed Pages Router and App Router setup to using only the App Router in our Next.js application.

## Migration Steps

1. **API Routes Migration**
   - All API routes have been migrated from `/pages/api/*` to `/app/api/*/route.ts`
   - Updated to use `NextRequest` and `NextResponse` from 'next/server'
   - Changed from default exports to named exports for HTTP methods (GET, POST, etc.)

2. **Client-Side Code Updates**
   - Updated router imports from 'next/router' to 'next/navigation'
   - Ensured all client components use App Router patterns for navigation
   - Refer to `app/api/updating-imports.md` for detailed guidance on import changes

3. **Final Cleanup**
   - Run the `scripts/finalize-app-router-migration.sh` script when ready
   - This script will:
     - Check for any remaining references to 'next/router'
     - Remove the Pages Router directory
     - Update next.config.js to fully embrace App Router
     - Add a note to the refactoring-progress.md file

4. **Testing**
   - Test all routes to ensure they work as expected
   - Test authentication flows
   - Verify API endpoints

## Benefits of App Router

1. **Server Components**: Improved performance with React Server Components
2. **Simplified Data Fetching**: More intuitive data fetching patterns
3. **Nested Layouts**: Better composition of UI elements
4. **Loading and Error States**: Built-in loading and error handling
5. **Route Groups**: Logical organization of routes
6. **Future-Proof**: Aligned with Next.js's future direction

## Common Issues During Migration

1. **Router Import Changes**: Update all imports from 'next/router' to 'next/navigation'
2. **API Route Parameter Access**: In App Router, use `new URL(req.url).searchParams` instead of `req.query`
3. **Response Format**: Use `NextResponse.json()` instead of `res.status().json()`
4. **Client vs. Server Components**: Be mindful of the distinction between client and server components

## Rollback Plan

If issues arise after migration:
1. Revert the changes to next.config.js
2. Restore the Pages Router directory from version control
3. Update any client-side code that was modified during migration

## Completion Checklist

- [x] All API routes migrated
- [x] All client-side router imports updated
- [x] Finalization script run
- [x] All tests passing
- [ ] Application deployed and verified in production 