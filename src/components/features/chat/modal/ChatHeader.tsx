'use client';

import React from 'react';
import { AIPersonality } from '@/types/ai';
import PersonalitySelector from '../PersonalitySelector';

interface ChatHeaderProps {
  showHistory: boolean;
  setShowHistory: (show: boolean) => void;
  onNewChat: () => void;
  onClose: () => void;
  activePersonality: AIPersonality;
  onSwitchPersonality: (personality: AIPersonality) => void;
  buttonDimensions: {
    toboWidth: number;
    heidoWidth: number;
    heidoLeft: number;
  };
  selectorKey: number;
  firstToggleRef: React.RefObject<HTMLButtonElement>;
  secondToggleRef: React.RefObject<HTMLButtonElement>;
  isDarkMode: boolean;
  headerStyles: {
    modalHeader: string;
    modalHeaderDark: string;
    modalHeaderLight: string;
  };
}

export function ChatHeader({
  showHistory,
  setShowHistory,
  onNewChat,
  onClose,
  activePersonality,
  onSwitchPersonality,
  buttonDimensions,
  selectorKey,
  firstToggleRef,
  secondToggleRef,
  isDarkMode,
  headerStyles,
}: ChatHeaderProps) {
  return (
    <div className={`flex items-center justify-between p-4 ${
      isDarkMode 
        ? headerStyles.modalHeaderDark
        : headerStyles.modalHeaderLight
      } ${headerStyles.modalHeader}`}>
      <div className="flex items-center space-x-3">
        {/* History Button */}
        <button 
          onClick={() => setShowHistory(!showHistory)}
          className={`p-2 rounded-full ${
            isDarkMode 
              ? 'hover:bg-gray-800/50' 
              : 'hover:bg-gray-100/70'
          } transition-colors duration-200 ${showHistory ? 'bg-brand-primary/20' : ''}`}
          title="Chat History"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
            <path d="M3 3v5h5"></path>
            <path d="M12 7v5l4 2"></path>
          </svg>
        </button>
        
        {/* New Chat Button */}
        <button 
          onClick={onNewChat}
          className={`p-2 rounded-full ${
            isDarkMode 
              ? 'hover:bg-gray-800/50' 
              : 'hover:bg-gray-100/70'
          } transition-colors duration-200`}
          title="New Chat"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
        </button>
        
        {/* Personality selector */}
        <PersonalitySelector
          activePersonality={activePersonality}
          onSwitchPersonality={onSwitchPersonality}
          buttonDimensions={buttonDimensions}
          selectorKey={selectorKey}
          firstToggleRef={firstToggleRef}
          secondToggleRef={secondToggleRef}
        />
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className={`p-2 rounded-full ${
          isDarkMode 
            ? 'hover:bg-gray-800/50' 
            : 'hover:bg-gray-100/70'
        } transition-colors duration-200`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  );
} 