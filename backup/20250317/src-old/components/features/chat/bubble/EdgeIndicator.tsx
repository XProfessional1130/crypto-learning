'use client';

import { useEffect, useRef } from 'react';

interface EdgeIndicatorProps {
  onClick: () => void;
  onHide: () => void;
}

export function EdgeIndicator({ onClick, onHide }: EdgeIndicatorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = document.createElement('div');
    container.id = 'chat-indicator-injected';
    container.style.cssText = `
      position: fixed;
      z-index: 9999;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 36px;
      pointer-events: auto;
      opacity: 0;
      transition: opacity 0.5s ease-in-out;
    `;
    
    setTimeout(() => {
      container.style.opacity = '1';
    }, 10);
    
    container.innerHTML = `
      <div style="
        width: 3px;
        height: 36px;
        background-color: #4DB5B0;
        border-top-left-radius: 3px;
        border-bottom-left-radius: 3px;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        cursor: pointer;
        box-shadow: 0 1px 6px rgba(77, 181, 176, 0.2);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        overflow: hidden;
        animation: breathe 6s infinite ease-in-out;
      ">
        <div style="
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, rgba(255,255,255,0.1), rgba(255,255,255,0.4), rgba(255,255,255,0.1));
          opacity: 0;
          animation: subtleGlow 4s infinite cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: none;
          overflow: hidden;
        "></div>
      </div>
      
      <div style="
        position: absolute;
        left: -15px;
        top: 50%;
        transform: translateY(-50%);
        width: 12px;
        height: 12px;
        opacity: 0;
        animation: fadeInOut 6s infinite ease-in-out;
        pointer-events: none;
        z-index: 10000;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4DB5B0" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </div>
      
      <style>
        @keyframes subtleGlow {
          0%, 100% { opacity: 0; transform: translateY(-100%); }
          50% { opacity: 0.7; transform: translateY(100%); }
        }
        
        @keyframes fadeInOut {
          0%, 100% { opacity: 0; transform: translateY(-50%) translateX(5px); }
          15%, 40% { opacity: 1; transform: translateY(-50%) translateX(0); }
          55% { opacity: 0; transform: translateY(-50%) translateX(-5px); }
        }
        
        @keyframes breathe {
          0%, 100% { height: 36px; opacity: 0.85; }
          50% { height: 42px; opacity: 1; }
        }
        
        #chat-indicator-injected > div:first-child:hover {
          width: 4px;
          box-shadow: 0 1px 8px rgba(77, 181, 176, 0.4);
          animation: none;
          height: 42px;
          opacity: 1;
        }
        
        #chat-indicator-injected:hover > div:nth-child(2) {
          opacity: 1 !important;
          animation: none !important;
          transform: translateY(-50%) translateX(0) !important;
          filter: drop-shadow(0 0 2px rgba(77, 181, 176, 0.7));
        }
      </style>
    `;
    
    document.body.appendChild(container);
    containerRef.current = container;
    
    const tabElement = container.querySelector('div');
    if (tabElement) {
      container.addEventListener('click', () => {
        onClick();
        onHide();
      });
      
      const pulseAnimation = () => {
        setTimeout(() => {
          if (tabElement && document.body.contains(tabElement)) {
            tabElement.style.boxShadow = '0 1px 8px rgba(77, 181, 176, 0.4)';
            
            setTimeout(() => {
              if (tabElement && document.body.contains(tabElement)) {
                tabElement.style.boxShadow = '0 1px 6px rgba(77, 181, 176, 0.2)';
              }
            }, 1500);
          }
        }, 4000);
      };
      
      const pulseInterval = setInterval(pulseAnimation, 10000);
      container.dataset.pulseInterval = String(pulseInterval);
      pulseAnimation();
    }
    
    return () => {
      if (containerRef.current && document.body.contains(containerRef.current)) {
        const interval = Number(containerRef.current.dataset.pulseInterval);
        if (interval) clearInterval(interval);
        document.body.removeChild(containerRef.current);
      }
    };
  }, [onClick, onHide]);

  return null;
} 