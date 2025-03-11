-- Create user portfolios table
CREATE TABLE IF NOT EXISTS user_portfolios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  coin_id TEXT NOT NULL,
  coin_symbol TEXT NOT NULL,
  coin_name TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  preferred_currency TEXT DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS user_portfolios_user_id_idx ON user_portfolios(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_portfolios_updated_at
    BEFORE UPDATE ON user_portfolios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) policies
ALTER TABLE user_portfolios ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read only their own portfolio
CREATE POLICY "Users can view own portfolio"
  ON user_portfolios
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert into their own portfolio
CREATE POLICY "Users can insert into own portfolio"
  ON user_portfolios
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own portfolio
CREATE POLICY "Users can update own portfolio"
  ON user_portfolios
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to delete from their own portfolio
CREATE POLICY "Users can delete from own portfolio"
  ON user_portfolios
  FOR DELETE
  USING (auth.uid() = user_id); 