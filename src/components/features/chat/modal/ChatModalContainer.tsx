'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/providers/theme-provider';
import { useAuth } from '@/lib/providers/auth-provider';
import { useAssistantChat } from '@/hooks/useAssistantChat';
import ChatHistory from '@/components/ChatHistory';
import { AIPersonality } from '@/types/ai';
import styles from '../../chat.module.css';

// Import new modular components
import ChatInput from './ChatInput';
import ChatControls from './ChatControls';
import ChatMessages from './ChatMessages';
import ChatHeader from './ChatHeader';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * ChatModalContainer - Main container for the chat modal functionality
 * This component handles the layout and orchestrates the child components
 */
export default function ChatModalContainer({ isOpen, onClose }: ChatModalProps) {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const { user } = useAuth();
  
  // State management
  const [isMobile, setIsMobile] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Default personality
  const defaultPersonality: AIPersonality = 'tobo';

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  // Initialize chat with useAssistantChat hook
  const {
    messages,
    inputMessage,
    isTyping,
    activePersonality,
    threadId,
    typingMessageId,
    handleInputChange,
    handleSubmit,
    switchPersonality,
    setMessages,
    loadThread,
    sendMessage,
    skipTypingAnimation
  } = useAssistantChat({
    initialMessages: user ? [
      {
        id: '1',
        user_id: 'system',
        role: 'assistant',
        content: `Hi there! I'm ${defaultPersonality === 'tobo' ? 'Tobot' : 'Haido'}, your crypto learning assistant. How can I help you today?`,
        personality: defaultPersonality,
        created_at: new Date().toISOString(),
      }
    ] : [],
    userId: user?.id || '',
  });

  // Check if this is a new chat
  const isNewChat = messages.length <= 1 && messages[0]?.role === 'assistant';

  // Effect to handle mobile detection
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // Effect to auto-scroll to bottom when messages change or typing status changes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // Effect to focus the text input when the modal opens
  useEffect(() => {
    if (isOpen && textInputRef.current) {
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);

  const handleNewChat = (newPersonality?: AIPersonality) => {
    const personality = newPersonality || activePersonality;
    const welcomeMessage = {
      id: String(Date.now()),
      user_id: 'system',
      role: 'assistant',
      content: `Hi there! I'm ${personality === 'tobo' ? 'Tobot' : 'Haido'}, your crypto learning assistant. How can I help you today?`,
      personality,
      created_at: new Date().toISOString(),
    };
    
    setMessages([welcomeMessage]);
    switchPersonality(personality);
  };

  const handleSwitchPersonality = (personality: AIPersonality) => {
    if (personality === activePersonality) return;
    
    // If it's a new chat, just switch the personality of the welcome message
    if (isNewChat) {
      handleNewChat(personality);
      return;
    }
    
    // Otherwise, clear the current chat and start a new one
    handleNewChat(personality);
  };

  const handleThreadSelect = (selectedThreadId: string) => {
    loadThread(selectedThreadId);
    setShowHistory(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className={styles.modalOverlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className={`${styles.modalContent} ${isDarkMode ? styles.dark : ''}`}
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          ref={chatContainerRef}
        >
          {/* History sidebar */}
          {showHistory && user && (
            <div className={styles.historyPanel}>
              <ChatHistory
                onSelectThread={handleThreadSelect}
                userId={user.id}
                onNewChat={() => {
                  handleNewChat();
                  setShowHistory(false);
                }}
                currentThreadId={threadId || undefined}
              />
            </div>
          )}

          {/* Main chat container */}
          <div className={styles.chatContainer}>
            <ChatHeader
              onClose={onClose}
              activePersonality={activePersonality}
              onSwitchPersonality={handleSwitchPersonality}
              showHistory={showHistory}
              setShowHistory={setShowHistory}
              isNewChat={isNewChat}
              userId={user?.id}
              onNewChat={handleNewChat}
            />

            <ChatMessages
              messages={messages}
              isTyping={isTyping}
              typingMessageId={typingMessageId}
              activePersonality={activePersonality}
              messagesEndRef={messagesEndRef}
              isNewChat={isNewChat}
              skipTypingAnimation={skipTypingAnimation}
              sendMessage={sendMessage}
            />

            <ChatInput
              inputMessage={inputMessage}
              handleInputChange={handleInputChange}
              handleSubmit={handleSubmit}
              isTyping={isTyping}
              textInputRef={textInputRef}
              isNewChat={isNewChat}
              errorMessage={errorMessage}
            />

            <ChatControls
              isNewChat={isNewChat}
              activePersonality={activePersonality}
              sendMessage={sendMessage}
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
} 