'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Loader2, Search, Filter, UserPlus, RefreshCw, CheckCircle, XCircle, Clock, Info, User, Users, ChevronDown, Calendar, Mail, AlertCircle, ArrowUpDown, MoreHorizontal, Trash2, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AddSubscriptionModal from '@/components/admin/subscriptions/AddSubscriptionModal';
import { useAuth } from '@/lib/providers/auth-provider';
import { supabase } from '@/lib/api/supabase'; // Import the existing initialized client

export default function MembersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, active, canceled, etc.
  const [showAddModal, setShowAddModal] = useState(false);
  const [debugMessage, setDebugMessage] = useState<string | null>(null);
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Use the pre-initialized supabase instance rather than creating a new one
  // const supabase = createClientComponentClient();
  const router = useRouter();
  const { user, session } = useAuth();

  // Fetch users and their subscriptions
  const fetchData = async () => {
    if (!user) {
      console.log('No authenticated user, skipping data fetch');
      return;
    }
    
    try {
      console.log('Fetching admin data using admin API endpoints');
      setIsLoading(true);
      
      // Use our admin API endpoints that bypass RLS
      // Include credentials to send cookies with the request
      const usersResponse = await fetch('/api/admin/get-all-users', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!usersResponse.ok) {
        const errorData = await usersResponse.json();
        throw new Error(errorData.error || 'Error fetching users');
      }
      
      const usersResult = await usersResponse.json();
      
      console.log('Users data retrieved:', usersResult.data?.length || 0, 'users found');
      
      // Get subscriptions through admin API
      const subscriptionsResponse = await fetch('/api/admin/get-all-subscriptions', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!subscriptionsResponse.ok) {
        const errorData = await subscriptionsResponse.json();
        throw new Error(errorData.error || 'Error fetching subscriptions');
      }
      
      const subscriptionsResult = await subscriptionsResponse.json();
      
      console.log('Subscriptions data retrieved:', subscriptionsResult.data?.length || 0, 'subscriptions found');
      
      setUsers(usersResult.data || []);
      setSubscriptions(subscriptionsResult.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch data if we have an authenticated user
    if (user) {
      fetchData();
    }
  }, [user]);

  // Sort and filter data
  const processedUsers = [...users]
    .sort((a, b) => {
      if (sortField === 'email') {
        const aValue = a.email?.toLowerCase() || '';
        const bValue = b.email?.toLowerCase() || '';
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      } else if (sortField === 'status') {
        const aSubscription = subscriptions.find(sub => sub.user_id === a.id);
        const bSubscription = subscriptions.find(sub => sub.user_id === b.id);
        const aStatus = aSubscription?.status || '';
        const bStatus = bSubscription?.status || '';
        return sortDirection === 'asc' ? aStatus.localeCompare(bStatus) : bStatus.localeCompare(aStatus);
      } else if (sortField === 'created_at') {
        const aDate = new Date(a.created_at).getTime();
        const bDate = new Date(b.created_at).getTime();
        return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
      }
      return 0;
    })
    .filter(user => {
      // Apply search query
      const matchesSearch = searchQuery === '' || 
        user.email?.toLowerCase().includes(searchQuery.toLowerCase());

      // Apply status filter
      if (filter === 'all') return matchesSearch;
      
      // Find subscription for this user
      const userSubscription = subscriptions.find(sub => sub.user_id === user.id);
      
      if (filter === 'subscribed') {
        return matchesSearch && userSubscription && userSubscription.status === 'active';
      } else if (filter === 'unsubscribed') {
        return matchesSearch && (!userSubscription || userSubscription.status !== 'active');
      }
      
      return matchesSearch;
    });

  // Function to toggle sort
  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Function to update subscription status
  const updateSubscriptionStatus = async (subscriptionId: string, newStatus: string) => {
    try {
      // Use admin API to update subscription status
      const response = await fetch('/api/admin/update-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscriptionId: subscriptionId,
          status: newStatus
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update subscription status');
      }

      // Refresh data after update
      await fetchData();
    } catch (error) {
      console.error('Error updating subscription:', error);
    }
  };

  // Navigate to user detail page
  const navigateToUserDetail = (userId: string) => {
    router.push(`/admin-platform/members/${userId}`);
  };

  // Toggle user selection
  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Toggle all users selection
  const toggleAllUsers = () => {
    if (selectedUsers.length === processedUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(processedUsers.map(user => user.id));
    }
  };

  // Get status badge style
  const getStatusBadge = (status: string | undefined) => {
    if (!status) return {
      bg: 'bg-gray-100 dark:bg-gray-800',
      text: 'text-gray-700 dark:text-gray-300',
      icon: <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
    };
    
    switch(status) {
      case 'active':
        return {
          bg: 'bg-emerald-100 dark:bg-emerald-900/30',
          text: 'text-emerald-800 dark:text-emerald-300',
          icon: <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
        };
      case 'canceled':
        return {
          bg: 'bg-red-100 dark:bg-red-900/30',
          text: 'text-red-800 dark:text-red-300',
          icon: <XCircle className="w-3.5 h-3.5 mr-1.5" />
        };
      case 'trialing':
        return {
          bg: 'bg-blue-100 dark:bg-blue-900/30',
          text: 'text-blue-800 dark:text-blue-300',
          icon: <Clock className="w-3.5 h-3.5 mr-1.5" />
        };
      case 'past_due':
        return {
          bg: 'bg-amber-100 dark:bg-amber-900/30',
          text: 'text-amber-800 dark:text-amber-300',
          icon: <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
        };
      default:
        return {
          bg: 'bg-gray-100 dark:bg-gray-800',
          text: 'text-gray-700 dark:text-gray-300',
          icon: <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
        };
    }
  };

  // Function to promote current user to admin
  const promoteToAdmin = async () => {
    try {
      setDebugMessage('Promoting user to admin...');
      const response = await fetch('/api/admin/promote-to-admin');
      const result = await response.json();
      
      if (result.success) {
        setDebugMessage(`Success: ${result.message}`);
        // Refresh data after promotion
        fetchData();
      } else {
        setDebugMessage(`Error: ${result.error} - ${result.details || ''}`);
      }
    } catch (error) {
      console.error('Error promoting to admin:', error);
      setDebugMessage('Failed to promote user to admin. See console for details.');
    }
  };

  // Function to create test user if none exist
  const createTestUser = async () => {
    try {
      setDebugMessage('Creating test user...');
      
      // First check if there are any users
      const { data: existingUsers, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
        
      if (checkError) {
        throw new Error(`Error checking for users: ${checkError.message}`);
      }
      
      // If users exist, just return
      if (existingUsers && existingUsers.length > 0) {
        setDebugMessage('Users already exist in the database. No test user created.');
        return;
      }
      
      // Create a test user
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: '00000000-0000-0000-0000-000000000001', // Dummy ID for test user
          email: 'test@example.com',
          role: 'user'
        })
        .select();
        
      if (error) {
        throw new Error(`Error creating test user: ${error.message}`);
      }
      
      setDebugMessage('Test user created successfully');
      // Refresh data
      fetchData();
      
    } catch (error: any) {
      console.error('Error creating test user:', error);
      setDebugMessage(`Failed to create test user: ${error.message}`);
    }
  };

  // Function to fix RLS policies
  const fixRlsPolicies = async () => {
    try {
      setDebugMessage('Fixing RLS policies...');
      const response = await fetch('/api/admin/fix-rls-policy');
      const result = await response.json();
      
      if (result.success) {
        setDebugMessage(`Success: ${result.message}`);
        // Refresh data after fixing policies
        fetchData();
      } else {
        setDebugMessage(`Error: ${result.error} - ${result.details || ''}`);
      }
    } catch (error) {
      console.error('Error fixing RLS policies:', error);
      setDebugMessage('Failed to fix RLS policies. See console for details.');
    }
  };

  // Replace the setupAdmin function with this simpler one
  const makeUserAdmin = async () => {
    try {
      if (!user) {
        alert('You must be logged in first');
        return;
      }
      
      setDebugMessage('Setting admin role...');
      
      // Just set the current user as admin - this is the only thing needed
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', user.id);
        
      if (error) {
        setDebugMessage(`Error: ${error.message}`);
        console.error('Error setting admin role:', error);
      } else {
        setDebugMessage('Your account is now an admin. Refreshing data...');
        // After making user admin, verify access through our API endpoint
        try {
          const response = await fetch('/api/admin/update-rls-policy', {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const result = await response.json();
            setDebugMessage(`Admin verification: ${result.message}`);
          }
        } catch (verifyError) {
          console.error('Error verifying admin status:', verifyError);
        }
        
        // Then refresh data
        fetchData();
      }
    } catch (error: any) {
      console.error('Error:', error);
      setDebugMessage(`Error: ${error.message || 'Unknown error'}`);
    }
  };

  // Add this function to your component before the return statement
  const checkDatabase = async () => {
    try {
      // First, log the current user info
      console.log('Current authenticated user:', user);
      
      // Check if the current user is admin
      const { data: myProfile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single();
        
      console.log('My profile role:', myProfile?.role, profileError ? `(Error: ${profileError.message})` : '');
      
      // Try to count total rows in profiles regardless of RLS
      const { count: rowCount, error: countError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
        
      console.log('Total rows in profiles (may be affected by RLS):', rowCount, countError ? `(Error: ${countError.message})` : '');
      
      // Try a simpler query with no joins or complex filters
      const { data: simpleData, error: simpleError } = await supabase
        .from('profiles')
        .select('id, email')
        .limit(5);
        
      console.log('Simple query results:', simpleData?.length || 0, 'rows returned', simpleError ? `(Error: ${simpleError.message})` : '');
      
      // Try a service-role approach if available via a simple fetch to a server function
      alert(`
Database check results:
- Your role: ${myProfile?.role || 'unknown'}
- Rows returned by simple query: ${simpleData?.length || 0}
- Check console for more details
      `);
    } catch (error) {
      console.error('Error checking database:', error);
      alert('Error checking database. See console for details.');
    }
  };

  // Update this function to match the new API response format
  const serverDatabaseCheck = async () => {
    try {
      const response = await fetch('/api/admin/db-check');
      const data = await response.json();
      
      console.log('Server DB check results:', data);
      
      // Display results in alert
      if (data.error) {
        alert(`Error: ${data.error} - ${data.details || ''}`);
      } else if (data.count === 0) {
        alert('No profiles found in the database. You need to create users first.');
      } else {
        // Show the first few profiles
        const profilesList = data.profiles.map((p: { email?: string; role?: string; id: string }) => 
          `- ${p.email || 'No email'} (${p.role || 'No role'})`
        ).join('\n');
        
        alert(`
Database Check Results:
${data.count} profiles found in database.

First ${data.profiles.length} profiles:
${profilesList}

These results were retrieved using admin access, bypassing RLS.
If you can see profiles here but not in the UI, it's definitely an RLS issue.
        `);
        
        // If we found profiles, try to refresh the UI with the user's credentials
        await fetchData();
      }
    } catch (error) {
      console.error('Error calling server check:', error);
      alert('Error checking database from server. See console for details.');
    }
  };

  // Add this function to call the create-test-profile API
  const createTestProfile = async () => {
    try {
      const response = await fetch('/api/admin/create-test-profile');
      const data = await response.json();
      
      console.log('Create test profile result:', data);
      
      if (data.error) {
        alert(`Error: ${data.error} - ${data.details || ''}`);
      } else if (data.message === 'Profiles already exist') {
        alert(`Profiles already exist in the database (${data.count}). No test profile created.`);
      } else {
        alert(`Test profile created successfully. Email: ${data.profile?.email}, Role: ${data.profile?.role}`);
        // Refresh data
        await serverDatabaseCheck();
      }
    } catch (error) {
      console.error('Error creating test profile:', error);
      alert('Error creating test profile. See console for details.');
    }
  };

  // Update RLS policies
  const updateRlsPolicies = async () => {
    try {
      setDebugMessage('Checking admin access...');
      // Call our simplified endpoint with credentials to send cookies
      const response = await fetch('/api/admin/update-rls-policy', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error updating RLS policies');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setDebugMessage(`Success: ${result.message}`);
        // Refresh data after confirming admin access
        fetchData();
      } else {
        setDebugMessage(`Error: ${result.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Error updating RLS policies:', error);
      setDebugMessage(`Error: ${error.message || 'Unknown error'}`);
    }
  };

  // Function to delete a user
  const deleteUser = async (userId: string) => {
    setIsDeleting(true);
    
    try {
      // Call the delete user API
      const response = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }
      
      // Refresh data after deletion
      await fetchData();
      setDebugMessage('User deleted successfully');
    } catch (error: any) {
      console.error('Error deleting user:', error);
      setDebugMessage(`Error deleting user: ${error.message}`);
    } finally {
      setIsDeleting(false);
      setUserToDelete(null);
      setShowDeleteConfirm(false);
    }
  };
  
  // Function to handle delete click
  const handleDeleteClick = (userId: string) => {
    setUserToDelete(userId);
    setShowDeleteConfirm(true);
  };

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 flex items-center space-x-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Users className="h-6 w-6 text-blue-700 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Members</p>
            <p className="text-2xl font-semibold">{users.length}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 flex items-center space-x-4">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
            <CheckCircle className="h-6 w-6 text-emerald-700 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Active Subscriptions</p>
            <p className="text-2xl font-semibold">
              {subscriptions.filter(sub => sub.status === 'active').length}
            </p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 flex items-center space-x-4">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
            <Clock className="h-6 w-6 text-amber-700 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Pending Renewal</p>
            <p className="text-2xl font-semibold">
              {subscriptions.filter(sub => sub.cancel_at_period_end).length}
            </p>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left side */}
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by email"
                className="pl-10 pr-4 py-2.5 w-full sm:w-72 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search members"
              />
            </div>
            
            <div className="relative w-full sm:w-auto">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                className="pl-10 pr-10 py-2.5 w-full appearance-none border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                aria-label="Filter members"
              >
                <option value="all">All Members</option>
                <option value="subscribed">Active Subscriptions</option>
                <option value="unsubscribed">No Active Subscription</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>
          </div>
          
          {/* Right side */}
          <div className="flex gap-3">
            <div className="relative">
              <button 
                onClick={() => setIsActionsOpen(!isActionsOpen)}
                className={`px-4 py-2.5 flex items-center gap-2 border ${selectedUsers.length > 0 ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'} rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${selectedUsers.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={selectedUsers.length === 0}
                aria-label="Bulk actions"
              >
                <span>Actions</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {isActionsOpen && selectedUsers.length > 0 && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 z-10 border border-gray-200 dark:border-gray-700">
                  <button 
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => {
                      // Bulk action logic here
                      setIsActionsOpen(false);
                    }}
                  >
                    Activate Selected
                  </button>
                  <button 
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => {
                      // Bulk action logic here
                      setIsActionsOpen(false);
                    }}
                  >
                    Cancel Selected
                  </button>
                </div>
              )}
            </div>
            
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              aria-label="Add new subscription"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Subscription</span>
            </button>
            
            <button 
              onClick={fetchData}
              className="flex items-center justify-center p-2.5 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Refresh data"
            >
              <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Members List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <div className="flex flex-col items-center">
              <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Loading members data...</p>
            </div>
          </div>
        ) : processedUsers.length === 0 ? (
          <div className="py-16 text-center">
            <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
              <Users className="w-8 h-8 text-gray-500 dark:text-gray-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No members found</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              {searchQuery ? 'Try adjusting your search criteria or filters to see more results.' : 'Add members to get started with your subscription management.'}
            </p>
            {searchQuery && (
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setFilter('all');
                }}
                className="mt-4 px-4 py-2 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800/40 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th scope="col" className="pl-6 py-3 text-left">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
                        checked={selectedUsers.length === processedUsers.length && processedUsers.length > 0}
                        onChange={toggleAllUsers}
                      />
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left">
                    <button 
                      className="group inline-flex items-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                      onClick={() => toggleSort('email')}
                    >
                      <span>Member</span>
                      <ArrowUpDown className={`ml-1.5 h-4 w-4 flex-shrink-0 ${sortField === 'email' ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'}`} />
                    </button>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left">
                    <button 
                      className="group inline-flex items-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                      onClick={() => toggleSort('status')}
                    >
                      <span>Status</span>
                      <ArrowUpDown className={`ml-1.5 h-4 w-4 flex-shrink-0 ${sortField === 'status' ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'}`} />
                    </button>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Plan</th>
                  <th scope="col" className="px-6 py-3 text-left">
                    <button 
                      className="group inline-flex items-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                      onClick={() => toggleSort('created_at')}
                    >
                      <span>Joined</span>
                      <ArrowUpDown className={`ml-1.5 h-4 w-4 flex-shrink-0 ${sortField === 'created_at' ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'}`} />
                    </button>
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {processedUsers.map((user) => {
                  const subscription = subscriptions.find(sub => sub.user_id === user.id);
                  const status = subscription?.status || 'No Subscription';
                  const statusBadge = getStatusBadge(subscription?.status);
                  const isSelected = selectedUsers.includes(user.id);
                  
                  return (
                    <tr 
                      key={user.id} 
                      className={`${isSelected ? 'bg-blue-50 dark:bg-blue-900/10' : ''} hover:bg-gray-50 dark:hover:bg-gray-900/10 transition-colors`}
                    >
                      <td className="pl-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
                            checked={isSelected}
                            onChange={() => toggleUserSelection(user.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap" onClick={() => navigateToUserDetail(user.id)}>
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                            <span className="text-white font-medium">
                              {user.email?.charAt(0).toUpperCase() || '?'}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{user.email}</div>
                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                              <Mail className="w-3 h-3 mr-1" />
                              <span>User ID: {user.id.substring(0, 8)}...</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap" onClick={() => navigateToUserDetail(user.id)}>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}>
                          {statusBadge.icon}
                          {status === 'No Subscription' ? status : 
                            status.charAt(0).toUpperCase() + status.slice(1)
                          }
                        </span>
                        {subscription?.cancel_at_period_end && (
                          <span className="block mt-1 text-xs text-amber-600 dark:text-amber-400 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            <span>Cancels at period end</span>
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap" onClick={() => navigateToUserDetail(user.id)}>
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          {subscription?.plan_id ? (
                            <span className="capitalize font-medium">{subscription.plan_id.replace('_', ' ')}</span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500">No plan</span>
                          )}
                        </div>
                        {subscription && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            <span>Renews {new Date(subscription.current_period_end).toLocaleDateString()}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300" onClick={() => navigateToUserDetail(user.id)}>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                          <span>{new Date(user.created_at).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex justify-end space-x-2">
                          {subscription ? (
                            subscription.status === 'active' ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateSubscriptionStatus(subscription.id, 'canceled');
                                }}
                                className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                                title="Cancel Subscription"
                                aria-label="Cancel subscription"
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateSubscriptionStatus(subscription.id, 'active');
                                }}
                                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20 transition-colors"
                                title="Activate Subscription"
                                aria-label="Activate subscription"
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                            )
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowAddModal(true);
                              }}
                              className="px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-800/40 text-blue-700 dark:text-blue-300 rounded-lg transition-colors"
                              aria-label="Add subscription"
                            >
                              Add
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigateToUserDetail(user.id);
                            }}
                            className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
                            title="View Details"
                            aria-label="View details"
                          >
                            <MoreHorizontal className="w-5 h-5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(user.id);
                            }}
                            className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Admin Tools section - kept the same as original */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="mt-8 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium mb-3">Admin Tools</h3>
          
          {debugMessage && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded">
              {debugMessage}
            </div>
          )}
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={fixRlsPolicies}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded"
            >
              Fix RLS Policies
            </button>
            
            <button
              onClick={promoteToAdmin}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded"
            >
              Promote to Admin
            </button>
            
            <button
              onClick={createTestUser}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded"
            >
              Create Test User
            </button>
            
            <button
              onClick={() => {
                console.log('Current users:', users);
                console.log('Current subscriptions:', subscriptions);
                setDebugMessage('Check browser console for current data');
              }}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
            >
              Log Current Data
            </button>
          </div>
        </div>
      )}
      
      {/* Add Subscription Modal */}
      <AddSubscriptionModal 
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchData}
      />

      {/* Admin buttons - hidden at the bottom for development purposes */}
      <div className="flex flex-wrap gap-2 mt-4">
        <button
          onClick={makeUserAdmin}
          className="px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded-md"
        >
          Make Me Admin
        </button>

        <button
          onClick={checkDatabase}
          className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md"
        >
          Check Database
        </button>

        <button
          onClick={serverDatabaseCheck}
          className="px-3 py-1.5 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded-md"
        >
          Server DB Check
        </button>

        <button
          onClick={createTestProfile}
          className="px-3 py-1.5 text-xs bg-orange-600 hover:bg-orange-700 text-white rounded-md"
        >
          Create Test Profile
        </button>

        <button
          onClick={updateRlsPolicies}
          className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-md"
        >
          Fix Admin Policies
        </button>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-center mb-2 text-gray-900 dark:text-white">
              Delete User
            </h3>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete this user? This action is permanent and cannot be undone.
            </p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setUserToDelete(null);
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={() => userToDelete && deleteUser(userToDelete)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
                disabled={isDeleting}
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 