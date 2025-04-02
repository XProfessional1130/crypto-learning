import { User as SupabaseUser } from '@supabase/supabase-js';

export interface UserProfile extends SupabaseUser {
  displayName?: string;
  avatarUrl?: string;
  role?: 'user' | 'admin';
  plan_type?: 'free' | 'paid';
  preferences?: {
    emailNotifications: boolean;
    theme: 'light' | 'dark' | 'system';
  };
}

export type AuthUser = UserProfile | null;

export interface AuthContextType {
  user: AuthUser;
  signIn: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  loading: boolean;
} 