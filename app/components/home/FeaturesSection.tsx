'use client';

import { useState, useEffect, useRef } from 'react';
import Section from '../ui/Section';
import FeatureCard from './FeatureCard';

// Define the features as constants to avoid recreation on each render
const features = [
  {
    title: 'AI-Driven Education',
    description:
      'Learn crypto concepts through interactive AI chats. Ask questions and get personalized explanations from our AI assistants, Tobo and Heido.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
      </svg>
    ),
  },
  {
    title: 'Portfolio Tracking',
    description:
      'Track your crypto investments with professional portfolio tools. Monitor performance, calculate returns, and get insights on your holdings.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
      </svg>
    ),
  },
  {
    title: 'Market Analytics',
    description:
      'Access real-time market data, on-chain analytics, and expert analysis. Stay ahead with Fear & Greed index, whale wallet tracking, and more.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
      </svg>
    ),
  },
];

export default function FeaturesSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simple intersection observer to trigger animations when in view
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <Section background="none" className="relative py-32 overflow-hidden">
      {/* Enhanced atmospheric background elements */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Main background elements */}
        <div className="absolute top-1/3 left-[-10%] w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-brand-100/10 to-brand-200/5 dark:from-brand-800/8 dark:to-brand-900/3 blur-[80px] animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-[-5%] w-[450px] h-[450px] rounded-full bg-gradient-to-bl from-indigo-100/8 to-blue-100/3 dark:from-indigo-900/5 dark:to-blue-900/3 blur-[100px] animate-pulse-slow" style={{ animationDelay: '2.5s' }}></div>
        
        {/* Decorative lines */}
        <div className="absolute left-0 right-0 top-[15%] h-[1px] bg-gradient-to-r from-transparent via-brand-200/20 dark:via-brand-700/10 to-transparent"></div>
        <div className="absolute left-0 right-0 bottom-[15%] h-[1px] bg-gradient-to-r from-transparent via-brand-200/10 dark:via-brand-700/5 to-transparent"></div>
        
        {/* Floating particles */}
        <div className="absolute top-[20%] left-[15%] w-[6px] h-[6px] rounded-full bg-brand-200 dark:bg-brand-700 opacity-40 dark:opacity-30 animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-[60%] right-[20%] w-[8px] h-[8px] rounded-full bg-indigo-300 dark:bg-indigo-700 opacity-30 dark:opacity-20 animate-float" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-[30%] left-[30%] w-[4px] h-[4px] rounded-full bg-cyan-300 dark:bg-cyan-700 opacity-40 dark:opacity-30 animate-float" style={{ animationDelay: '1.7s' }}></div>
      </div>
      
      <div 
        ref={sectionRef} 
        className={`relative z-10 transition-all duration-1000 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        {/* Enhanced section header with sophisticated typography */}
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center px-4 py-2 mb-6 rounded-full text-xs font-medium tracking-wider bg-light-bg-accent/50 dark:bg-dark-bg-accent/30 text-light-text-secondary dark:text-dark-text-secondary border border-white/20 dark:border-white/5 backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-brand-400 dark:bg-brand-300 mr-2"></div>
            KEY PLATFORM FEATURES
          </div>
          
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4 relative">
            <span className="relative inline-block">
              <span className="absolute -inset-1 bg-brand-200/20 dark:bg-brand-700/20 rounded-lg blur-lg -z-10"></span>
              <span className="text-light-text-primary dark:text-dark-text-primary relative z-10">Everything You Need to</span>
            </span>
            <br />
            <span className="relative inline-block">
              <span className="text-gradient-vibrant relative">
                Succeed in Crypto
                <div className="absolute -bottom-1 left-0 right-0 h-[3px] bg-gradient-to-r from-brand-primary via-brand-light to-transparent rounded-full"></div>
              </span>
            </span>
          </h2>
          
          <p className="mx-auto mt-6 max-w-2xl text-xl text-light-text-secondary dark:text-dark-text-secondary leading-relaxed backdrop-blur-sm">
            Our comprehensive platform provides the tools and knowledge for both 
            <span className="relative inline-block px-2 py-1 mx-1">
              <span className="absolute inset-0 bg-brand-100/20 dark:bg-brand-800/20 rounded-lg -z-10"></span>
              <span className="relative z-10 text-brand-700 dark:text-brand-300 font-medium">beginners</span>
            </span> 
            and 
            <span className="relative inline-block px-2 py-1 mx-1">
              <span className="absolute inset-0 bg-indigo-100/20 dark:bg-indigo-800/20 rounded-lg -z-10"></span>
              <span className="relative z-10 text-indigo-700 dark:text-indigo-300 font-medium">experts</span>
            </span>.
          </p>
        </div>

        {/* Animated staggered cards */}
        <div className="mt-24 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="transition-all duration-1000" 
              style={{ 
                transitionDelay: isVisible ? `${index * 150}ms` : '0ms',
              }}
            >
              <FeatureCard 
                title={feature.title}
                description={feature.description}
                icon={feature.icon}
              />
            </div>
          ))}
        </div>
        
        {/* Decorative section footer */}
        <div className="mt-24 text-center">
          <div className="relative inline-block">
            <div className="inline-flex rounded-full items-center px-4 py-3 backdrop-blur-md border border-white/20 dark:border-white/5 bg-white/10 dark:bg-dark-bg-accent/20 text-light-text-secondary dark:text-dark-text-secondary text-sm animate-float">
              <svg className="w-4 h-4 mr-2 text-brand-400 dark:text-brand-300" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.25 11.25L11.25 16.75M7.5 8.75V16.75M3.75 12.75V16.75M18.75 15.25V8.25M15 11.25V16.75M22.5 8.75V16.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Advanced analytics and data-driven insights at your fingertips</span>
            </div>
            <div className="absolute -inset-1 bg-white/5 dark:bg-white/5 blur rounded-full -z-10"></div>
          </div>
        </div>
      </div>
    </Section>
  );
} 