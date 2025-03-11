'use client';

import Section from '../ui/Section';
import Button from '../ui/Button';
import Image from 'next/image';

export default function HeroSection() {
  return (
    <Section 
      background="none" 
      className="py-24 relative overflow-hidden"
    >
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] right-[15%] w-[600px] h-[600px] rounded-full bg-brand-300/20 dark:bg-brand-700/20 blur-[80px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-20%] left-[5%] w-[500px] h-[500px] rounded-full bg-indigo-300/15 dark:bg-indigo-700/15 blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[30%] left-[40%] w-[300px] h-[300px] rounded-full bg-teal-200/10 dark:bg-teal-800/10 blur-[60px] animate-pulse-slow" style={{ animationDelay: '3s' }}></div>
      </div>
      
      <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-20 relative z-10">
        <div className="flex flex-col justify-center">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl animate-fade-in">
            <span className="text-gradient">Master Crypto</span> <br/>
            <span className="text-light-text-primary dark:text-dark-text-primary">with AI-Powered Education</span>
          </h1>
          <p className="mt-8 text-xl leading-relaxed text-light-text-secondary dark:text-dark-text-secondary">
            LearningCrypto combines AI technology with expert insights 
            to provide personalized crypto education, portfolio tracking, 
            and real-time market analytics.
          </p>
          <div className="mt-10 flex flex-col space-y-4 sm:flex-row sm:space-x-6 sm:space-y-0">
            <Button 
              href="/auth/signin" 
              variant="glass" 
              size="lg"
              className="backdrop-blur-md bg-brand-primary/90 text-white border border-white/10 hover:bg-brand-primary"
            >
              Get Started
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
        </div>

        <div className="flex items-center justify-center">
          <div className="relative w-full max-w-lg mx-auto animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
              <div className="absolute inset-0 backdrop-blur-xl bg-white/20 dark:bg-dark-bg-primary/30 border border-white/30 dark:border-white/10 shadow-2xl"></div>
              
              <div className="absolute inset-0 p-8 flex flex-col">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gradient mb-2">Crypto Analytics Dashboard</h3>
                  <div className="w-full h-1 bg-gradient-to-r from-brand-primary to-brand-light opacity-70 rounded-full"></div>
                </div>
                
                <div className="flex-1 rounded-lg bg-white/10 dark:bg-dark-bg-accent/20 border border-white/10 dark:border-dark-bg-accent/30 p-4 flex items-center justify-center">
                  <div className="w-full h-32 relative">
                    <div className="absolute bottom-0 inset-x-0 h-[1px] bg-white/20 dark:bg-white/10"></div>
                    <div className="h-full w-full flex items-end">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div 
                          key={i} 
                          className="flex-1 mx-0.5"
                          style={{ 
                            height: `${20 + Math.random() * 80}%`,
                            background: 'linear-gradient(to top, rgba(77, 181, 176, 0.7), rgba(77, 181, 176, 0.1))',
                            borderTopLeftRadius: '3px',
                            borderTopRightRadius: '3px'
                          }}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-brand-200 dark:bg-brand-800 blur-xl opacity-50"></div>
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-indigo-200 dark:bg-indigo-900 blur-xl opacity-30"></div>
          </div>
        </div>
      </div>
    </Section>
  );
} 