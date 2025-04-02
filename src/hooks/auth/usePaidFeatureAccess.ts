import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/auth/useAuth';
import { supabase } from '@/lib/api/supabase';

/**
 * Hook to check if a user has access to paid features
 * @returns {boolean} True if user has access to paid features
 */
export function usePaidFeatureAccess(): boolean {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean>(false);

  useEffect(() => {
    async function checkAccess() {
      if (!user) {
        setHasAccess(false);
        return;
      }

      // Check sessionStorage first to avoid unnecessary DB queries when switching tabs
      if (typeof window !== 'undefined') {
        const cachedAccessStatus = sessionStorage.getItem(`paid_access_${user.id}`);
        const cachedTimestamp = sessionStorage.getItem(`paid_access_timestamp_${user.id}`);
        
        if (cachedAccessStatus && cachedTimestamp) {
          const timestamp = parseInt(cachedTimestamp, 10);
          const now = Date.now();
          // Cache for 15 minutes
          if (now - timestamp < 15 * 60 * 1000) {
            console.log('Using cached paid access status');
            setHasAccess(cachedAccessStatus === 'true');
            return;
          }
        }
      }

      // Immediate debug output of the current user
      console.log('Checking paid access for user:', user.id);

      try {
        // Check profile to get role and plan_type in one query
        const { data, error } = await supabase
          .from('profiles')
          .select('id, role, plan_type')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('Error checking plan type:', error);
          // Check for "not found" profile error
          if (error.code === 'PGRST116' && error.details === 'The result contains 0 rows') {
            console.log('No profile found for user, creating default profile...');
            // Consider creating a default profile here or handle this case appropriately
            setHasAccess(false);
          } else {
            setHasAccess(false);
          }
          return;
        }
        
        // Debug the data returned from the database
        console.log('Profile data retrieved:', data);
        
        // Check if user is an admin - this should grant access regardless of plan_type
        const isAdmin = data?.role === 'admin';
        
        // Check if user has a paid plan
        const hasPaidPlan = data?.plan_type === 'paid';
        
        // Special case for admin email
        const isAdminByEmail = user.email === 'admin@learningcrypto.com';
        
        // Grant access if any condition is met
        const shouldHaveAccess = isAdmin || hasPaidPlan || isAdminByEmail;
        console.log(`Access evaluation: isAdmin=${isAdmin}, hasPaidPlan=${hasPaidPlan}, isAdminByEmail=${isAdminByEmail}, final=${shouldHaveAccess}`);
        
        // Cache the access status in sessionStorage
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(`paid_access_${user.id}`, shouldHaveAccess.toString());
          sessionStorage.setItem(`paid_access_timestamp_${user.id}`, Date.now().toString());
        }
        
        setHasAccess(shouldHaveAccess);
      } catch (err) {
        console.error('Unexpected error in usePaidFeatureAccess:', err);
        setHasAccess(false);
      }
    }

    checkAccess();
  }, [user]);

  return hasAccess;
}

export default usePaidFeatureAccess; 