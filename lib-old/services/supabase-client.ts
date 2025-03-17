import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Define the client type to avoid type errors
type SupabaseClientType = SupabaseClient;

// Declare a truly global variable to survive all module reloads
// This will be available in globalThis/window in browser and global in Node
declare global {
  // For browser global scope
  interface Window {
    __supabaseClientInstance: SupabaseClientType | undefined;
  }
  
  // For global scope across environments (Node/browser)
  var __supabaseClientInstance: SupabaseClientType | undefined;
}

/**
 * Enhanced singleton pattern that's resistant to React Fast Refresh
 * and module reloads in both development and production.
 * 
 * This approach uses environment-specific globals to maintain a single instance.
 */
const getSupabaseClient = (): SupabaseClientType => {
  // Determine which global variable to use based on environment
  const isBrowser = typeof window !== 'undefined';
  
  // Check if we already have an instance
  if (isBrowser && window.__supabaseClientInstance) {
    return window.__supabaseClientInstance;
  } else if (globalThis.__supabaseClientInstance) {
    return globalThis.__supabaseClientInstance;
  } else if (global.__supabaseClientInstance) {
    return global.__supabaseClientInstance;
  }
  
  // Create a new instance if none exists
  const newClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true
    }
  });
  
  // Store in all possible global variables to ensure it's available
  // regardless of which scope is preserved during hot module reloading
  if (isBrowser) {
    window.__supabaseClientInstance = newClient;
  }
  globalThis.__supabaseClientInstance = newClient;
  global.__supabaseClientInstance = newClient;
  
  // Only log in development mode
  if (process.env.NODE_ENV === 'development') {
    console.log('Created new Supabase client instance');
  }
  
  return newClient;
};

// Get or create the singleton instance
const supabase = getSupabaseClient();

// Log any initialization issues in development
if (process.env.NODE_ENV === 'development') {
  if (!supabaseUrl) console.error('Missing NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseAnonKey) console.error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export default supabase; 