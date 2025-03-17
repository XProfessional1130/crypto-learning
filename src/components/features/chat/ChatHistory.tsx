import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/lib/providers/auth-provider';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { deleteThread } from '@/lib/api/chat-history';
import { memoize } from '@/lib/utils/memoize';
import { logger } from '@/lib/utils/logger';

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

// Extract ThreadItem into a separate memoized component for better performance
const ThreadItem = memoize(({ 
  thread, 
  isActive, 
  onThreadSelect, 
  onDelete, 
  isDeleting, 
  formatDate 
}: { 
  thread: Thread;
  isActive: boolean;
  onThreadSelect: (threadId: string) => void;
  onDelete: (e: React.MouseEvent, threadId: string) => void;
  isDeleting: boolean;
  formatDate: (dateString: string) => string;
}) => {
  return (
    <motion.div
      key={thread.threadId}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.2 }}
      className={`relative px-4 py-3 mb-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors
        ${isActive ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800'}
        border`}
      onClick={() => onThreadSelect(thread.threadId)}
    >
      <div className="flex items-center mb-1">
        <div className="flex-shrink-0 w-6 h-6 mr-2 relative">
          <Image
            src={personalityImages[thread.personality || 'tobo']}
            alt={thread.personality || 'AI'}
            width={24}
            height={24}
            className="rounded-full"
          />
        </div>
        <div className="flex-grow font-medium text-sm truncate pr-6">
          {thread.preview || 'New conversation'}
        </div>
      </div>
      <div className="flex justify-between items-center">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {formatDate(thread.latestMessage.created_at)}
        </div>
        <button
          className={`text-xs px-2 py-1 rounded hover:bg-red-100 dark:hover:bg-red-900 transition-colors
            text-red-500 dark:text-red-400`}
          onClick={(e) => onDelete(e, thread.threadId)}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Deleting
            </span>
          ) : (
            'Delete'
          )}
        </button>
      </div>
    </motion.div>
  );
});
ThreadItem.displayName = 'ThreadItem';

function ChatHistoryComponent({ onThreadSelect, currentThreadId }: ChatHistoryProps) {
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

  // Format date for display - memoize the function for better performance
  const formatDate = useCallback((dateString: string) => {
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
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // Filter conversations with useMemo for performance
  const filteredConversations = useMemo(() => {
    if (!searchTerm) return conversations;
    const searchTermLower = searchTerm.toLowerCase();
    
    return conversations.filter(thread => 
      thread.preview.toLowerCase().includes(searchTermLower) ||
      (thread.personality || '').toLowerCase().includes(searchTermLower)
    );
  }, [conversations, searchTerm]);

  // Handle thread deletion with useCallback
  const handleDelete = useCallback(async (e: React.MouseEvent, threadId: string) => {
    e.stopPropagation(); // Prevent clicking through to the thread select
    
    try {
      setDeleting(threadId);
      setDeleteError(null);
      
      // Delete the thread via API
      if (user) {
        await deleteThread(user.id, threadId);
        logger.info('Thread deleted successfully', { threadId });
        
        // Remove from local state
        setConversations(prev => prev.filter(thread => thread.threadId !== threadId));
        
        // If the deleted thread was selected, clear the current thread
        if (currentThreadId === threadId) {
          onThreadSelect('');
        }
      }
    } catch (err) {
      logger.error('Failed to delete thread', { error: err, threadId });
      setDeleteError('Failed to delete. Try again?');
    } finally {
      setDeleting(null);
    }
  }, [user, currentThreadId, onThreadSelect]);

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
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="text-lg font-semibold mb-2">Chat History</div>
        
        <div className="relative">
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 pl-9 rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-blue-500 dark:focus:border-blue-600 outline-none transition-all"
          />
          <div className="absolute left-3 top-2.5 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>
      
      <div className="flex-grow overflow-y-auto p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading conversations...</div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="text-red-500 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{error}</div>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-3 px-4 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-md transition-colors"
            >
              Retry
            </button>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            {searchTerm ? (
              <>
                <div className="text-gray-400 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">No matching conversations found.</div>
                <button 
                  onClick={() => setSearchTerm('')} 
                  className="mt-2 px-3 py-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs rounded-md transition-colors"
                >
                  Clear search
                </button>
              </>
            ) : (
              <>
                <div className="text-gray-400 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">No conversations yet. Start a new chat!</div>
              </>
            )}
          </div>
        ) : (
          <AnimatePresence>
            {filteredConversations.map(thread => (
              <ThreadItem
                key={thread.threadId}
                thread={thread}
                isActive={currentThreadId === thread.threadId}
                onThreadSelect={onThreadSelect}
                onDelete={handleDelete}
                isDeleting={deleting === thread.threadId}
                formatDate={formatDate}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
      
      {deleteError && (
        <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-xs text-center">
          {deleteError}
        </div>
      )}
    </div>
  );
}

// Export the memoized component
export default memoize(ChatHistoryComponent); 