'use client';

import { useState, useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import Button from '../ui/Button';
import useSubscription from '@/lib/hooks/useSubscription';
import { Dialog } from '@headlessui/react';
import { AnimatePresence, motion } from 'framer-motion';

interface AccountModalProps {
  user: User | null;
  onSignOut: () => Promise<void>;
  isOpen: boolean;
  onClose: () => void;
}

export default function AccountModal({ user, onSignOut, isOpen, onClose }: AccountModalProps) {
  const [actionInProgress, setActionInProgress] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);
  const [showPlanChangeConfirm, setShowPlanChangeConfirm] = useState(false);
  const [targetPlan, setTargetPlan] = useState<'monthly' | 'yearly' | null>(null);
  const initialFocusRef = useRef<HTMLDivElement>(null);

  const {
    subscription,
    isLoading: isLoadingSubscription,
    error: subscriptionError,
    cancelSubscription,
    reactivateSubscription,
    openCustomerPortal,
    changeBillingPlan,
    setSubscription,
    refreshSubscription
  } = useSubscription(user?.id);

  // Close modal when escape key is pressed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      // Prevent scrolling when modal is open
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Format dates for subscription
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    
    // Format as Month Day, Year (e.g., "February 15, 2023")
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Helper to get subscription property values, handling both snake_case and camelCase
  const getSubscriptionValue = (propertyName: string) => {
    if (!subscription) return null;
    
    // Check for camelCase first, then snake_case
    const camelCaseKey = propertyName;
    const snakeCaseKey = propertyName.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    
    // @ts-ignore - Dynamic property access
    return subscription[camelCaseKey] !== undefined ? subscription[camelCaseKey] : subscription[snakeCaseKey];
  };

  // Helper to get plan name
  const getPlanName = () => {
    const planId = getSubscriptionValue('planId') || getSubscriptionValue('plan_id');
    if (!planId) return 'Unknown Plan';
    return planId.toString() === 'monthly' ? 'Monthly' : 'Annual';
  };

  // Helper to get current plan ID
  const getCurrentPlanId = (): 'monthly' | 'yearly' | null => {
    const planId = getSubscriptionValue('planId') || getSubscriptionValue('plan_id');
    if (!planId) return null;
    return planId.toString() === 'monthly' ? 'monthly' : 'yearly';
  };

  // Helper to check if subscription is canceling
  const isSubscriptionCanceling = () => {
    return getSubscriptionValue('cancelAtPeriodEnd') || getSubscriptionValue('cancel_at_period_end');
  };

  // Helper to check if subscription is fully canceled (already ended)
  const isSubscriptionFullyCanceled = () => {
    return (getSubscriptionValue('status') === 'canceled');
  };

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

  // Handle initiating plan change
  const handleInitiatePlanChange = (newPlanId: 'monthly' | 'yearly') => {
    if (newPlanId === getCurrentPlanId()) {
      setActionMessage({
        type: 'info',
        text: `You're already on the ${newPlanId === 'monthly' ? 'Monthly' : 'Annual'} plan.`
      });
      return;
    }

    // Set the target plan and show confirmation dialog
    setTargetPlan(newPlanId);
    setShowPlanChangeConfirm(true);
  };

  // Handle confirming plan change
  const handleConfirmPlanChange = async () => {
    if (!targetPlan) return;
    
    setShowPlanChangeConfirm(false);
    setActionInProgress(true);
    setActionMessage(null);
    
    const result = await changeBillingPlan(targetPlan);
    
    setActionInProgress(false);
    setActionMessage({
      type: result.success ? 'success' : 'error',
      text: result.message
    });
    
    setTargetPlan(null);
  };

  // Handle subscribing again after cancellation
  const handleSubscribeAgain = async (planId: 'monthly' | 'yearly' = 'monthly') => {
    if (!user?.email) return;
    
    setActionInProgress(true);
    setActionMessage(null);
    
    try {
      // Create checkout session with user email pre-filled
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          email: user.email,
          userId: user.id,
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create checkout session');
      }
      
      // Redirect to checkout URL
      if (result.url) {
        window.location.href = result.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      console.error('Error creating checkout session:', err);
      setActionInProgress(false);
      setActionMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to create checkout session'
      });
    }
  };

  // Get formatted renewal date
  const getRenewalDate = () => {
    const periodEnd = getSubscriptionValue('currentPeriodEnd') || getSubscriptionValue('current_period_end');
    if (!periodEnd) return 'Unknown';
    return formatDate(periodEnd as string);
  };
  
  // Update subscription dates from Stripe
  const handleUpdateDates = async () => {
    if (!user?.id || !subscription) return;
    
    const subscriptionId = getSubscriptionValue('stripeSubscriptionId') || getSubscriptionValue('stripe_subscription_id');
    if (!subscriptionId) return;
    
    setActionInProgress(true);
    setActionMessage(null);
    
    try {
      const response = await fetch('/api/stripe/manage-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update_dates',
          subscriptionId,
          userId: user.id,
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update subscription dates');
      }
      
      // Update subscription with new dates
      setSubscription(prev => {
        if (!prev) return null;
        return {
          ...prev,
          current_period_start: result.currentPeriodStart,
          currentPeriodStart: result.currentPeriodStart,
          current_period_end: result.currentPeriodEnd,
          currentPeriodEnd: result.currentPeriodEnd
        };
      });
      
      setActionMessage({
        type: 'success',
        text: 'Subscription information updated successfully'
      });
    } catch (err) {
      console.error('Error updating subscription dates:', err);
      setActionMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update subscription information'
      });
    } finally {
      setActionInProgress(false);
    }
  };

  // Add a handler for refreshing subscription
  const handleRefreshSubscription = () => {
    setActionInProgress(true);
    refreshSubscription().then(() => {
      setActionInProgress(false);
      setActionMessage({
        type: 'success',
        text: 'Subscription information refreshed'
      });
    });
  };

  if (!isOpen) return null;

  // Fade-in animation settings
  const fadeInAnimation = {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 10 },
    transition: { duration: 0.2 }
  };

  // Slide-up settings for the confirmation dialog
  const slideUpAnimation = {
    initial: { opacity: 0, y: 50 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 50 },
    transition: { duration: 0.2 }
  };

  return (
    <Dialog 
      as="div" 
      className="fixed inset-0 z-50 overflow-y-auto" 
      initialFocus={initialFocusRef}
      open={isOpen} 
      onClose={onClose}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 backdrop-blur-lg bg-black/20 dark:bg-black/40" aria-hidden="true" />
      
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl transition-all relative">
          {/* Subtle gradient accents */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-40 -right-20 w-80 h-80 bg-gradient-to-br from-brand-50/40 to-transparent dark:from-brand-900/10 dark:to-transparent rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-20 w-80 h-80 bg-gradient-to-tr from-blue-50/40 to-transparent dark:from-blue-900/10 dark:to-transparent rounded-full blur-3xl" />
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-200/30 dark:via-brand-500/20 to-transparent" />
          </div>
          
          {/* Header with close button */}
          <div className="flex justify-between items-center mb-6 relative">
            <Dialog.Title as="h3" className="text-xl font-semibold text-gray-900 dark:text-white">
              Account
            </Dialog.Title>
            <button
              className="p-1.5 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={onClose}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div ref={initialFocusRef}>
            <AnimatePresence mode="wait">
              {actionMessage && (
                <motion.div 
                  key="action-message"
                  className={`mb-5 p-3 rounded-lg text-sm ${
                    actionMessage.type === 'success' 
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' 
                      : actionMessage.type === 'error'
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                        : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                  }`}
                  {...fadeInAnimation}
                >
                  <div className="flex gap-2 items-start">
                    {actionMessage.type === 'success' && (
                      <svg className="h-5 w-5 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                    {actionMessage.type === 'error' && (
                      <svg className="h-5 w-5 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    )}
                    {actionMessage.type === 'info' && (
                      <svg className="h-5 w-5 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 01-1-1v-4a1 1 0 112 0v4a1 1 0 01-1 1z" clipRule="evenodd" />
                      </svg>
                    )}
                    <div>{actionMessage.text}</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* User Profile Section */}
            <motion.div 
              className="mb-6 flex items-center"
              {...fadeInAnimation}
            >
              <div className="flex-shrink-0 w-14 h-14 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-full flex items-center justify-center mr-4">
                <span className="text-xl font-medium">
                  {user?.email ? user.email.charAt(0).toUpperCase() : '?'}
                </span>
              </div>
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                  {user?.email?.split('@')[0]}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user?.email}
                </p>
              </div>
            </motion.div>

            <div className="space-y-6">
              {/* Subscription Status */}
              <motion.div {...fadeInAnimation}>
                {isLoadingSubscription ? (
                  <div className="space-y-3 animate-pulse">
                    <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
                    <div className="h-24 bg-gray-200 dark:bg-gray-800 rounded"></div>
                  </div>
                ) : subscriptionError ? (
                  <div className="py-4 px-5 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400">
                    <p>Error loading subscription: {subscriptionError.message}</p>
                  </div>
                ) : !subscription ? (
                  <div className="text-center py-6 px-5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-black/20">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Subscription</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-xs mx-auto">
                      You don't have an active subscription yet. Subscribe to unlock premium features.
                    </p>
                    <Button
                      variant="primary"
                      href="/membership"
                      className="w-full"
                    >
                      View Plans
                    </Button>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-md font-medium text-gray-700 dark:text-gray-300">Subscription</h4>
                      <button
                        onClick={handleRefreshSubscription}
                        disabled={actionInProgress || isLoadingSubscription}
                        className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 transition-colors flex items-center"
                      >
                        <svg
                          className={`h-4 w-4 mr-1 ${actionInProgress ? 'animate-spin' : ''}`}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
                        </svg>
                        {actionInProgress ? 'Refreshing...' : 'Refresh'}
                      </button>
                    </div>
                    <div className="rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm border border-gray-200/70 dark:border-gray-700/30">
                      {/* Plan Details Card */}
                      <div className="px-5 py-4 border-b border-gray-200/70 dark:border-gray-700/30">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 dark:text-gray-400 text-sm">Plan</span>
                          <div className="flex items-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              getCurrentPlanId() === 'yearly' 
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                            }`}>
                              {getPlanName()}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Status */}
                      <div className="px-5 py-4 border-b border-gray-200/70 dark:border-gray-700/30">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 dark:text-gray-400 text-sm">Status</span>
                          <div className="flex flex-col items-end">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              getSubscriptionValue('status') === 'active' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                                : getSubscriptionValue('status') === 'past_due' || getSubscriptionValue('status') === 'unpaid'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                  : getSubscriptionValue('status') === 'canceled'
                                    ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                            }`}>
                              {(getSubscriptionValue('status') as string)?.charAt(0).toUpperCase() + (getSubscriptionValue('status') as string)?.slice(1)}
                            </span>
                            {isSubscriptionCanceling() && !isSubscriptionFullyCanceled() && (
                              <span className="text-xs mt-1 text-red-500 dark:text-red-400 font-medium">
                                Canceled - ends {getRenewalDate()}
                              </span>
                            )}
                            {isSubscriptionFullyCanceled() && (
                              <span className="text-xs mt-1 text-gray-500 dark:text-gray-400 font-medium">
                                Your subscription has ended
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Renewal date */}
                      <div className="px-5 py-4 border-b border-gray-200/70 dark:border-gray-700/30">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 dark:text-gray-400 text-sm">Renews On</span>
                          <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                            {isSubscriptionFullyCanceled() ? (
                              'No renewal - subscription ended'
                            ) : isSubscriptionCanceling() ? (
                              'Will not renew'
                            ) : (
                              getRenewalDate() === 'Unknown' ? (
                                <button 
                                  onClick={handleUpdateDates} 
                                  className="text-brand-600 dark:text-brand-400 hover:underline hover:text-brand-800 dark:hover:text-brand-300 font-medium transition-colors"
                                  disabled={actionInProgress}
                                >
                                  {actionInProgress ? 'Updating...' : 'Update dates'}
                                </button>
                              ) : getRenewalDate()
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Plan switching toggle */}
                      {!isSubscriptionCanceling() && !isSubscriptionFullyCanceled() && (
                        <div className="px-5 py-4">
                          <div className="mb-2">
                            <span className="text-gray-500 dark:text-gray-400 text-sm">Billing Cycle</span>
                          </div>
                          <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-lg">
                            <button
                              className={`flex-1 py-2 px-4 text-sm rounded-md transition-colors ${
                                getCurrentPlanId() === 'monthly'
                                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                              }`}
                              onClick={() => handleInitiatePlanChange('monthly')}
                              disabled={actionInProgress}
                            >
                              Monthly
                            </button>
                            <button
                              className={`flex-1 py-2 px-4 text-sm rounded-md transition-colors ${
                                getCurrentPlanId() === 'yearly'
                                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                              }`}
                              onClick={() => handleInitiatePlanChange('yearly')}
                              disabled={actionInProgress}
                            >
                              Annual
                              <span className="ml-1 text-xs font-medium text-green-600 dark:text-green-400">Save 20%</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Subscription Actions */}
                    <div className="mt-4 space-y-3">
                      {isSubscriptionFullyCanceled() ? (
                        <>
                          <div className="mb-2">
                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                              Your subscription has ended. Choose a plan to subscribe again:
                            </p>
                            <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-lg mb-2">
                              <button
                                className={`flex-1 py-2 px-4 text-sm rounded-md transition-colors ${
                                  targetPlan === 'monthly' || !targetPlan
                                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                                onClick={() => setTargetPlan('monthly')}
                                disabled={actionInProgress}
                              >
                                Monthly
                              </button>
                              <button
                                className={`flex-1 py-2 px-4 text-sm rounded-md transition-colors ${
                                  targetPlan === 'yearly'
                                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                                onClick={() => setTargetPlan('yearly')}
                                disabled={actionInProgress}
                              >
                                Annual
                                <span className="ml-1 text-xs font-medium text-green-600 dark:text-green-400">Save 20%</span>
                              </button>
                            </div>
                          </div>
                          <Button
                            variant="primary"
                            onClick={() => handleSubscribeAgain(targetPlan || 'monthly')}
                            disabled={actionInProgress}
                            className="w-full py-2.5"
                          >
                            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 5v14M5 12h14"></path>
                            </svg>
                            {actionInProgress ? 'Processing...' : 'Subscribe Again'}
                          </Button>
                        </>
                      ) : isSubscriptionCanceling() ? (
                        <Button
                          variant="outline"
                          onClick={handleReactivateSubscription}
                          disabled={actionInProgress}
                          className="w-full py-2.5"
                        >
                          <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                          </svg>
                          {actionInProgress ? 'Processing...' : 'Reactivate Subscription'}
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={handleCancelSubscription}
                          disabled={actionInProgress}
                          className="w-full py-2.5 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border-red-300 dark:border-red-700 hover:border-red-400 dark:hover:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="9" y1="9" x2="15" y2="15"></line>
                            <line x1="15" y1="9" x2="9" y2="15"></line>
                          </svg>
                          {actionInProgress ? 'Processing...' : 'Cancel Subscription'}
                        </Button>
                      )}
                      
                      <Button
                        variant="glass"
                        onClick={handleOpenCustomerPortal}
                        disabled={actionInProgress}
                        className="w-full py-2.5"
                      >
                        <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <path d="M12 6v6l4 2"></path>
                        </svg>
                        {actionInProgress ? 'Opening...' : 'Billing History'}
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
            
            {/* Sign Out Button */}
            <motion.div 
              className="mt-8 pt-4 border-t border-gray-200/50 dark:border-white/10"
              {...fadeInAnimation}
            >
              <Button
                variant="glass"
                size="lg"
                onClick={onSignOut}
                className="w-full justify-center bg-gray-100/80 dark:bg-white/5 border-gray-200/80 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/10"
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Sign out
              </Button>
            </motion.div>
          </div>
        </Dialog.Panel>
      </div>

      {/* Plan Change Confirmation Dialog */}
      <AnimatePresence>
        {showPlanChangeConfirm && (
          <Dialog 
            as="div"
            className="fixed inset-0 z-50 overflow-y-auto" 
            static
            open={showPlanChangeConfirm} 
            onClose={() => setShowPlanChangeConfirm(false)}
          >
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
            
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <motion.div
                {...slideUpAnimation}
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Confirm Plan Change
                  </Dialog.Title>
                  
                  <div className="mb-6">
                    {targetPlan === 'yearly' ? (
                      <p className="text-gray-600 dark:text-gray-300 mb-2">
                        You're about to switch to the <span className="font-semibold">Annual</span> plan. You'll be charged immediately for the new annual plan, with credit for the remaining time on your current plan.
                      </p>
                    ) : (
                      <p className="text-gray-600 dark:text-gray-300 mb-2">
                        You're about to switch to the <span className="font-semibold">Monthly</span> plan. Your annual subscription will be replaced by a monthly one, effective immediately.
                      </p>
                    )}
                    
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-amber-800 dark:text-amber-300 text-sm mt-4">
                      <div className="flex">
                        <svg className="h-5 w-5 text-amber-500 dark:text-amber-400 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v4a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span>This will take effect immediately and your card will be charged for the prorated difference.</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button
                      variant="glass"
                      onClick={() => setShowPlanChangeConfirm(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleConfirmPlanChange}
                      className="flex-1"
                    >
                      Confirm Change
                    </Button>
                  </div>
                </Dialog.Panel>
              </motion.div>
            </div>
          </Dialog>
        )}
      </AnimatePresence>
    </Dialog>
  );
} 