import { useState, useEffect, useCallback } from 'react';
import supabase from '@/lib/api/supabase-client';

interface Subscription {
  id: string;
  user_id?: string;
  userId?: string;  // Add camelCase variant
  stripe_customer_id?: string;
  stripeCustomerId?: string;  // Add camelCase variant
  stripe_subscription_id?: string;
  stripeSubscriptionId?: string;  // Add camelCase variant
  plan_id?: string;
  planId?: string;  // Add camelCase variant
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'unpaid';
  current_period_start?: string;
  currentPeriodStart?: string;  // Add camelCase variant
  current_period_end?: string;
  currentPeriodEnd?: string;  // Add camelCase variant
  cancel_at_period_end?: boolean;
  cancelAtPeriodEnd?: boolean;  // Add camelCase variant
  customer_email?: string;
  customerEmail?: string;  // Add camelCase variant
}

interface UseSubscriptionReturn {
  subscription: Subscription | null;
  isLoading: boolean;
  error: Error | null;
  setSubscription: React.Dispatch<React.SetStateAction<Subscription | null>>;
  refreshSubscription: () => Promise<void>;
  cancelSubscription: () => Promise<{ success: boolean; message: string }>;
  reactivateSubscription: () => Promise<{ success: boolean; message: string }>;
  openCustomerPortal: () => Promise<{ success: boolean; url?: string; error?: string }>;
  changeBillingPlan: (newPlanId: 'monthly' | 'yearly') => Promise<{ success: boolean; message: string; planId?: string; error?: string }>;
}

export default function useSubscription(userId?: string): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Function to fetch subscription data
  const fetchSubscription = useCallback(async () => {
    if (!userId) {
      return;
    }

    setError(null);

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        // Just log the error and throw it for error handling
        console.error('Supabase error details:', error);
        throw error;
      }
      
      // Debug log to inspect what data is being returned from Supabase
      console.log('Subscription data from Supabase:', data ? 'Found' : 'Not found');
      
      setSubscription(data);
    } catch (err) {
      console.error('Error fetching subscription:', err);
      // Simplify error handling - just set the error state
      setError(err instanceof Error ? err : new Error('Failed to load subscription'));
    }
  }, [userId]);

  // Function to refresh subscription data
  const refreshSubscription = useCallback(async () => {
    setIsLoading(true);
    
    // If we have a subscription, try to sync it with Stripe first
    if (userId && subscription?.stripe_subscription_id) {
      try {
        const response = await fetch('/api/stripe/sync-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscriptionId: subscription.stripe_subscription_id,
            userId,
          }),
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('Subscription synced with Stripe:', result);
        }
      } catch (err) {
        console.error('Error syncing subscription with Stripe:', err);
      }
    }
    
    // Then fetch the latest data from the database
    await fetchSubscription();
    setIsLoading(false);
  }, [fetchSubscription, userId, subscription?.stripe_subscription_id]);

  // Fetch subscription data when component mounts or userId changes
  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    refreshSubscription();

    // Set up a polling interval to check for subscription changes
    // This helps catch changes made outside the app (like in Stripe dashboard)
    const intervalId = setInterval(() => {
      fetchSubscription();
    }, 60000); // Check every minute

    return () => {
      clearInterval(intervalId);
    };
  }, [userId, refreshSubscription, fetchSubscription]);

  // Helper function to get the subscription ID, handling both snake_case and camelCase
  const getSubscriptionId = (sub: Subscription) => {
    return sub.stripe_subscription_id || sub.stripeSubscriptionId;
  };

  // Function to cancel subscription
  const cancelSubscription = async (): Promise<{ success: boolean; message: string }> => {
    if (!userId || !subscription) {
      return { success: false, message: 'No active subscription found' };
    }

    const subscriptionId = getSubscriptionId(subscription);
    
    if (!subscriptionId) {
      return { success: false, message: 'No valid subscription ID found' };
    }

    try {
      const response = await fetch('/api/stripe/manage-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'cancel',
          subscriptionId,
          userId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to cancel subscription');
      }

      // Update local state - handle both camelCase and snake_case properties
      setSubscription((prev) => {
        if (!prev) return null;
        return { 
          ...prev, 
          cancel_at_period_end: true,
          cancelAtPeriodEnd: true
        };
      });

      return { success: true, message: result.message };
    } catch (err) {
      console.error('Error canceling subscription:', err);
      return { 
        success: false, 
        message: err instanceof Error ? err.message : 'An unknown error occurred'
      };
    }
  };

  // Function to reactivate a canceled subscription
  const reactivateSubscription = async (): Promise<{ success: boolean; message: string }> => {
    if (!userId || !subscription) {
      return { success: false, message: 'No active subscription found' };
    }

    const subscriptionId = getSubscriptionId(subscription);
    
    if (!subscriptionId) {
      return { success: false, message: 'No valid subscription ID found' };
    }

    try {
      const response = await fetch('/api/stripe/manage-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reactivate',
          subscriptionId,
          userId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reactivate subscription');
      }

      // Update local state - handle both camelCase and snake_case properties
      setSubscription((prev) => {
        if (!prev) return null;
        return { 
          ...prev, 
          cancel_at_period_end: false,
          cancelAtPeriodEnd: false 
        };
      });

      return { success: true, message: result.message };
    } catch (err) {
      console.error('Error reactivating subscription:', err);
      return { 
        success: false, 
        message: err instanceof Error ? err.message : 'An unknown error occurred'
      };
    }
  };

  // Function to open Stripe Customer Portal
  const openCustomerPortal = async (): Promise<{ success: boolean, url?: string, error?: string }> => {
    if (!userId || !subscription) {
      return { success: false, error: 'No active subscription found' };
    }

    const subscriptionId = getSubscriptionId(subscription);
    
    if (!subscriptionId) {
      return { success: false, error: 'No valid subscription ID found' };
    }

    try {
      const response = await fetch('/api/stripe/manage-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'customer_portal',
          subscriptionId,
          userId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to open customer portal');
      }

      return { success: true, url: result.url };
    } catch (err) {
      console.error('Error opening customer portal:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'An unknown error occurred'
      };
    }
  };

  // Function to change billing plan between monthly and yearly
  const changeBillingPlan = async (newPlanId: 'monthly' | 'yearly'): Promise<{ success: boolean; message: string; planId?: string; error?: string }> => {
    if (!userId || !subscription) {
      return { success: false, message: 'No active subscription found', error: 'No active subscription found' };
    }

    const subscriptionId = subscription.id;
    
    if (!subscriptionId) {
      return { success: false, message: 'No valid subscription ID found', error: 'No valid subscription ID found' };
    }

    try {
      const response = await fetch('/api/subscription/change-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId,
          newPlanId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to change subscription plan');
      }

      // Update local state with the new plan
      setSubscription((prev) => {
        if (!prev) return null;
        return { 
          ...prev, 
          plan_id: result.planId,
          planId: result.planId,
          current_period_start: result.currentPeriodStart,
          currentPeriodStart: result.currentPeriodStart,
          current_period_end: result.currentPeriodEnd,
          currentPeriodEnd: result.currentPeriodEnd
        };
      });

      return { 
        success: true, 
        message: result.message,
        planId: result.planId
      };
    } catch (err) {
      console.error('Error changing billing plan:', err);
      return { 
        success: false, 
        message: err instanceof Error ? err.message : 'An unknown error occurred',
        error: err instanceof Error ? err.message : 'An unknown error occurred'
      };
    }
  };

  return {
    subscription,
    isLoading,
    error,
    setSubscription,
    refreshSubscription,
    cancelSubscription,
    reactivateSubscription,
    openCustomerPortal,
    changeBillingPlan
  };
} 