import { createClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Singleton pattern for Supabase client
let supabaseInstance: ReturnType<typeof createClient> | null = null;

// Get or create the Supabase client (singleton)
const getSupabaseClient = () => {
  if (supabaseInstance === null) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true
      }
    });
  }
  return supabaseInstance;
};

// Create and export the Supabase client
const supabase = getSupabaseClient();

// Log any initialization issues in development
if (process.env.NODE_ENV === 'development') {
  if (!supabaseUrl) console.error('Missing NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseAnonKey) console.error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export default supabase; 