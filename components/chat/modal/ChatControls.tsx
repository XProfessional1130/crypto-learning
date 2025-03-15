'use client';

import React, { useState, useEffect } from 'react';
import { AIPersonality } from '@/types/ai';
import styles from '../../chat.module.css';
import { getPromptsByPersonality } from '../utils';

interface ChatControlsProps {
  isNewChat: boolean;
  activePersonality: AIPersonality;
  sendMessage: (message: string, personality?: AIPersonality) => Promise<void>;
}

/**
 * ChatControls - Provides additional controls for the chat interface
 * Currently handles sample prompts for empty/new chats
 */
export default function ChatControls({
  isNewChat,
  activePersonality,
  sendMessage
}: ChatControlsProps) {
  const [randomPrompts, setRandomPrompts] = useState<string[]>([]);

  // Effect to set random prompts when component mounts or when personality changes
  useEffect(() => {
    // Get all prompts for the active personality
    const prompts = getPromptsByPersonality(activePersonality);
    
    // Shuffle and take 3 random prompts
    if (prompts.length) {
      const shuffled = [...prompts].sort(() => 0.5 - Math.random());
      setRandomPrompts(shuffled.slice(0, 3));
    }
  }, [activePersonality]);

  // If it's not a new chat, don't render anything
  if (!isNewChat) return null;

  return (
    <div className={styles.chatControls}>
      <div className={styles.promptSuggestions}>
        <div className={styles.promptsTitle}>Try asking about:</div>
        <div className={styles.promptsList}>
          {randomPrompts.map((prompt, index) => (
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
    </div>
  );
} 