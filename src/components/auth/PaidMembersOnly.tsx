'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/auth/useAuth';
import usePaidFeatureAccess from '@/hooks/auth/usePaidFeatureAccess';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { supabase } from '@/lib/api/supabase';

interface PaidMembersOnlyProps {
  children: React.ReactNode;
  redirectUrl?: string;
}

/**
 * A wrapper component that restricts access to entire pages/areas to paid members only.
 * It automatically redirects non-paid users to the membership page or login page.
 */
export default function PaidMembersOnly({ 
  children, 
  redirectUrl = '/membership' 
}: PaidMembersOnlyProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const hasPaidAccess = usePaidFeatureAccess();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState<boolean>(false);
  
  // Check if user is admin
  useEffect(() => {
    async function checkIsAdmin() {
      if (!user) return false;
      
      // Check sessionStorage first to avoid unnecessary DB queries when switching tabs
      if (typeof window !== 'undefined') {
        const cachedAdminStatus = sessionStorage.getItem(`admin_status_${user.id}`);
        const cachedTimestamp = sessionStorage.getItem(`admin_status_timestamp_${user.id}`);
        
        if (cachedAdminStatus && cachedTimestamp) {
          const timestamp = parseInt(cachedTimestamp, 10);
          const now = Date.now();
          // Cache for 30 minutes
          if (now - timestamp < 30 * 60 * 1000) {
            console.log('Using cached admin status');
            setIsAdmin(cachedAdminStatus === 'true');
            setIsCheckingAdmin(false);
            return cachedAdminStatus === 'true';
          }
        }
      }
      
      setIsCheckingAdmin(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
          
        if (error) {
          console.error('Error checking admin status:', error);
          setIsCheckingAdmin(false);
          return false;
        }
        
        const adminStatus = data?.role === 'admin';
        setIsAdmin(adminStatus);
        
        // Cache the admin status in sessionStorage
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(`admin_status_${user.id}`, adminStatus.toString());
          sessionStorage.setItem(`admin_status_timestamp_${user.id}`, Date.now().toString());
        }
        
        setIsCheckingAdmin(false);
        return adminStatus;
      } catch (err) {
        console.error('Error checking admin role:', err);
        setIsCheckingAdmin(false);
        return false;
      }
    }
    
    if (user) {
      checkIsAdmin();
    } else {
      setIsCheckingAdmin(false);
    }
  }, [user]);
  
  // Log current state for debugging
  useEffect(() => {
    if (!authLoading && !isCheckingAdmin) {
      console.log('PaidMembersOnly state:', { 
        isAuthenticated: !!user,
        userId: user?.id,
        hasPaidAccess,
        isAdmin
      });
    }
  }, [user, authLoading, hasPaidAccess, isAdmin, isCheckingAdmin]);
  
  useEffect(() => {
    // Only redirect after both auth and access checks are complete
    if (!authLoading && !isCheckingAdmin) {
      // If not logged in, redirect to login with a return URL
      if (!user) {
        console.log('User not logged in, redirecting to sign in page');
        router.push(`/auth/signin?redirect=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      
      // Special case for admin email
      const isAdminByEmail = user.email === 'admin@learningcrypto.com';
      
      // If logged in but not a paid member and not admin, redirect to the membership page
      if (!hasPaidAccess && !isAdmin && !isAdminByEmail) {
        console.log('User does not have paid access and is not admin, redirecting to membership page');
        router.push(redirectUrl);
      }
    }
  }, [user, hasPaidAccess, authLoading, isCheckingAdmin, router, redirectUrl, isAdmin]);
  
  // Show loading state while checking authentication and access
  if (authLoading || isCheckingAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner size="large" text="Checking access..." />
      </div>
    );
  }
  
  // If user doesn't have paid access and is not admin, don't render children (should redirect)
  if (!hasPaidAccess && !isAdmin && user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner size="large" text="Checking access..." />
      </div>
    );
  }
  
  // Render children if user has paid access or is admin
  return <>{children}</>;
} 