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
  const isProcessingRef = useRef<boolean>(false);
  const pollRequestIdRef = useRef<number>(0);
  const processedResponsesRef = useRef<Set<string>>(new Set());
  
  // Reset abort controller when component unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      isProcessingRef.current = false;
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
  
  // Poll for run status - modified to be more robust
  const pollRunStatus = useCallback(async (threadId: string, runId: string, typingMsgId: string, requestId: number) => {
    if (requestId !== pollRequestIdRef.current) {
      console.log(`Skipping poll for outdated request ID ${requestId}`);
      return true;
    }
    
    try {
      const url = `/api/assistant/status?threadId=${threadId}&runId=${runId}&userId=${userId}&personality=${activePersonality}`;
      console.log(`Polling ${url} for request ${requestId}`);
      const response = await fetch(url);
      
      if (requestId !== pollRequestIdRef.current) {
        console.log(`Skipping response processing for outdated request ID ${requestId}`);
        return true;
      }
      
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
      
      if (data.status !== 'completed' && data.status !== 'failed') {
        console.log(`Run status: ${data.status}, continuing to poll`);
        return false;
      }
      
      if (data.status === 'failed') {
        console.error(`Run failed with error: ${data.error || 'Unknown error'}`);
        throw new Error(data.error || 'Assistant run failed');
      }
      
      const responseKey = `${threadId}-${runId}`;
      
      if (processedResponsesRef.current.has(responseKey)) {
        console.log(`Already processed response for ${responseKey}, skipping duplicate`);
        return true;
      }
      
      processedResponsesRef.current.add(responseKey);
      console.log(`Adding response to processed set: ${responseKey}`);
      
      console.log(`Processing completed response with content length: ${data.content?.length || 0}`);
      
      setMessages(prevMessages => {
        const newMessages = prevMessages.filter(msg => msg.id !== typingMsgId);
        
        return [
          ...newMessages,
          {
            id: `assistant-${Date.now()}`,
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
      isProcessingRef.current = false;
      
      if (onResponse) {
        console.log(`Calling onResponse callback for thread ${threadId}, run ${runId}`);
        onResponse();
      }
      
      return true;
    } catch (error) {
      console.error('Error polling run status:', error);
      
      if (requestId === pollRequestIdRef.current) {
        setMessages(prevMessages => 
          prevMessages.filter(msg => msg.id !== typingMsgId)
        );
        
        setTypingMessageId(null);
        setIsTyping(false);
        isProcessingRef.current = false;
        
        if (onError) {
          onError(error instanceof Error ? error : new Error(String(error)));
        }
      }
      
      return true;
    }
  }, [activePersonality, userId, onResponse, onError]);
  
  // Send message to API
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;
    
    if (isProcessingRef.current || isTyping) {
      console.log('Message already being processed, ignoring duplicate send');
      return;
    }
    
    isProcessingRef.current = true;
    
    try {
      // Always clear any existing interval first
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        user_id: userId,
        role: 'user',
        content,
        created_at: new Date().toISOString(),
      };
      
      setMessages(prevMessages => [...prevMessages, userMessage]);
      setInputMessage('');
      setIsTyping(true);
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      
      const typingMessage: ChatMessage = {
        id: `typing-${Date.now()}`,
        user_id: 'system',
        role: 'assistant',
        content: '...',
        personality: activePersonality,
        created_at: new Date().toISOString(),
      };
      
      setMessages(prevMessages => [...prevMessages, typingMessage]);
      setTypingMessageId(typingMessage.id);
      
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
      
      if (data.threadId) {
        threadIdRef.current = data.threadId;
      }
      
      if (data.status === 'processing' && data.runId && data.threadId) {
        pollRequestIdRef.current += 1;
        const currentRequestId = pollRequestIdRef.current;
        
        // SIMPLIFIED POLLING APPROACH - Use a single consistent polling method
        // First poll immediately without an interval
        const initialResult = await pollRunStatus(
          data.threadId, 
          data.runId, 
          typingMessage.id, 
          currentRequestId
        );
        
        // If not done with the first poll, start an interval
        if (!initialResult && currentRequestId === pollRequestIdRef.current) {
          // Ensure no other interval is running
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
          }
          
          // Create a simple polling function that stops itself when done
          pollIntervalRef.current = setInterval(async () => {
            console.log(`Polling for response, request ID: ${currentRequestId}`);
            
            // If this isn't the current request anymore, stop polling
            if (currentRequestId !== pollRequestIdRef.current) {
              clearInterval(pollIntervalRef.current!);
              pollIntervalRef.current = null;
              return;
            }
            
            try {
              const isDone = await pollRunStatus(
                data.threadId, 
                data.runId, 
                typingMessage.id, 
                currentRequestId
              );
              
              if (isDone) {
                clearInterval(pollIntervalRef.current!);
                pollIntervalRef.current = null;
              }
            } catch (error) {
              console.error('Error in polling interval:', error);
              clearInterval(pollIntervalRef.current!);
              pollIntervalRef.current = null;
            }
          }, 1000);
        }
      }
    } catch (error: any) {
      setIsTyping(false);
      isProcessingRef.current = false;
      
      setMessages(prevMessages => 
        prevMessages.filter(msg => !msg.id.startsWith('typing-'))
      );
      
      setTypingMessageId(null);
      
      console.error('Error sending message:', error);
      
      if (error.name !== 'AbortError' && onError) {
        onError(error);
      }
    }
  }, [activePersonality, userId, onError, pollRunStatus, isTyping]);
  
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