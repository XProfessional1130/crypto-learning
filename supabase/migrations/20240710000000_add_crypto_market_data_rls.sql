-- Add RLS policy for the crypto_market_data table
-- First, check if RLS is enabled; if not, enable it
DO $$
BEGIN
  -- Check if RLS is already enabled on the table
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'crypto_market_data' 
    AND rowsecurity = true
  ) THEN
    -- Enable RLS on the table
    EXECUTE 'ALTER TABLE IF EXISTS public.crypto_market_data ENABLE ROW LEVEL SECURITY;';
    
    -- Now we need to add policies to make the table accessible
    -- Create a policy allowing all authenticated users to read data
    EXECUTE $policy$
    CREATE POLICY "Allow authenticated users to read crypto market data" 
    ON public.crypto_market_data 
    FOR SELECT 
    TO authenticated
    USING (true);
    $policy$;

    -- Create a policy allowing service_role to do everything
    EXECUTE $policy$
    CREATE POLICY "Service role can manage crypto market data" 
    ON public.crypto_market_data 
    USING (auth.jwt() ? 'role' AND auth.jwt()->>'role' = 'service_role');
    $policy$;
    
    RAISE NOTICE 'Enabled RLS and added policies for crypto_market_data table';
  ELSE
    RAISE NOTICE 'RLS already enabled for crypto_market_data table';
    
    -- Check if the read policy exists, if not create it
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = 'crypto_market_data' 
      AND policyname = 'Allow authenticated users to read crypto market data'
    ) THEN
      EXECUTE $policy$
      CREATE POLICY "Allow authenticated users to read crypto market data" 
      ON public.crypto_market_data 
      FOR SELECT 
      TO authenticated
      USING (true);
      $policy$;
      
      RAISE NOTICE 'Added read policy for crypto_market_data table';
    END IF;
    
    -- Check if the service role policy exists, if not create it
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = 'crypto_market_data' 
      AND policyname = 'Service role can manage crypto market data'
    ) THEN
      EXECUTE $policy$
      CREATE POLICY "Service role can manage crypto market data" 
      ON public.crypto_market_data 
      USING (auth.jwt() ? 'role' AND auth.jwt()->>'role' = 'service_role');
      $policy$;
      
      RAISE NOTICE 'Added service role policy for crypto_market_data table';
    END IF;
  END IF;
END;
$$;
