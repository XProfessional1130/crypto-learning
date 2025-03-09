'use client';

import Section from '../ui/Section';
import Button from '../ui/Button';

export default function HeroSection() {
  return (
    <Section 
      background="primary" 
      className="py-16 relative overflow-hidden"
    >
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-5%] right-[20%] w-[500px] h-[500px] rounded-full bg-brand-300/30 dark:bg-brand-700/30 blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[10%] w-[400px] h-[400px] rounded-full bg-indigo-200/20 dark:bg-indigo-800/20 blur-3xl"></div>
      </div>
      
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-16 relative z-10">
        <div className="flex flex-col justify-center">
          <h1 className="text-gradient text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl animate-fade-in">
            Master Crypto with AI-Powered Education
          </h1>
          <p className="mt-6 max-w-3xl text-xl text-light-text-primary dark:text-dark-text-primary">
            LearningCrypto combines AI technology with expert insights to provide personalized crypto education, portfolio tracking, and real-time market analytics.
          </p>
          <div className="mt-8 flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
            <Button 
              href="/auth/signin" 
              variant="glass" 
              size="lg"
            >
              Get Started
            </Button>
            <Button 
              href="/about" 
              variant="outline" 
              size="lg"
            >
              Learn More
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-center">
          <div className="relative h-64 w-full md:h-72 lg:h-96 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="absolute inset-0 rounded-xl brand-glass shadow-glass-strong"></div>
            <div className="absolute inset-4 rounded-lg glass flex items-center justify-center">
              <span className="text-xl font-bold text-gradient">Crypto Analytics Dashboard</span>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
} 