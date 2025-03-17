import { useState, useCallback } from 'react';
import { ChatMessage } from '@/types';
import { AIPersonality } from '@/types/ai';

interface UseChatOptions {
  initialMessages?: ChatMessage[];
  userId: string;
}

/**
 * useChat - Core chat functionality hook
 * Handles basic message state and operations
 */
export function useChat({
  initialMessages = [],
  userId,
}: UseChatOptions) {
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputMessage, setInputMessage] = useState('');
  
  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
  }, []);
  
  // Clear input
  const clearInput = useCallback(() => {
    setInputMessage('');
  }, []);
  
  // Add a user message
  const addUserMessage = useCallback((content: string): ChatMessage => {
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      user_id: userId,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    return userMessage;
  }, [userId]);
  
  // Add an assistant message
  const addAssistantMessage = useCallback((content: string, personality: AIPersonality): ChatMessage => {
    const assistantMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      user_id: 'system',
      role: 'assistant',
      content,
      personality,
      created_at: new Date().toISOString(),
    };
    
    setMessages(prevMessages => [...prevMessages, assistantMessage]);
    return assistantMessage;
  }, []);
  
  // Update a message by ID
  const updateMessage = useCallback((id: string, content: string) => {
    setMessages(prevMessages => 
      prevMessages.map(msg => 
        msg.id === id ? { ...msg, content } : msg
      )
    );
  }, []);
  
  // Handle form submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    // Don't submit empty messages
    if (!inputMessage.trim()) return;
    
    // Add the user message
    addUserMessage(inputMessage);
    
    // Clear the input
    clearInput();
  }, [inputMessage, addUserMessage, clearInput]);
  
  return {
    messages,
    setMessages,
    inputMessage,
    handleInputChange,
    handleSubmit,
    clearInput,
    addUserMessage,
    addAssistantMessage,
    updateMessage,
  };
} 