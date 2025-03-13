-- SQL to run in Supabase SQL Editor:

-- Step 1: Make sure that thread_id and assistant_id columns exist in the chat_messages table
-- If you've already added these columns, you can skip this part
DO $$
BEGIN
  -- Add thread_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_messages' AND column_name = 'thread_id') THEN
    ALTER TABLE chat_messages ADD COLUMN thread_id TEXT;
  END IF;

  -- Add assistant_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_messages' AND column_name = 'assistant_id') THEN
    ALTER TABLE chat_messages ADD COLUMN assistant_id TEXT;
  END IF;

  -- Create index on thread_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_chat_messages_thread_id') THEN
    CREATE INDEX idx_chat_messages_thread_id ON chat_messages(thread_id);
  END IF;
END
$$;

-- Step 2: Create the get_recent_threads function for efficiently retrieving conversation history
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

-- Step 3: Grant execution permissions on the function
GRANT EXECUTE ON FUNCTION get_recent_threads TO service_role;
GRANT EXECUTE ON FUNCTION get_recent_threads TO authenticated;

-- Step 4: Output success message if everything worked
DO $$
BEGIN
  RAISE NOTICE 'Chat history functionality successfully set up!';
END
$$; 