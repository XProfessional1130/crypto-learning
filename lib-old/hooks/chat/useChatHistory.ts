import { useState, useCallback, useRef } from 'react';
import { ChatMessage } from '@/types';

interface UseChatHistoryOptions {
  userId: string;
  onError?: (error: Error) => void;
}

/**
 * useChatHistory - Handles chat thread history management
 * Loads, saves, and manages chat threads
 */
export function useChatHistory({
  userId,
  onError,
}: UseChatHistoryOptions) {
  // Thread state
  const [threadId, setThreadId] = useState<string | null>(null);
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  
  // Error handling utility
  const handleError = useCallback((error: unknown, context: string = 'chat history operation') => {
    console.error(`Error in ${context}:`, error);
    if (onError) {
      onError(error instanceof Error ? error : new Error(String(error)));
    }
  }, [onError]);
  
  // Load a thread by ID
  const loadThread = useCallback(async (threadId: string): Promise<ChatMessage[]> => {
    try {
      setIsLoadingThread(true);
      
      const response = await fetch(`/api/assistant?userId=${userId}&threadId=${threadId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load thread: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.messages && Array.isArray(data.messages)) {
        setThreadId(threadId);
        setIsLoadingThread(false);
        return data.messages;
      } else {
        throw new Error('Invalid thread data received');
      }
    } catch (error) {
      handleError(error, 'loading thread');
      setIsLoadingThread(false);
      return [];
    }
  }, [userId, handleError]);
  
  // Save a thread
  const saveThread = useCallback(async (messages: ChatMessage[]): Promise<string | null> => {
    try {
      // Don't save empty threads
      if (messages.length === 0) {
        return null;
      }
      
      const response = await fetch('/api/assistant/save-thread', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          messages,
          threadId,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save thread: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.threadId) {
        setThreadId(data.threadId);
        return data.threadId;
      } else {
        throw new Error('No thread ID received from server');
      }
    } catch (error) {
      handleError(error, 'saving thread');
      return null;
    }
  }, [userId, threadId, handleError]);
  
  // Delete a thread
  const deleteThread = useCallback(async (threadIdToDelete: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/assistant/delete-thread?userId=${userId}&threadId=${threadIdToDelete}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete thread: ${response.statusText}`);
      }
      
      // If we deleted the current thread, reset the thread ID
      if (threadIdToDelete === threadId) {
        setThreadId(null);
      }
      
      return true;
    } catch (error) {
      handleError(error, 'deleting thread');
      return false;
    }
  }, [userId, threadId, handleError]);
  
  return {
    threadId,
    setThreadId,
    isLoadingThread,
    loadThread,
    saveThread,
    deleteThread,
  };
} 