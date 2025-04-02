'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { XCircle, Loader2, Mail, CreditCard, X, CheckCircle, AlertCircle, Package, HelpCircle } from 'lucide-react';
import { useAuth } from '@/lib/providers/auth-provider';

interface AddSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddSubscriptionModal({ isOpen, onClose, onSuccess }: AddSubscriptionModalProps) {
  const [email, setEmail] = useState('');
  const [planId, setPlanId] = useState('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [step, setStep] = useState<'email' | 'plan' | 'confirm'>('email');
  
  const supabase = createClientComponentClient();
  const { user: authUser } = useAuth();
  
  // Reset form state
  const resetForm = () => {
    setEmail('');
    setPlanId('monthly');
    setError(null);
    setMessage(null);
    setStep('email');
  };
  
  // Close modal and reset
  const handleClose = () => {
    resetForm();
    onClose();
  };
  
  // Go to next step
  const goToNextStep = () => {
    if (step === 'email') {
      if (!email.trim()) {
        setError('Please enter a valid email address.');
        return;
      }
      setError(null);
      setStep('plan');
    } else if (step === 'plan') {
      setError(null);
      setStep('confirm');
    }
  };
  
  // Go to previous step
  const goToPreviousStep = () => {
    if (step === 'plan') {
      setStep('email');
    } else if (step === 'confirm') {
      setStep('plan');
    }
  };
  
  // Add subscription manually
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!authUser) {
      setError('You must be logged in to perform this action.');
      return;
    }
    
    setError(null);
    setMessage(null);
    setIsLoading(true);
    
    try {
      // Create subscription via admin API
      const response = await fetch('/api/admin/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email.trim(),
          planId: planId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create subscription');
      }
      
      setMessage('Subscription created successfully');
      
      // Call the success callback
      onSuccess();
      
      // Automatically close after success
      setTimeout(() => {
        handleClose();
      }, 1500);
      
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating the subscription');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!isOpen) return null;
  
  // Get the plan details
  const getPlanDetails = (plan: string) => {
    switch(plan) {
      case 'monthly':
        return {
          name: 'Monthly Plan',
          description: 'Billed monthly with standard features'
        };
      case 'yearly':
        return {
          name: 'Yearly Plan',
          description: 'Billed annually with 20% savings'
        };
      case 'complimentary':
        return {
          name: 'Complimentary Access',
          description: 'Free access granted by admin'
        };
      default:
        return {
          name: 'Unknown Plan',
          description: 'Plan details not available'
        };
    }
  };
  
  const selectedPlan = getPlanDetails(planId);
  
  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div 
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full relative overflow-hidden animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress indicator */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100 dark:bg-gray-700">
          <div 
            className="h-full bg-blue-500 transition-all duration-300 ease-out" 
            style={{ width: step === 'email' ? '33%' : step === 'plan' ? '66%' : '100%' }}
          ></div>
        </div>
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {step === 'email' ? 'Add Subscription - Email' : 
             step === 'plan' ? 'Add Subscription - Plan' : 
             'Confirm Subscription'}
          </h3>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={step === 'confirm' ? handleSubmit : (e) => e.preventDefault()} className="p-6">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}
          
          {message && (
            <div className="mb-5 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 text-sm flex items-start gap-2.5">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>{message}</div>
            </div>
          )}
          
          {/* Step 1: Email Input */}
          {step === 'email' && (
            <div className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  User Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input 
                    type="email" 
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    autoFocus
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-white text-sm"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                  <HelpCircle className="w-3.5 h-3.5 mr-1" />
                  Enter the email of an existing user
                </p>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={goToNextStep}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  Continue to Plan Selection
                </button>
              </div>
            </div>
          )}
          
          {/* Step 2: Plan Selection */}
          {step === 'plan' && (
            <div className="space-y-5">
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select Subscription Plan
                </label>
                
                <div 
                  className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
                    planId === 'complimentary' 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500/20' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                  }`}
                  onClick={() => setPlanId('complimentary')}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full border flex-shrink-0 mt-0.5 flex items-center justify-center ${
                        planId === 'complimentary' 
                          ? 'border-blue-500 bg-blue-500' 
                          : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {planId === 'complimentary' && (
                          <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">Complimentary Access</h4>
                          <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                            Admin Only
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Grant free access without payment</p>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      Free
                    </div>
                  </div>
                </div>
                
                <div className="mt-5 pt-5 border-t border-gray-200 dark:border-gray-700">
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    User-initiated Plans (Not Recommended)
                  </h5>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mb-3 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Users should normally sign up for these plans themselves to complete payment setup.</span>
                  </p>
                </div>
                
                <div 
                  className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
                    planId === 'monthly' 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500/20' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                  }`}
                  onClick={() => setPlanId('monthly')}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full border flex-shrink-0 mt-0.5 flex items-center justify-center ${
                        planId === 'monthly' 
                          ? 'border-blue-500 bg-blue-500' 
                          : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {planId === 'monthly' && (
                          <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Monthly Plan</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Standard monthly billing</p>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      $9.99/mo
                    </div>
                  </div>
                </div>
                
                <div 
                  className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
                    planId === 'yearly' 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500/20' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                  }`}
                  onClick={() => setPlanId('yearly')}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full border flex-shrink-0 mt-0.5 flex items-center justify-center ${
                        planId === 'yearly' 
                          ? 'border-blue-500 bg-blue-500' 
                          : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {planId === 'yearly' && (
                          <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">Yearly Plan</h4>
                          <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                            Save 20%
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Annual billing, bigger savings</p>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      $95.88/yr
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={goToPreviousStep}
                  className="px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={goToNextStep}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  Continue to Review
                </button>
              </div>
            </div>
          )}
          
          {/* Step 3: Confirmation */}
          {step === 'confirm' && (
            <div className="space-y-5">
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-3">Subscription Summary</h4>
                
                <div className="space-y-4">
                  <div className="flex justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-500 dark:text-gray-400">User Email</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{email}</span>
                  </div>
                  
                  <div className="flex justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Plan</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedPlan.name}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Billing Cycle</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {planId === 'monthly' ? 'Monthly' : planId === 'yearly' ? 'Yearly' : 'Complimentary'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-blue-800 dark:text-blue-300 text-sm flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>
                  {planId === 'complimentary' 
                    ? "This will grant complimentary access to the user without requiring payment information."
                    : "This will create a new subscription for the user. They will not be charged immediately as this is a manual addition."}
                </p>
              </div>
              
              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={goToPreviousStep}
                  className="px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  disabled={isLoading}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-70 disabled:hover:bg-blue-600"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </div>
                  ) : (
                    'Add Subscription'
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
} 