import React from 'react';
import ChatModal from '@/components/ChatModal';

/**
 * This is a simple test script to manually verify the chat modal functionality
 * 
 * Usage:
 * - Import this component in a page
 * - Render it to see if the ChatModal opens and functions correctly
 */
export default function ChatModalTest() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Chat Modal Test</h1>
      <button 
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-brand-primary text-white rounded-md"
      >
        Open Chat Modal
      </button>

      <ChatModal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </div>
  );
} 