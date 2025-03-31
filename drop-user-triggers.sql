-- Script to identify and drop custom triggers on auth.users table

-- First, let's identify all triggers on the auth.users table
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
AND event_object_table = 'users';

-- Drop custom triggers on auth.users (run the SELECT above first to review)
DO $$
DECLARE
  trigger_rec RECORD;
BEGIN
  -- Find triggers on auth.users that might be causing conflicts
  -- We're specifically looking for triggers that modify the same record
  FOR trigger_rec IN 
    SELECT trigger_name 
    FROM information_schema.triggers
    WHERE event_object_schema = 'auth'
    AND event_object_table = 'users'
    -- Skip any core Supabase triggers to avoid breaking functionality
    AND trigger_name NOT LIKE 'supabase_%'
    AND trigger_name NOT LIKE 'auth_%'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.users', trigger_rec.trigger_name);
    RAISE NOTICE 'Dropped trigger: %', trigger_rec.trigger_name;
  END LOOP;
  
  -- If we need to specifically target known problematic triggers:
  -- Uncomment and modify these lines:
  -- DROP TRIGGER IF EXISTS update_user_profile ON auth.users;
  -- DROP TRIGGER IF EXISTS sync_user_subscriptions ON auth.users;
  -- DROP TRIGGER IF EXISTS update_user_record ON auth.users;
END;
$$;

-- Finally, verify that only essential triggers remain
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
AND event_object_table = 'users'; 