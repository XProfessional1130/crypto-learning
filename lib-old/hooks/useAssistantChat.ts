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

// Error handling utility
const createErrorHandler = (
  callback?: (error: Error) => void,
  context: string = 'assistant operation'
) => {
  return (error: unknown) => {
    console.error(`Error in ${context}:`, error);
    if (callback) {
      callback(error instanceof Error ? error : new Error(String(error)));
    }
  };
};

export function useAssistantChat({
  initialMessages = [],
  initialThreadId = null,
  onError,
  onResponse,
  onSend,
  userId,
}: UseAssistantChatOptions) {
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activePersonality, setActivePersonality] = useState<AIPersonality>(
    initialMessages.length > 0 && initialMessages[0].personality
      ? initialMessages[0].personality as AIPersonality
      : 'tobo'
  );
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  
  // Refs for persistent state between renders
  const threadIdRef = useRef<string | null>(initialThreadId);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const pollRequestIdRef = useRef<number>(0);
  const processedResponsesRef = useRef<Set<string>>(new Set());
  const streamingRef = useRef<boolean>(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  
  // Create error handler with context
  const handleError = useCallback(createErrorHandler(onError, 'assistant chat'), [onError]);
  
  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      isProcessingRef.current = false;
      streamingRef.current = false;
    };
  }, []);
  
  // Switch personality
  const switchPersonality = useCallback((personality: AIPersonality) => {
    if (personality === activePersonality) return;
    setActivePersonality(personality);
    threadIdRef.current = null;
  }, [activePersonality]);
  
  // Load a specific thread
  const loadThread = useCallback(async (threadId: string) => {
    try {
      setIsTyping(true);
      
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
        
        if (onResponse) {
          onResponse();
        }
      }
      
      setIsTyping(false);
    } catch (error) {
      setIsTyping(false);
      handleError(error);
    }
  }, [userId, onResponse, handleError]);
  
  // Poll for run status - simplified version
  const pollRunStatus = useCallback(async (threadId: string, runId: string, typingMsgId: string, requestId: number) => {
    // Skip polling if this is an outdated request
    if (requestId !== pollRequestIdRef.current) {
      return true;
    }
    
    try {
      const url = `/api/assistant/status?threadId=${threadId}&runId=${runId}&userId=${userId}&personality=${activePersonality}`;
      const response = await fetch(url);
      
      // Skip processing if this is an outdated request
      if (requestId !== pollRequestIdRef.current) {
        return true;
      }
      
      // Parse and validate response
      let data;
      const responseText = await response.text();
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`Server returned invalid JSON: ${responseText.substring(0, 100)}${responseText.length > 100 ? '...' : ''}`);
      }
      
      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }
      
      // Continue polling if not complete
      if (data.status !== 'completed' && data.status !== 'failed') {
        return false;
      }
      
      // Handle failure
      if (data.status === 'failed') {
        throw new Error(data.error || 'Assistant run failed');
      }
      
      // Check if we already processed this response
      const responseKey = `${threadId}-${runId}`;
      if (processedResponsesRef.current.has(responseKey)) {
        return true;
      }
      
      // Mark as processed
      processedResponsesRef.current.add(responseKey);
      
      // Update messages
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
      
      // Reset state
      setTypingMessageId(null);
      setIsTyping(false);
      isProcessingRef.current = false;
      
      if (onResponse) {
        onResponse();
      }
      
      return true;
    } catch (error) {
      // Only handle errors for current requests
      if (requestId === pollRequestIdRef.current) {
        setMessages(prevMessages => 
          prevMessages.filter(msg => msg.id !== typingMsgId)
        );
        
        setTypingMessageId(null);
        setIsTyping(false);
        isProcessingRef.current = false;
        
        handleError(error);
      }
      
      return true;
    }
  }, [activePersonality, userId, onResponse, handleError]);

  // Setup streaming connection - simplified
  const setupStreamingConnection = useCallback((threadId: string, runId: string, typingMsgId: string) => {
    // Close existing connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    streamingRef.current = true;
    
    const maxRetries = 3;
    let retryCount = 0;
    let partialContent = '';
    let connectionTimeoutId: NodeJS.Timeout | null = null;
    
    const endpoint = `/api/assistant/stream?threadId=${threadId}&runId=${runId}&userId=${userId}&personality=${activePersonality}`;
    
    // Connect and setup event handlers
    const connectEventSource = () => {
      try {
        const eventSource = new EventSource(endpoint);
        eventSourceRef.current = eventSource;
        
        // Set connection timeout
        connectionTimeoutId = setTimeout(() => {
          if (eventSource.readyState !== 2) { // Not CLOSED
            eventSource.close();
            
            if (retryCount < maxRetries) {
              retryCount++;
              connectEventSource();
            } else {
              streamingRef.current = false;
              isProcessingRef.current = false;
              setIsTyping(false);
              
              // Show error message
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
              
              handleError(new Error('Connection timeout - unable to establish connection'));
            }
          }
        }, 10000); // 10 second timeout
        
        // Event handlers
        eventSource.onopen = () => {
          console.log('EventSource connection opened');
        };
        
        eventSource.onmessage = (event) => {
          // Clear timeout when we receive a message
          if (connectionTimeoutId) {
            clearTimeout(connectionTimeoutId);
            connectionTimeoutId = null;
          }
          
          // Skip heartbeat messages
          if (event.data.startsWith(':') || event.data.trim() === '') {
            return;
          }
          
          try {
            const data = JSON.parse(event.data);
            
            switch (data.status) {
              case 'streaming':
                // Add new content
                partialContent += data.content || '';
                
                // Update message with cumulative content
                setMessages(prevMessages => {
                  return prevMessages.map(msg => {
                    if (msg.id === typingMsgId) {
                      return { ...msg, content: partialContent };
                    }
                    return msg;
                  });
                });
                
                // Close connection when done
                if (data.done) {
                  setTimeout(() => {
                    if (eventSourceRef.current) {
                      eventSourceRef.current.close();
                      eventSourceRef.current = null;
                    }
                    streamingRef.current = false;
                    setIsTyping(false);
                  }, 300);
                }
                break;
                
              case 'completed':
                setTimeout(() => {
                  if (eventSourceRef.current) {
                    eventSourceRef.current.close();
                    eventSourceRef.current = null;
                  }
                  
                  streamingRef.current = false;
                  isProcessingRef.current = false;
                  setIsTyping(false);
                  
                  if (onResponse) {
                    onResponse();
                  }
                }, 300);
                break;
                
              case 'error':
              case 'failed':
                eventSource.close();
                eventSourceRef.current = null;
                streamingRef.current = false;
                isProcessingRef.current = false;
                setIsTyping(false);
                
                // Show error message
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
                
                handleError(new Error(data.error || 'Streaming failed'));
                break;
            }
          } catch (error) {
            console.error('Error processing stream event:', error);
          }
        };
        
        // Error handling
        eventSource.onerror = (error) => {
          if (connectionTimeoutId) {
            clearTimeout(connectionTimeoutId);
            connectionTimeoutId = null;
          }
          
          eventSource.close();
          
          if (eventSourceRef.current === eventSource) {
            eventSourceRef.current = null;
            
            if (retryCount < maxRetries) {
              retryCount++;
              const retryDelay = Math.min(1000 * Math.pow(2, retryCount - 1), 10000);
              setTimeout(() => {
                if (streamingRef.current) {
                  connectEventSource();
                }
              }, retryDelay);
            } else {
              streamingRef.current = false;
              isProcessingRef.current = false;
              setIsTyping(false);
              
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
              
              handleError(new Error('Streaming connection failed after multiple attempts'));
            }
          }
        };
        
        return eventSource;
      } catch (error) {
        // Handle connection error
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(() => connectEventSource(), 1000);
        } else {
          streamingRef.current = false;
          isProcessingRef.current = false;
          setIsTyping(false);
          
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
          
          handleError(new Error('Failed to create EventSource connection'));
        }
      }
    };
    
    connectEventSource();
    
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
  }, [activePersonality, userId, handleError, onResponse]);
  
  // Send message to API
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || streamingRef.current || isProcessingRef.current || isTyping) {
      return;
    }
    
    // Set processing flag
    isProcessingRef.current = true;
    
    // Clean up existing connections
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    try {
      // Create user message
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        user_id: userId,
        role: 'user',
        content,
        created_at: new Date().toISOString(),
      };
      
      // Create typing message
      const typingId = `typing-${Date.now()}`;
      setTypingMessageId(typingId);
      
      // Update UI immediately
      setMessages(prevMessages => [
        ...prevMessages, 
        userMessage,
        {
          id: typingId,
          user_id: 'system',
          role: 'assistant',
          content: '',
          personality: activePersonality,
          created_at: new Date().toISOString(),
        }
      ]);
      
      setInputMessage('');
      setIsTyping(true);
      
      if (onSend) {
        onSend();
      }
      
      // Update request ID
      pollRequestIdRef.current += 1;
      const currentRequestId = pollRequestIdRef.current;
      
      // Check if processing was cancelled
      if (!isProcessingRef.current) {
        return;
      }
      
      // Show thinking indicator if API call takes too long
      const currentTypingId = typingId;
      const thinkingIndicatorTimeout = setTimeout(() => {
        if (isProcessingRef.current) {
          setMessages(prevMessages => {
            return prevMessages.map(msg => {
              if (msg.id === currentTypingId) {
                return {...msg, content: '...'};
              }
              return msg;
            });
          });
        }
      }, 1000);
      
      try {
        // Send API request
        const requestBody = {
          message: content,
          personality: activePersonality,
          userId,
          threadId: threadIdRef.current || undefined,
        };
        
        // Use timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch('/api/assistant', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        clearTimeout(thinkingIndicatorTimeout);
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to send message: ${errorText}`);
        }
        
        const data = await response.json();
        
        if (!data.threadId || !data.runId) {
          throw new Error('Invalid response from server: missing threadId or runId');
        }
        
        // Store thread ID
        threadIdRef.current = data.threadId;
        
        // Start streaming
        streamingRef.current = true;
        
        // Handle temporary run IDs
        if (data.runId.startsWith('temp-')) {
          let resolved = false;
          
          // Try to resolve the real run ID
          for (let retryCount = 0; retryCount < 10 && !resolved; retryCount++) {
            try {
              // Check if a real run ID is available
              const statusResponse = await fetch(`/api/assistant/status?threadId=${data.threadId}&runId=${data.runId}&userId=${userId}&personality=${activePersonality}`);
              
              if (statusResponse.status === 404 || statusResponse.status === 400) {
                // Get the latest run for this thread
                const runsResponse = await fetch(`/api/assistant/runs?threadId=${data.threadId}&userId=${userId}`);
                if (runsResponse.ok) {
                  const runsData = await runsResponse.json();
                  if (runsData.runs && runsData.runs.length > 0) {
                    // Use the most recent run
                    setupStreamingConnection(data.threadId, runsData.runs[0].id, currentTypingId);
                    resolved = true;
                    break;
                  }
                }
              }
              
              // Wait before retrying
              await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
              console.warn('Error checking for real runId:', error);
            }
          }
          
          // Use the temp ID if we couldn't resolve a real one
          if (!resolved) {
            setupStreamingConnection(data.threadId, data.runId, currentTypingId);
          }
        } else {
          // Normal case with real run ID
          setupStreamingConnection(data.threadId, data.runId, currentTypingId);
        }
      } catch (fetchError) {
        clearTimeout(thinkingIndicatorTimeout);
        
        // Show error message
        if (typingMessageId) {
          setMessages(prevMessages => {
            return prevMessages.map(msg => {
              if (msg.id === typingMessageId) {
                return {
                  ...msg,
                  content: `Error: ${fetchError instanceof Error ? fetchError.message : 'Failed to get response'}. Please try again.`
                };
              }
              return msg;
            });
          });
        }
        
        // Reset state
        setIsTyping(false);
        isProcessingRef.current = false;
        streamingRef.current = false;
        
        handleError(fetchError);
      }
    } catch (error) {
      // Handle any overall errors
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
      
      // Reset state
      setIsTyping(false);
      isProcessingRef.current = false;
      streamingRef.current = false;
      
      handleError(error);
    }
  }, [activePersonality, isTyping, handleError, onSend, typingMessageId, userId, setupStreamingConnection]);
  
  // Input change handler
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
  }, []);
  
  // Form submit handler
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() && !isTyping) {
      sendMessage(inputMessage);
    }
  }, [inputMessage, isTyping, sendMessage]);
  
  // Skip typing animation
  const skipTypingAnimation = useCallback(() => {
    // Only skip if there's streaming in progress
    if (!streamingRef.current || !typingMessageId) {
      return;
    }
    
    try {
      // Close existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      
      // Get full content via API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
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
          
          // Update message with full content if it's longer
          if (data.fullContent && typingMessageId) {
            setMessages(prevMessages => {
              const typingMsg = prevMessages.find(msg => msg.id === typingMessageId);
              const currentLength = typingMsg?.content?.length || 0;
              
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
          
          // Reset state
          streamingRef.current = false;
          isProcessingRef.current = false;
          setIsTyping(false);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          console.error('Error skipping typing animation:', error);
          
          // Even on error, stop typing
          streamingRef.current = false;
          isProcessingRef.current = false;
          setIsTyping(false);
        });
    } catch (error) {
      // Fallback error handling - stop typing but keep content
      console.error('Error in skip typing:', error);
      
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      
      // Preserve any existing content
      if (typingMessageId) {
        const typingMessage = messages.find(msg => msg.id === typingMessageId);
        if (typingMessage && typingMessage.content) {
          setMessages(prevMessages => {
            return prevMessages.map(msg => {
              if (msg.id === typingMessageId) {
                return {
                  ...msg,
                  content: `${typingMessage.content}\n\n(Error: Connection was interrupted. Content may be incomplete.)`
                };
              }
              return msg;
            });
          });
        }
      }
      
      // Reset state
      streamingRef.current = false;
      isProcessingRef.current = false;
      setIsTyping(false);
    }
  }, [activePersonality, isTyping, messages, typingMessageId, userId]);
  
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