'use client';

import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/theme-context';
import { useAuth } from '@/lib/auth-context';
import Image from 'next/image';
import { useAssistantChat } from '@/lib/hooks/useAssistantChat';
import ChatHistory from '@/components/ChatHistory';
import { ChatMessage } from '@/types';
import { AIPersonality } from '@/types/ai';
import styles from './chat.module.css';

// Import extracted components
import MessageBubble, { personalityImages } from './chat/MessageBubble';
import PersonalitySelector from './chat/PersonalitySelector';
import SuggestedPrompts from './chat/SuggestedPrompts';
import { formatMessageContent, samplePrompts } from './chat/utils';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Main ChatModal component
export default function ChatModal({ isOpen, onClose }: ChatModalProps) {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const { user } = useAuth();
  
  // State management
  const [isMobile, setIsMobile] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [randomPrompts, setRandomPrompts] = useState(samplePrompts.slice(0, 3));
  const [selectorKey, setSelectorKey] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [buttonDimensions, setButtonDimensions] = useState({
    toboWidth: 140,
    heidoWidth: 140,
    heidoLeft: 140
  });
  
  // Default personality
  const defaultPersonality: AIPersonality = 'tobo';

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const skipButtonRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const firstToggleRef = useRef<HTMLButtonElement>(null);
  const secondToggleRef = useRef<HTMLButtonElement>(null);

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
    skipTypingAnimation: originalSkipTypingAnimation
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

  // Custom skip typing that also focuses the input
  const skipTypingAnimation = useCallback(() => {
    originalSkipTypingAnimation();
    // Small delay to ensure UI has updated after skipping
    setTimeout(() => {
      if (textInputRef.current) {
        textInputRef.current.focus();
      }
    }, 150);
  }, [originalSkipTypingAnimation]);

  // Check if this is a new chat
  const isNewChat = messages.length <= 1 && messages[0]?.role === 'assistant';
  
  // Effect to detect when AI has finished typing and focus the input
  const previousIsTypingRef = useRef(isTyping);
  useEffect(() => {
    // Auto-focus the input field when typing finishes
    // This triggers both after natural completion and after skipping
    if (previousIsTypingRef.current && !isTyping && !isNewChat && textInputRef.current) {
      // Small delay to ensure UI has updated properly
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 100);
    }
    
    // Update previous state
    previousIsTypingRef.current = isTyping;
  }, [isTyping, isNewChat]);

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

  // Effect to set random prompts when component mounts, modal opens, or new chat is created
  useEffect(() => {
    if (samplePrompts.length) {
      const shuffled = [...samplePrompts].sort(() => 0.5 - Math.random());
      setRandomPrompts(shuffled.slice(0, 3));
    }
  }, [isOpen]); // Refresh when modal opens

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
    
    // Force a re-render of the personality selector when the modal opens
    if (isOpen) {
      setSelectorKey(prevKey => prevKey + 1);
    }
  }, [isOpen]);

  // Effect to add keyboard support for various actions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only skip typing on Enter if:
      // 1. Enter key is pressed
      // 2. Typing is in progress
      // 3. There are messages
      // 4. The current message has enough content
      // 5. The input field is not focused (to avoid conflicts with message sending)
      const isInputFocused = document.activeElement === textInputRef.current;
      const messageLength = messages.length > 0 ? messages[messages.length - 1]?.content.length || 0 : 0;
      
      if (e.key === 'Enter') {
        // For debugging
        if (isTyping) {
          console.debug('Skip typing conditions:', {
            isTyping,
            messagesExist: messages.length > 0,
            messageLength,
            contentLongEnough: messageLength > 30,
            isInputFocused,
            willSkip: isTyping && messages.length > 0 && messageLength > 30 && !isInputFocused
          });
        }
        
        if (isTyping && messages.length > 0 && messageLength > 30 && !isInputFocused) {
          // Skip typing if AI is currently typing
          skipTypingAnimation();
        } else if (!isTyping && !isInputFocused && !isNewChat) {
          // Focus the input field if AI is not typing and input is not focused
          // This makes it easier for users to start typing their next message
          if (textInputRef.current) {
            textInputRef.current.focus();
          }
        }
      }
      
      // Close the history sidebar when Escape is pressed
      if (e.key === 'Escape' && showHistory) {
        setShowHistory(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isTyping, messages, skipTypingAnimation, isNewChat, showHistory]);

  // Effect to measure buttons after layout
  useLayoutEffect(() => {
    if (isOpen && firstToggleRef.current && secondToggleRef.current) {
      setButtonDimensions({
        toboWidth: firstToggleRef.current.offsetWidth,
        heidoWidth: secondToggleRef.current.offsetWidth,
        heidoLeft: secondToggleRef.current.offsetLeft
      });
    }
  }, [isOpen, selectorKey]);

  // Effect to make sure the personality selector is properly initialized after layout
  useLayoutEffect(() => {
    if (isOpen && firstToggleRef.current && secondToggleRef.current) {
      // Brief delay to ensure layout is complete
      setTimeout(() => {
        setSelectorKey(prevKey => prevKey + 1);
      }, 50);
    }
  }, [isOpen, activePersonality]);

  // Handler for starting a new chat
  const handleNewChat = (newPersonality?: AIPersonality) => {
    const personality = newPersonality || activePersonality;
    
    // Reset state
    setMessages([
      {
        id: '1',
        user_id: 'system',
        role: 'assistant',
        content: `Hi there! I'm ${personality === 'tobo' ? 'Tobot' : 'Haido'}, your crypto learning assistant. How can I help you today?`,
        personality: personality,
        created_at: new Date().toISOString(),
      }
    ]);
    
    // Generate new random prompts for the new chat
    if (samplePrompts.length) {
      const shuffled = [...samplePrompts].sort(() => 0.5 - Math.random());
      setRandomPrompts(shuffled.slice(0, 3));
    }
    
    switchPersonality(personality);
    setShowHistory(false);
  };

  // Handler for switching personality
  const handleSwitchPersonality = (personality: AIPersonality) => {
    if (messages.length <= 1) {
      // If it's a new chat, just switch personality
      switchPersonality(personality);
      handleNewChat(personality);
    } else {
      // If there's an ongoing conversation, confirm with the user
      if (window.confirm(`Starting a new chat with ${personality === 'tobo' ? 'Tobot' : 'Haido'}. Your current conversation will be saved.`)) {
        handleNewChat(personality);
      }
    }
  };

  // Handler for thread selection from history
  const handleThreadSelect = (selectedThreadId: string) => {
    loadThread(selectedThreadId);
    setShowHistory(false);
  };

  // Handler for clicking on a sample prompt
  const handlePromptClick = (prompt: string, personality: AIPersonality) => {
    if (activePersonality !== personality) {
      switchPersonality(personality);
      setSelectorKey(prevKey => prevKey + 1);
    }
    sendMessage(prompt);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={`fixed inset-0 z-50 flex items-center justify-center ${styles.fullscreenBackdrop}`}
          onClick={onClose}
        >
          {/* Modal content */}
          <motion.div
            className={`relative ${
              isDarkMode 
                ? styles.fullscreenModal
                : `${styles.fullscreenModal} ${styles.fullscreenModalLight}`
            } text-${isDarkMode ? 'white' : 'gray-900'} overflow-hidden flex flex-col`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Main content area with sidebar and animated content */}
            <div className="flex flex-1 overflow-hidden relative">
              {/* Chat history sidebar (conditionally shown) */}
              <AnimatePresence>
                {showHistory && (
                  <motion.div
                    initial={{ x: -280, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -280, opacity: 0 }}
                    transition={{ 
                      type: "spring", 
                      damping: 28, 
                      stiffness: 350, 
                      mass: 1
                    }}
                    className={`w-72 h-full ${
                      isDarkMode 
                        ? 'bg-gray-900/50 backdrop-blur-md' 
                        : 'bg-gray-50/70 backdrop-blur-md'
                    } overflow-y-auto z-10 absolute left-0 top-0 border-r border-white/10`}
                  >
                    <div className="sticky top-0 z-20 flex justify-between items-center p-3 border-b border-white/10 bg-inherit backdrop-blur-md">
                      <h3 className="font-medium text-light-text-primary dark:text-dark-text-primary">
                        Chat History
                      </h3>
                      <button 
                        onClick={() => setShowHistory(false)}
                        className={`p-1.5 rounded-full ${
                          isDarkMode 
                            ? 'hover:bg-gray-800/50' 
                            : 'hover:bg-gray-100/70'
                        } transition-colors duration-200`}
                        title="Close history"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>
                    <ChatHistory
                      onThreadSelect={handleThreadSelect}
                      currentThreadId={threadId}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Combined header and chat area with animation */}
              <motion.div 
                className="flex-1 flex flex-col h-full overflow-hidden"
                animate={{ 
                  marginLeft: showHistory ? "288px" : "0px" 
                }}
                transition={{ 
                  type: "spring", 
                  damping: 28, 
                  stiffness: 350,
                  mass: 1
                }}
                initial={false}
              >
                {/* Header with controls - now inside the animated container */}
                <div className={`flex items-center justify-between p-4 ${
                  isDarkMode 
                    ? styles.modalHeaderDark
                    : styles.modalHeaderLight
                } ${styles.modalHeader}`}>
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
                      onClick={() => handleNewChat()}
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
                      onSwitchPersonality={handleSwitchPersonality}
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

                {/* Messages container */}
                <div
                  ref={chatContainerRef}
                  className={`flex-1 overflow-y-auto p-4 pb-2 ${styles.scrollableContent} ${isNewChat ? 'flex items-center justify-center' : ''}`}
                >
                  {/* Regular message content */}
                  {isNewChat ? (
                    <SuggestedPrompts 
                      prompts={randomPrompts} 
                      onPromptClick={handlePromptClick}
                      isDarkMode={isDarkMode}
                    />
                  ) : (
                    /* Messages */
                    <>
                      {messages.map((message) => (
                        <MessageBubble
                          key={message.id}
                          message={message}
                          isTyping={isTyping}
                          typingMessageId={typingMessageId}
                          formatMessageContent={formatMessageContent}
                          isDarkMode={isDarkMode}
                          onSkipTyping={skipTypingAnimation}
                        />
                      ))}

                      {/* Error message */}
                      {errorMessage && (
                        <div className="p-3 mb-4 rounded-lg bg-red-500/10 text-red-500 text-sm">
                          <div className="flex items-start">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0116 0zm-7 4a1 1 0 1 1-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <div className="flex-1">
                              <p className="font-medium mb-1">Error</p>
                              <p>{errorMessage}</p>
                              <button 
                                onClick={() => setErrorMessage(null)} 
                                className="mt-2 text-sm font-medium hover:underline"
                              >
                                Dismiss
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Invisible element for scrolling to bottom */}
                  <div ref={messagesEndRef} />
                </div>

                {/* Skip typing button - perfectly positioned between messages and input */}
                <AnimatePresence>
                  {isTyping && messages.length > 0 && messages[messages.length - 1]?.content?.length > 30 && !isNewChat && (
                    <motion.div
                      ref={skipButtonRef}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="w-full flex justify-center py-1.5 z-10"
                      key="skip-button"
                    >
                      <button
                        className={`${styles.skipTypingButton} ${
                          isDarkMode ? styles.skipTypingButtonDark : styles.skipTypingButtonLight
                        } cursor-pointer`}
                        onClick={() => skipTypingAnimation()}
                        aria-label="Skip typing animation"
                      >
                        <span className="hidden sm:block">Press ENTER to Skip</span>
                        <span className="block sm:hidden">TAP TO SKIP</span>
                        <span className="font-mono ml-1.5">⏎</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Input area with reduced top padding when skip button is visible */}
                <div className={`p-4 ${isTyping ? 'pt-1.5' : 'pt-3'} ${
                  isDarkMode 
                    ? 'bg-gray-900/30 backdrop-blur-md' 
                    : 'bg-white/30 backdrop-blur-md'
                } ${styles.chatInputContainer}`}>
                  <form onSubmit={(e) => {
                    // Call the original handleSubmit
                    handleSubmit(e);
                    
                    // Blur the input field to remove focus after sending a message
                    if (textInputRef.current) {
                      textInputRef.current.blur();
                    }
                  }} className="relative">
                    <input
                      ref={textInputRef}
                      type="text"
                      value={inputMessage}
                      onChange={handleInputChange}
                      placeholder="Type your message..."
                      className={`w-full p-3 pr-14 rounded-full ${
                        isDarkMode
                          ? `${styles.chatInput} ${styles.chatInputDark}`
                          : `${styles.chatInput} ${styles.chatInputLight}`
                      } focus:outline-none focus:ring-2 focus:ring-brand-primary/30`}
                    />
                    <button
                      type="submit"
                      className={`${styles.sendButton} ${
                        inputMessage.trim() && !isTyping
                          ? isDarkMode 
                            ? styles.sendButtonActiveDark
                            : styles.sendButtonActiveLight
                          : isDarkMode
                            ? styles.sendButtonInactiveDark
                            : styles.sendButtonInactiveLight
                      }`}
                      disabled={!inputMessage.trim() || isTyping}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${
                        inputMessage.trim() && !isTyping ? 'translate-x-0.5' : ''
                      } transition-transform duration-200`}>
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                    </button>
                  </form>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 