-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  personality TEXT CHECK (personality IN ('tobo', 'heido')),
  thread_id TEXT, -- OpenAI Assistant thread ID
  assistant_id TEXT, -- OpenAI Assistant ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Add foreign key constraint to auth.users if needed
  CONSTRAINT fk_user
    FOREIGN KEY(user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_id ON chat_messages(thread_id);

-- Set up Row Level Security (RLS)
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
-- 1. Users can view their own messages
CREATE POLICY "Users can view their own chat messages"
  ON chat_messages FOR SELECT
  USING (auth.uid() = user_id);

-- 2. Users can insert their own messages
CREATE POLICY "Users can insert their own chat messages"
  ON chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Service role can do everything
CREATE POLICY "Service role can do everything"
  ON chat_messages
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Grant permissions to authenticated users
GRANT SELECT, INSERT ON chat_messages TO authenticated;

-- Grant all permissions to service_role
GRANT ALL ON chat_messages TO service_role; 