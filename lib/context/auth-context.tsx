'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { AuthService } from '@/lib/services/auth';
import type { AuthUser } from '@/types/auth';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: Error | null;
  signIn: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  signIn: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        setLoading(true);
        setError(null);
        const currentUser = await AuthService.getCurrentUser();
        if (mounted) {
          setUser(currentUser);
          console.debug('Auth initialized:', { user: currentUser ? 'exists' : 'none' });
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (mounted) {
          setError(err as Error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    // Initialize auth state
    initializeAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = AuthService.subscribeToAuthChanges(async (updatedUser) => {
      if (mounted) {
        setUser(updatedUser);
        console.debug('Auth state changed:', { user: updatedUser ? 'exists' : 'none' });
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      const { error } = await AuthService.signInWithMagicLink(email);
      if (error) throw error;
    } catch (err) {
      console.error('Sign in error:', err);
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);
      await AuthService.signOut();
      setUser(null);
    } catch (err) {
      console.error('Sign out error:', err);
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 