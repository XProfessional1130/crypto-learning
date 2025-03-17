-- Create a function to get a user ID by email
-- This allows us to look up a user ID without needing direct access to the auth.users table
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(user_email TEXT)
RETURNS UUID 
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
BEGIN
  -- First try to get from auth.users if we have access
  BEGIN
    SELECT id INTO user_id
    FROM auth.users
    WHERE email = user_email
    LIMIT 1;
    
    EXCEPTION WHEN others THEN
      -- If we can't access auth.users, return null
      RETURN NULL;
  END;
  
  -- If we found a user, return it
  IF user_id IS NOT NULL THEN
    RETURN user_id;
  END IF;
  
  -- Otherwise, try to find in the profiles table if it exists
  BEGIN
    SELECT id INTO user_id
    FROM public.profiles
    WHERE email = user_email
    LIMIT 1;
    
    EXCEPTION WHEN others THEN
      -- If profiles table doesn't exist, return null
      RETURN NULL;
  END;
  
  RETURN user_id;
END;
$$; 