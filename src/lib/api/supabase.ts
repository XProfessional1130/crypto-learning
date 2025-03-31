import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create Supabase client with explicit auth config for magic link flow
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Also export a method to create admin client when needed
export const createAdminClient = (serviceRoleKey: string) => {
  return createClient(supabaseUrl, serviceRoleKey);
};

// For server-side operations that require higher privileges
export const createServiceClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey);
}; 