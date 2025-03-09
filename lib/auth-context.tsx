'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface AuthContextProps {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      // Get session on initial load
      await getInitialSession();
      
      // Set up auth state listener
      const { data: { subscription } } = setupAuthStateChangeListener();
      
      // Cleanup subscription on unmount
      return () => {
        subscription.unsubscribe();
      };
    };
    
    initializeAuth();
  }, []);

  // Get initial session
  const getInitialSession = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (!error && data.session) {
      setSession(data.session);
      setUser(data.session.user);
    }
    setLoading(false);
  };

  // Set up auth state change listener
  const setupAuthStateChangeListener = () => {
    return supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });
  };

  // Sign in with OTP
  const signIn = async (email: string) => {
    // ALWAYS use the production URL for redirects in the magic link emails
    const redirectUrl = 'https://lc-platform.vercel.app/auth/callback';
    
    // Sign in with OTP, explicitly setting the redirect URL
    return await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
  };

  // Sign out
  const signOut = async () => {
    return await supabase.auth.signOut();
  };

  // Context value
  const value = {
    session,
    user,
    loading,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
} 