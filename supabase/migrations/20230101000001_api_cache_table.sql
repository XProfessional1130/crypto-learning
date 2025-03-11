-- Create API Cache table for storing API responses
CREATE TABLE api_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  source TEXT NOT NULL,
  data JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  -- Create a composite unique constraint on key and source
  CONSTRAINT unique_cache_entry UNIQUE (key, source)
);

-- Add indexes for faster lookups and expirations
CREATE INDEX idx_api_cache_key_source ON api_cache(key, source);
CREATE INDEX idx_api_cache_expires_at ON api_cache(expires_at);

-- Add RLS policies
ALTER TABLE api_cache ENABLE ROW LEVEL SECURITY;

-- Only allow service role and server-side access
CREATE POLICY "Service access policy"
  ON api_cache
  USING (true)
  WITH CHECK (false);  -- Read-only for non-service roles

-- Create trigger for updating the updated_at timestamp
CREATE OR REPLACE FUNCTION update_api_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_api_cache_updated_at
BEFORE UPDATE ON api_cache
FOR EACH ROW
EXECUTE FUNCTION update_api_cache_updated_at(); 