'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { AuthService } from '@/lib/services/auth';
import type { AuthContextType, AuthUser } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial user check
    AuthService.getCurrentUser().then(user => {
      setUser(user);
      setLoading(false);
    });

    // Subscribe to auth changes
    const { data: { subscription } } = AuthService.subscribeToAuthChanges(
      (user) => setUser(user)
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email: string) => {
    return AuthService.signInWithMagicLink(email);
  };

  const signOut = async () => {
    await AuthService.signOut();
    setUser(null);
  };

  const value = {
    user,
    signIn,
    signOut,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 