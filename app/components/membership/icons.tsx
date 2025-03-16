import React from 'react';

interface IconProps {
  className?: string;
}

export function ArrowRightIcon({ className = '' }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 20 20" 
      fill="currentColor" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        fillRule="evenodd" 
        d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" 
        clipRule="evenodd" 
      />
    </svg>
  );
}

export function CreditCardIcon({ className = '' }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 20 20" 
      fill="currentColor" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
      <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
    </svg>
  );
}

export function CryptoIcon({ className = '' }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 20 20" 
      fill="currentColor" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm.5 11.5v1h-1v-1c-1.5 0-2.5-.75-3-1.5l1-1c.5.5 1.25 1 2 1 1 0 1.5-.5 1.5-1 0-1.5-4.5-1-4.5-4 0-1.5 1-2.5 3-2.5v-1h1v1c1.25 0 2.5.75 2.5 1.5l-1 1c-.5-.5-1.25-.75-2-.75-.75 0-1.5.25-1.5 1 0 1.5 4.5 1 4.5 4 0 1.5-1 2.5-2.5 2.5z" />
    </svg>
  );
}

export function CheckIcon({ className = '' }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 20 20" 
      fill="currentColor" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        fillRule="evenodd" 
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
        clipRule="evenodd" 
      />
    </svg>
  );
}

export function CloseIcon({ className = '' }: IconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 20 20" 
      fill="currentColor" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        fillRule="evenodd" 
        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
        clipRule="evenodd" 
      />
    </svg>
  );
} 