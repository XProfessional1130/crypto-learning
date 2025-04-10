# Troubleshooting Guide

This document provides solutions for common issues you might encounter when working with the Learning Crypto Platform.

## Authentication Issues

| Issue | Solution |
|-------|----------|
| **Login failures** | Check that Supabase Site URL is correctly set to match your deployment URL |
| **Session not persisting** | Ensure the auth configuration includes `persistSession: true` |
| **PKCE flow errors** | Verify `flowType: 'pkce'` is set in the Supabase client config |
| **Admin access denied** | Check `profiles` table to ensure user has `is_admin: true` |

## Database Issues

| Issue | Solution |
|-------|----------|
| **Missing tables** | Run latest migrations or check if the migrations ran successfully |
| **Permission denied** | Check Row Level Security (RLS) policies for the affected tables |
| **Duplicate key errors** | Look for unique constraint violations in your insert/update operations |
| **Slow queries** | Add indexes to frequently queried columns or optimize your query |

## API Issues

| Issue | Solution |
|-------|----------|
| **Rate limiting** | Implement proper caching strategy for external API calls |
| **Stale data** | Check if background jobs are running to update data |
| **Multiple client warnings** | Use the singleton pattern for Supabase client instantiation |
| **CORS errors** | Check CORS settings in Supabase and ensure proper origin configuration |

## Frontend Issues

| Issue | Solution |
|-------|----------|
| **React component re-renders** | Use memoization with `useMemo` and `useCallback` |
| **State management issues** | Check provider nesting order or consider using more atomic state |
| **UI inconsistencies** | Ensure Tailwind classes are applied consistently |
| **Form validation errors** | Verify client and server validation rules match |

## Deployment Issues

| Issue | Solution |
|-------|----------|
| **Build failures** | Check for TypeScript errors or missing dependencies |
| **Environment variables** | Ensure all required env variables are set in Vercel/hosting platform |
| **Post-deployment errors** | Check browser console for client-side errors |
| **Asset loading failures** | Verify paths to static assets and proper Next.js image configuration |

## Payment Integration Issues

| Issue | Solution |
|-------|----------|
| **Stripe webhook failures** | Check webhook secret and ensure correct endpoint registration |
| **Subscription status not updating** | Verify webhook events are being processed correctly |
| **Radom payment verification** | Check blockchain transaction confirmation logic |

## Performance Issues

| Issue | Solution |
|-------|----------|
| **Slow page loads** | Implement code splitting and optimize component rendering |
| **Database performance** | Add indexes or optimize query patterns |
| **API response times** | Add caching layer or optimize server functions |
| **Bundle size** | Check for large dependencies and use dynamic imports where appropriate |

## Debugging Tools

### Database Debugging

```sql
-- Check for RLS policy issues
SELECT * FROM pg_policies WHERE tablename = 'your_table';

-- Check for missing indexes
SELECT 
  relname, 
  seq_scan, 
  idx_scan
FROM 
  pg_stat_user_tables
ORDER BY 
  seq_scan DESC;
```

### API Debugging

```typescript
// Add debug logging to API calls
const response = await fetch('/api/endpoint', {
  // options
}).then(async (res) => {
  const data = await res.json();
  console.log('API Response:', data);
  return data;
});
```

### Common Database Fixes

Run the following if you encounter database permission issues:

```bash
# Apply RLS policy fixes
psql -U postgres -d your_database_name -f fix_rls_manual.sql
```

## Getting Help

If you're still stuck after trying these troubleshooting steps:

1. Check the documentation for the specific feature
2. Look for similar issues in the project issue tracker
3. Contact the development team for assistance 