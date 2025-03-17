import { createServiceClient } from '@/lib/api/supabase';
import { ChatMessage } from '@/types';

/**
 * Save a chat message to the database
 */
export async function saveChatMessage(message: Omit<ChatMessage, 'id'>) {
  try {
    const supabase = createServiceClient();
    
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([{
        user_id: message.user_id,
        role: message.role,
        content: message.content,
        personality: message.personality,
        thread_id: message.thread_id,
        assistant_id: message.assistant_id,
        created_at: message.created_at || new Date().toISOString(),
      }])
      .select()
      .single();
      
    if (error) {
      console.error('Error saving chat message:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in saveChatMessage:', error);
    // Return null instead of throwing to prevent API failures when only history saving fails
    return null;
  }
}

/**
 * Get chat history for a user
 */
export async function getChatHistory(userId: string, limit = 50) {
  try {
    const supabase = createServiceClient();
    
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (error) {
      console.error('Error getting chat history:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getChatHistory:', error);
    throw error;
  }
}

/**
 * Get chat messages for a specific thread
 */
export async function getChatByThread(userId: string, threadId: string) {
  try {
    const supabase = createServiceClient();
    
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });
      
    if (error) {
      console.error('Error getting thread messages:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getChatByThread:', error);
    throw error;
  }
}

/**
 * Get recent conversations for a user
 * Grouped by thread_id
 */
export async function getRecentConversations(userId: string, limit = 10) {
  try {
    const supabase = createServiceClient();
    
    // Get the most recent message from each thread
    const { data, error } = await supabase
      .rpc('get_recent_threads', {
        user_id_param: userId,
        limit_param: limit
      });
    
    if (error) {
      console.error('Error getting recent conversations:', error);
      
      // Fallback if the RPC function doesn't exist
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', userId)
        .not('thread_id', 'is', null)
        .order('created_at', { ascending: false });
        
      if (fallbackError) {
        throw fallbackError;
      }
      
      // Group by thread_id
      const threadMap: Record<string, ChatMessage[]> = {};
      const threads: { threadId: string, latestMessage: ChatMessage, personality: string, preview: string }[] = [];
      
      fallbackData.forEach(message => {
        const threadId = message.thread_id;
        if (!threadId) return;
        
        if (!threadMap[threadId]) {
          threadMap[threadId] = [];
          
          // Add this thread to the list with its first message
          threads.push({
            threadId,
            latestMessage: message,
            personality: message.personality || 'tobo',
            preview: getMessagePreview(message.content)
          });
        }
        
        threadMap[threadId].push(message);
      });
      
      // Sort threads by latest message date
      threads.sort((a, b) => {
        return new Date(b.latestMessage.created_at).getTime() - 
               new Date(a.latestMessage.created_at).getTime();
      });
      
      return threads.slice(0, limit);
    }
    
    // Format the data
    return data.map((thread: any) => ({
      threadId: thread.thread_id,
      latestMessage: {
        id: thread.id,
        content: thread.content,
        created_at: thread.created_at,
        role: thread.role,
        user_id: thread.user_id,
        personality: thread.personality
      },
      personality: thread.personality || 'tobo',
      preview: getMessagePreview(thread.content)
    }));
    
  } catch (error) {
    console.error('Error in getRecentConversations:', error);
    throw error;
  }
}

/**
 * Get a preview of a message (first 50 characters)
 */
function getMessagePreview(content: string): string {
  if (!content) return '';
  
  // Get first 50 characters
  const preview = content.substring(0, 50);
  
  // Add ellipsis if content is longer than 50 characters
  return content.length > 50 ? `${preview}...` : preview;
}

/**
 * Delete a chat thread by ID
 */
export async function deleteThread(userId: string, threadId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/assistant/delete?userId=${userId}&threadId=${threadId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete thread');
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting thread:', error);
    throw error;
  }
} 