-- Create watchlist table
CREATE TABLE IF NOT EXISTS watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coin_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  price_target FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, coin_id)
);

-- Set up RLS (Row Level Security)
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can only see their own watchlist items
CREATE POLICY "Users can select their own watchlist items" 
ON watchlist 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own watchlist items
CREATE POLICY "Users can insert their own watchlist items" 
ON watchlist 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own watchlist items
CREATE POLICY "Users can update their own watchlist items" 
ON watchlist 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own watchlist items
CREATE POLICY "Users can delete their own watchlist items" 
ON watchlist 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column() 
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Set trigger on watchlist table for updated_at
DROP TRIGGER IF EXISTS update_watchlist_updated_at ON watchlist;
CREATE TRIGGER update_watchlist_updated_at
BEFORE UPDATE ON watchlist
FOR EACH ROW
EXECUTE FUNCTION update_modified_column(); 