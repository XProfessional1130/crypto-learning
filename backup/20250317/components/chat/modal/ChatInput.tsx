'use client';

import React, { RefObject, FormEvent } from 'react';
import styles from '../../chat.module.css';

interface ChatInputProps {
  inputMessage: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: FormEvent) => void;
  isTyping: boolean;
  textInputRef: RefObject<HTMLInputElement>;
  isNewChat: boolean;
  errorMessage: string | null;
}

/**
 * ChatInput - Handles user input for chat messages
 * Provides text input field and submit button
 */
export default function ChatInput({
  inputMessage,
  handleInputChange,
  handleSubmit,
  isTyping,
  textInputRef,
  isNewChat,
  errorMessage
}: ChatInputProps) {
  return (
    <div className={styles.chatInputContainer}>
      {errorMessage && (
        <div className={styles.errorMessage}>
          {errorMessage}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className={styles.chatInputForm}>
        <input
          type="text"
          value={inputMessage}
          onChange={handleInputChange}
          placeholder={isTyping ? "AI is typing..." : "Type your message..."}
          disabled={isTyping}
          className={styles.chatInput}
          ref={textInputRef}
          aria-label="Chat message input"
        />
        
        <button
          type="submit"
          className={`${styles.sendButton} ${!inputMessage.trim() || isTyping ? styles.disabled : ''}`}
          disabled={!inputMessage.trim() || isTyping}
          aria-label="Send message"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </form>
    </div>
  );
} 