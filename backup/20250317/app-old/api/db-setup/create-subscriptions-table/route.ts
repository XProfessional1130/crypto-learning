import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client using service role for admin access
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// FOR TESTING ONLY - DO NOT USE IN PRODUCTION
export async function GET(req: NextRequest) {
  try {
    // Check for a valid admin API key for security
    const url = new URL(req.url);
    const apiKey = url.searchParams.get('api_key');
    
    if (apiKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // SQL to create the subscriptions table
    const createSubscriptionsTable = `
      -- Create subscriptions table
      CREATE TABLE IF NOT EXISTS subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
        stripe_customer_id TEXT,
        stripe_subscription_id TEXT UNIQUE NOT NULL,
        plan_id TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid')),
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
      CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
      CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
      CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
      CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
      CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_email ON subscriptions(customer_email);
      
      -- Enable RLS on the subscriptions table
      ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
      
      -- Create RLS policies (skipping if they already exist)
      DO $$
      BEGIN
        -- Check if policy exists first
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies 
          WHERE tablename = 'subscriptions' 
          AND policyname = 'Users can view their own subscriptions'
        ) THEN
          -- Create policy if it doesn't exist
          CREATE POLICY "Users can view their own subscriptions"
            ON subscriptions
            FOR SELECT
            USING (auth.uid() = user_id OR customer_email = auth.jwt() ->> 'email');
        END IF;
        
        -- Check if policy exists first
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies 
          WHERE tablename = 'subscriptions' 
          AND policyname = 'Service role can manage subscriptions'
        ) THEN
          -- Create policy if it doesn't exist
          CREATE POLICY "Service role can manage subscriptions"
            ON subscriptions
            USING (auth.role() = 'service_role');
        END IF;
      END;
      $$;
      
      -- Create trigger function if it doesn't exist
      CREATE OR REPLACE FUNCTION update_subscription_updated_at()
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
        ) THEN
          CREATE TRIGGER update_subscriptions_updated_at
          BEFORE UPDATE ON subscriptions
          FOR EACH ROW
          EXECUTE FUNCTION update_subscription_updated_at();
        END IF;
      END;
      $$;
    `;
    
    // Execute the SQL
    const { error } = await supabaseAdmin.rpc('pgrest_sql', { query: createSubscriptionsTable });
    
    if (error) {
      console.error('❌ Error creating subscriptions table:', error);
      return NextResponse.json({ 
        error: `Database error: ${error.message}`,
        hint: "You may need to enable 'pgrest_sql' in your Supabase dashboard. Go to SQL Editor and run: CREATE EXTENSION IF NOT EXISTS pgrest;"
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Subscriptions table created or verified successfully'
    });
    
  } catch (error) {
    console.error('❌ Error in db-setup endpoint:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
} 