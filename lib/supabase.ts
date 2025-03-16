import { createClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Define the site URL for redirects
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL 
  || (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : '')
  || 'http://localhost:3000';

// Create Supabase client for client-side operations with simple auth configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
    flowType: 'pkce',
    // Ensure redirects go to the correct environment
    url: siteUrl,
    cookieOptions: {
      domain: new URL(siteUrl).hostname === 'localhost' ? 'localhost' : undefined
    }
  }
});

// Log any initialization issues in development
if (process.env.NODE_ENV === 'development') {
  if (!supabaseUrl) console.error('Missing NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseAnonKey) console.error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
  if (!siteUrl) console.error('Missing NEXT_PUBLIC_SITE_URL');
  console.log(`Supabase client configured with site URL: ${siteUrl}`);
}

// For server-side operations that require higher privileges
export const createServiceClient = () => {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      flowType: 'pkce',
      url: siteUrl
    }
  });
}; 