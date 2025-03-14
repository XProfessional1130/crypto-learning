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
    // First ensure any existing connection is properly closed
    if (eventSourceRef.current) {
      console.log('Closing existing EventSource connection before starting new one');
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    // Set streaming flag
    streamingRef.current = true;
    
    let retryCount = 0;
    const maxRetries = 3;
    let receivedFirstMessage = false;
    let connectionTimeoutId: NodeJS.Timeout | null = null;
    let partialContent = '';
    let isDone = false;
    
    const endpoint = `/api/assistant/stream?threadId=${threadId}&runId=${runId}&userId=${userId}&personality=${activePersonality}`;
    
    const connectEventSource = () => {
      // Create a new EventSource connection
      const eventSource = new EventSource(endpoint);
      eventSourceRef.current = eventSource;
      
      // Set a timeout to detect initial connection issues
      connectionTimeoutId = setTimeout(() => {
        console.log('Connection timeout - no messages received.');
        
        if (eventSource && eventSource.readyState !== 2) { // 2 = CLOSED
          eventSource.close();
          
          if (eventSourceRef.current === eventSource) {
            eventSourceRef.current = null;
            
            // Try to reconnect if we haven't reached max retries
            if (retryCount < maxRetries) {
              retryCount++;
              console.log(`Connection timeout. Retrying (${retryCount}/${maxRetries})...`);
              connectEventSource();
            } else {
              console.error('Max retries reached. Unable to establish connection.');
              
              // Clean up properly
              streamingRef.current = false;
              isProcessingRef.current = false;
              setIsTyping(false);
              
              // Update the message with error
              if (typingMsgId) {
                setMessages(prevMessages => {
                  return prevMessages.map(msg => {
                    if (msg.id === typingMsgId) {
                      return { 
                        ...msg, 
                        content: 'Error: Unable to connect to server. Please try again.' 
                      };
                    }
                    return msg;
                  });
                });
              }
              
              if (onError) {
                onError(new Error('Connection timeout - unable to establish connection'));
              }
            }
          }
        }
      }, 10000); // 10 second timeout
      
      // Event for when connection is established
      eventSource.onopen = () => {
        console.log('EventSource connection opened');
        
        // If this is a reconnection, just silently continue without showing any message
        receivedFirstMessage = true;
      };
      
      // Setup event handlers
      eventSource.onmessage = (event) => {
        try {
          // Clear the connection timeout since we received a message
          if (connectionTimeoutId) {
            clearTimeout(connectionTimeoutId);
            connectionTimeoutId = null;
          }
          
          receivedFirstMessage = true;
          
          // Skip heartbeat messages
          if (event.data.startsWith(':') || event.data.trim() === '') {
            return;
          }
          
          const data = JSON.parse(event.data);
          
          // Handle different status types
          switch (data.status) {
            case 'connected':
              console.log('Stream connection established');
              break;
              
            case 'processing':
              // Update the UI to show processing state - no content changes needed here
              // We'll let the initial empty message with just the cursor remain
              break;
              
            case 'streaming':
              // Add the new content chunk
              partialContent += data.content;
              // Track if this is the last chunk
              isDone = data.done;
              
              // Don't update the UI for each tiny chunk, which can cause performance issues
              // Instead, use a throttled update approach for smoother rendering
              // For slower typing, we can update more frequently
              const shouldUpdateNow = isDone || data.content.includes('\n') || 
                                     partialContent.length % 10 === 0 || // Update every 10 chars instead of 20 
                                     data.content.length > 3;           // Update on larger chunks
              
              if (shouldUpdateNow) {
                // Update the message with the current content
                setMessages(prevMessages => {
                  return prevMessages.map(msg => {
                    if (msg.id === typingMsgId) {
                      return { ...msg, content: partialContent };
                    }
                    return msg;
                  });
                });
              }
              
              // Only clear typing state when we're completely done
              if (isDone) {
                setTimeout(() => {
                  if (eventSourceRef.current) {
                    eventSourceRef.current.close();
                    eventSourceRef.current = null;
                  }
                  streamingRef.current = false;
                  setIsTyping(false);
                }, 500); // Shorter delay to improve responsiveness
              }
              break;
              
            case 'completed':
              // Cleanup after a shorter delay for improved responsiveness
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
              }, 300); // Shorter delay for better responsiveness
              break;
              
            case 'error':
            case 'failed':
              console.error(`Error in streaming: ${data.error}`);
              eventSource.close();
              eventSourceRef.current = null;
              streamingRef.current = false;
              isProcessingRef.current = false;
              setIsTyping(false);
              
              // Update the message with error instead of removing
              setMessages(prevMessages => {
                return prevMessages.map(msg => {
                  if (msg.id === typingMsgId) {
                    return { 
                      ...msg, 
                      content: `Error: ${data.error || 'An unknown error occurred'}. Please try again.` 
                    };
                  }
                  return msg;
                });
              });
              
              if (onError) {
                onError(new Error(data.error || 'Streaming failed'));
              }
              break;
              
            case 'polling_error':
              // Just log polling errors but don't fail the connection
              console.warn(`Polling error: ${data.error}`);
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
        
        // Clear connection timeout if it exists
        if (connectionTimeoutId) {
          clearTimeout(connectionTimeoutId);
          connectionTimeoutId = null;
        }
        
        // Close the current connection
        eventSource.close();
        
        // Only handle error if this is still the current eventSource
        if (eventSourceRef.current === eventSource) {
          eventSourceRef.current = null;
          
          // Try to reconnect if we haven't reached max retries
          if (retryCount < maxRetries) {
            retryCount++;
            console.log(`Connection error. Retrying (${retryCount}/${maxRetries})...`);
            
            // Wait a bit before reconnecting (use exponential backoff)
            const retryDelay = Math.min(1000 * Math.pow(2, retryCount - 1), 10000);
            setTimeout(() => {
              // Only reconnect if we're still in streaming mode
              if (streamingRef.current) {
                connectEventSource();
              }
            }, retryDelay);
            
            // No reconnection message - silently try to reconnect
          } else {
            streamingRef.current = false;
            isProcessingRef.current = false;
            setIsTyping(false);
            
            // Only show error message when all reconnection attempts fail
            setMessages(prevMessages => {
              return prevMessages.map(msg => {
                if (msg.id === typingMsgId) {
                  return { 
                    ...msg, 
                    content: partialContent ? 
                      `${partialContent}\n\n(Connection failed. The response may be incomplete.)` : 
                      'Connection failed. Please try again.' 
                  };
                }
                return msg;
              });
            });
            
            if (onError) {
              onError(new Error('Streaming connection failed after multiple attempts'));
            }
          }
        }
      };
      
      return eventSource;
    };
    
    connectEventSource();
    
    // Return cleanup function (not used directly but good practice)
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      
      if (connectionTimeoutId) {
        clearTimeout(connectionTimeoutId);
      }
      
      streamingRef.current = false;
    };
  }, [activePersonality, userId, setMessages, setIsTyping, onError, onResponse]);
  
  // Send message to API
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;
    
    // More robust check to prevent multiple active requests
    if (streamingRef.current || isProcessingRef.current || isTyping) {
      console.log('Message already being processed or streaming in progress, ignoring request');
      return;
    }
    
    // Set processing flag immediately to prevent race conditions
    isProcessingRef.current = true;
    streamingRef.current = true;
    
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
      
      // Add a typing indicator with empty content to show just the cursor immediately
      setMessages(prevMessages => [
        ...prevMessages,
        {
          id: typingId,
          user_id: 'system',
          role: 'assistant',
          content: '',  // Start with empty content to show just the cursor
          personality: activePersonality,
          created_at: new Date().toISOString(),
        }
      ]);

      // Use a smaller timeout to improve responsiveness
      setTimeout(async () => {
        try {
          // Increment the request ID
          pollRequestIdRef.current += 1;
          const currentRequestId = pollRequestIdRef.current;
          
          // Double-check that we're still in processing state (user didn't cancel)
          if (!isProcessingRef.current) {
            console.log('Request was cancelled before API call');
            return;
          }
          
          // Prepare the request body
          const requestBody = {
            message: content,
            personality: activePersonality,
            userId,
            threadId: threadIdRef.current || undefined,
          };
          
          // Submit message to API with a timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30-second timeout
          
          try {
            const response = await fetch('/api/assistant', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestBody),
              signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
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
            
            // Setup streaming connection
            setupStreamingConnection(data.threadId, data.runId, typingId);
          } catch (fetchError) {
            // Handle API errors or timeouts
            clearTimeout(timeoutId);
            throw fetchError;
          }
        } catch (error) {
          console.error('Error in API call:', error);
          
          // Clean up the typing message
          if (typingMessageId) {
            setMessages(prevMessages => {
              // Instead of removing, change to an error message
              return prevMessages.map(msg => {
                if (msg.id === typingMessageId) {
                  return {
                    ...msg,
                    content: `Error: ${error instanceof Error ? error.message : 'Failed to get response'}. Please try again.`
                  };
                }
                return msg;
              });
            });
          }
          
          // Reset all state
          setIsTyping(false);
          isProcessingRef.current = false;
          streamingRef.current = false;
          
          if (onError) {
            onError(error instanceof Error ? error : new Error(String(error)));
          }
        }
      }, 50); // Smaller delay for better responsiveness
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Clean up the typing message
      if (typingMessageId) {
        setMessages(prevMessages => {
          return prevMessages.map(msg => {
            if (msg.id === typingMessageId) {
              return {
                ...msg,
                content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`
              };
            }
            return msg;
          });
        });
      }
      
      // Reset all state
      setIsTyping(false);
      isProcessingRef.current = false;
      streamingRef.current = false;
      
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
  
  // Skip the typing animation and immediately show the full message
  const skipTypingAnimation = useCallback(() => {
    console.log('Skipping typing animation');
    
    // Only attempt to skip if there's actually streaming in progress
    if (!eventSourceRef.current || !streamingRef.current || !typingMessageId) {
      console.log('No active streaming to skip');
      return;
    }
    
    try {
      // First check if we already have a typing message with some content
      if (typingMessageId) {
        const typingMessage = messages.find(msg => msg.id === typingMessageId);
        
        // With slower typing, we should allow skipping with less initial content
        if (!typingMessage || typingMessage.content.length < 5) {
          console.log('Not enough content to skip yet, waiting for more...');
          return;
        }
      }
      
      // Set a timeout to ensure the skip request doesn't hang
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout
      
      // Try to gather the full content from the API
      fetch(`/api/assistant/stream/skip?threadId=${threadIdRef.current}&userId=${userId}&personality=${activePersonality}`, {
        signal: controller.signal
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`Skip request failed with status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          clearTimeout(timeoutId);
          
          // If we have the full message content, update the current typing message
          if (data.fullContent && typingMessageId) {
            // Only update if the full content is actually longer than what we have
            setMessages(prevMessages => {
              const typingMsg = prevMessages.find(msg => msg.id === typingMessageId);
              const currentLength = typingMsg?.content?.length || 0;
              
              // Only update if we got something longer back
              if (data.fullContent.length > currentLength) {
                return prevMessages.map(msg => {
                  if (msg.id === typingMessageId) {
                    return { ...msg, content: data.fullContent };
                  }
                  return msg;
                });
              }
              return prevMessages;
            });
          }
          
          // Clean up the streaming state regardless of the result
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
          }
          streamingRef.current = false;
          isProcessingRef.current = false;
          setIsTyping(false);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          console.error('Error skipping typing animation:', error);
          
          // Even on error, we should stop the streaming to improve UX
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
          }
          
          // Keep any partial content we've received so far
          streamingRef.current = false;
          isProcessingRef.current = false;
          setIsTyping(false);
        });
    } catch (error) {
      // Fallback approach - just stop typing but keep partial content
      console.error('Error in skip typing:', error);
      
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      streamingRef.current = false;
      isProcessingRef.current = false;
      setIsTyping(false);
    }
  }, [userId, activePersonality, typingMessageId, messages, setMessages]);
  
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
    skipTypingAnimation
  };
} 