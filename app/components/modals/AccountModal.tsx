'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import Button from '../ui/Button';

interface AccountModalProps {
  user: User | null;
  onSignOut: () => Promise<void>;
  isOpen: boolean;
  onClose: () => void;
}

export default function AccountModal({ user, onSignOut, isOpen, onClose }: AccountModalProps) {
  // Close modal when escape key is pressed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      // Prevent scrolling when modal is open
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div className="fixed inset-x-0 top-20 mx-auto max-w-md p-6 z-50 rounded-xl bg-white dark:bg-dark-bg-primary shadow-xl border border-gray-200 dark:border-white/10 animate-fade-in">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Account Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        {user && (
          <div className="space-y-6">
            {/* User Info */}
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 p-3 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium">{user.email?.split('@')[0]}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                </div>
              </div>
            </div>
            
            {/* Subscription Info - Placeholder */}
            <div className="p-4 bg-gray-100 dark:bg-dark-bg-accent/20 rounded-lg">
              <h3 className="font-medium mb-2">Subscription</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Your current plan</p>
              <div className="flex items-center justify-between">
                <span className="font-medium text-brand-600 dark:text-brand-400">Free Tier</span>
                <Button 
                  variant="glass" 
                  size="sm"
                  href="/subscription"
                  className="bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 border-brand-200 dark:border-brand-800"
                >
                  Upgrade
                </Button>
              </div>
            </div>
            
            {/* Sign Out Button */}
            <div className="pt-4 border-t border-gray-200 dark:border-white/10">
              <Button
                variant="glass"
                size="md"
                onClick={onSignOut}
                className="w-full justify-center bg-gray-200/40 dark:bg-white/5 border-gray-300/50 dark:border-white/5 hover:bg-gray-200/60 dark:hover:bg-white/10"
              >
                Sign out
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
} 