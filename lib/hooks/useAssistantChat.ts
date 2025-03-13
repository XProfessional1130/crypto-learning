import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatMessage } from '@/types';
import { AIPersonality } from '@/types/ai';
import personalities from '@/lib/config/ai-personalities';

interface UseAssistantChatOptions {
  initialMessages?: ChatMessage[];
  initialThreadId?: string | null;
  onError?: (error: Error) => void;
  onResponse?: () => void;
  onSend?: () => void;
  userId: string;
}

export function useAssistantChat({
  initialMessages = [],
  initialThreadId = null,
  onError,
  onResponse,
  onSend,
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
  const streamingRef = useRef<boolean>(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  
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
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      isProcessingRef.current = false;
      streamingRef.current = false;
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

  // Setup streaming connection
  const setupStreamingConnection = useCallback((threadId: string, runId: string, typingMsgId: string) => {
    // Close any existing EventSource
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    streamingRef.current = true;
    
    // Create a new EventSource connection
    const streamUrl = `/api/assistant/stream?threadId=${threadId}&runId=${runId}&userId=${userId}&personality=${activePersonality}`;
    const eventSource = new EventSource(streamUrl);
    eventSourceRef.current = eventSource;
    
    let partialContent = '';
    let isDone = false;
    
    // Setup event handlers
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle different status types
        switch (data.status) {
          case 'streaming':
            // Add the new content chunk
            partialContent += data.content;
            // Track if this is the last chunk
            isDone = data.done;
            
            // Update the message with the current content
            setMessages(prevMessages => {
              return prevMessages.map(msg => {
                if (msg.id === typingMsgId) {
                  return { ...msg, content: partialContent };
                }
                return msg;
              });
            });
            
            // Only clear typing state when we're completely done
            if (isDone) {
              setTimeout(() => {
                if (eventSourceRef.current) {
                  eventSourceRef.current.close();
                  eventSourceRef.current = null;
                }
                streamingRef.current = false;
                setIsTyping(false);
              }, 500); // Short delay to keep cursor visible a bit longer
            }
            break;
            
          case 'completed':
            // Cleanup after a short delay to ensure cursor is seen at the end
            setTimeout(() => {
              if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
              }
              streamingRef.current = false;
              isProcessingRef.current = false;
              setIsTyping(false);
              
              // Call onResponse if provided
              if (onResponse) {
                onResponse();
              }
            }, 500);
            break;
            
          case 'error':
          case 'failed':
            console.error(`Error in streaming: ${data.error}`);
            eventSource.close();
            eventSourceRef.current = null;
            streamingRef.current = false;
            isProcessingRef.current = false;
            setIsTyping(false);
            
            // Remove typing message and show error
            setMessages(prevMessages => prevMessages.filter(msg => msg.id !== typingMsgId));
            
            if (onError) {
              onError(new Error(data.error || 'Streaming failed'));
            }
            break;
            
          default:
            // For processing, queued, etc. - just log the status
            console.log(`Streaming status: ${data.status}`);
        }
      } catch (error) {
        console.error('Error processing stream event:', error);
      }
    };
    
    eventSource.onerror = (error) => {
      console.error('EventSource error:', error);
      eventSource.close();
      eventSourceRef.current = null;
      streamingRef.current = false;
      isProcessingRef.current = false;
      setIsTyping(false);
      
      // Remove typing message
      setMessages(prevMessages => prevMessages.filter(msg => msg.id !== typingMsgId));
      
      if (onError) {
        onError(new Error('Streaming connection failed'));
      }
    };
    
    return eventSource;
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
      
      // Close any existing EventSource
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
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
      
      // Call onSend callback if provided
      if (onSend) {
        onSend();
      }
      
      // Create a new typing message from the assistant
      const typingId = `typing-${Date.now()}`;
      setTypingMessageId(typingId);
      
      setMessages(prevMessages => [
        ...prevMessages,
        {
          id: typingId,
          user_id: 'system',
          role: 'assistant',
          content: '',  // Empty content for clean start
          personality: activePersonality,
          created_at: new Date().toISOString(),
        }
      ]);
      
      // Increment the request ID
      pollRequestIdRef.current += 1;
      const currentRequestId = pollRequestIdRef.current;
      
      // Prepare the request body
      const requestBody = {
        message: content,
        personality: activePersonality,
        userId,
        threadId: threadIdRef.current || undefined,
      };
      
      // Submit message to API
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to send message: ${errorText}`);
      }
      
      const data = await response.json();
      
      if (!data.threadId || !data.runId) {
        throw new Error('Invalid response from server: missing threadId or runId');
      }
      
      // Update thread ID
      threadIdRef.current = data.threadId;
      
      // Use streaming approach
      setupStreamingConnection(data.threadId, data.runId, typingId);
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      if (typingMessageId) {
        setMessages(prevMessages => prevMessages.filter(msg => msg.id !== typingMessageId));
        setTypingMessageId(null);
      }
      
      setIsTyping(false);
      isProcessingRef.current = false;
      
      if (onError) {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
    }
  }, [activePersonality, isTyping, onError, onResponse, onSend, typingMessageId, userId, setupStreamingConnection]);
  
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
  }, []);
  
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() && !isTyping) {
      sendMessage(inputMessage);
    }
  }, [inputMessage, isTyping, sendMessage]);
  
  return {
    messages,
    inputMessage,
    isTyping,
    activePersonality,
    threadId: threadIdRef.current,
    typingMessageId,
    handleInputChange,
    handleSubmit,
    switchPersonality,
    setMessages,
    loadThread,
    sendMessage,
  };
} 