-- Create a function to execute dynamic SQL
-- This function requires superuser privileges
CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE query;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION exec_sql TO authenticated;

-- Grant execute permission to service_role
GRANT EXECUTE ON FUNCTION exec_sql TO service_role; 