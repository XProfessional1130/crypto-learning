import { useState, useCallback, useRef } from 'react';

interface UseChatTypingOptions {
  onTypingComplete?: () => void;
}

/**
 * useChatTyping - Handles typing animation state and control
 * Manages the typing animation for chat messages
 */
export function useChatTyping({ onTypingComplete }: UseChatTypingOptions = {}) {
  // Typing state
  const [isTyping, setIsTyping] = useState(false);
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const [typingContent, setTypingContent] = useState('');
  const [fullContent, setFullContent] = useState('');
  
  // Refs for animation control
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const typingIndexRef = useRef(0);
  const typingSpeedRef = useRef(30); // ms per character
  
  // Start typing animation
  const startTyping = useCallback((messageId: string, content: string, speed = 30) => {
    // Clear any existing typing animation
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }
    
    // Reset typing state
    setIsTyping(true);
    setTypingMessageId(messageId);
    setTypingContent('');
    setFullContent(content);
    typingIndexRef.current = 0;
    typingSpeedRef.current = speed;
    
    // Start the typing animation
    typingIntervalRef.current = setInterval(() => {
      if (typingIndexRef.current < content.length) {
        setTypingContent(prev => prev + content[typingIndexRef.current]);
        typingIndexRef.current++;
      } else {
        // Animation complete
        clearInterval(typingIntervalRef.current!);
        setIsTyping(false);
        setTypingMessageId(null);
        
        // Call the completion callback
        if (onTypingComplete) {
          onTypingComplete();
        }
      }
    }, speed);
    
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, [onTypingComplete]);
  
  // Skip typing animation
  const skipTypingAnimation = useCallback(() => {
    if (!isTyping || !typingIntervalRef.current) return;
    
    // Clear the interval
    clearInterval(typingIntervalRef.current);
    
    // Set the full content
    setTypingContent(fullContent);
    
    // Update state
    setIsTyping(false);
    setTypingMessageId(null);
    
    // Call the completion callback
    if (onTypingComplete) {
      onTypingComplete();
    }
  }, [isTyping, fullContent, onTypingComplete]);
  
  return {
    isTyping,
    typingMessageId,
    typingContent,
    startTyping,
    skipTypingAnimation,
  };
} 