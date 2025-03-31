-- Fix for "tuple to be updated was already modified by an operation triggered by the current command"
-- This script specifically targets triggers that might conflict with password recovery operations

-- PART 1: Identify all triggers that might be involved in password recovery

-- Check triggers on auth.users
SELECT trigger_name, event_manipulation, action_statement, action_timing
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
AND event_object_table = 'users'
ORDER BY trigger_name;

-- PART 2: Fix conflicting triggers

-- Option 1: Drop specific problematic triggers
DO $$
BEGIN
  -- Uncomment the ones you've identified as problematic from the SELECT above
  -- DROP TRIGGER IF EXISTS handle_user_update ON auth.users;
  -- DROP TRIGGER IF EXISTS sync_profile_data ON auth.users;
  -- DROP TRIGGER IF EXISTS sync_subscription_data ON auth.users;
END;
$$;

-- Option 2: Modify triggers to avoid conflicts with password recovery
-- This approach is better if you need to keep the trigger functionality
CREATE OR REPLACE FUNCTION auth.safe_user_update_function()
RETURNS TRIGGER AS $$
BEGIN
  -- Skip trigger execution during password recovery operations
  -- This is checking for specific operations that might happen during recovery
  IF TG_OP = 'UPDATE' AND 
     (OLD.recovery_token IS NULL AND NEW.recovery_token IS NOT NULL) OR
     (OLD.recovery_token IS NOT NULL AND NEW.recovery_token IS NULL) OR
     (OLD.recovery_token IS NOT NULL AND NEW.recovery_token IS NOT NULL AND OLD.recovery_token <> NEW.recovery_token)
  THEN
    -- Skip any additional actions when a recovery is in progress
    RETURN NEW;
  END IF;
  
  -- Your original trigger logic goes here
  -- ...
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- To apply the fixed trigger function, you would typically:
-- DROP TRIGGER IF EXISTS your_problematic_trigger ON auth.users;
-- CREATE TRIGGER your_problematic_trigger
--   BEFORE UPDATE ON auth.users
--   FOR EACH ROW
--   EXECUTE FUNCTION auth.safe_user_update_function();

-- PART 3: Verify that Supabase auth functions still work properly
-- This creates a test user to check if authentication operations still work
-- DO $$
-- BEGIN
--   -- Only uncomment if you need to test password recovery
--   -- INSERT INTO auth.users (email, encrypted_password)
--   -- VALUES ('test_recovery@example.com', '...');
-- END;
-- $$; 