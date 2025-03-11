import { createClient } from '@supabase/supabase-js';

// Supabase client singleton
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create a single client for the entire application
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase; 