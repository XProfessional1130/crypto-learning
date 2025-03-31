-- Begin transaction
BEGIN;

-- Function to set up initial admin user
CREATE OR REPLACE FUNCTION setup_initial_admin()
RETURNS VOID AS $$
BEGIN
  -- Update or insert the admin user
  INSERT INTO profiles (id, email, role)
  SELECT id, email, 'admin'
  FROM auth.users
  WHERE email = 'admin@learningcrypto.com'
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to sync user data across tables
CREATE OR REPLACE FUNCTION sync_user_data()
RETURNS TRIGGER AS $$
BEGIN
  -- When a user is created in auth.users
  IF (TG_OP = 'INSERT') THEN
    -- Create profile if it doesn't exist
    INSERT INTO profiles (id, email, role)
    VALUES (NEW.id, NEW.email, 
      CASE 
        WHEN NEW.email = 'admin@learningcrypto.com' THEN 'admin'
        ELSE 'user'
      END
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email;
    
    -- Update any existing subscriptions with this email
    UPDATE subscriptions
    SET user_id = NEW.id
    WHERE customer_email = NEW.email AND user_id IS NULL;
  
  -- When a user is updated in auth.users
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Update profile email if it changed
    UPDATE profiles
    SET email = NEW.email,
        updated_at = NOW()
    WHERE id = NEW.id;
    
    -- Update subscription email if it changed
    UPDATE subscriptions
    SET customer_email = NEW.email
    WHERE user_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to sync subscription data
CREATE OR REPLACE FUNCTION sync_subscription_data()
RETURNS TRIGGER AS $$
BEGIN
  -- When a subscription is created/updated
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    -- If we have an email but no user_id, try to find the user
    IF (NEW.user_id IS NULL AND NEW.customer_email IS NOT NULL) THEN
      -- Look for user in auth.users
      UPDATE subscriptions
      SET user_id = u.id
      FROM auth.users u
      WHERE u.email = NEW.customer_email
      AND subscriptions.id = NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS sync_auth_user_changes ON auth.users;
DROP TRIGGER IF EXISTS sync_subscription_changes ON subscriptions;

-- Create triggers for synchronization
CREATE TRIGGER sync_auth_user_changes
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_data();

CREATE TRIGGER sync_subscription_changes
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION sync_subscription_data();

-- Add RLS policies for admin access to subscriptions
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Admins can view all subscriptions" ON subscriptions;
  DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON subscriptions;
  
  -- Create new policies
  CREATE POLICY "Admins can view all subscriptions"
    ON subscriptions
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
    );

  CREATE POLICY "Admins can manage all subscriptions"
    ON subscriptions
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
    );
END $$;

-- Execute the function to set up initial admin
SELECT setup_initial_admin();

-- Commit transaction
COMMIT; 