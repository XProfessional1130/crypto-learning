'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { MembershipPlan } from './types';
import { CloseIcon, CreditCardIcon, CryptoIcon } from './icons';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/api/supabase'; // Import the shared Supabase client
import { useAuth } from '@/lib/providers/auth-provider'; // Import the auth hook

interface MembershipPlanModalProps {
  plan: MembershipPlan;
  onClose: () => void;
}

type PaymentMethod = 'stripe' | 'crypto' | null;

export default function MembershipPlanModal({ plan, onClose }: MembershipPlanModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authState, setAuthState] = useState<'checking' | 'authenticated' | 'unauthenticated'>('checking');
  const router = useRouter();
  const { user } = useAuth(); // Get user from auth context
  
  // Animation effect on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimateIn(true);
    }, 10);
    return () => clearTimeout(timer);
  }, []);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // First check our auth context
        if (user) {
          setAuthState('authenticated');
          return;
        }

        // Fallback to checking session directly
        const { data } = await supabase.auth.getSession();
        setAuthState(data.session ? 'authenticated' : 'unauthenticated');
      } catch (err) {
        console.error('Error checking auth state:', err);
        setAuthState('unauthenticated');
      }
    };

    checkAuth();
  }, [user]);
  
  // Handle payment method selection and immediate checkout
  const handlePaymentMethodSelect = async (method: PaymentMethod) => {
    if (method === 'crypto') {
      // Don't do anything if crypto is selected since it's disabled
      return;
    }
    
    setPaymentMethod(method);
    setIsProcessing(true);
    setError(null);
    
    if (method === 'stripe') {
      try {
        // Create a checkout session
        const response = await fetch('/api/stripe/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            planId: plan.id,
            // Send userId if authenticated
            userId: user?.id || undefined,
            userEmail: user?.email || undefined,
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Checkout session creation failed:', errorData);
          throw new Error(errorData.error || `Server error: ${response.status}`);
        }
        
        const { url, error: checkoutError } = await response.json();
        
        if (checkoutError) {
          throw new Error(checkoutError);
        }
        
        // Redirect to Stripe Checkout
        window.location.href = url;
      } catch (err) {
        console.error('Checkout error:', err);
        setIsProcessing(false);
        setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
      }
    }
  };

  // Close with animation
  const handleCloseWithAnimation = () => {
    setAnimateIn(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  // Handle sign in redirect
  const handleSignIn = () => {
    router.push(`/auth/signin?redirect=${encodeURIComponent('/membership')}`);
    handleCloseWithAnimation();
  };
  
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
      animateIn ? 'opacity-100' : 'opacity-0'
    }`}>
      <div className={`relative w-full max-w-xl mx-4 max-h-[90vh] overflow-auto transition-all duration-300 transform ${
        animateIn ? 'translate-y-0 scale-100' : 'translate-y-4 scale-95'
      }`}>
        <Card className="shadow-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          {/* Modal header */}
          <div className="flex justify-between items-center mb-5 pt-5 px-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {isProcessing 
                ? 'Processing Payment...' 
                : authState === 'unauthenticated'
                  ? 'Authentication Required'
                  : `Complete Your ${plan.name} Purchase`
              }
            </h2>
            <button
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={handleCloseWithAnimation}
              aria-label="Close"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>
          
          {/* Error message */}
          {error && (
            <div className="px-6">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 p-3 rounded-md mb-4 text-sm">
                {error}
              </div>
            </div>
          )}
          
          {/* Payment options content */}
          <div className="px-6 pb-6">
            {isProcessing ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-16 h-16 mb-4 rounded-full border-4 border-gray-200 dark:border-gray-700 border-t-brand-primary dark:border-t-brand-400 animate-spin"></div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Processing Your Request</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
                  Please wait while we redirect you to the payment page. This will only take a moment.
                </p>
              </div>
            ) : authState === 'checking' ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-12 h-12 mb-4 rounded-full border-4 border-gray-200 dark:border-gray-700 border-t-brand-primary dark:border-t-brand-400 animate-spin"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  Checking authentication status...
                </p>
              </div>
            ) : authState === 'unauthenticated' ? (
              <div className="text-center py-6">
                <p className="mb-4 text-gray-600 dark:text-gray-300">
                  Please sign in or create an account to complete your purchase.
                </p>
                <Button onClick={handleSignIn} className="px-6">
                  Sign In / Create Account
                </Button>
              </div>
            ) : (
              <>
                {/* Plan summary */}
                <div className="mb-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/60 border border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">{plan.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{plan.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900 dark:text-white">${plan.price}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">per {plan.interval}</p>
                      {plan.discount && (
                        <p className="text-xs text-green-600 dark:text-green-400">Save {plan.discount}%</p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Payment method selection */}
                <div>
                  <h3 className="text-base font-semibold mb-3 text-gray-900 dark:text-white">Select Payment Method</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      className="p-4 border rounded-lg flex flex-col items-center justify-center transition-all border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-750"
                      onClick={() => handlePaymentMethodSelect('stripe')}
                    >
                      <div className="w-10 h-10 rounded-full mb-2 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                        <CreditCardIcon className="w-5 h-5" />
                      </div>
                      <span className="font-medium text-sm text-gray-900 dark:text-white">Credit Card</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">via Stripe</span>
                    </button>
                    
                    <button
                      className="p-4 border rounded-lg flex flex-col items-center justify-center transition-all border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed"
                      disabled
                    >
                      <div className="w-10 h-10 rounded-full mb-2 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                        <CryptoIcon className="w-5 h-5" />
                      </div>
                      <span className="font-medium text-sm text-gray-900 dark:text-white">Cryptocurrency</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">via Radom (Coming Soon)</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
          
          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 pb-6 pt-2 border-t border-gray-100 dark:border-gray-700 mt-4">
            {!isProcessing && (
              <Button variant="secondary" onClick={handleCloseWithAnimation} className="text-sm py-1.5">
                Cancel
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
} 