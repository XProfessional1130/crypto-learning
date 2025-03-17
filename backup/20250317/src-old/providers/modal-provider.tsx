'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type ModalContent = ReactNode | null;

interface ModalContextType {
  isOpen: boolean;
  content: ModalContent;
  openModal: (content: ModalContent) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState<ModalContent>(null);

  const openModal = useCallback((content: ModalContent) => {
    setContent(content);
    setIsOpen(true);
    // Prevent body scrolling when modal is open
    document.body.style.overflow = 'hidden';
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    // Re-enable body scrolling when modal is closed
    document.body.style.overflow = '';
    // Clear content after animation completes
    setTimeout(() => setContent(null), 300);
  }, []);

  return (
    <ModalContext.Provider value={{ isOpen, content, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
} 