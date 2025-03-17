'use client';

import React, { RefObject, useEffect, useRef } from 'react';
import { AIPersonality } from '@/types/ai';
import { ChatMessage } from '@/types';
import styles from '../../chat.module.css';
import MessageBubble from '../MessageBubble';
import SuggestedPrompts from '../SuggestedPrompts';
import { formatMessageContent, getPromptsByPersonality } from '../utils';

interface ChatMessagesProps {
  messages: ChatMessage[];
  isTyping: boolean;
  typingMessageId: string | null;
  activePersonality: AIPersonality;
  messagesEndRef: RefObject<HTMLDivElement>;
  isNewChat: boolean;
  skipTypingAnimation: () => void;
  sendMessage: (message: string, personality?: AIPersonality) => Promise<void>;
}

/**
 * ChatMessages - Displays the list of chat messages and handles suggested prompts
 */
export default function ChatMessages({
  messages,
  isTyping,
  typingMessageId,
  activePersonality,
  messagesEndRef,
  isNewChat,
  skipTypingAnimation,
  sendMessage
}: ChatMessagesProps) {
  const skipButtonRef = useRef<HTMLDivElement>(null);

  // Effect to handle Enter key for skipping typing animation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && isTyping && skipButtonRef.current) {
        skipTypingAnimation();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTyping, skipTypingAnimation]);

  return (
    <div className={styles.chatMessages}>
      <div className={styles.messagesContainer}>
        {/* Map through the messages and display them */}
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isTyping={isTyping && typingMessageId === message.id}
          />
        ))}
        
        {/* Skip button that appears when AI is typing */}
        {isTyping && (
          <div 
            className={styles.skipTypingButton} 
            onClick={skipTypingAnimation}
            ref={skipButtonRef}
          >
            Press Enter to skip
          </div>
        )}
        
        {/* Display suggested prompts for new chats */}
        {isNewChat && !isTyping && (
          <div className={styles.suggestedPrompts}>
            <div className={styles.promptsTitle}>Try asking about:</div>
            <div className={styles.promptsList}>
              {getPromptsByPersonality(activePersonality).slice(0, 3).map((prompt, index) => (
                <button
                  key={index}
                  className={styles.promptButton}
                  onClick={() => sendMessage(prompt, activePersonality)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Empty div for scrolling to the end */}
        <div ref={messagesEndRef} className={styles.messagesEnd} />
      </div>
    </div>
  );
} 