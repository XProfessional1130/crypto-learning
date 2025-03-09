# Common Issues and Solutions

This document captures common issues encountered during development and their solutions, serving as a reference for troubleshooting.

## Authentication Issues

### 1. "Unexpected end of JSON input" Error

**Issue:** When submitting an email for magic link authentication in production, the error "Failed to execute 'json' on 'Response': Unexpected end of JSON input" occurs.

**Cause:** This typically happens when:
- Environment variables for Supabase are not properly set in the production environment
- The API endpoint is returning an empty response
- Connection to the API is being interrupted

**Solution:**
1. Ensure Supabase environment variables are correctly set in Vercel:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
2. Verify the Site URL in Supabase authentication settings matches your production URL
3. Check for CORS issues by ensuring your domain is allowed in Supabase
4. Add error logging to identify specific issues:
   ```typescript
   try {
     const { error } = await signIn(email);
     if (error) {
       console.error("Auth error:", error);
     }
   } catch (err) {
     console.error("Catch error:", err);
   }
   ```

### 2. Magic Link Points to Localhost

**Issue:** Magic link emails contain localhost URLs instead of the production URL.

**Cause:** The `emailRedirectTo` URL in the sign-in function is not using the production URL.

**Solution:**
1. Ensure the redirect URL is explicitly set to the production URL:
   ```typescript
   const redirectUrl = 'https://lc-platform.vercel.app/auth/callback';
   
   return await supabase.auth.signInWithOtp({
     email,
     options: {
       emailRedirectTo: redirectUrl,
     },
   });
   ```
2. Check that `NEXT_PUBLIC_SITE_URL` is correctly set in environment variables

### 3. Session Not Persisting

**Issue:** User session is not persisting after authentication.

**Cause:** Cookie storage or Supabase client configuration issue.

**Solution:**
1. Ensure Supabase client is configured correctly:
   ```typescript
   export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
     auth: {
       autoRefreshToken: true,
       persistSession: true,
       detectSessionInUrl: true,
       flowType: 'pkce',
     }
   });
   ```
2. Check for cookie storage issues (third-party cookies, Safari privacy features)
3. Implement a server-side session check for critical routes

## Deployment Issues

### 1. Environment Variables Missing in Production

**Issue:** Environment variables from local development are not available in production.

**Cause:** Environment variables are not committed to Git and must be set manually in Vercel.

**Solution:**
1. Set all required environment variables in the Vercel project settings
2. Ensure variables are designated for the correct environments (Production, Preview, Development)
3. After setting variables, redeploy the application

### 2. Vercel Build Failures

**Issue:** Builds fail when deploying to Vercel.

**Cause:** Dependencies, TypeScript errors, or build configuration issues.

**Solution:**
1. Check build logs for specific errors
2. Ensure all dependencies are in package.json
3. Fix any TypeScript errors
4. Check for environment variables required at build time
5. Verify Next.js version compatibility

## Development Environment Issues

### 1. Hot Reload Not Working

**Issue:** Changes are not reflected automatically during development.

**Cause:** Next.js development server issue or file watching limitations.

**Solution:**
1. Restart the development server: `npm run dev`
2. Clear the Next.js cache: `rm -rf .next`
3. Check for file path issues (case sensitivity, special characters)
4. Ensure you're not exceeding file watching limits on your OS

### 2. API Route 500 Errors

**Issue:** API routes return 500 errors during development.

**Cause:** Server-side errors not properly handled.

**Solution:**
1. Add try/catch blocks to API handlers
2. Check server logs for detailed error messages
3. Verify required environment variables are available
4. Ensure external services (Supabase, etc.) are accessible

## Database Issues

### 1. Supabase Connection Errors

**Issue:** Unable to connect to Supabase database.

**Cause:** Authentication, network, or configuration issues.

**Solution:**
1. Verify Supabase URL and anon key are correct
2. Check network connectivity to Supabase
3. Ensure required tables and schemas exist
4. Check for rate limiting or service disruptions

### 2. Missing Database Tables

**Issue:** Application errors due to missing tables or columns.

**Cause:** Database schema changes not applied across environments.

**Solution:**
1. Use Supabase migrations to manage schema changes
2. Document required database structure
3. Verify all environments have the same schema
4. Implement schema version checking in the application

## UI/UX Issues

### 1. Inconsistent Styling

**Issue:** UI components look different across pages or environments.

**Cause:** CSS specificity issues or Tailwind configuration differences.

**Solution:**
1. Use consistent class naming patterns
2. Ensure Tailwind configuration is the same across environments
3. Create reusable UI components for common elements
4. Implement a design system or component library

### 2. Responsive Design Issues

**Issue:** Layout breaks on certain screen sizes.

**Cause:** Insufficient responsive design implementation.

**Solution:**
1. Use Tailwind's responsive classes consistently
2. Test on various screen sizes during development
3. Implement a mobile-first approach
4. Add specific fixes for problematic breakpoints

## Performance Issues

### 1. Slow Page Load Times

**Issue:** Pages take too long to load, especially on initial visit.

**Cause:** Large bundle sizes, unoptimized images, or excessive network requests.

**Solution:**
1. Implement code splitting and lazy loading
2. Optimize images using Next.js Image component
3. Minimize third-party scripts
4. Implement caching strategies
5. Use performance monitoring tools to identify bottlenecks

### 2. Memory Leaks

**Issue:** Application becomes slower over time or crashes.

**Cause:** Uncleared event listeners, timers, or subscription.

**Solution:**
1. Clean up event listeners in useEffect cleanup functions
2. Clear intervals and timeouts when components unmount
3. Unsubscribe from Supabase real-time subscriptions
4. Implement proper error boundaries

---

This document should be updated regularly as new issues are encountered and resolved. 