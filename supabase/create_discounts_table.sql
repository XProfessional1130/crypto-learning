-- Create discounts table
CREATE TABLE IF NOT EXISTS discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;

-- Add a trigger to update the updated_at column
CREATE TRIGGER update_discounts_updated_at
BEFORE UPDATE ON discounts
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- Create a policy to allow public read access
CREATE POLICY "Allow public read access"
ON discounts FOR SELECT
TO public
USING (true);

-- Create a policy to allow only authenticated users with admin role to modify data
CREATE POLICY "Allow admin write access"
ON discounts FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin')
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Insert sample data
INSERT INTO discounts (title, description, url, category, expires_at)
VALUES 
  ('Binance: 20% Off Trading Fees', 'Get 20% off trading fees when you sign up using our referral link. Valid for new users only.', 'https://binance.com/ref=12345', 'Exchange', '2024-12-31T23:59:59Z'),
  ('Ledger: $20 Off Nano X', 'Save $20 on the Ledger Nano X hardware wallet. Secure your crypto with the industry-leading hardware wallet.', 'https://ledger.com/ref=12345', 'Hardware Wallet', '2024-11-30T23:59:59Z'),
  ('Kraken: Free $10 in Bitcoin', 'Get $10 in free Bitcoin when you make your first trade of $100 or more on Kraken.', 'https://kraken.com/ref=12345', 'Exchange', '2024-10-15T23:59:59Z'),
  ('TradingView: 30% Off Premium Plan', 'Save 30% on TradingView Premium. Access advanced charting tools and indicators for better trading decisions.', 'https://tradingview.com/ref=12345', 'Trading Tools', '2024-09-30T23:59:59Z'),
  ('Trezor: Buy One, Get 10% Off', 'Purchase a Trezor hardware wallet and get 10% off your order with our exclusive code.', 'https://trezor.com/ref=12345', 'Hardware Wallet', '2024-12-15T23:59:59Z'),
  ('CoinGecko Premium: 25% Discount', 'Get 25% off CoinGecko Premium for advanced crypto market data and portfolio tracking.', 'https://coingecko.com/ref=12345', 'Data & Analytics', '2024-11-01T23:59:59Z'); 