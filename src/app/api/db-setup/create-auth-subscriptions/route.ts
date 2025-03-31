import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client using service role for admin access
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Mark route as dynamic to prevent static optimization issues
export const dynamic = 'force-dynamic';

// This endpoint creates the auth.subscriptions table needed for Supabase magic link recovery
export async function GET(req: NextRequest) {
  try {
    // Check for a valid admin API key for security
    const { searchParams } = req.nextUrl;
    const apiKey = searchParams.get('api_key');
    
    if (apiKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // SQL to create the auth.subscriptions table required for Supabase auth flows
    const createAuthSubscriptionsTable = `
      -- Create subscriptions table in auth schema
      CREATE TABLE IF NOT EXISTS auth.subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
        stripe_customer_id TEXT,
        stripe_subscription_id TEXT UNIQUE,
        plan_id TEXT,
        status TEXT CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid')),
        current_period_start TIMESTAMPTZ,
        current_period_end TIMESTAMPTZ,
        cancel_at_period_end BOOLEAN DEFAULT FALSE,
        price_id TEXT,
        quantity INTEGER DEFAULT 1,
        metadata JSONB,
        customer_email TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
      
      -- Create indexes for faster lookups
      CREATE INDEX IF NOT EXISTS idx_auth_subscriptions_user_id ON auth.subscriptions(user_id);
      CREATE INDEX IF NOT EXISTS idx_auth_subscriptions_stripe_customer_id ON auth.subscriptions(stripe_customer_id);
      CREATE INDEX IF NOT EXISTS idx_auth_subscriptions_stripe_subscription_id ON auth.subscriptions(stripe_subscription_id);
      CREATE INDEX IF NOT EXISTS idx_auth_subscriptions_status ON auth.subscriptions(status);
      CREATE INDEX IF NOT EXISTS idx_auth_subscriptions_customer_email ON auth.subscriptions(customer_email);
      
      -- Enable RLS on the subscriptions table
      ALTER TABLE auth.subscriptions ENABLE ROW LEVEL SECURITY;
      
      -- Create RLS policies (skipping if they already exist)
      DO $$
      BEGIN
        -- Check if policy exists first
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies 
          WHERE tablename = 'subscriptions' 
          AND schemaname = 'auth'
          AND policyname = 'Users can view their own subscriptions'
        ) THEN
          -- Create policy if it doesn't exist
          CREATE POLICY "Users can view their own subscriptions"
            ON auth.subscriptions
            FOR SELECT
            USING (auth.uid() = user_id OR customer_email = auth.jwt() ->> 'email');
        END IF;
        
        -- Check if policy exists first
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies 
          WHERE tablename = 'subscriptions' 
          AND schemaname = 'auth'
          AND policyname = 'Service role can manage subscriptions'
        ) THEN
          -- Create policy if it doesn't exist
          CREATE POLICY "Service role can manage subscriptions"
            ON auth.subscriptions
            USING (auth.role() = 'service_role');
        END IF;
      END;
      $$;
      
      -- Create trigger function if it doesn't exist
      CREATE OR REPLACE FUNCTION auth.update_subscription_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      
      -- Create trigger if it doesn't exist
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_trigger 
          WHERE tgname = 'update_subscriptions_updated_at'
          AND tgrelid = 'auth.subscriptions'::regclass
        ) THEN
          CREATE TRIGGER update_subscriptions_updated_at
          BEFORE UPDATE ON auth.subscriptions
          FOR EACH ROW
          EXECUTE FUNCTION auth.update_subscription_updated_at();
        END IF;
      END;
      $$;
    `;
    
    // Execute the SQL
    const { error } = await supabaseAdmin.rpc('pgrest_sql', { query: createAuthSubscriptionsTable });
    
    if (error) {
      console.error('❌ Error creating auth.subscriptions table:', error);
      return NextResponse.json({ 
        error: `Database error: ${error.message}`,
        hint: "You may need to enable 'pgrest_sql' in your Supabase dashboard. Go to SQL Editor and run: CREATE EXTENSION IF NOT EXISTS pgrest;"
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'auth.subscriptions table created successfully'
    });
    
  } catch (error) {
    console.error('❌ Error in create-auth-subscriptions endpoint:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
} 