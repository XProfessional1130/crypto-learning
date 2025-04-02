'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Edit, Clock, CreditCard, CheckCircle, XCircle, AlertTriangle, ShieldCheck, Calendar, Mail, User, Sparkles, AlertCircle, ClipboardCopy, ChevronRight, CreditCard as Card, BadgeCheck, RefreshCw, Archive, CheckSquare, XSquare, Users } from 'lucide-react';
import { useAuth } from '@/lib/providers/auth-provider';
import AddSubscriptionModal from '@/components/admin/subscriptions/AddSubscriptionModal';

export default function MemberDetailPage({ params }: { params: { id: string } }) {
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{type: 'success' | 'error' | 'info', text: string} | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { user: authUser } = useAuth();
  
  useEffect(() => {
    async function fetchData() {
      if (!authUser) {
        console.log('No authenticated user, skipping data fetch');
        return;
      }
      
      setIsLoading(true);
      try {
        // Fetch user data from admin API
        const userResponse = await fetch(`/api/admin/get-user?id=${params.id}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!userResponse.ok) {
          const errorData = await userResponse.json();
          throw new Error(errorData.error || 'Error fetching user');
        }
        
        const userResult = await userResponse.json();
        
        // Fetch subscription data from admin API
        const subscriptionResponse = await fetch(`/api/admin/get-user-subscription?userId=${params.id}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        let subscriptionData = null;
        if (subscriptionResponse.ok) {
          const subscriptionResult = await subscriptionResponse.json();
          subscriptionData = subscriptionResult.data;
        }
        
        setUser(userResult.data);
        setSubscription(subscriptionData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, [params.id, authUser]);
  
  // Function to update subscription status
  const updateSubscriptionStatus = async (newStatus: string) => {
    if (!subscription) return;
    
    setIsUpdating(true);
    setStatusMessage(null);
    
    try {
      // Use admin API to update subscription status
      const response = await fetch('/api/admin/update-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscriptionId: subscription.id,
          status: newStatus
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update subscription status');
      }
      
      const result = await response.json();
      
      // Update the subscription data in state
      setSubscription(result.data);
      setStatusMessage({
        type: 'success',
        text: `Subscription status updated to ${newStatus}`
      });
    } catch (error: any) {
      console.error('Error updating subscription:', error);
      setStatusMessage({
        type: 'error',
        text: error.message || 'Failed to update subscription status'
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Function to toggle auto-renew setting
  const toggleAutoRenew = async () => {
    if (!subscription) return;
    
    setIsUpdating(true);
    setStatusMessage(null);
    
    try {
      const newCancelAtPeriodEnd = !subscription.cancel_at_period_end;
      
      // Use admin API to update auto-renew setting
      const response = await fetch('/api/admin/update-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscriptionId: subscription.id,
          cancel_at_period_end: newCancelAtPeriodEnd
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update auto-renew setting');
      }
      
      const result = await response.json();
      
      // Update the subscription data in state
      setSubscription(result.data);
      setStatusMessage({
        type: 'success',
        text: newCancelAtPeriodEnd ? 
          'Subscription will be canceled at the end of billing period' : 
          'Subscription will now automatically renew'
      });
    } catch (error: any) {
      console.error('Error updating auto-renew setting:', error);
      setStatusMessage({
        type: 'error',
        text: error.message || 'Failed to update auto-renew setting'
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Copy to clipboard function
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopySuccess(`${field} copied!`);
        setTimeout(() => setCopySuccess(null), 2000);
      },
      () => {
        setCopySuccess('Failed to copy');
        setTimeout(() => setCopySuccess(null), 2000);
      }
    );
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Loading member data...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-center mt-4 text-gray-900 dark:text-white">Member not found</h2>
          <p className="mt-2 text-center text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            The member you're looking for doesn't exist or you don't have permission to view their details.
          </p>
          <div className="mt-6 flex justify-center">
            <button 
              onClick={() => router.push('/admin-platform/members')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Members
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Calculate the status color and icon
  const getStatusInfo = (status: string | undefined) => {
    if (!status) return {
      bgColor: 'bg-gray-100 dark:bg-gray-800',
      textColor: 'text-gray-700 dark:text-gray-300',
      icon: <AlertCircle className="w-5 h-5 mr-2" />,
      label: 'No Subscription'
    };
    
    const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1);
    
    switch(status) {
      case 'active':
        return {
          bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
          textColor: 'text-emerald-800 dark:text-emerald-300',
          icon: <CheckCircle className="w-5 h-5 mr-2" />,
          label: formattedStatus
        };
      case 'canceled':
        return {
          bgColor: 'bg-red-100 dark:bg-red-900/30',
          textColor: 'text-red-800 dark:text-red-300',
          icon: <XCircle className="w-5 h-5 mr-2" />,
          label: formattedStatus
        };
      case 'trialing':
        return {
          bgColor: 'bg-blue-100 dark:bg-blue-900/30',
          textColor: 'text-blue-800 dark:text-blue-300',
          icon: <Clock className="w-5 h-5 mr-2" />,
          label: formattedStatus
        };
      case 'past_due':
        return {
          bgColor: 'bg-amber-100 dark:bg-amber-900/30',
          textColor: 'text-amber-800 dark:text-amber-300',
          icon: <AlertTriangle className="w-5 h-5 mr-2" />,
          label: formattedStatus
        };
      default:
        return {
          bgColor: 'bg-gray-100 dark:bg-gray-800',
          textColor: 'text-gray-700 dark:text-gray-300',
          icon: <AlertCircle className="w-5 h-5 mr-2" />,
          label: formattedStatus
        };
    }
  };
  
  const statusInfo = getStatusInfo(subscription?.status);
  const formattedPlanId = subscription?.plan_id ? subscription.plan_id.replace('_', ' ') : 'No Plan';
  const formattedBillingPeriod = subscription && (
    `${new Date(subscription.current_period_start).toLocaleDateString()} - ${new Date(subscription.current_period_end).toLocaleDateString()}`
  );
  
  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => router.push('/admin-platform/members')}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Go back to members list"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Member Details</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">View and manage member information</p>
        </div>
      </div>
      
      {/* Status message */}
      {statusMessage && (
        <div 
          className={`p-4 rounded-xl border ${
            statusMessage.type === 'success' ? 
              'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' : 
            statusMessage.type === 'error' ? 
              'bg-red-50 dark:bg-red-900/10 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800' : 
              'bg-blue-50 dark:bg-blue-900/10 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
          } flex items-start gap-3`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          ) : statusMessage.type === 'error' ? (
            <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          )}
          <div>{statusMessage.text}</div>
        </div>
      )}
      
      {/* Main content area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - User Profile */}
        <div className="lg:col-span-1 space-y-6">
          {/* User Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center mb-4">
                  <span className="text-white text-2xl font-semibold">
                    {user.email?.charAt(0).toUpperCase() || '?'}
                  </span>
                </div>
                
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">{user.email}</h2>
                
                {user.role === 'admin' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 mb-4">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                    Admin
                  </span>
                )}
                
                <div className="w-full mt-4 space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                      <User className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                      User ID
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-mono text-gray-600 dark:text-gray-400 mr-1">{user.id.substring(0, 10)}...</span>
                      <button 
                        onClick={() => copyToClipboard(user.id, 'User ID')}
                        className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        aria-label="Copy user ID"
                      >
                        <ClipboardCopy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                      <Mail className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                      Email
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400 mr-1">{user.email}</span>
                      <button 
                        onClick={() => copyToClipboard(user.email, 'Email')}
                        className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        aria-label="Copy email"
                      >
                        <ClipboardCopy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                      <BadgeCheck className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                      Role
                    </div>
                    <span className="text-sm capitalize font-medium text-gray-600 dark:text-gray-400">
                      {user.role || 'User'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                      <Calendar className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                      Joined
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                {copySuccess && (
                  <div className="mt-3 text-sm text-emerald-600 dark:text-emerald-400 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    {copySuccess}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-medium text-gray-900 dark:text-white">Quick Actions</h3>
            </div>
            <div className="p-4 space-y-2">
              <button
                onClick={() => router.push('/admin-platform/members')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center">
                  <Users className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" />
                  <span>All Members</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="w-full flex items-center justify-between p-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center">
                  <Card className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" />
                  <span>Add Subscription</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Right column - Subscription Details */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Subscription Details</h2>
              {subscription && (
                <div className={`flex items-center px-3 py-1 rounded-full text-sm ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                  {statusInfo.icon}
                  <span>{statusInfo.label}</span>
                </div>
              )}
            </div>
            
            {!subscription ? (
              <div className="p-8 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                  <CreditCard className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No subscription found</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
                  This member doesn't have any active subscription. You can add one manually.
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Add Subscription
                </button>
              </div>
            ) : (
              <div className="p-6">
                {/* Subscription status indicator */}
                <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-800 rounded-xl p-5 mb-6 border border-gray-100 dark:border-gray-700">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h3 className="font-medium text-lg text-gray-900 dark:text-white mb-1 flex items-center">
                        <span className="capitalize">{formattedPlanId}</span>
                        {subscription.cancel_at_period_end && (
                          <span className="ml-2 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full">
                            Cancels at period end
                          </span>
                        )}
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 flex items-center">
                        <Calendar className="w-4 h-4 mr-1.5" />
                        <span>{formattedBillingPeriod}</span>
                      </p>
                    </div>
                    <div className="flex gap-2 flex-wrap md:flex-nowrap">
                      {subscription.status === 'active' ? (
                        <button
                          onClick={() => updateSubscriptionStatus('canceled')}
                          disabled={isUpdating}
                          className="flex items-center gap-2 px-4 py-2 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        >
                          {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <XSquare className="w-4 h-4" />}
                          <span>Cancel</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => updateSubscriptionStatus('active')}
                          disabled={isUpdating}
                          className="flex items-center gap-2 px-4 py-2 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                        >
                          {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckSquare className="w-4 h-4" />}
                          <span>Activate</span>
                        </button>
                      )}
                      
                      <button
                        onClick={toggleAutoRenew}
                        disabled={isUpdating}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : subscription.cancel_at_period_end ? <RefreshCw className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                        <span>{subscription.cancel_at_period_end ? "Enable Auto-Renew" : "Disable Auto-Renew"}</span>
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Subscription details sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Plan Information */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 dark:text-white flex items-center">
                      <CreditCard className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
                      Plan Information
                    </h4>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Plan</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">{formattedPlanId}</span>
                      </div>
                      
                      <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
                        <span className="text-sm font-medium capitalize flex items-center">
                          <span className={`w-2 h-2 rounded-full mr-1.5 ${
                            subscription.status === 'active' ? 'bg-emerald-500' :
                            subscription.status === 'canceled' ? 'bg-red-500' :
                            subscription.status === 'trialing' ? 'bg-blue-500' :
                            subscription.status === 'past_due' ? 'bg-amber-500' : 'bg-gray-500'
                          }`}></span>
                          <span className={
                            subscription.status === 'active' ? 'text-emerald-700 dark:text-emerald-400' :
                            subscription.status === 'canceled' ? 'text-red-700 dark:text-red-400' :
                            subscription.status === 'trialing' ? 'text-blue-700 dark:text-blue-400' :
                            subscription.status === 'past_due' ? 'text-amber-700 dark:text-amber-400' : 'text-gray-700 dark:text-gray-400'
                          }>
                            {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                          </span>
                        </span>
                      </div>
                      
                      {subscription.cancel_at_period_end && (
                        <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Auto-Renew</span>
                          <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                            Cancels at period end
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Billing Information */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 dark:text-white flex items-center">
                      <Calendar className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
                      Billing Information
                    </h4>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Current Period</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {new Date(subscription.current_period_start).toLocaleDateString()} to {new Date(subscription.current_period_end).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Next Renewal</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {subscription.cancel_at_period_end ? 'Will not renew' : new Date(subscription.current_period_end).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Created</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {new Date(subscription.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Technical Details */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">Technical Details</h4>
                  
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Subscription ID</span>
                        <div className="flex items-center">
                          <span className="text-xs font-mono text-gray-600 dark:text-gray-400 mr-1.5">
                            {subscription.id}
                          </span>
                          <button 
                            onClick={() => copyToClipboard(subscription.id, 'Subscription ID')}
                            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            aria-label="Copy subscription ID"
                          >
                            <ClipboardCopy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      
                      {subscription.stripe_subscription_id && (
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Stripe Subscription ID</span>
                          <div className="flex items-center">
                            <span className="text-xs font-mono text-gray-600 dark:text-gray-400 mr-1.5">
                              {subscription.stripe_subscription_id}
                            </span>
                            <button 
                              onClick={() => copyToClipboard(subscription.stripe_subscription_id, 'Stripe Subscription ID')}
                              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                              aria-label="Copy Stripe subscription ID"
                            >
                              <ClipboardCopy className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {subscription.stripe_customer_id && (
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Stripe Customer ID</span>
                          <div className="flex items-center">
                            <span className="text-xs font-mono text-gray-600 dark:text-gray-400 mr-1.5">
                              {subscription.stripe_customer_id}
                            </span>
                            <button 
                              onClick={() => copyToClipboard(subscription.stripe_customer_id, 'Stripe Customer ID')}
                              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                              aria-label="Copy Stripe customer ID"
                            >
                              <ClipboardCopy className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Add Subscription Modal */}
      <AddSubscriptionModal 
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          window.location.reload();
        }}
      />
    </div>
  );
} 