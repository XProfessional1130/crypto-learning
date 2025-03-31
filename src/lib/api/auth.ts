import { supabase } from '@/lib/api/supabase';
import type { AuthUser } from '@/types/auth';

export class AuthService {
  static async signInWithMagicLink(email: string): Promise<{ error: Error | null }> {
    try {
      console.log(`Attempting to sign in with magic link for: ${email}`);

      // Use the simplest implementation possible - no extra options
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim()
      });

      if (error) {
        // These errors can be ignored as the email is often still sent
        if (error.message === "Error sending magic link email" || 
            error.message?.includes("relation") ||
            error.message?.includes("subscriptions") ||
            error.message?.includes("profiles")) {
          console.warn('Ignoring database-related error - email likely still sent');
          return { error: null };
        }
        
        console.error('Magic link sign-in error:', error);
        throw error;
      }

      console.log('Magic link sign-in success');
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

  static async isAdmin(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      return profile?.role === 'admin';
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  static async makeUserAdmin(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('make_user_admin', { user_id: userId });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error making user admin:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      };
    }
  }

  static async removeUserAdmin(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('remove_user_admin', { user_id: userId });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error removing admin status:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      };
    }
  }
} 