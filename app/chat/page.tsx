'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { ChatMessage } from '@/types';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';

// Personality profile images (placeholders for now)
const personalityImages = {
  tobo: '/images/avatars/tobo-avatar.svg',
  heido: '/images/avatars/heido-avatar.svg',
};

export default function Chat() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      user_id: 'system',
      role: 'assistant',
      content: "Hi there! I'm Tobo, your crypto AI assistant. What would you like to learn about today?",
      personality: 'tobo',
      created_at: new Date().toISOString(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activePersonality, setActivePersonality] = useState<'tobo' | 'heido'>('tobo');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialRenderRef = useRef(true);
  const textInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const firstToggleRef = useRef<HTMLButtonElement>(null);
  const secondToggleRef = useRef<HTMLButtonElement>(null);
  const [shouldScroll, setShouldScroll] = useState(false);

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
  
  // Switch personality
  const switchPersonality = (personality: 'tobo' | 'heido') => {
    if (personality === activePersonality) return;
    
    setActivePersonality(personality);
    
    const personalityIntros = {
      tobo: "Hey! I'm Tobo! I'll explain crypto concepts in simple, concise terms with a bit of wit. What can I help you with?",
      heido: "Greetings, I'm Heido. I provide careful, detailed analysis with a focus on accuracy and risk assessment. How may I assist you?",
    };
    
    setMessages([
      ...messages,
      {
        id: Date.now().toString(),
        user_id: 'system',
        role: 'assistant',
        content: personalityIntros[personality],
        personality,
        created_at: new Date().toISOString(),
      },
    ]);
    
    // Set flag to scroll to bottom after personality switch message
    setShouldScroll(true);
  };

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim()) return;
    
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      user_id: user?.id || 'user',
      role: 'user',
      content: inputMessage,
      created_at: new Date().toISOString(),
    };
    
    setMessages([...messages, userMessage]);
    setInputMessage('');
    setIsTyping(true);
    
    // Set flag to scroll to bottom after sending message
    setShouldScroll(true);
    
    // In a real app, this would call OpenAI API
    // For this demo, we'll simulate a response after a delay
    setTimeout(() => {
      const aiResponses = {
        tobo: {
          'bitcoin': "Bitcoin is digital money that lives on a global network called a blockchain. Think of it like digital gold that you can send across the internet without needing a bank! It has a limited supply of 21 million coins, which is why some people see it as protection against inflation.",
          'ethereum': "Ethereum is like a global computer that runs on a blockchain. Unlike Bitcoin which is mainly digital money, Ethereum lets developers build apps (called dApps) that run exactly as programmed without downtime or middlemen. Its native currency is Ether (ETH).",
          'defi': "DeFi or Decentralized Finance is like recreating financial services (lending, borrowing, trading) without banks or brokers. It uses smart contracts on blockchains like Ethereum to let people transact directly with each other. It's open to everyone with an internet connection!",
          'nft': "NFTs are like digital certificates of ownership for unique items. They prove you own a specific digital artwork, collectible, or even virtual real estate. Each NFT has a unique ID that can't be duplicated, so it's perfect for proving authenticity in the digital world!",
        },
        heido: {
          'bitcoin': "Bitcoin represents a peer-to-peer electronic cash system implementing a decentralized ledger technology called blockchain. It employs proof-of-work consensus to secure transactions and has a deflationary monetary policy with a capped supply of 21 million units. Its value proposition centers on censorship resistance and potential hedge against monetary inflation, though volatility remains significant.",
          'ethereum': "Ethereum functions as a decentralized, Turing-complete computing platform enabling smart contract functionality. Unlike Bitcoin's UTXO model, Ethereum employs an account-based system with its native currency Ether (ETH) facilitating computational resources allocation. It's transitioning from proof-of-work to proof-of-stake consensus via the Beacon Chain, with further scalability solutions under development.",
          'defi': "Decentralized Finance refers to the ecosystem of financial applications built on blockchain networks operating without central intermediaries. These protocols utilize smart contracts to facilitate lending, borrowing, trading, and derivatives. While offering unprecedented accessibility and composability, DeFi presents significant risks including smart contract vulnerabilities, oracle failures, governance attacks, and regulatory uncertainty.",
          'nft': "Non-Fungible Tokens represent cryptographically unique digital assets that, unlike cryptocurrencies, cannot be mutually interchanged. Typically implemented using ERC-721 or ERC-1155 standards on Ethereum, NFTs contain metadata pointing to digital or physical assets. While enabling verifiable digital ownership and royalty structures, the market exhibits extreme volatility, copyright complexities, and environmental concerns due to underlying blockchain energy consumption.",
        },
      };
      
      // Simple keyword matching for demo purposes
      const userQuery = inputMessage.toLowerCase();
      let responseContent = '';
      
      Object.entries(aiResponses[activePersonality]).forEach(([keyword, response]) => {
        if (userQuery.includes(keyword)) {
          responseContent = response;
        }
      });
      
      // Default response if no keyword match
      if (!responseContent) {
        responseContent = activePersonality === 'tobo'
          ? "Great question! While I don't have specific information on that, I'd be happy to help you learn about popular topics like Bitcoin, Ethereum, DeFi, or NFTs. What interests you most?"
          : "I appreciate your inquiry. To provide accurate information, I should note that this specific topic requires further research. However, I can offer detailed analysis on Bitcoin, Ethereum, DeFi protocols, or NFT markets if those subjects would be of interest.";
      }
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        user_id: 'system',
        role: 'assistant',
        content: responseContent,
        personality: activePersonality,
        created_at: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
      
      // Set flag to scroll to bottom after AI response
      setShouldScroll(true);
    }, 1500);
  };

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

  // Text appearing animation - optimized for performance
  const textAnimation = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.5,
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
        staggerChildren: 0.03,
        ease: "easeOut"
      }
    }
  };

  const wordItem = {
    hidden: { opacity: 0, y: 3 },
    visible: { opacity: 1, y: 0 }
  };

  const letterAnimation = {
    hidden: { opacity: 0, y: 5 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gradient-vibrant">AI Crypto Chat</h1>
        <p className="mt-1 text-light-text-secondary dark:text-dark-text-secondary">
          Chat with our AI assistants to learn about crypto concepts in a way that suits your learning style.
        </p>
      </div>

      {/* Redesigned Personality Selector */}
      <div className="mb-6 flex justify-center">
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
            onClick={() => switchPersonality('tobo')}
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
              <div className={`font-medium transition-all duration-300 ${activePersonality === 'tobo' ? 'text-brand-primary dark:text-brand-light' : 'text-light-text-secondary dark:text-dark-text-secondary'}`}>Tobo</div>
              <div className="text-xs opacity-70">Simple & Concise</div>
            </div>
          </button>
          
          {/* Heido Button */}
          <button
            ref={secondToggleRef}
            onClick={() => switchPersonality('heido')}
            className="z-10 px-4 py-2 rounded-full flex items-center space-x-2 transition-all duration-300"
          >
            <div className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center border border-white/30 shadow-sm transition-all duration-300 ${
              activePersonality === 'heido' 
                ? 'bg-blue-100 dark:bg-blue-800/50 scale-110 shadow-[0_0_10px_rgba(77,181,176,0.3)]' 
                : 'bg-gray-100/70 dark:bg-gray-800/30'
            }`}>
              <Image 
                src={personalityImages.heido} 
                alt="Heido" 
                width={32} 
                height={32} 
                className={`object-cover transition-transform duration-300 ${activePersonality === 'heido' ? 'scale-110' : 'scale-100 opacity-80'}`}
              />
            </div>
            <div>
              <div className={`font-medium transition-all duration-300 ${activePersonality === 'heido' ? 'text-brand-primary dark:text-brand-light' : 'text-light-text-secondary dark:text-dark-text-secondary'}`}>Heido</div>
              <div className="text-xs opacity-70">Detailed & Analytical</div>
            </div>
          </button>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex flex-col rounded-xl h-[70vh] neo-glass overflow-hidden backdrop-blur-md relative neo-glass-before">
        {/* Glassmorphic effect elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-brand-primary/5 dark:bg-brand-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-brand-primary/5 dark:bg-brand-primary/10 rounded-full blur-3xl"></div>
        </div>
        
        {/* Chat Messages */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <AnimatePresence initial={false}>
            <div className="space-y-6">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  {...messageAnimation}
                  layout
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
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'glass-brand-effect text-white animate-blur-in'
                        : message.personality === 'tobo'
                        ? 'glass animate-blur-in'
                        : 'glass animate-blur-in'
                    }`}
                  >
                    <motion.div
                      initial="hidden"
                      animate="visible"
                      variants={isLongMessage(message.content) ? wordAnimation : textAnimation}
                    >
                      {isLongMessage(message.content) ? (
                        // For long messages, animate word by word
                        <motion.div variants={wordAnimation}>
                          {message.content.split(' ').map((word, index) => (
                            <motion.span key={index} variants={wordItem} style={{ display: 'inline-block' }}>
                              {word}&nbsp;
                            </motion.span>
                          ))}
                        </motion.div>
                      ) : (
                        // For shorter messages, animate letter by letter
                        message.content.split('').map((char, index) => (
                          <motion.span key={index} variants={letterAnimation}>
                            {char}
                          </motion.span>
                        ))
                      )}
                    </motion.div>
                  </div>
                  
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-brand-primary/80 dark:bg-brand-primary/90 flex items-center justify-center ml-2 flex-shrink-0 text-white border border-white/20 dark:border-white/5">
                      {user.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </motion.div>
              ))}
              
              {isTyping && (
                <motion.div 
                  className="flex justify-start"
                  {...typingAnimation}
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center mr-2 flex-shrink-0 border border-white/20 dark:border-white/5">
                    <Image 
                      src={personalityImages[activePersonality]} 
                      alt={activePersonality} 
                      width={32} 
                      height={32}
                      className="object-cover"
                    />
                  </div>
                  <div className="glass rounded-2xl px-4 py-3 relative backdrop-blur-md overflow-hidden">
                    <div className="flex space-x-2 relative z-10">
                      <div className="h-2 w-2 rounded-full bg-brand-primary/70 dark:bg-brand-primary/90 animate-bounce"></div>
                      <div className="h-2 w-2 rounded-full bg-brand-primary/70 dark:bg-brand-primary/90 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="h-2 w-2 rounded-full bg-brand-primary/70 dark:bg-brand-primary/90 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                    {/* Glassmorphic effect elements */}
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute -top-6 -right-6 w-12 h-12 bg-brand-primary/10 dark:bg-brand-primary/20 rounded-full blur-xl"></div>
                      <div className="absolute -bottom-6 -left-6 w-12 h-12 bg-brand-primary/10 dark:bg-brand-primary/20 rounded-full blur-xl"></div>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </AnimatePresence>
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t border-white/10 dark:border-dark-bg-accent/10 backdrop-blur-md bg-white/5 dark:bg-dark-bg-primary/5">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <input
              ref={textInputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about any crypto concept..."
              className="flex-1 rounded-xl input focus:ring-brand-primary focus:ring-2 transition-all duration-300"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isTyping}
              className="btn btn-primary rounded-xl relative overflow-hidden transition-all duration-300 hover:shadow-[0_0_15px_rgba(77,181,176,0.5)] group"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 