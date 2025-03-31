'use client';

import { useIntersectionObserver } from '@/hooks/ui/useIntersectionObserver';
import Section from '@/components/ui/Section';
import FeatureCard from './FeatureCard';

// Define the features as constants to avoid recreation on each render
const features = [
  {
    title: 'AI-Driven Education',
    description:
      'Learn crypto concepts through interactive AI chats. Ask questions and get personalized explanations from our AI assistants, Tobo and Heido.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 sm:w-8 sm:h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
      </svg>
    ),
  },
  {
    title: 'Portfolio Tracking',
    description:
      'Track your crypto investments with professional portfolio tools. Monitor performance, calculate returns, and get insights on your holdings.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 sm:w-8 sm:h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
      </svg>
    ),
  },
  {
    title: 'Market Analytics',
    description:
      'Access real-time market data, on-chain analytics, and expert analysis. Stay ahead with Fear & Greed index, whale wallet tracking, and more.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 sm:w-8 sm:h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
      </svg>
    ),
  },
];

export default function FeaturesSection() {
  // Use the optimized intersection observer hook with mobile-specific settings
  const [isVisible, sectionRef] = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.1,
    rootMargin: '0px 0px -10% 0px',
    triggerOnce: true,
    // More aggressive preloading on mobile
    mobileRootMargin: '0px 0px 5% 0px',
    mobileThreshold: 0.05
  });

  return (
    <div ref={sectionRef} className="below-fold-section">
      <Section 
        background="none" 
        className="relative py-16 sm:py-20"
      >
      {/* Simplified visual accents for better performance */}
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-brand-primary/5 dark:bg-brand-primary/10 rounded-full blur-2xl opacity-70 pointer-events-none" aria-hidden="true"></div>
      <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-brand-secondary/5 dark:bg-brand-secondary/10 rounded-full blur-2xl opacity-70 pointer-events-none" aria-hidden="true"></div>
      
      <div className={`max-w-6xl mx-auto px-4 sm:px-6 transition-opacity duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        <div className="text-center mb-10 sm:mb-16">
          {/* Feature badge with improved visibility and touch target */}
          <div className="inline-flex items-center px-3 py-1.5 mb-4 sm:mb-6 rounded-full text-xs font-medium tracking-wider bg-gray-200/80 dark:bg-gray-700/60 text-gray-700 dark:text-gray-50 border border-teal-500/20 dark:border-teal-400/30 backdrop-blur-sm shadow-sm">
            <span className="w-2 h-2 rounded-full bg-teal-500 dark:bg-teal-300 mr-2 animate-pulse"></span>
            KEY PLATFORM FEATURES
          </div>
          
          {/* Styled heading with simplified effects for better performance */}
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight md:text-5xl mb-4 sm:mb-6">
            <span className="block text-gray-800 dark:text-white">Everything You Need to</span>
            <span className="block mt-1 sm:mt-2">
              <span className="relative inline-block text-teal-500 dark:text-teal-300">
                Succeed in Crypto
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-teal-400 via-teal-300 to-cyan-400 dark:from-teal-300 dark:via-teal-200 dark:to-cyan-300 opacity-90"></span>
              </span>
            </span>
          </h2>
          
          {/* Styled paragraph with better contrast */}
          <p className="mx-auto mt-4 sm:mt-6 max-w-2xl text-lg sm:text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
            Our comprehensive platform provides the tools and knowledge for both
            <span className="relative inline-block px-2 mx-1">
              <span className="absolute inset-0 bg-teal-100/50 dark:bg-teal-800/40 rounded-lg -z-10"></span>
              <span className="relative z-10 text-teal-800 dark:text-teal-200 font-medium">beginners</span>
            </span>
            and
            <span className="relative inline-block px-2 mx-1">
              <span className="absolute inset-0 bg-indigo-100/50 dark:bg-indigo-800/40 rounded-lg -z-10"></span>
              <span className="relative z-10 text-indigo-800 dark:text-indigo-200 font-medium">experts</span>
            </span>.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:gap-8 md:gap-10 md:grid-cols-3">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={index * 0.1} // Reduced delay for better mobile performance
              isVisible={isVisible}
            />
          ))}
        </div>
      </div>
      </Section>
    </div>
  );
} 