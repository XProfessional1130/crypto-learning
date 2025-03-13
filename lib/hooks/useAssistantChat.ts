import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatMessage } from '@/types';
import { AIPersonality } from '@/types/ai';
import personalities from '@/lib/config/ai-personalities';

interface UseAssistantChatOptions {
  initialMessages?: ChatMessage[];
  initialThreadId?: string | null;
  onError?: (error: Error) => void;
  onResponse?: () => void;
  userId: string;
}

export function useAssistantChat({
  initialMessages = [],
  initialThreadId = null,
  onError,
  onResponse,
  userId,
}: UseAssistantChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activePersonality, setActivePersonality] = useState<AIPersonality>(
    initialMessages.length > 0 && initialMessages[0].personality
      ? initialMessages[0].personality as AIPersonality
      : 'tobo'
  );
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const threadIdRef = useRef<string | null>(initialThreadId);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Reset abort controller when component unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);
  
  // Switch personality
  const switchPersonality = useCallback((personality: AIPersonality) => {
    if (personality === activePersonality) return;
    
    setActivePersonality(personality);
    
    // Reset thread ID when switching personalities
    threadIdRef.current = null;
    
    // We don't automatically add a welcome message here anymore
    // The component using this hook will handle that if needed
  }, [activePersonality]);
  
  // Load a specific thread
  const loadThread = useCallback(async (threadId: string) => {
    try {
      setIsTyping(true);
      
      // Fetch messages for this thread
      const response = await fetch(`/api/assistant?userId=${userId}&threadId=${threadId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load thread');
      }
      
      const data = await response.json();
      
      if (data.messages && data.messages.length > 0) {
        // Set thread ID
        threadIdRef.current = threadId;
        
        // Determine the personality from the messages
        const assistantMessage = data.messages.find((msg: ChatMessage) => msg.role === 'assistant' && msg.personality);
        if (assistantMessage && assistantMessage.personality) {
          setActivePersonality(assistantMessage.personality as AIPersonality);
        }
        
        // Sort messages by created_at
        const sortedMessages = [...data.messages].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        
        // Update messages state
        setMessages(sortedMessages);
        
        // Call onResponse if provided
        if (onResponse) {
          onResponse();
        }
      }
      
      setIsTyping(false);
    } catch (error) {
      setIsTyping(false);
      console.error('Error loading thread:', error);
      
      if (onError) {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
    }
  }, [userId, onResponse, onError]);
  
  // Poll for run status
  const pollRunStatus = useCallback(async (threadId: string, runId: string, typingMsgId: string) => {
    try {
      const url = `/api/assistant/status?threadId=${threadId}&runId=${runId}&userId=${userId}&personality=${activePersonality}`;
      const response = await fetch(url);
      
      // Improved error handling
      let data;
      try {
        const responseText = await response.text();
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Failed to parse status response as JSON:', responseText);
          throw new Error(`Server returned invalid JSON: ${responseText.substring(0, 100)}${responseText.length > 100 ? '...' : ''}`);
        }
        
        if (!response.ok) {
          throw new Error(data.error || `Server error: ${response.status}`);
        }
      } catch (error) {
        throw error;
      }
      
      // If still in progress, continue polling
      if (data.status !== 'completed' && data.status !== 'failed') {
        return false;
      }
      
      // If failed, show error and stop polling
      if (data.status === 'failed') {
        throw new Error(data.error || 'Assistant run failed');
      }
      
      // If completed, update messages with the response
      // Replace the typing indicator with the actual response
      setMessages(prevMessages => {
        const newMessages = prevMessages.filter(msg => msg.id !== typingMsgId);
        
        return [
          ...newMessages,
          {
            id: Date.now().toString(),
            user_id: 'system',
            role: 'assistant',
            content: data.content,
            personality: activePersonality,
            thread_id: data.threadId,
            created_at: new Date().toISOString(),
          }
        ];
      });
      
      setTypingMessageId(null);
      setIsTyping(false);
      
      // Call onResponse again after getting the response
      if (onResponse) {
        onResponse();
      }
      
      return true;
    } catch (error) {
      console.error('Error polling run status:', error);
      
      // Remove typing indicator on error
      setMessages(prevMessages => 
        prevMessages.filter(msg => msg.id !== typingMsgId)
      );
      
      setTypingMessageId(null);
      setIsTyping(false);
      
      if (onError) {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
      
      return true; // Stop polling on error
    }
  }, [activePersonality, userId, onResponse, onError]);
  
  // Send message to API
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;
    
    try {
      // Stop any ongoing polling
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      
      // Create user message
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        user_id: userId,
        role: 'user',
        content,
        created_at: new Date().toISOString(),
      };
      
      // Update state with user message
      setMessages(prevMessages => [...prevMessages, userMessage]);
      setInputMessage('');
      setIsTyping(true);
      
      // Create abort controller for the request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      
      // Call onResponse callback after user message
      if (onResponse) {
        onResponse();
      }
      
      // Create a temporary assistant typing message
      const typingMessage: ChatMessage = {
        id: `typing-${Date.now()}`,
        user_id: 'system',
        role: 'assistant',
        content: '...',
        personality: activePersonality,
        created_at: new Date().toISOString(),
      };
      
      // Add typing indicator as a message
      setMessages(prevMessages => [...prevMessages, typingMessage]);
      setTypingMessageId(typingMessage.id);
      
      // Send request to API
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          threadId: threadIdRef.current,
          personality: activePersonality,
          userId,
        }),
        signal: abortControllerRef.current.signal,
      });
      
      // Improved error handling for API responses
      let data;
      try {
        const responseText = await response.text();
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Failed to parse response as JSON:', responseText);
          throw new Error(`Server returned invalid JSON: ${responseText.substring(0, 100)}${responseText.length > 100 ? '...' : ''}`);
        }
        
        if (!response.ok) {
          throw new Error(data.error || `Server error: ${response.status}`);
        }
      } catch (error) {
        throw error;
      }
      
      // Update thread ID if provided
      if (data.threadId) {
        threadIdRef.current = data.threadId;
      }
      
      // If the status is processing and we have a runId, start polling
      if (data.status === 'processing' && data.runId && data.threadId) {
        // Begin polling for the response
        const pollStatus = async () => {
          const isDone = await pollRunStatus(data.threadId, data.runId, typingMessage.id);
          if (isDone && pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        };
        
        // Initial check right away
        await pollStatus();
        
        // Continue polling if not already complete
        pollIntervalRef.current = setInterval(pollStatus, 1000);
      }
    } catch (error: any) {
      setIsTyping(false);
      
      // Remove typing indicator on error
      setMessages(prevMessages => 
        prevMessages.filter(msg => !msg.id.startsWith('typing-'))
      );
      
      setTypingMessageId(null);
      
      console.error('Error sending message:', error);
      
      // Don't show error for aborted requests
      if (error.name !== 'AbortError' && onError) {
        onError(error);
      }
    }
  }, [activePersonality, userId, onError, onResponse, pollRunStatus]);
  
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
  }, []);
  
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() && !isTyping) {
      sendMessage(inputMessage);
    }
  }, [inputMessage, isTyping, sendMessage]);
  
  // Get the current thread ID
  const getThreadId = useCallback(() => threadIdRef.current, []);
  
  return {
    messages,
    inputMessage,
    isTyping,
    activePersonality,
    threadId: threadIdRef.current,
    getThreadId,
    handleInputChange,
    handleSubmit,
    sendMessage,
    switchPersonality,
    setMessages,
    loadThread,
  };
} 