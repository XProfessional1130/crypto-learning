-- Create the watchlist table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.watchlist (
  id SERIAL PRIMARY KEY,
  user_id UUID,
  coin_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  price_target DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read all watchlist items
CREATE POLICY "Allow authenticated users to read watchlist" 
  ON public.watchlist 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Sample data (uncomment to add sample coins to watchlist)
/*
INSERT INTO public.watchlist (coin_id, symbol, name, price_target)
VALUES 
  ('1027', 'ETH', 'Ethereum', 3000),
  ('5426', 'SOL', 'Solana', 120),
  ('3890', 'MATIC', 'Polygon', 1.5),
  ('1839', 'BNB', 'BNB', 350),
  ('11156', 'ARB', 'Arbitrum', 1.8);
*/

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS watchlist_coin_id_idx ON public.watchlist (coin_id);
CREATE INDEX IF NOT EXISTS watchlist_symbol_idx ON public.watchlist (symbol); 