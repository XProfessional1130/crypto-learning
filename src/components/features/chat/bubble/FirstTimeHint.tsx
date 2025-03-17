'use client';

import { useEffect, useState } from 'react';

interface FirstTimeHintProps {
  onDismiss: () => void;
}

export function FirstTimeHint({ onDismiss }: FirstTimeHintProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasSeenChatIndicator = localStorage.getItem('hasSeenChatIndicator');
    const sessionHasSeenHint = sessionStorage.getItem('hasSeenChatIndicator');
    
    if ((!hasSeenChatIndicator || !sessionHasSeenHint) && window.innerWidth <= 768) {
      setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      
      setTimeout(() => {
        setIsVisible(false);
        localStorage.setItem('hasSeenChatIndicator', 'true');
        sessionStorage.setItem('hasSeenChatIndicator', 'true');
        onDismiss();
      }, 20000);
    }
  }, [onDismiss]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-sm z-50 animate-fade-in">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            New Chat Feature
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Swipe from the right edge to open the chat. We're here to help!
          </p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            onDismiss();
          }}
          className="flex-shrink-0 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
        >
          <span className="sr-only">Dismiss</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
} 