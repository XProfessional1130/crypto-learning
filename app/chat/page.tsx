'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { ChatMessage } from '@/types';

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

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Only scroll if it's not the initial render
    if (initialRenderRef.current) {
      initialRenderRef.current = false;
      return;
    }
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Check if user is authenticated
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

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
    }, 1500);
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">AI Crypto Chat</h1>
        <p className="mt-1 text-gray-600">
          Chat with our AI assistants to learn about crypto concepts in a way that suits your learning style.
        </p>
      </div>

      {/* Personality Selector */}
      <div className="mb-6 flex space-x-4">
        <button
          onClick={() => switchPersonality('tobo')}
          className={`rounded-lg px-4 py-2 ${
            activePersonality === 'tobo'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <span className="font-medium">Tobo</span>
          <span className="ml-2 text-xs">
            {activePersonality === 'tobo' ? 'ACTIVE' : 'Simple & Concise'}
          </span>
        </button>
        <button
          onClick={() => switchPersonality('heido')}
          className={`rounded-lg px-4 py-2 ${
            activePersonality === 'heido'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <span className="font-medium">Heido</span>
          <span className="ml-2 text-xs">
            {activePersonality === 'heido' ? 'ACTIVE' : 'Detailed & Analytical'}
          </span>
        </button>
      </div>

      {/* Chat Container */}
      <div className="flex h-[600px] flex-col rounded-lg border border-gray-200 bg-white shadow-md">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : message.personality === 'tobo'
                      ? 'bg-green-100 text-gray-800'
                      : 'bg-blue-100 text-gray-800'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    activePersonality === 'tobo'
                      ? 'bg-green-100 text-gray-800'
                      : 'bg-blue-100 text-gray-800'
                  }`}
                >
                  <div className="flex space-x-2">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-gray-500"></div>
                    <div className="h-2 w-2 animate-bounce rounded-full bg-gray-500" style={{ animationDelay: '0.2s' }}></div>
                    <div className="h-2 w-2 animate-bounce rounded-full bg-gray-500" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Chat Input */}
        <div className="border-t border-gray-200 p-4">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about any crypto concept..."
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isTyping}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-300"
            >
              Send
            </button>
          </form>
          <p className="mt-2 text-xs text-gray-500">
            Try asking about: Bitcoin, Ethereum, DeFi, NFTs, or any crypto topic!
          </p>
        </div>
      </div>
    </div>
  );
} 