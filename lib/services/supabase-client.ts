import { createClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Declare the global variable to hold the Supabase instance across module loads during development
declare global {
  var __supabaseClient: ReturnType<typeof createClient> | undefined;
}

/**
 * This singleton implementation uses a global variable to survive React Fast Refresh
 * in development mode, which prevents multiple instances warning
 */
const getSupabaseClient = (): ReturnType<typeof createClient> => {
  // In production, we can use a simple module-level singleton
  if (process.env.NODE_ENV === 'production') {
    if (!globalThis.__supabaseClient) {
      globalThis.__supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          detectSessionInUrl: true,
          persistSession: true,
          autoRefreshToken: true
        }
      });
    }
    return globalThis.__supabaseClient;
  }
  
  // In development, we use global to survive Fast Refresh
  if (!global.__supabaseClient) {
    global.__supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true
      }
    });
  }
  
  return global.__supabaseClient;
};

// Create and export the Supabase client
const supabase = getSupabaseClient();

// Log any initialization issues in development
if (process.env.NODE_ENV === 'development') {
  if (!supabaseUrl) console.error('Missing NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseAnonKey) console.error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export default supabase; 