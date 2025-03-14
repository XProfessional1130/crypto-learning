import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { deleteThread } from '@/lib/services/chat-history';

// Define personality profile images here instead of importing from page.tsx
const personalityImages = {
  tobo: '/images/avatars/tobo-avatar.svg',
  heido: '/images/avatars/heido-avatar.svg',
};

interface Thread {
  threadId: string;
  latestMessage: {
    content: string;
    created_at: string;
    personality?: 'tobo' | 'heido';
  };
  preview: string;
  personality: 'tobo' | 'heido';
}

interface ChatHistoryProps {
  onThreadSelect: (threadId: string) => void;
  currentThreadId: string | null;
}

export default function ChatHistory({ onThreadSelect, currentThreadId }: ChatHistoryProps) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchConversations() {
      if (!user) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/assistant?userId=${user.id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch chat history');
        }
        
        const data = await response.json();
        
        if (data.conversations) {
          setConversations(data.conversations);
        }
      } catch (err) {
        console.error('Error fetching conversations:', err);
        setError('Failed to load chat history. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchConversations();
  }, [user]);

  // Filter conversations by search term
  const filteredConversations = searchTerm
    ? conversations.filter(thread => 
        thread.preview.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (thread.personality || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    : conversations;

  // Handle thread deletion
  const handleDelete = async (e: React.MouseEvent, threadId: string) => {
    e.stopPropagation(); // Prevent clicking through to the thread select
    
    try {
      setDeleting(threadId);
      setDeleteError(null);
      
      // Delete the thread via API
      if (user) {
        await deleteThread(user.id, threadId);
        
        // Remove from local state
        setConversations(prev => prev.filter(thread => thread.threadId !== threadId));
        
        // If the deleted thread was selected, clear the current thread
        if (currentThreadId === threadId) {
          onThreadSelect('');
        }
      }
    } catch (err) {
      console.error('Failed to delete thread:', err);
      setDeleteError('Failed to delete. Try again?');
    } finally {
      setDeleting(null);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    if (isYesterday) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 flex-1">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200/30 dark:bg-gray-800/30 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 text-red-500 flex items-center justify-center flex-1">
          <div className="text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-2 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm">{error}</p>
            <button 
              className="mt-2 text-brand-primary hover:underline text-sm font-medium"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-white/10">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search conversations..."
            className="w-full py-1.5 px-3 pr-8 text-sm rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary transition"
          />
          {searchTerm ? (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary hover:text-brand-primary"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
          )}
        </div>
      </div>
      
      {deleteError && (
        <div className="px-3 py-2 mx-2 mt-2 text-xs text-red-500 bg-red-500/10 rounded-md flex items-center justify-between">
          <span>{deleteError}</span>
          <button onClick={() => setDeleteError(null)} className="text-red-500/70 hover:text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      
      <div className="overflow-y-auto flex-1 scrollbar-thin">
        {filteredConversations.length === 0 && !loading && (
          <div className="p-4 text-center text-light-text-secondary dark:text-dark-text-secondary h-full flex items-center justify-center">
            <div>
              {searchTerm ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-2 text-light-text-secondary/50 dark:text-dark-text-secondary/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="text-sm">No matches found</p>
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="mt-1 text-xs text-brand-primary hover:underline"
                  >
                    Clear search
                  </button>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-2 text-light-text-secondary/50 dark:text-dark-text-secondary/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-sm">No previous conversations</p>
                  <p className="text-xs mt-1">Start a new chat to see your history here</p>
                </>
              )}
            </div>
          </div>
        )}
        
        <AnimatePresence>
          <div className="p-2 space-y-2">
            {filteredConversations.map((thread, index) => (
              <motion.div
                key={thread.threadId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="relative group"
              >
                <button
                  id={`thread-${thread.threadId}`}
                  onClick={() => onThreadSelect(thread.threadId)}
                  className={`w-full p-3 rounded-lg text-left transition-all duration-200 ${
                    currentThreadId === thread.threadId 
                      ? 'bg-brand-primary/10 shadow-sm border border-brand-primary/20' 
                      : 'hover:bg-white/5 dark:hover:bg-dark-bg-secondary/30 border border-transparent'
                  } relative group`}
                >
                  <div className="flex items-start">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100/20 dark:bg-gray-800/30 flex items-center justify-center mr-2 flex-shrink-0 border border-white/10 dark:border-white/5">
                      <Image 
                        src={personalityImages[thread.personality || 'tobo']} 
                        alt={thread.personality || 'AI'} 
                        width={32} 
                        height={32} 
                        className="object-cover"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span className={`font-medium text-sm truncate ${
                          currentThreadId === thread.threadId 
                            ? 'text-brand-primary dark:text-brand-light' 
                            : 'text-light-text-primary dark:text-dark-text-primary'
                        }`}>
                          {thread.personality === 'tobo' ? 'Tobot' : 'Haido'}
                        </span>
                        <span className="text-xs text-light-text-secondary/70 dark:text-dark-text-secondary/70 ml-2 flex-shrink-0">
                          {formatDate(thread.latestMessage.created_at)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary truncate mt-1">
                        {thread.preview}
                      </p>
                    </div>
                    
                    {/* New inline delete button */}
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      className="ml-2 flex-shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 relative"
                      title="Delete conversation"
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Stop event propagation
                          if (window.confirm("Are you sure you want to delete this conversation? This cannot be undone.")) {
                            handleDelete(e, thread.threadId);
                          }
                        }}
                        disabled={deleting === thread.threadId}
                        className={`p-1.5 rounded-full transition-all duration-200 ${
                          deleting === thread.threadId
                            ? 'bg-red-500/20'
                            : 'hover:bg-red-500/20 hover:scale-110'
                        }`}
                        aria-label="Delete conversation"
                      >
                        {deleting === thread.threadId ? (
                          <svg className="animate-spin h-4 w-4 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </button>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      </div>
    </div>
  );
} 