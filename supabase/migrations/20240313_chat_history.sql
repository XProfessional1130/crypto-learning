-- Create a database function to get recent threads
CREATE OR REPLACE FUNCTION get_recent_threads(user_id_param UUID, limit_param INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  thread_id TEXT,
  content TEXT,
  personality TEXT,
  role TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  WITH ranked_messages AS (
    SELECT 
      cm.*,
      ROW_NUMBER() OVER (PARTITION BY cm.thread_id ORDER BY cm.created_at DESC) AS rn
    FROM 
      chat_messages cm
    WHERE 
      cm.user_id = user_id_param
      AND cm.thread_id IS NOT NULL
  )
  SELECT 
    rm.id,
    rm.thread_id,
    rm.content,
    rm.personality,
    rm.role,
    rm.user_id,
    rm.created_at
  FROM 
    ranked_messages rm
  WHERE 
    rm.rn = 1
  ORDER BY 
    rm.created_at DESC
  LIMIT 
    limit_param;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_recent_threads TO service_role;
GRANT EXECUTE ON FUNCTION get_recent_threads TO authenticated; 