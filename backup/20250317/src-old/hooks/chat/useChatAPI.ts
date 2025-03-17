import { useCallback, useRef } from 'react';
import { AIPersonality } from '@/types/ai';
import { ChatMessage } from '@/types';

interface UseChatAPIOptions {
  userId: string;
  onError?: (error: Error) => void;
  onMessageStart?: (messageId: string) => void;
  onMessageUpdate?: (messageId: string, content: string) => void;
  onMessageComplete?: (messageId: string, content: string) => void;
}

/**
 * useChatAPI - Handles API communication for the chat
 * Manages sending messages to the AI and receiving responses
 */
export function useChatAPI({
  userId,
  onError,
  onMessageStart,
  onMessageUpdate,
  onMessageComplete,
}: UseChatAPIOptions) {
  // Refs for API state
  const abortControllerRef = useRef<AbortController | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  
  // Error handling utility
  const handleError = useCallback((error: unknown, context: string = 'chat API operation') => {
    console.error(`Error in ${context}:`, error);
    if (onError) {
      onError(error instanceof Error ? error : new Error(String(error)));
    }
  }, [onError]);
  
  // Send a message to the AI
  const sendMessage = useCallback(async (
    message: string,
    personality: AIPersonality,
    threadId: string | null = null,
    previousMessages: ChatMessage[] = []
  ): Promise<{ messageId: string, content: string } | null> => {
    try {
      // Don't allow multiple requests at once
      if (isProcessingRef.current) {
        console.warn('Already processing a message, ignoring new request');
        return null;
      }
      
      // Set processing flag
      isProcessingRef.current = true;
      
      // Create a new abort controller
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;
      
      // Generate a message ID
      const messageId = `assistant-${Date.now()}`;
      
      // Notify that a message is starting
      if (onMessageStart) {
        onMessageStart(messageId);
      }
      
      // Prepare the request
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          message,
          personality,
          threadId,
          messages: previousMessages,
        }),
        signal,
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }
      
      // Check if the response is a stream
      if (response.headers.get('Content-Type')?.includes('text/event-stream')) {
        // Handle streaming response
        const reader = response.body?.getReader();
        let content = '';
        
        if (!reader) {
          throw new Error('Failed to get response reader');
        }
        
        // Read the stream
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            break;
          }
          
          // Decode the chunk
          const chunk = new TextDecoder().decode(value);
          
          // Process the chunk (may contain multiple events)
          const events = chunk.split('\n\n').filter(Boolean);
          
          for (const event of events) {
            if (event.startsWith('data: ')) {
              const data = event.slice(6);
              
              if (data === '[DONE]') {
                // Stream is complete
                break;
              }
              
              try {
                const parsed = JSON.parse(data);
                
                if (parsed.content) {
                  // Append to the content
                  content += parsed.content;
                  
                  // Notify of content update
                  if (onMessageUpdate) {
                    onMessageUpdate(messageId, content);
                  }
                }
              } catch (e) {
                console.warn('Failed to parse event data:', e);
              }
            }
          }
        }
        
        // Notify that the message is complete
        if (onMessageComplete) {
          onMessageComplete(messageId, content);
        }
        
        // Reset processing flag
        isProcessingRef.current = false;
        
        return { messageId, content };
      } else {
        // Handle regular JSON response
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        const content = data.content || '';
        
        // Notify that the message is complete
        if (onMessageComplete) {
          onMessageComplete(messageId, content);
        }
        
        // Reset processing flag
        isProcessingRef.current = false;
        
        return { messageId, content };
      }
    } catch (error) {
      // Don't report errors from aborted requests
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log('Request aborted');
      } else {
        handleError(error, 'sending message');
      }
      
      // Reset processing flag
      isProcessingRef.current = false;
      
      return null;
    }
  }, [userId, handleError, onMessageStart, onMessageUpdate, onMessageComplete]);
  
  // Cancel the current request
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    isProcessingRef.current = false;
  }, []);
  
  return {
    sendMessage,
    cancelRequest,
    isProcessing: isProcessingRef.current,
  };
} 