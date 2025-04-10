'use client';

import { useAuth } from '@/lib/providers/auth-provider';

export default function DashboardTestPage() {
  const { user, loading } = useAuth();
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Dashboard Test Page</h1>
      
      {loading ? (
        <p>Loading authentication...</p>
      ) : user ? (
        <div>
          <p>You are logged in!</p>
          <p>User ID: {user.id}</p>
          <p>Email: {user.email}</p>
        </div>
      ) : (
        <p>Not logged in. You should be redirected...</p>
      )}
    </div>
  );
} 