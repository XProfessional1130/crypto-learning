'use client';

import Section from '../ui/Section';
import Button from '../ui/Button';

export default function HeroSection() {
  return (
    <Section 
      background="primary" 
      className="bg-gradient-to-b from-indigo-900 to-indigo-700"
    >
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-16">
        <div className="flex flex-col justify-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Master Crypto with AI-Powered Education
          </h1>
          <p className="mt-6 max-w-3xl text-xl">
            LearningCrypto combines AI technology with expert insights to provide personalized crypto education, portfolio tracking, and real-time market analytics.
          </p>
          <div className="mt-8 flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
            <Button 
              href="/auth/signin" 
              variant="secondary" 
              size="lg"
            >
              Get Started
            </Button>
            <Button 
              href="/about" 
              variant="outline" 
              size="lg" 
              className="text-white border-white hover:bg-white/10"
            >
              Learn More
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-center">
          <div className="relative h-64 w-full md:h-72 lg:h-96">
            <div className="absolute inset-0 rounded-lg bg-white/10 shadow-2xl"></div>
            <div className="absolute inset-2 rounded-lg bg-gradient-to-br from-indigo-200 to-indigo-400 flex items-center justify-center text-indigo-700 font-bold">
              Crypto Analytics Dashboard
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
} 