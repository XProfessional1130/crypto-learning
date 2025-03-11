-- Create team watchlist table - only editable by admins
CREATE TABLE IF NOT EXISTS team_watchlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coin_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    name TEXT NOT NULL,
    price_target DECIMAL NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS team_watchlist_coin_id_idx ON team_watchlist(coin_id);
CREATE INDEX IF NOT EXISTS team_watchlist_symbol_idx ON team_watchlist(symbol);

-- Create a trigger to automatically update the updated_at column
DROP TRIGGER IF EXISTS update_team_watchlist_updated_at ON team_watchlist;
CREATE TRIGGER update_team_watchlist_updated_at
BEFORE UPDATE ON team_watchlist
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on the team_watchlist table
ALTER TABLE team_watchlist ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read team watchlist
CREATE POLICY "Authenticated users can read team watchlist"
ON team_watchlist
FOR SELECT
USING (auth.role() = 'authenticated');

-- Only admins can insert data
CREATE POLICY "Only admins can insert into team watchlist"
ON team_watchlist
FOR INSERT
WITH CHECK (auth.uid() = '529cfde5-d8c3-4a6a-a9dc-5bb67fb039b5');

-- Only admins can update data
CREATE POLICY "Only admins can update team watchlist"
ON team_watchlist
FOR UPDATE
USING (auth.uid() = '529cfde5-d8c3-4a6a-a9dc-5bb67fb039b5');

-- Only admins can delete data
CREATE POLICY "Only admins can delete from team watchlist"
ON team_watchlist
FOR DELETE
USING (auth.uid() = '529cfde5-d8c3-4a6a-a9dc-5bb67fb039b5'); 