import { useCallback, useEffect, useState } from 'react';
import { ChatMessage } from '@/types';
import { AIPersonality } from '@/types/ai';
import { useChat } from './useChat';
import { useChatTyping } from './useChatTyping';
import { useChatHistory } from './useChatHistory';
import { usePersonality } from './usePersonality';
import { useChatAPI } from './useChatAPI';

interface UseAssistantChatOptions {
  initialMessages?: ChatMessage[];
  initialThreadId?: string | null;
  initialPersonality?: AIPersonality;
  userId: string;
  onError?: (error: Error) => void;
  onResponse?: () => void;
  onSend?: () => void;
}

/**
 * useAssistantChat - Main chat hook that combines all chat functionality
 * This hook orchestrates the other specialized hooks to provide a complete chat experience
 */
export function useAssistantChat({
  initialMessages = [],
  initialThreadId = null,
  initialPersonality = 'tobo',
  userId,
  onError,
  onResponse,
  onSend,
}: UseAssistantChatOptions) {
  // Determine initial personality from messages if available
  const firstAssistantMessage = initialMessages.find(msg => msg.role === 'assistant' && msg.personality);
  const detectedPersonality = firstAssistantMessage?.personality as AIPersonality | undefined;
  
  // State for error handling
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Error handler function
  const handleError = useCallback((error: Error) => {
    console.error('Chat error:', error);
    setErrorMessage(error.message);
    
    if (onError) {
      onError(error);
    }
    
    // Clear error after 5 seconds
    setTimeout(() => {
      setErrorMessage(null);
    }, 5000);
  }, [onError]);
  
  // Initialize all the specialized hooks
  const {
    messages,
    setMessages,
    inputMessage,
    handleInputChange,
    clearInput,
    addUserMessage,
    addAssistantMessage,
    updateMessage,
  } = useChat({
    initialMessages,
    userId,
  });
  
  const {
    isTyping,
    typingMessageId,
    typingContent,
    startTyping,
    skipTypingAnimation: skipTyping,
  } = useChatTyping({
    onTypingComplete: onResponse,
  });
  
  const {
    threadId,
    setThreadId,
    isLoadingThread,
    loadThread: loadThreadHistory,
    saveThread,
    deleteThread,
  } = useChatHistory({
    userId,
    onError: handleError,
  });
  
  const {
    activePersonality,
    switchPersonality: switchPersonalityBase,
    togglePersonality,
    getPersonalityName,
  } = usePersonality({
    initialPersonality: detectedPersonality || initialPersonality,
  });
  
  const {
    sendMessage: sendMessageToAPI,
    cancelRequest,
    isProcessing,
  } = useChatAPI({
    userId,
    onError: handleError,
    onMessageStart: (messageId) => {
      // Start typing animation when message starts
      startTyping(messageId, '');
    },
    onMessageUpdate: (messageId, content) => {
      // Update the typing content as it comes in
      updateMessage(messageId, content);
    },
    onMessageComplete: (messageId, content) => {
      // Update the final message when complete
      updateMessage(messageId, content);
    },
  });
  
  // Initialize thread ID from props
  useEffect(() => {
    if (initialThreadId) {
      setThreadId(initialThreadId);
    }
  }, [initialThreadId, setThreadId]);
  
  // Load a thread by ID
  const loadThread = useCallback(async (threadId: string) => {
    try {
      const threadMessages = await loadThreadHistory(threadId);
      
      if (threadMessages.length > 0) {
        setMessages(threadMessages);
        
        // Set personality from the thread if available
        const assistantMessage = threadMessages.find(msg => msg.role === 'assistant' && msg.personality);
        if (assistantMessage && assistantMessage.personality) {
          switchPersonalityBase(assistantMessage.personality as AIPersonality);
        }
      }
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)));
    }
  }, [loadThreadHistory, setMessages, switchPersonalityBase, handleError]);
  
  // Switch personality and handle thread reset
  const switchPersonality = useCallback((personality: AIPersonality) => {
    if (personality === activePersonality) return;
    
    switchPersonalityBase(personality);
    
    // Reset thread ID when switching personality
    setThreadId(null);
  }, [activePersonality, switchPersonalityBase, setThreadId]);
  
  // Send a message to the AI
  const sendMessage = useCallback(async (message: string, personality?: AIPersonality) => {
    try {
      // Use provided personality or active one
      const usePersonality = personality || activePersonality;
      
      // Add user message if provided
      if (message) {
        addUserMessage(message);
        
        if (onSend) {
          onSend();
        }
      }
      
      // Create a placeholder for the assistant's response
      const assistantMessage = addAssistantMessage('', usePersonality);
      
      // Send the message to the API
      const result = await sendMessageToAPI(
        message,
        usePersonality,
        threadId,
        messages
      );
      
      if (result) {
        // Save the thread after getting a response
        saveThread([...messages, assistantMessage]);
      }
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)));
    }
  }, [
    activePersonality,
    addUserMessage,
    addAssistantMessage,
    sendMessageToAPI,
    threadId,
    messages,
    saveThread,
    onSend,
    handleError
  ]);
  
  // Handle form submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    // Don't submit empty messages or while typing
    if (!inputMessage.trim() || isTyping) return;
    
    // Send the message
    sendMessage(inputMessage);
    
    // Clear the input
    clearInput();
  }, [inputMessage, isTyping, sendMessage, clearInput]);
  
  // Skip typing animation and expose it
  const skipTypingAnimation = useCallback(() => {
    skipTyping();
  }, [skipTyping]);
  
  return {
    // State
    messages,
    inputMessage,
    isTyping,
    activePersonality,
    threadId,
    typingMessageId,
    errorMessage,
    isLoadingThread,
    
    // Actions
    setMessages,
    handleInputChange,
    handleSubmit,
    switchPersonality,
    togglePersonality,
    loadThread,
    sendMessage,
    skipTypingAnimation,
    cancelRequest,
    deleteThread,
    
    // Utilities
    getPersonalityName,
  };
} 