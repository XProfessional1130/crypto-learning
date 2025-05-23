'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import Section from '../ui/Section';
import Button from '../ui/Button';
import Image from 'next/image';

export default function HeroSection() {
  const [isVisible, setIsVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  
  // Mock data for animated chart - memoized to prevent recalculation
  const chartData = useMemo(() => {
    // Generate random data points for the animated chart
    const baseValue = 30 + Math.random() * 20;
    return Array.from({ length: 24 }, (_, i) => {
      // Create a somewhat realistic looking chart with trends
      const trend = Math.sin(i / 3) * 15;
      const noise = (Math.random() * 20) - 10;
      return baseValue + trend + noise;
    });
  }, []);
  
  useEffect(() => {    
    // Use requestAnimationFrame for better performance, especially on mobile
    const rafId = requestAnimationFrame(() => {
      setIsVisible(true);
    });
    
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <Section 
      background="none"
      spacing="none"
      className="relative nav-section-fix"
    >
      {/* Background elements removed to use main homepage background */}
      
      <div 
        ref={heroRef} 
        className={`grid grid-cols-1 gap-16 md:grid-cols-2 md:gap-20 relative z-10 transition-all duration-700 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} mt-8 pt-4`}
        style={{ willChange: isVisible ? 'auto' : 'opacity, transform' }}
      >
        {/* Left content with optimized animations for mobile */}
        <div className="flex flex-col justify-center mt-0">
          <div className="inline-flex items-center px-3 py-1.5 mb-2 rounded-full text-xs font-medium tracking-wider bg-brand-100/30 dark:bg-brand-800/30 text-brand-700 dark:text-brand-300 border border-brand-200/50 dark:border-brand-700/50 backdrop-blur-sm shadow-sm max-w-fit">
            <span className="w-2 h-2 rounded-full bg-brand-500 dark:bg-brand-400 mr-2"></span>
            NEXT GENERATION CRYPTO LEARNING
          </div>
          
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl animate-fade-in relative">
            <span className="text-gradient-vibrant text-shadow-glow relative inline-block text-rendering-optimizeLegibility after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[6px] after:bg-gradient-to-r after:from-brand-primary/70 after:to-brand-light/30 after:rounded-full after:transform after:translate-y-2 after:blur-sm">
              Master Crypto
            </span>
            <br/>
            <span className="text-light-text-primary dark:text-dark-text-primary">with AI-Powered</span>
            <br/>
            <span className="text-light-text-primary dark:text-dark-text-primary relative inline-block">
              Education
              <svg 
                className="absolute -right-12 -bottom-1 w-10 h-10 text-brand-300 dark:text-brand-400 opacity-70" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path d="M10.75 8.75L14.25 12L10.75 15.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6.75 19.25H17.25C18.3546 19.25 19.25 18.3546 19.25 17.25V6.75C19.25 5.64543 18.3546 4.75 17.25 4.75H6.75C5.64543 4.75 4.75 5.64543 4.75 6.75V17.25C4.75 18.3546 5.64543 19.25 6.75 19.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </h1>
          
          <p className="mt-8 text-xl leading-relaxed text-light-text-secondary dark:text-dark-text-secondary backdrop-blur-sm p-3 -ml-3 border-l-2 border-brand-200 dark:border-brand-700">
            LearningCrypto combines AI technology with expert insights 
            to provide personalized crypto education, portfolio tracking, 
            and real-time market analytics.
          </p>
          
          <div className="mt-10 flex flex-col space-y-4 sm:flex-row sm:space-x-6 sm:space-y-0">
            <Button 
              href="/auth/signin" 
              variant="glass" 
              size="lg"
              className="neo-glass backdrop-blur-lg bg-brand-primary/90 dark:bg-brand-primary/90 border border-white/20 hover:bg-brand-primary hover:border-white/30 font-medium shadow-md"
            >
              <span className="relative z-10 text-brand-primary dark:text-white font-semibold">Get Started</span>
            </Button>
            <Button 
              href="/about" 
              variant="outline" 
              size="lg"
              className="backdrop-blur-md border-2"
            >
              Learn More
            </Button>
          </div>
          
          {/* Trust indicators */}
          <div className="mt-12 flex items-center space-x-5">
            <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Trusted by:</div>
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-800 flex items-center justify-center text-xs font-semibold text-brand-700 dark:text-brand-300 border border-white/50 dark:border-dark-bg-accent/50">
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">5,000+ users</div>
          </div>
        </div>

        {/* Right side with optimized rendering for mobile */}
        <div className="flex items-center justify-center">
          <div 
            className="relative w-full max-w-lg mx-auto transition-all duration-700 transform perspective-tilt" 
            style={{ 
              willChange: isVisible ? 'auto' : 'transform',
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden'
            }}
          >
            {/* Main dashboard card with optimized glassmorphism for mobile */}
            <div 
              className="relative rounded-2xl overflow-hidden neo-glass neo-glass-before sm:aspect-[4/3] h-[80vw] max-h-[400px] w-full" 
              style={{ 
                willChange: 'transform',
                transform: 'translateZ(0)',
                backfaceVisibility: 'hidden'
              }}
            >
              {/* Card background with optimized glass effect for mobile */}
              <div className="absolute inset-0 backdrop-blur-xl bg-white/20 dark:bg-dark-bg-primary/25"></div>
              
              {/* Light reflections - static for better mobile performance */}
              <div className="absolute top-0 right-0 w-[80%] h-[30%] bg-gradient-to-br from-white/20 dark:from-white/10 to-transparent rounded-bl-full"></div>
              <div className="absolute bottom-0 left-0 w-[40%] h-[20%] bg-gradient-to-tr from-white/10 dark:from-white/5 to-transparent rounded-tr-full"></div>
              
              {/* Dashboard content */}
              <div className="absolute inset-0 p-4 sm:p-8 flex flex-col">
                <div className="flex items-center justify-between mb-3 sm:mb-6">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-gradient-vibrant mb-0.5 sm:mb-1">Crypto Analytics Dashboard</h3>
                    <div className="text-xs sm:text-sm text-light-text-secondary dark:text-dark-text-secondary opacity-80">Real-time data insights</div>
                  </div>
                  <div className="flex space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-3 h-3 rounded-full bg-brand-200 dark:bg-brand-700"></div>
                    ))}
                  </div>
                </div>
                <div className="w-full h-1 bg-gradient-to-r from-brand-primary to-brand-light opacity-70 rounded-full"></div>
                
                {/* Chart area with optimized animations for mobile */}
                <div className="flex-1 rounded-lg bg-white/10 dark:bg-dark-bg-accent/20 border border-white/10 dark:border-dark-bg-accent/30 mt-4 sm:mt-6 p-3 sm:p-4 flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <div className="font-medium text-sm text-light-text-primary dark:text-dark-text-primary">BTC/USD</div>
                    <div className="text-sm text-green-500 font-medium flex items-center">
                      <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M12 19V5M12 5L5 12M12 5L19 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      2.4%
                    </div>
                  </div>
                  
                  {/* Optimized chart rendering for mobile */}
                  <div className="w-full h-24 sm:h-36 relative">
                    <div className="absolute bottom-0 inset-x-0 h-[1px] bg-white/20 dark:bg-white/10"></div>
                    <div className="h-full w-full flex items-end relative">
                      {chartData.map((value, i) => (
                        <div 
                          key={i} 
                          className="flex-1 mx-0.5 transform transition-all duration-300 ease-out"
                          style={{ 
                            height: `${value}%`,
                            background: 'linear-gradient(to top, rgba(77, 181, 176, 0.8), rgba(77, 181, 176, 0.1))',
                            borderTopLeftRadius: '3px',
                            borderTopRightRadius: '3px',
                            opacity: isVisible ? 1 : 0,
                            transform: isVisible ? 'scaleY(1)' : 'scaleY(0)',
                            transitionDelay: `${i * 25}ms`, // Reduced delay for better mobile performance
                            willChange: 'transform, opacity',
                            backfaceVisibility: 'hidden'
                          }}
                        ></div>
                      ))}
                      
                      {/* Chart line overlay - optimized for mobile */}
                      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                        <polyline
                          points={chartData.map((value, i) => `${(i / (chartData.length - 1)) * 100},${100 - value}`).join(' ')}
                          fill="none"
                          stroke="rgba(77, 181, 176, 0.8)"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="transition-all duration-700 ease-out"
                          style={{ 
                            opacity: isVisible ? 1 : 0,
                            strokeDasharray: 1000,
                            strokeDashoffset: isVisible ? 0 : 1000
                          }}
                        />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Additional data points */}
                  <div className="flex justify-between mt-3 sm:mt-4 text-xs">
                    <div className="flex flex-col">
                      <span className="text-light-text-secondary dark:text-dark-text-secondary text-[10px] sm:text-xs">24h Vol</span>
                      <span className="font-medium text-light-text-primary dark:text-dark-text-primary">$36.8B</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-light-text-secondary dark:text-dark-text-secondary text-[10px] sm:text-xs">Market Cap</span>
                      <span className="font-medium text-light-text-primary dark:text-dark-text-primary">$428.4B</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-light-text-secondary dark:text-dark-text-secondary text-[10px] sm:text-xs">Price</span>
                      <span className="font-medium text-light-text-primary dark:text-dark-text-primary">$21,984</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
} 