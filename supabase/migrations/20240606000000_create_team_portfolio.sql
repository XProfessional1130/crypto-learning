-- Create team portfolio table - only editable by admins
CREATE TABLE IF NOT EXISTS team_portfolio (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coin_id TEXT NOT NULL,
    coin_symbol TEXT NOT NULL,
    coin_name TEXT NOT NULL,
    amount DECIMAL NOT NULL CHECK (amount > 0),
    preferred_currency TEXT NOT NULL DEFAULT 'USD' CHECK (preferred_currency IN ('USD', 'BTC')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index on coin_id for faster lookups
CREATE INDEX IF NOT EXISTS team_portfolio_coin_id_idx ON team_portfolio(coin_id);

-- Add a function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at column
DROP TRIGGER IF EXISTS update_team_portfolio_updated_at ON team_portfolio;
CREATE TRIGGER update_team_portfolio_updated_at
BEFORE UPDATE ON team_portfolio
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on the team_portfolio table
ALTER TABLE team_portfolio ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read team portfolio
CREATE POLICY "Authenticated users can read team portfolio"
ON team_portfolio
FOR SELECT
USING (auth.role() = 'authenticated');

-- Only admins can insert data
CREATE POLICY "Only admins can insert into team portfolio"
ON team_portfolio
FOR INSERT
WITH CHECK (auth.uid() = '529cfde5-d8c3-4a6a-a9dc-5bb67fb039b5');

-- Only admins can update data
CREATE POLICY "Only admins can update team portfolio"
ON team_portfolio
FOR UPDATE
USING (auth.uid() = '529cfde5-d8c3-4a6a-a9dc-5bb67fb039b5');

-- Only admins can delete data
CREATE POLICY "Only admins can delete from team portfolio"
ON team_portfolio
FOR DELETE
USING (auth.uid() = '529cfde5-d8c3-4a6a-a9dc-5bb67fb039b5'); 