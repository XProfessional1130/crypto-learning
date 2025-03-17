'use client';

import { useState } from 'react';
import useSubscription from '@/lib/hooks/useSubscription';
import { useAuth } from '@/lib/hooks/useAuth'; // This would need to be created or adapted from your auth code
import Card from '../ui/Card';
import Button from '../ui/Button';

export default function SubscriptionStatus() {
  const { user } = useAuth();
  const {
    subscription,
    isLoading,
    error,
    cancelSubscription,
    reactivateSubscription,
    openCustomerPortal
  } = useSubscription(user?.id);
  
  const [actionInProgress, setActionInProgress] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Subscription Status</h3>
        <p className="text-red-600 dark:text-red-400">Error loading subscription status: {error.message}</p>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Subscription Status</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">You don't have an active subscription.</p>
        <Button
          variant="primary"
          onClick={() => window.location.href = '/membership'} // Navigate to membership page
          className="w-full"
        >
          View Membership Plans
        </Button>
      </Card>
    );
  }

  // Format dates
  const startDate = new Date(subscription.current_period_start).toLocaleDateString();
  const endDate = new Date(subscription.current_period_end).toLocaleDateString();
  
  // Handle cancel subscription
  const handleCancelSubscription = async () => {
    setActionInProgress(true);
    setActionMessage(null);
    
    const result = await cancelSubscription();
    
    setActionInProgress(false);
    setActionMessage({
      type: result.success ? 'success' : 'error',
      text: result.message
    });
  };
  
  // Handle reactivate subscription
  const handleReactivateSubscription = async () => {
    setActionInProgress(true);
    setActionMessage(null);
    
    const result = await reactivateSubscription();
    
    setActionInProgress(false);
    setActionMessage({
      type: result.success ? 'success' : 'error',
      text: result.message
    });
  };
  
  // Handle open customer portal
  const handleOpenCustomerPortal = async () => {
    setActionInProgress(true);
    setActionMessage(null);
    
    const result = await openCustomerPortal();
    
    if (result.success && result.url) {
      window.location.href = result.url;
    } else {
      setActionInProgress(false);
      setActionMessage({
        type: 'error',
        text: result.error || 'Could not open customer portal'
      });
    }
  };
  
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Subscription Status</h3>
      
      {actionMessage && (
        <div className={`mb-4 p-3 rounded-md ${
          actionMessage.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
        }`}>
          {actionMessage.text}
        </div>
      )}
      
      <div className="space-y-3 mb-5">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Plan</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {subscription.plan_id === 'monthly' ? 'Monthly' : 'Annual'} Plan
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Status</span>
          <span className={`font-medium ${
            subscription.status === 'active' 
              ? 'text-green-600 dark:text-green-400' 
              : subscription.status === 'past_due' || subscription.status === 'unpaid'
                ? 'text-red-600 dark:text-red-400'
                : 'text-yellow-600 dark:text-yellow-400'
          }`}>
            {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
            {subscription.cancel_at_period_end && ' (Cancels soon)'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Current Period</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {startDate} to {endDate}
          </span>
        </div>
      </div>
      
      <div className="space-y-3">
        {subscription.cancel_at_period_end ? (
          <Button
            variant="outline"
            onClick={handleReactivateSubscription}
            disabled={actionInProgress}
            className="w-full"
          >
            {actionInProgress ? 'Processing...' : 'Reactivate Subscription'}
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={handleCancelSubscription}
            disabled={actionInProgress}
            className="w-full"
          >
            {actionInProgress ? 'Processing...' : 'Cancel Subscription'}
          </Button>
        )}
        
        <Button
          variant="primary"
          onClick={handleOpenCustomerPortal}
          disabled={actionInProgress}
          className="w-full"
        >
          {actionInProgress ? 'Opening...' : 'Manage Billing'}
        </Button>
      </div>
    </Card>
  );
} 