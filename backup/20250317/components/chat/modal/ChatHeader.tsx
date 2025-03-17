'use client';

import React from 'react';
import Image from 'next/image';
import { AIPersonality } from '@/types/ai';
import styles from '../../chat.module.css';
import { personalityImages } from '../MessageBubble';

interface ChatHeaderProps {
  onClose: () => void;
  activePersonality: AIPersonality;
  onSwitchPersonality: (personality: AIPersonality) => void;
  showHistory: boolean;
  setShowHistory: (show: boolean) => void;
  isNewChat: boolean;
  userId?: string;
  onNewChat: () => void;
}

/**
 * ChatHeader - Displays the header of the chat modal with personality switching and controls
 */
export default function ChatHeader({
  onClose,
  activePersonality,
  onSwitchPersonality,
  showHistory,
  setShowHistory,
  isNewChat,
  userId,
  onNewChat
}: ChatHeaderProps) {
  const togglePersonality = () => {
    const newPersonality = activePersonality === 'tobo' ? 'heido' : 'tobo';
    onSwitchPersonality(newPersonality);
  };

  return (
    <div className={styles.chatHeader}>
      {/* Left side - history toggle & new chat */}
      <div className={styles.leftControls}>
        {userId && (
          <button
            className={`${styles.historyButton} ${showHistory ? styles.active : ''}`}
            onClick={() => setShowHistory(!showHistory)}
            aria-label={showHistory ? "Hide chat history" : "Show chat history"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </button>
        )}
        
        <button
          className={styles.newChatButton}
          onClick={onNewChat}
          aria-label="Start new chat"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>New Chat</span>
        </button>
      </div>
      
      {/* Center - bot info and switcher */}
      <div className={styles.botInfo}>
        <div className={styles.botAvatar} onClick={togglePersonality}>
          <Image
            src={personalityImages[activePersonality]}
            alt={activePersonality === 'tobo' ? 'Tobot' : 'Haido'}
            width={40}
            height={40}
            className={styles.botImage}
          />
        </div>
        <div className={styles.botName}>
          {activePersonality === 'tobo' ? 'Tobot' : 'Haido'}
        </div>
      </div>
      
      {/* Right side - close button */}
      <div className={styles.rightControls}>
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close chat"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  );
} 