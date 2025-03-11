-- Run this script in Supabase SQL Editor to set up the necessary tables

-- Create user_portfolios table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, -- Reference to auth.users but we don't enforce it to allow testing
  coin_id TEXT NOT NULL,
  coin_symbol TEXT NOT NULL,
  coin_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  preferred_currency TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_portfolios ENABLE ROW LEVEL SECURITY;

-- Add a trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_portfolios_updated_at
BEFORE UPDATE ON user_portfolios
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- Insert some example portfolio items for testing
INSERT INTO user_portfolios (user_id, coin_id, coin_symbol, coin_name, amount)
VALUES 
  ('00000000-0000-0000-0000-000000000000', '1', 'BTC', 'Bitcoin', 0.5),
  ('00000000-0000-0000-0000-000000000000', '1027', 'ETH', 'Ethereum', 5);

-- Note: In a real application, you would:
-- 1. Create policies to enforce row-level security
-- 2. Link user_id to auth.users with a foreign key
-- 3. Set up proper authentication with Supabase Auth 