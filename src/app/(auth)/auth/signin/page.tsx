'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/providers/auth-provider';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/api/supabase';
import { signInWithEmail } from '@/lib/api/supabase-client';

// Define types for our particles
interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
}

export default function SignIn() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [formShown, setFormShown] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const router = useRouter();

  // Create floating particles effect
  useEffect(() => {
    // Generate random particles
    const newParticles: Particle[] = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 6 + 2,
      duration: Math.random() * 15 + 10,
      delay: Math.random() * 5
    }));
    setParticles(newParticles);
    
    // Animate form entrance after particles
    const timer = setTimeout(() => setFormShown(true), 400);
    
    // Check for URL parameters
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      
      // Check for error parameter
      const error = url.searchParams.get('error');
      const errorMessage = url.searchParams.get('message');
      
      if (error) {
        console.log('Error from URL:', error, errorMessage);
        
        if (errorMessage) {
          // Show the specific error message from the URL
          setMessage(`Error: ${decodeURIComponent(errorMessage)}`);
        } else if (error === 'expired') {
          setMessage('Error: Magic link has expired. Please try again.');
        } else if (error === 'invalid') {
          setMessage('Error: Invalid authentication. Please try again.');
        } else if (error === 'failed') {
          setMessage('Error: Authentication failed. Please try again.');
        } else if (error === 'auth') {
          setMessage('Error: Authentication failed. Please try again.');
        } else if (error === 'auth_failed') {
          setMessage('Error: Authentication failed. Please try again.');
        } else if (error === 'unexpected') {
          setMessage('Error: An unexpected error occurred. Please try again.');
        } else {
          setMessage('Error: Please try signing in again.');
        }
      }
      
      // Store redirect URL if present
      const redirect = url.searchParams.get('redirect');
      if (redirect) {
        console.log('Redirect URL found:', redirect);
        // Store in localStorage to use after sign-in
        localStorage.setItem('authRedirectUrl', redirect);
      }
    }
    
    return () => clearTimeout(timer);
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Basic email validation
    if (!email.trim() || !email.includes('@') || !email.includes('.')) {
      setMessage('Error: Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      // Use our improved sign-in helper
      const result = await signInWithEmail(email.trim());
      
      if (result.success) {
        setMessage(`${result.message} ✨`);
        setEmail('');
      } else {
        setMessage(`Error: ${result.message}`);
      }
    } catch (error: any) {
      setMessage('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-start justify-center pt-16 sm:pt-24 p-4 overflow-hidden">
      {/* Animated background particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-brand-200 dark:bg-brand-500/30"
          initial={{ 
            left: `${particle.x}%`, 
            top: `${particle.y}%`, 
            width: particle.size, 
            height: particle.size, 
            opacity: 0 
          }}
          animate={{ 
            opacity: [0, 0.3, 0], 
            y: [0, -30, -60], 
            x: [0, Math.random() * 20 - 10]
          }}
          transition={{ 
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut" 
          }}
        />
      ))}

      {/* Glassmorphic container with blur effect that grows on load */}
      <motion.div 
        className="neo-glass relative overflow-hidden w-full max-w-md rounded-2xl shadow-glass-strong border border-white/20 dark:border-white/10 backdrop-blur-xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Prismatic edge with shimmer effect */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden">
          <div className="absolute -inset-[1px] bg-gradient-to-tr from-brand-200/30 via-white/40 to-brand-300/30 dark:from-brand-500/20 dark:via-white/10 dark:to-brand-300/20 opacity-70 prism-edge shimmer"></div>
        </div>

        {/* Soft inner glow */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden shadow-glass-inner"></div>

        {/* Content container */}
        <div className="relative z-10 p-8 md:p-10">
          {/* Logo animation */}
          <motion.div 
            className="flex flex-col items-center mb-6"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Full logo display without circular container */}
            <div className="relative mb-4">
              {/* Light/Dark theme switching logos */}
              <div className="flex items-center justify-center">
                {/* Light theme logo (green) - visible in light mode, hidden in dark mode */}
                <div className="block dark:hidden">
                  <Image 
                    src="/logos/logo-green.png" 
                    alt="Learning Crypto Logo" 
                    width={200} 
                    height={80}
                    priority
                  />
                </div>
                {/* Dark theme logo (white) - hidden in light mode, visible in dark mode */}
                <div className="hidden dark:block">
                  <Image 
                    src="/logos/logo-white.png" 
                    alt="Learning Crypto Logo" 
                    width={200} 
                    height={80}
                    priority
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Direct magic link fix - shown only when an email has been sent */}
          {message && message.includes('Magic link sent!') && (
            <motion.div
              className="mb-6 p-4 bg-brand-50 dark:bg-brand-900/20 rounded-lg border border-brand-200 dark:border-brand-800"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-lg font-semibold text-brand-700 dark:text-brand-300 mb-2">Trouble with the magic link?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                If you've received the email but the magic link isn't working, you can try these options:
              </p>
              <div className="space-y-2">
                <button 
                  onClick={async () => {
                    // Try checking for a session directly
                    const { data } = await supabase.auth.getSession();
                    if (data?.session) {
                      router.push('/dashboard');
                    } else {
                      setMessage('No active session found. Please try a different option.');
                    }
                  }}
                  className="w-full py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-md transition-colors"
                >
                  Check Session Status
                </button>
                <button 
                  onClick={() => router.push('/dashboard')}
                  className="w-full py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-md transition-colors"
                >
                  Go to Dashboard Directly
                </button>
              </div>
            </motion.div>
          )}

          {/* Sign-in form with staggered animation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: formShown ? 1 : 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <motion.h2 
              className="text-xl font-semibold text-center mb-2"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              Welcome Back
            </motion.h2>
            
            <motion.p 
              className="text-center text-light-text-secondary dark:text-dark-text-secondary mb-6"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              We'll send you a magical link to sign in ✨
            </motion.p>
            
            <motion.form 
              onSubmit={handleSignIn}
              className="space-y-6"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <div className="relative">
                <motion.div 
                  className={`absolute inset-0 rounded-lg transition-all duration-300 ${inputFocused ? 'bg-brand-primary/10 shadow-[0_0_0_2px] shadow-brand-primary/30' : 'bg-transparent'}`}
                  layoutId="input-highlight"
                />
                <label 
                  htmlFor="email" 
                  className={`block text-sm font-medium mb-2 transition-all duration-300 ${inputFocused ? 'text-brand-primary dark:text-brand-light' : 'text-light-text-secondary dark:text-dark-text-secondary'}`}
                >
                  Email address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="w-full px-4 py-3 rounded-lg transition-colors duration-300 outline-none relative bg-white/40 dark:bg-dark-bg-secondary/30 border border-white/20 dark:border-white/10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    placeholder="you@example.com"
                  />
                  {/* Subtle email icon */}
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary opacity-60">
                    ✉️
                  </div>
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                className="relative w-full py-3 px-4 rounded-lg overflow-hidden group"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {/* Button background with animation */}
                <div className="absolute inset-0 bg-gradient-to-r from-brand-primary to-brand-500 rounded-lg" />
                
                {/* Shimmer effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-all duration-700 ease-in-out rounded-lg" />
                
                {/* Button text */}
                <span className="relative text-white font-medium">
                  {loading ? (
                    <motion.span 
                      className="flex items-center justify-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending magic link...
                    </motion.span>
                  ) : (
                    <span>Continue with Email ✨</span>
                  )}
                </span>
              </motion.button>

              {message && (
                <motion.div 
                  className={`text-sm py-2 px-3 rounded-lg ${message.includes('Error') ? 'bg-red-100/80 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100/80 text-green-600 dark:bg-green-900/30 dark:text-green-400'}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {message}
                </motion.div>
              )}
            </motion.form>

            <motion.div 
              className="mt-8 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                Don't have an account? <span className="text-brand-primary dark:text-brand-light">The magic link will create one</span>
              </p>
            </motion.div>
            
            <motion.div 
              className="mt-6 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
            >
              <Link 
                href="/" 
                className="inline-flex items-center text-sm text-brand-primary hover:text-brand-400 dark:text-brand-light dark:hover:text-brand-300 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Return to home
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
} 