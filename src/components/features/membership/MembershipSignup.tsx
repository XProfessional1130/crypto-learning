'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';
import MembershipPlanModal from './MembershipPlanModal';
import { ArrowRightIcon, CheckIcon } from './icons';
import { MembershipPlan, membershipPlans } from './types';

export default function MembershipSignup() {
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);
  // Animation states
  const [animatedCards, setAnimatedCards] = useState(false);

  // Trigger animations after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedCards(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handlePlanSelect = (plan: MembershipPlan) => {
    setSelectedPlan(plan);
    setShowPlanModal(true);
  };

  const handlePlanModalClose = () => {
    setShowPlanModal(false);
  };

  return (
    <div className="min-h-screen">
      <Container maxWidth="lg" className="py-6 md:py-10">
        <div className="text-center mb-8">
          <div className="inline-block bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-300 px-4 py-1 rounded-full text-sm font-medium mb-3">
            Premium Membership
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-gray-50 tracking-tight">
            Unlock <span className="text-gradient dark:from-brand-300 dark:to-brand-100">Premium Access</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Choose the membership plan that works best for you
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {membershipPlans.map((plan, index) => (
            <div 
              key={plan.id} 
              className={`transform transition-all duration-500 ${
                animatedCards ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <Card 
                variant="outlined" 
                className={`relative border-2 transition-all duration-300 hover:shadow-lg focus-within:ring-2 focus-within:ring-brand-primary dark:focus-within:ring-brand-light bg-white dark:bg-gray-800 ${
                  plan.popular 
                    ? 'border-brand-primary dark:border-brand-400 shadow-md' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-0 right-0 flex justify-center">
                    <div className="py-1 px-4 bg-brand-primary dark:bg-brand-500 text-white font-medium rounded-full text-sm shadow-sm">
                      Best Value
                    </div>
                  </div>
                )}
                
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">{plan.description}</p>
                    </div>
                    <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${
                      plan.popular 
                        ? 'bg-brand-primary dark:bg-brand-500 text-white' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {plan.interval === 'month' 
                          ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        }
                      </svg>
                    </div>
                  </div>
                  
                  <div className="mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">${plan.price}</span>
                      <span className="text-gray-500 dark:text-gray-400 ml-2 text-sm">/{plan.interval}</span>
                    </div>
                    {plan.discount && (
                      <div className="flex items-center mt-1 text-green-600 dark:text-green-400 text-sm font-medium">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Save {plan.discount}% with annual billing
                      </div>
                    )}
                  </div>
                  
                  <ul className="space-y-2 mb-6 text-sm">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckIcon className="h-4 w-4 text-green-500 dark:text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    variant={plan.popular ? "primary" : "outline"} 
                    className="w-full justify-center py-2 text-base font-medium"
                    onClick={() => handlePlanSelect(plan)}
                  >
                    Choose {plan.interval === 'month' ? 'Monthly' : 'Annual'}
                    <ArrowRightIcon className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </Card>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap justify-center gap-4 items-center text-sm">
            <div className="flex items-center bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-1.5">
              <svg className="h-5 w-5 text-brand-primary dark:text-brand-300 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-gray-800 dark:text-gray-200">Secure payment</span>
            </div>
            <div className="flex items-center bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-1.5">
              <svg className="h-5 w-5 text-brand-primary dark:text-brand-300 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <span className="text-gray-800 dark:text-gray-200">Cancel anytime</span>
            </div>
            <div className="flex items-center bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-1.5">
              <svg className="h-5 w-5 text-brand-primary dark:text-brand-300 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-gray-800 dark:text-gray-200">14-day money-back guarantee</span>
            </div>
          </div>
        </div>
      </Container>

      {/* Membership plan selection modal */}
      {showPlanModal && selectedPlan && (
        <MembershipPlanModal 
          plan={selectedPlan} 
          onClose={handlePlanModalClose} 
        />
      )}
    </div>
  );
} 