import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatMessage } from '@/types';
import { AIPersonality } from '@/types/ai';
import personalities from '@/lib/config/ai-personalities';

interface UseChatOptions {
  initialMessages?: ChatMessage[];
  onError?: (error: Error) => void;
  onResponse?: () => void;
  userId: string;
}

export function useChat({
  initialMessages = [],
  onError,
  onResponse,
  userId,
}: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activePersonality, setActivePersonality] = useState<AIPersonality>('tobo');
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Reset abort controller when component unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  // Switch personality
  const switchPersonality = useCallback((personality: AIPersonality) => {
    if (personality === activePersonality) return;
    
    setActivePersonality(personality);
    
    const personalityConfig = personalities[personality];
    
    if (!personalityConfig) return;
    
    setMessages(prevMessages => [
      ...prevMessages,
      {
        id: Date.now().toString(),
        user_id: 'system',
        role: 'assistant',
        content: `Hello! I'm ${personalityConfig.displayName}. ${personalityConfig.description}. How can I help you today?`,
        personality,
        created_at: new Date().toISOString(),
      },
    ]);
  }, [activePersonality]);
  
  // Send message to API
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;
    
    try {
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
      
      // Prepare API message format
      const apiMessages = messages
        .concat(userMessage)
        .map(msg => ({
          role: msg.role,
          content: msg.content,
        }));
      
      // Create abort controller for the request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      
      // Send request to API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: apiMessages,
          personality: activePersonality,
          userId,
        }),
        signal: abortControllerRef.current.signal,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send message');
      }
      
      if (onResponse) {
        onResponse();
      }
      
      // Handle streaming response
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';
      
      // Create assistant message with empty content
      const newAssistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        user_id: 'system',
        role: 'assistant',
        content: '',
        personality: activePersonality,
        created_at: new Date().toISOString(),
      };
      
      setMessages(prevMessages => [...prevMessages, newAssistantMessage]);
      
      // Read the stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        // Convert bytes to text
        const chunk = decoder.decode(value, { stream: true });
        assistantMessage += chunk;
        
        // Update the assistant message content
        setMessages(prevMessages => {
          const updatedMessages = [...prevMessages];
          const lastMessage = updatedMessages[updatedMessages.length - 1];
          
          if (lastMessage.role === 'assistant') {
            lastMessage.content = assistantMessage;
          }
          
          return updatedMessages;
        });
      }
      
      setIsTyping(false);
    } catch (error: any) {
      setIsTyping(false);
      console.error('Error sending message:', error);
      
      // Don't show error for aborted requests
      if (error.name !== 'AbortError' && onError) {
        onError(error);
      }
    }
  }, [messages, activePersonality, userId, onError, onResponse]);
  
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
    handleInputChange,
    handleSubmit,
    sendMessage,
    switchPersonality,
    setMessages,
  };
} 