-- Add plan_type to profiles and implement user subscription tier support
BEGIN;

-- Add plan_type column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'free' CHECK (plan_type IN ('free', 'paid'));

-- Create function to update user plan_type based on subscription status
CREATE OR REPLACE FUNCTION update_user_plan_type()
RETURNS TRIGGER AS $$
BEGIN
  -- If subscription becomes active, set to paid
  IF NEW.status = 'active' THEN
    UPDATE profiles SET plan_type = 'paid' WHERE id = NEW.user_id;
  -- If subscription is canceled and grace period ended, set to free
  ELSIF (NEW.status = 'canceled' AND NEW.current_period_end < NOW()) THEN
    UPDATE profiles SET plan_type = 'free' WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on subscriptions table
DROP TRIGGER IF EXISTS subscription_update_plan_type ON subscriptions;
CREATE TRIGGER subscription_update_plan_type
AFTER INSERT OR UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_user_plan_type();

-- Add RLS policy for content based on plan_type
CREATE POLICY IF NOT EXISTS "Paid content access based on plan_type"
ON content
FOR SELECT
USING (
  status = 'published' AND 
  (
    visibility = 'public' OR 
    (visibility = 'members' AND auth.role() = 'authenticated') OR
    (
      visibility = 'paid' AND EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() 
        AND (p.plan_type = 'paid' OR p.role = 'admin')
      )
    )
  )
);

-- Update existing subscriptions to set plan_type
UPDATE profiles p
SET plan_type = 'paid'
WHERE EXISTS (
  SELECT 1 FROM subscriptions s
  WHERE s.user_id = p.id
  AND s.status = 'active'
);

COMMIT; 