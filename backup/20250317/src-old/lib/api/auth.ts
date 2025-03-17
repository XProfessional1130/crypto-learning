import { supabase } from '@/lib/supabase';
import type { AuthUser } from '@/types/auth';

export class AuthService {
  static async signInWithMagicLink(email: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }

      return { error: null };
    } catch (error) {
      console.error('Auth error:', error);
      return { error: error as Error };
    }
  }

  static async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  static async getCurrentUser(): Promise<AuthUser> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Fetch additional user data from profiles table if needed
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      return {
        ...user,
        ...profile,
      };
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }

  static async updateUserProfile(userId: string, data: Partial<AuthUser>): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          updated_at: new Date().toISOString(),
          ...data,
        });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Update profile error:', error);
      return { error: error as Error };
    }
  }

  static subscribeToAuthChanges(callback: (user: AuthUser) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        const user = await this.getCurrentUser();
        callback(user);
      } else if (event === 'SIGNED_OUT') {
        callback(null);
      }
    });
  }
} 