# Updating Imports for App Router Migration

## Common import changes

During the migration from Pages Router to App Router, you may need to update imports in your components. Here are some common changes:

1. **Router imports**:
   - Pages Router: `import { useRouter } from 'next/router';`
   - App Router: `import { useRouter } from 'next/navigation';`

2. **Link behavior changes**:
   - In App Router, the `<Link>` component doesn't require the `passHref` prop
   - The `legacyBehavior` prop is also not needed

3. **Navigation**:
   - Pages Router: `router.push('/dashboard')`
   - App Router: `router.push('/dashboard')` (same method, but different import)

4. **Route Handlers**:
   - Pages Router: Default export function with `req` and `res` parameters
   - App Router: Named exports for HTTP methods (`GET`, `POST`, etc.) with `req` parameter

5. **Request/Response handling**:
   - Pages Router: `NextApiRequest` and `NextApiResponse` from 'next'
   - App Router: `NextRequest` and `NextResponse` from 'next/server'

## Check these files for import updates

Review the following types of files for import updates:

1. Components using router functionality
2. Components with API calls to the endpoints we've migrated
3. Components with authentication logic

## Steps to update imports

1. Search for `next/router` imports and replace with `next/navigation`
2. Update any components using the migrated API routes to use the new URL parameter format
3. Review authentication flows to ensure they're using the App Router pattern 