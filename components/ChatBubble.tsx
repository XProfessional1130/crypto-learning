'use client';

import { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/lib/theme-context';
import styles from './chat.module.css';

interface ChatBubbleProps {
  onClick: () => void;
  unreadMessages?: number;
  showPulse?: boolean;
}

export default function ChatBubble({ onClick, unreadMessages = 0, showPulse = false }: ChatBubbleProps) {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [isMobile, setIsMobile] = useState(false);
  const [showEdgeIndicator, setShowEdgeIndicator] = useState(true);
  const [showFirstTimeHint, setShowFirstTimeHint] = useState(false);
  const touchStartXRef = useRef(0);
  const indicatorRef = useRef<HTMLDivElement>(null);
  
  // Function to temporarily hide the edge indicator
  const hideEdgeIndicatorTemporarily = () => {
    setShowEdgeIndicator(false);
    // Show it again after 5 minutes
    setTimeout(() => {
      setShowEdgeIndicator(true);
    }, 5 * 60 * 1000);
  };
  
  // Function to make the edge indicator visible when chat is closed
  const showEdgeIndicatorWithFade = () => {
    // If the indicator is currently hidden, show it with fade effect
    if (!showEdgeIndicator) {
      setShowEdgeIndicator(true);
    }
  };
  
  // Make this function available to parent components
  useEffect(() => {
    // Expose the showEdgeIndicatorWithFade function to the window object
    // so it can be called when the chat is closed
    if (isMobile && typeof window !== 'undefined') {
      (window as any).showChatEdgeIndicator = showEdgeIndicatorWithFade;
    }
    
    return () => {
      // Clean up
      if (typeof window !== 'undefined') {
        delete (window as any).showChatEdgeIndicator;
      }
    };
  }, [isMobile, showEdgeIndicator]);
  
  // Directly inject the chat tab into the DOM to avoid CSS conflicts
  useEffect(() => {
    if (!isMobile || !showEdgeIndicator) return;
    
    // Create the container element
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
    
    // Fade in the container
    setTimeout(() => {
      container.style.opacity = '1';
    }, 10);
    
    // Check if tooltip has been shown before in this session
    const hasSeenTooltip = sessionStorage.getItem('hasSeenSwipeTooltip');
    
    // Calculate adaptive tooltip position based on screen width
    const screenWidth = window.innerWidth;
    const tooltipWidthEstimate = 110; // Approximate width of tooltip in pixels
    const safeDistance = Math.min(screenWidth * 0.15, 50); // Adaptive distance from edge, max 50px
    
    // Create the elegant, subtle tab element with styling
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
        <!-- Glow effect - contained within indicator -->
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
      
      <!-- Subtle directional hint - animated chevron -->
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
      
      <!-- Initial tooltip that appears briefly then fades away -->
      <div style="
        position: absolute;
        right: auto;
        left: -${safeDistance}px;
        top: 50%;
        transform: translateY(-50%) translateX(-100%);
        padding: 4px 8px;
        background-color: rgba(30, 41, 59, 0.85);
        border-radius: 4px;
        font-size: 12px;
        font-family: system-ui, -apple-system, sans-serif;
        color: white;
        white-space: nowrap;
        opacity: 0;
        animation: ${!hasSeenTooltip ? 'tooltipFade 5s ease-in-out forwards' : 'none'};
        backdrop-filter: blur(4px);
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        border: 1px solid rgba(77, 181, 176, 0.3);
        pointer-events: none;
        max-width: calc(${screenWidth}px - 30px);
      ">
        <div style="
          display: flex;
          align-items: center;
          gap: 4px;
          font-weight: 500;
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4DB5B0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 9l-6 6"/>
            <path d="M9 9h5v5"/>
          </svg>
          Swipe to chat
        </div>
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
        
        @keyframes tooltipFade {
          0% { opacity: 0; transform: translateY(-50%) translateX(-90%) scale(0.95); }
          10%, 70% { opacity: 1; transform: translateY(-50%) translateX(-100%) scale(1); }
          100% { opacity: 0; transform: translateY(-50%) translateX(-100%) scale(1); }
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
        
        #chat-indicator-injected:hover > div:nth-child(3) {
          opacity: 1 !important;
          animation: none !important;
          transform: translateY(-50%) translateX(-100%) !important;
        }
      </style>
    `;
    
    // Append to body to bypass any conflicting CSS
    document.body.appendChild(container);
    
    // Set up click handlers
    const tabElement = container.querySelector('div');
    
    if (tabElement) {
      // Make the entire container clickable
      container.addEventListener('click', () => {
        onClick();
        container.remove();
        hideEdgeIndicatorTemporarily();
      });
      
      // Add ambient animation to make it subtly pulse in opacity instead of size
      const pulseAnimation = () => {
        // Very subtle animation that doesn't change the size dramatically
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
      
      // Start pulse animation and repeat with a longer interval for subtlety
      const pulseInterval = setInterval(pulseAnimation, 10000);
      pulseAnimation(); // Run once immediately
      
      // Store animation interval for cleanup
      container.dataset.pulseInterval = String(pulseInterval);
      
      // Mark the tooltip as seen after it's shown for this session
      if (!hasSeenTooltip) {
        setTimeout(() => {
          sessionStorage.setItem('hasSeenSwipeTooltip', 'true');
        }, 5000);
      }
    }
    
    // Cleanup function
    return () => {
      if (document.body.contains(container)) {
        // Clear any animations
        const interval = Number(container.dataset.pulseInterval);
        if (interval) clearInterval(interval);
        
        document.body.removeChild(container);
      }
    };
  }, [isMobile, showEdgeIndicator, onClick]);

  // Check if the screen is mobile and if this is first visit
  useEffect(() => {
    const checkIfMobile = () => {
      const isMobileDevice = window.innerWidth <= 768;
      console.log(`Device detected as: ${isMobileDevice ? 'MOBILE' : 'DESKTOP'}`);
      setIsMobile(isMobileDevice);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    // Check if this is the first time seeing the chat feature in this session
    const hasSeenChatIndicator = localStorage.getItem('hasSeenChatIndicator');
    const sessionHasSeenHint = sessionStorage.getItem('hasSeenChatIndicator');
    
    if ((!hasSeenChatIndicator || !sessionHasSeenHint) && window.innerWidth <= 768) {
      // Delay showing the hint to ensure page has loaded
      setTimeout(() => {
        setShowFirstTimeHint(true);
      }, 2000);
      
      // Set a reasonable timeout for the hint to auto-dismiss
      // But make it long enough for users to read and understand
      setTimeout(() => {
        setShowFirstTimeHint(false);
        localStorage.setItem('hasSeenChatIndicator', 'true');
        sessionStorage.setItem('hasSeenChatIndicator', 'true');
      }, 20000);
    }
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // Setup touch event listeners for swipe detection
  useEffect(() => {
    if (!isMobile) return;
    
    const handleTouchStart = (e: TouchEvent) => {
      touchStartXRef.current = e.touches[0].clientX;
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartXRef.current === 0) return;

      const touchX = e.touches[0].clientX;
      const deltaX = touchStartXRef.current - touchX;
      
      // If swiping from right edge to left (deltaX > 0)
      // Increase the detection area to 100px from the edge for better usability
      if (deltaX > 30 && touchStartXRef.current > window.innerWidth - 100) {
        onClick();
        hideEdgeIndicatorTemporarily();
        touchStartXRef.current = 0;
      }
    };
    
    const handleTouchEnd = () => {
      touchStartXRef.current = 0;
    };
    
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, onClick]);

  return (
    <>
      {/* First time user hint - elegant and subtle version */}
      {isMobile && showFirstTimeHint && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            willChange: 'auto',
            transform: 'none',
            backfaceVisibility: 'visible'
          }}
        >
          <div 
            className="p-6 rounded-xl shadow-2xl max-w-[280px] text-center"
            style={{
              backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.90)' : 'rgba(255, 255, 255, 0.95)',
              borderWidth: '1px',
              borderColor: isDarkMode ? 'rgba(77, 181, 176, 0.3)' : 'rgba(77, 181, 176, 0.4)',
              boxShadow: '0 15px 30px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(77, 181, 176, 0.2)'
            }}
          >
            {/* Animation demonstrating the swipe gesture */}
            <div className="w-full h-16 mx-auto mb-5 relative overflow-hidden rounded-lg"
              style={{
                backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : 'rgba(241, 245, 249, 0.6)',
                border: '1px solid',
                borderColor: isDarkMode ? 'rgba(77, 181, 176, 0.15)' : 'rgba(77, 181, 176, 0.2)'
              }}
            >
              {/* Device frame */}
              <div className="w-full h-full relative">
                {/* Animated finger icon */}
                <div 
                  className="absolute z-10"
                  style={{
                    width: '24px',
                    height: '24px',
                    right: '0',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    animation: 'fingerSwipe 2.5s infinite'
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? '#cbd5e1' : '#64748b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"></path>
                    <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"></path>
                    <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"></path>
                    <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"></path>
                  </svg>
                </div>
                
                {/* Edge indicator */}
                <div 
                  className="absolute h-12 w-1"
                  style={{
                    right: '0',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    backgroundColor: '#4DB5B0',
                    borderTopLeftRadius: '2px',
                    borderBottomLeftRadius: '2px'
                  }}
                ></div>
                
                {/* Chat panel that slides in */}
                <div 
                  className="absolute h-full"
                  style={{
                    width: '70%',
                    right: '-70%',
                    top: '0',
                    backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    borderLeft: '1px solid',
                    borderColor: isDarkMode ? 'rgba(77, 181, 176, 0.3)' : 'rgba(77, 181, 176, 0.3)',
                    animation: 'panelSlide 2.5s infinite'
                  }}
                >
                  <div className="flex items-center justify-center h-full">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? '#4DB5B0' : '#4DB5B0'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-10 h-10 mx-auto mb-4 flex items-center justify-center rounded-full"
              style={{
                backgroundColor: 'rgba(77, 181, 176, 0.15)'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                style={{ color: '#4DB5B0' }}>
                <path d="m22 2-7 20-4-9-9-4Z"/>
                <path d="M22 2 11 13"/>
              </svg>
            </div>
            <div 
              className="font-medium text-base mb-2" 
              style={{ color: isDarkMode ? '#ffffff' : '#1e293b' }}
            >
              Access chat with a swipe
            </div>
            <div 
              className="text-sm mb-5 opacity-80" 
              style={{ color: isDarkMode ? '#cbd5e1' : '#475569' }}
            >
              Swipe from the right edge of your screen anytime to open the assistant
            </div>
            <button 
              className="py-2.5 px-4 rounded-lg w-full font-medium text-white text-sm"
              style={{
                backgroundColor: '#4DB5B0',
                boxShadow: '0 2px 8px rgba(77, 181, 176, 0.3)'
              }}
              onClick={() => setShowFirstTimeHint(false)}
            >
              Got it
            </button>
            
            {/* Debug button for clearing stored state - visible in development only */}
            {process.env.NODE_ENV === 'development' && (
              <button
                className="text-xs mt-3 opacity-60 hover:opacity-100 transition-opacity"
                style={{ color: isDarkMode ? '#94a3b8' : '#64748b' }}
                onClick={() => {
                  localStorage.removeItem('hasSeenChatIndicator');
                  sessionStorage.removeItem('hasSeenChatIndicator');
                  sessionStorage.removeItem('hasSeenSwipeTooltip');
                  alert('Chat hint states reset');
                }}
              >
                Reset hints (dev only)
              </button>
            )}
          </div>

          <style jsx global>{`
            @keyframes fingerSwipe {
              0%, 100% { right: 0; opacity: 0; }
              10% { opacity: 1; }
              40% { right: 70%; opacity: 1; }
              60% { opacity: 0; }
            }
            @keyframes panelSlide {
              0%, 5%, 100% { right: -70%; }
              40%, 60% { right: 0; }
              90% { right: -70%; }
            }
          `}</style>
        </div>
      )}

      {/* Hidden div to maintain indicatorRef */}
      <div ref={indicatorRef} className="hidden"></div>
    </>
  );
} 