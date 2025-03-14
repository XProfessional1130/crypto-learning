'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { ChatMessage } from '@/types';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { useAssistantChat } from '@/lib/hooks/useAssistantChat';
import ChatHistory from '@/components/ChatHistory';
import personalities from '@/lib/config/ai-personalities';
import React from 'react';
import styles from './chat.module.css';

// Personality profile images
export const personalityImages = {
  tobo: '/images/avatars/tobo-avatar.svg',
  heido: '/images/avatars/heido-avatar.svg',
};

// Sample prompts based on crypto topics
const samplePrompts = [
  {
    text: "Explain blockchain technology in simple terms",
    personality: "tobo" as const
  },
  {
    text: "What's the difference between Bitcoin and Ethereum?",
    personality: "tobo" as const
  },
  {
    text: "How do smart contracts work?",
    personality: "heido" as const
  },
  {
    text: "What are NFTs and why are they valuable?",
    personality: "tobo" as const
  },
  {
    text: "Explain the concept of DeFi (Decentralized Finance)",
    personality: "heido" as const
  },
  {
    text: "What are the environmental concerns with Bitcoin mining?",
    personality: "heido" as const
  },
  {
    text: "How does cryptocurrency staking work?",
    personality: "tobo" as const
  },
  {
    text: "What is a crypto wallet and how do I keep it secure?",
    personality: "tobo" as const
  },
  {
    text: "Explain the concept of tokenomics",
    personality: "heido" as const
  }
];

export default function Chat() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialRenderRef = useRef(true);
  const textInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const firstToggleRef = useRef<HTMLButtonElement>(null);
  const secondToggleRef = useRef<HTMLButtonElement>(null);
  const [shouldScroll, setShouldScroll] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [randomPrompts, setRandomPrompts] = useState<typeof samplePrompts>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [skipTyping, setSkipTyping] = useState(false);
  
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
    initialMessages: [
      {
        id: '1',
        user_id: 'system',
        role: 'assistant',
        content: "Hi there! I'm Tobot, your crypto AI assistant. What would you like to learn about today?",
        personality: 'tobo',
        created_at: new Date().toISOString(),
      },
    ],
    userId: user?.id || 'anonymous',
    onResponse: () => {
      setShouldScroll(true);
    },
    onSend: () => {
      setShouldScroll(true);
    },
    onError: (error) => {
      console.error('Chat error:', error);
      // Show error message to user
      setErrorMessage(`Error: ${error.message || 'Something went wrong. Please try again.'}`);
      // Clear error after 5 seconds
      setTimeout(() => setErrorMessage(null), 5000);
    }
  });

  // Get three random prompts on initial load
  useEffect(() => {
    // Shuffle array and get 3 random prompts
    const shuffled = [...samplePrompts].sort(() => 0.5 - Math.random());
    setRandomPrompts(shuffled.slice(0, 3));
  }, []);

  // Smooth scroll to bottom
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    // Only set initial render state
    if (initialRenderRef.current) {
      initialRenderRef.current = false;
    } else if (shouldScroll) {
      // Scroll to bottom when a new message is sent
      scrollToBottom();
      setShouldScroll(false);
    }
  }, [messages, shouldScroll]);

  useEffect(() => {
    // Check if user is authenticated
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  // Focus input on personality switch
  useEffect(() => {
    textInputRef.current?.focus();
  }, [activePersonality]);
  
  // Start a new chat
  const handleNewChat = (newPersonality?: 'tobo' | 'heido') => {
    const personality = newPersonality || activePersonality;
    const personalityConfig = personalities[personality];
    
    setMessages([
      {
        id: Date.now().toString(),
        user_id: 'system',
        role: 'assistant',
        content: `Hi there! I'm ${personalityConfig?.displayName || (personality === 'tobo' ? 'Tobot' : 'Haidi')}, your crypto AI assistant. What would you like to learn about today?`,
        personality,
        created_at: new Date().toISOString(),
      },
    ]);
    
    // Get new random prompts
    const shuffled = [...samplePrompts].sort(() => 0.5 - Math.random());
    setRandomPrompts(shuffled.slice(0, 3));
    setShouldScroll(true);
    
    // If a new personality was specified, also update the active personality
    if (newPersonality && newPersonality !== activePersonality) {
      switchPersonality(newPersonality);
    }
  };

  // Handle switching personalities
  const handleSwitchPersonality = (personality: 'tobo' | 'heido') => {
    if (personality === activePersonality) return;
    
    // If we only have the initial welcome message, replace it instead of adding a new one
    if (messages.length === 1 && messages[0].role === 'assistant') {
      // This is a "new chat" scenario, so just replace the message
      const personalityConfig = personalities[personality];
      
      setMessages([{
        id: Date.now().toString(),
        user_id: 'system',
        role: 'assistant',
        content: `Hi there! I'm ${personalityConfig?.displayName || (personality === 'tobo' ? 'Tobot' : 'Haidi')}, your crypto AI assistant. What would you like to learn about today?`,
        personality,
        created_at: new Date().toISOString(),
      }]);
      
      // Generate new random prompts with the new personality
      const shuffled = [...samplePrompts].sort(() => 0.5 - Math.random());
      setRandomPrompts(shuffled.slice(0, 3));
    } else {
      // There's already a conversation going, so we should start a new chat with the new personality
      handleNewChat(personality);
    }
    
    // Switch the personality in the hook - this now only updates the active personality without adding a message
    switchPersonality(personality);
    setShouldScroll(true);
  };

  // Handle loading a thread from history
  const handleThreadSelect = (selectedThreadId: string) => {
    // If empty string is passed, it means the thread was deleted or deselected
    if (!selectedThreadId) {
      // Reset to new chat state
      handleNewChat();
      setShowHistory(false);
      return;
    }
    
    if (selectedThreadId === threadId) return;
    
    loadThread(selectedThreadId);
    setShouldScroll(true);
    setShowHistory(false); // Close history panel after selection
  };

  // Handle clicking a sample prompt
  const handlePromptClick = (prompt: string) => {
    sendMessage(prompt);
  };

  // Helper function to format message content with proper line breaks and markdown-like syntax
  const formatMessageContent = (content: string) => {
    // Process code blocks first
    content = content.replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>');
    
    // Process inline code
    content = content.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Process bold text (** **)
    content = content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Split text by double line breaks for paragraphs
    const paragraphs = content.split(/\n\n+/);
    
    if (paragraphs.length > 1) {
      return paragraphs.map((paragraph, i) => {
        // Check for bullet points or numbered lists
        if (paragraph.match(/^[*-] /m) || paragraph.match(/^\d+\. /m)) {
          const isNumbered = paragraph.match(/^\d+\. /m);
          const listItems = paragraph.split(/\n/).filter(line => line.trim());
          
          return (
            <div key={i} className={i > 0 ? 'mt-3' : ''}>
              {isNumbered ? (
                <ol>
                  {listItems.map((item, j) => (
                    <li key={j} dangerouslySetInnerHTML={{ __html: item.replace(/^\d+\. /, '') }} />
                  ))}
                </ol>
              ) : (
                <ul>
                  {listItems.map((item, j) => (
                    <li key={j} dangerouslySetInnerHTML={{ __html: item.replace(/^[*-] /, '') }} />
                  ))}
                </ul>
              )}
              {/* Add an extra space at the end of the last paragraph for the cursor */}
              {i === paragraphs.length - 1 && <span className={styles.typingCursor}>&nbsp;</span>}
            </div>
          );
        }
        
        // For each paragraph, check if it has single line breaks
        const lines = paragraph.split(/\n/);
        if (lines.length > 1) {
          // If paragraph has line breaks, preserve them
          return (
            <p key={i} className={i > 0 ? 'mt-3' : ''}>
              {lines.map((line, j) => (
                <React.Fragment key={j}>
                  <span dangerouslySetInnerHTML={{ __html: line }} />
                  {j < lines.length - 1 && <br />}
                </React.Fragment>
              ))}
              {/* Add an extra space at the end of the last paragraph for the cursor */}
              {i === paragraphs.length - 1 && <span className={styles.typingCursor}>&nbsp;</span>}
            </p>
          );
        }
        
        // Regular paragraph
        return (
          <p key={i} className={i > 0 ? 'mt-3' : ''}>
            <span dangerouslySetInnerHTML={{ __html: paragraph }} />
            {/* Add an extra space at the end of the last paragraph for the cursor */}
            {i === paragraphs.length - 1 && <span className={styles.typingCursor}>&nbsp;</span>}
          </p>
        );
      });
    }
    
    // Check for bullet points or numbered lists
    if (content.match(/^[*-] /m) || content.match(/^\d+\. /m)) {
      const isNumbered = content.match(/^\d+\. /m);
      const listItems = content.split(/\n/).filter(line => line.trim());
      
      return (
        <div>
          {isNumbered ? (
            <ol>
              {listItems.map((item, j) => (
                <li key={j} dangerouslySetInnerHTML={{ __html: item.replace(/^\d+\. /, '') }} />
              ))}
            </ol>
          ) : (
            <ul>
              {listItems.map((item, j) => (
                <li key={j} dangerouslySetInnerHTML={{ __html: item.replace(/^[*-] /, '') }} />
              ))}
            </ul>
          )}
          <span className={styles.typingCursor}>&nbsp;</span>
        </div>
      );
    }
    
    // Check for single line breaks if no paragraphs
    const lines = content.split(/\n/);
    if (lines.length > 1) {
      return (
        <p>
          {lines.map((line, i) => (
            <React.Fragment key={i}>
              <span dangerouslySetInnerHTML={{ __html: line }} />
              {i < lines.length - 1 && <br />}
            </React.Fragment>
          ))}
          <span className={styles.typingCursor}>&nbsp;</span>
        </p>
      );
    }
    
    // Handle code blocks and inline code that were preprocessed
    if (content.includes('<pre>') || content.includes('<code>')) {
      return (
        <>
          <div dangerouslySetInnerHTML={{ __html: content }} />
          <span className={styles.typingCursor}>&nbsp;</span>
        </>
      );
    }
    
    // No special formatting needed
    return (
      <>
        {content}
        <span className={styles.typingCursor}>&nbsp;</span>
      </>
    );
  };

  // Add a function to clear error message
  const clearError = () => {
    setErrorMessage(null);
  };

  // Add a typing indicator ref
  const typingIndicatorRef = useRef<HTMLDivElement>(null);

  // Add a function to check if message is currently being typed
  const isMessageStreaming = (message: ChatMessage) => {
    return isTyping && typingMessageId === message.id;
  };
  
  // Helper to determine if a message is skippable (has content and is lengthy)
  const isMessageSkippable = (message: ChatMessage) => {
    // Message should be currently streaming, have content, and be potentially lengthy
    // With slower typing, we should show the skip button earlier - lower threshold to 25 characters
    return isMessageStreaming(message) && message.content.length > 0 && message.content.length > 25;
  };

  // Ensure cursor stays visible when message is updating
  useEffect(() => {
    if (isTyping && typingMessageId) {
      setShouldScroll(true);
    }
  }, [isTyping, typingMessageId, messages]);

  // Add keyboard event listener for skipping typing with Enter key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip typing when Enter is pressed and AI is typing
      // Only allow skip when message has started typing and is likely to be lengthy
      if (e.key === 'Enter' && isTyping && typingMessageId) {
        // Find the current typing message
        const typingMessage = messages.find(msg => msg.id === typingMessageId);
        
        // Only skip if message is skippable
        if (typingMessage && isMessageSkippable(typingMessage)) {
          e.preventDefault();
          setSkipTyping(true);
          skipTypingAnimation();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTyping, skipTypingAnimation, typingMessageId, messages]);

  // Reset skip typing state when typing ends
  useEffect(() => {
    if (!isTyping) {
      setSkipTyping(false);
    }
  }, [isTyping]);

  if (loading || !user) {
    return (
      <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  // Custom message animations
  const messageAnimation = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.2 } }
  };

  // Custom typing indicator animation
  const typingAnimation = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
  };

  // Use static container animation for the message container
  const staticContainerAnimation = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.1 } }
  };

  // Text appearing animation - optimized for performance
  const textAnimation = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  // For longer messages, we'll use a simpler animation to avoid performance issues
  const isLongMessage = (text: string) => text.length > 150;

  // An optimized word-level animation for longer texts
  const wordAnimation = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.01, // Reduce stagger time to prevent layout shifts
        ease: "easeOut"
      }
    }
  };

  const wordItem = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const letterAnimation = {
    hidden: { opacity: 0, y: 5 },
    visible: { opacity: 1, y: 0 }
  };

  const isNewChat = messages.length <= 1 && messages[0]?.role === 'assistant';

  return (
    <div className={`mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 ${styles.heightVhFix} flex flex-col`}>
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Personality Selector */}
        <div className="mb-3 flex justify-center">
          <div className="neo-glass px-1 py-1 rounded-full flex items-center transition-all duration-300 relative overflow-hidden">
            {/* Improved Sliding background indicator */}
            <motion.div 
              className="absolute rounded-full bg-brand-primary/30 backdrop-blur-md border border-brand-primary/40 shadow-[0_0_8px_rgba(77,181,176,0.3)]"
              initial={false}
              animate={{
                x: activePersonality === 'tobo' ? 0 : secondToggleRef.current ? secondToggleRef.current.offsetLeft - (firstToggleRef.current?.offsetLeft || 0) : 0,
                width: activePersonality === 'tobo' 
                  ? firstToggleRef.current?.offsetWidth 
                  : secondToggleRef.current?.offsetWidth,
                height: '90%',
                top: '5%',
              }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
            />
            
            {/* Tobo Button */}
            <button
              ref={firstToggleRef}
              onClick={() => handleSwitchPersonality('tobo')}
              className="z-10 px-4 py-2 rounded-full flex items-center space-x-2 transition-all duration-300 relative"
            >
              <div className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center border border-white/30 shadow-sm transition-all duration-300 ${
                activePersonality === 'tobo' 
                  ? 'bg-brand-100 dark:bg-brand-800/50 scale-110 shadow-[0_0_10px_rgba(77,181,176,0.3)]' 
                  : 'bg-gray-100/70 dark:bg-gray-800/30'
              }`}>
                <Image 
                  src={personalityImages.tobo} 
                  alt="Tobo" 
                  width={32} 
                  height={32} 
                  className={`object-cover transition-transform duration-300 ${activePersonality === 'tobo' ? 'scale-110' : 'scale-100 opacity-80'}`}
                />
              </div>
              <div>
                <div className={`font-medium transition-all duration-300 ${activePersonality === 'tobo' ? 'text-brand-primary dark:text-brand-light' : 'text-light-text-secondary dark:text-dark-text-secondary'}`}>Tobot</div>
                <div className="text-xs opacity-70">Simple & Concise</div>
              </div>
            </button>
            
            {/* Heido Button */}
            <button
              ref={secondToggleRef}
              onClick={() => handleSwitchPersonality('heido')}
              className="z-10 px-4 py-2 rounded-full flex items-center space-x-2 transition-all duration-300"
            >
              <div className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center border border-white/30 shadow-sm transition-all duration-300 ${
                activePersonality === 'heido' 
                  ? 'bg-blue-100 dark:bg-blue-800/50 scale-110 shadow-[0_0_10px_rgba(77,181,176,0.3)]' 
                  : 'bg-gray-100/70 dark:bg-gray-800/30'
              }`}>
                <Image 
                  src={personalityImages.heido} 
                  alt="Haidi" 
                  width={32} 
                  height={32} 
                  className={`object-cover transition-transform duration-300 ${activePersonality === 'heido' ? 'scale-110' : 'scale-100 opacity-80'}`}
                />
              </div>
              <div>
                <div className={`font-medium transition-all duration-300 ${activePersonality === 'heido' ? 'text-brand-primary dark:text-brand-light' : 'text-light-text-secondary dark:text-dark-text-secondary'}`}>Haidi</div>
                <div className="text-xs opacity-70">Detailed & Analytical</div>
              </div>
            </button>
          </div>
        </div>

        {/* Chat tabs and content */}
        <div className={`flex flex-col flex-1 overflow-hidden ${styles.chatScrollContainer}`}>
          {/* Tab Navigation */}
          <div className="flex mb-0 relative z-10">
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className={`px-4 py-2 rounded-t-xl neo-glass backdrop-blur-sm flex items-center space-x-1 border border-white/10 border-b-0 transition-all duration-200 ${showHistory ? 'bg-brand-primary/10' : 'hover:bg-white/5'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              <span>{showHistory ? 'Hide History' : 'History'}</span>
            </button>
            <button 
              onClick={() => handleNewChat()}
              className={`px-4 py-2 rounded-t-xl neo-glass backdrop-blur-sm flex items-center space-x-1 border border-white/10 border-b-0 ml-1 transition-all duration-200 ${!showHistory ? 'bg-brand-primary/10' : 'hover:bg-white/5'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>New Chat</span>
            </button>
          </div>

          <div className="flex flex-1 gap-4 overflow-hidden">
            {/* Chat History Drawer */}
            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "280px" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="h-full neo-glass rounded-tr-xl rounded-b-xl overflow-hidden backdrop-blur-md border border-white/10 flex-shrink-0"
                >
                  <ChatHistory 
                    onThreadSelect={handleThreadSelect} 
                    currentThreadId={threadId} 
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Chat Container */}
            <div className={`flex-1 flex flex-col rounded-tr-xl rounded-b-xl neo-glass overflow-hidden backdrop-blur-md relative neo-glass-before ${styles.chatScrollContainer}`}>
              {/* Glassmorphic effect elements */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-brand-primary/5 dark:bg-brand-primary/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-brand-primary/5 dark:bg-brand-primary/10 rounded-full blur-3xl"></div>
              </div>
              
              {/* Chat Messages */}
              <div 
                ref={chatContainerRef}
                className={`flex-1 overflow-y-auto p-6 scrollbar-thin min-h-0 ${styles.scrollableContent}`}
              >
                {/* Error message display */}
                {errorMessage && (
                  <div 
                    className="mb-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded-md flex justify-between items-center"
                    onClick={clearError}
                  >
                    <p>{errorMessage}</p>
                    <button 
                      className="text-red-600 hover:text-red-800"
                      onClick={clearError}
                    >
                      ✕
                    </button>
                  </div>
                )}

                <AnimatePresence initial={false}>
                  <div className="space-y-6">
                    {messages.map((message) => {
                      // Skip rendering any temporary messages with no content when we're typing
                      if (isTyping && message.content === "" && message.role === "assistant" && message.id !== typingMessageId) {
                        return null;
                      }
                      
                      // Determine if this message is currently streaming
                      const isStreaming = isMessageStreaming(message);
                      
                      return (
                        <motion.div
                          key={message.id}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          {...staticContainerAnimation}
                        >
                          {message.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center mr-2 flex-shrink-0 border border-white/20 dark:border-white/5">
                              <Image 
                                src={personalityImages[message.personality || 'tobo']} 
                                alt={message.personality || 'AI'} 
                                width={32} 
                                height={32} 
                                className="object-cover"
                              />
                            </div>
                          )}
                          
                          <div
                            className={`${
                              message.role === 'user'
                                ? 'max-w-[80%] glass-brand-effect text-white animate-blur-in'
                                : message.personality === 'tobo'
                                ? `${(isStreaming && message.content === '') || message.content === '...' ? 'max-w-[15%]' : 'max-w-[80%]'} glass animate-blur-in`
                                : `${(isStreaming && message.content === '') || message.content === '...' ? 'max-w-[15%]' : 'max-w-[80%]'} glass animate-blur-in`
                            } rounded-2xl px-4 py-3`}
                            style={{ minWidth: (isStreaming && message.content === '') || message.content === '...' ? '5.5rem' : '10rem' }}
                          >
                            <motion.div
                              initial="hidden"
                              animate="visible"
                              variants={isLongMessage(message.content) ? wordAnimation : textAnimation}
                            >
                              {isLongMessage(message.content) ? (
                                // For long messages with better formatting
                                <motion.div variants={wordAnimation} className={`${styles['message-content']} ${styles.smoothMessage}`}>
                                  {formatMessageContent(message.content)}
                                  {isStreaming && message.content === "" && (
                                    <motion.span 
                                      className={styles.bouncingDots}
                                      style={{ 
                                        display: 'inline-flex',
                                        verticalAlign: 'middle',
                                        marginLeft: '2px'
                                      }}
                                    >
                                      <span className={`${styles.dot} ${styles.dot1}`}></span>
                                      <span className={`${styles.dot} ${styles.dot2}`}></span>
                                      <span className={`${styles.dot} ${styles.dot3}`}></span>
                                    </motion.span>
                                  )}
                                </motion.div>
                              ) : (
                                // For short messages
                                <div className={`${styles['message-content']} ${styles.smoothMessage}`}>
                                  {message.content === "" && isStreaming ? (
                                    <motion.span 
                                      ref={typingIndicatorRef}
                                      className={styles.bouncingDots}
                                    >
                                      <span className={`${styles.dot} ${styles.dot1}`}></span>
                                      <span className={`${styles.dot} ${styles.dot2}`}></span>
                                      <span className={`${styles.dot} ${styles.dot3}`}></span>
                                    </motion.span>
                                  ) : message.content === "..." ? (
                                    <motion.span 
                                      ref={typingIndicatorRef}
                                      className={styles.bouncingDots}
                                    >
                                      <span className={`${styles.dot} ${styles.dot1}`}></span>
                                      <span className={`${styles.dot} ${styles.dot2}`}></span>
                                      <span className={`${styles.dot} ${styles.dot3}`}></span>
                                    </motion.span>
                                  ) : (
                                    message.content.split(' ').map((word, i) => (
                                      <motion.span
                                        key={i}
                                        variants={wordItem}
                                        className="inline-block mr-1"
                                      >
                                        {word}
                                      </motion.span>
                                    ))
                                  )}

                                  {isStreaming && message.content !== "" && message.content !== "..." && (
                                    <></>
                                  )}
                                </div>
                              )}
                              
                              {/* Skip typing button - only show when message has content and is lengthy */}
                              {isMessageSkippable(message) && (
                                <motion.button
                                  onClick={() => {
                                    setSkipTyping(true);
                                    skipTypingAnimation();
                                  }}
                                  className="inline-flex items-center mt-2 text-xs py-1.5 px-3 bg-gray-200 dark:bg-gray-800 rounded-md text-gray-600 dark:text-gray-300 opacity-90 hover:opacity-100 hover:bg-gray-300 dark:hover:bg-gray-700 transition-all shadow-sm"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: 0.3 }}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                                    <polygon points="5 4 15 12 5 20 5 4"></polygon>
                                    <line x1="19" y1="5" x2="19" y2="19"></line>
                                  </svg>
                                  Skip (press Enter)
                                </motion.button>
                              )}
                            </motion.div>
                          </div>
                          
                          {message.role === 'user' && (
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-brand-primary/80 dark:bg-brand-primary/90 flex items-center justify-center ml-2 flex-shrink-0 text-white border border-white/20 dark:border-white/5">
                              {user.email?.charAt(0).toUpperCase() || 'U'}
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                    
                    {/* Sample prompts for new chats */}
                    {isNewChat && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                        className="mt-6"
                      >
                        <h3 className="text-center text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-3">
                          Try asking one of these:
                        </h3>
                        <div className="flex flex-col gap-2 items-start mx-4">
                          {randomPrompts.map((prompt, index) => (
                            <motion.button
                              key={index}
                              className="text-left p-3 rounded-xl neo-glass backdrop-blur-sm border border-white/10 hover:border-brand-primary/30 hover:bg-brand-primary/5 transition-all duration-200 inline-block"
                              whileHover={{ scale: 1.03, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handlePromptClick(prompt.text)}
                            >
                              <span className={`text-sm font-medium ${
                                prompt.personality === 'tobo' 
                                  ? 'text-brand-primary dark:text-brand-light' 
                                  : 'text-blue-500 dark:text-blue-300'
                              }`}>
                                {prompt.text}
                              </span>
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                </AnimatePresence>
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-white/10 dark:border-dark-bg-accent/10 backdrop-blur-md bg-white/5 dark:bg-dark-bg-primary/5">
                <form onSubmit={handleSubmit} className="flex space-x-2">
                  <input
                    ref={textInputRef}
                    type="text"
                    value={inputMessage}
                    onChange={handleInputChange}
                    placeholder="Ask about any crypto concept..."
                    className="flex-1 rounded-xl input focus:ring-brand-primary focus:ring-2 transition-all duration-300"
                  />
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || isTyping}
                    className="btn btn-primary rounded-xl relative overflow-hidden transition-all duration-300 hover:shadow-[0_0_15px_rgba(77,181,176,0.5)] group"
                  >
                    <span className="mr-1">Send</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 