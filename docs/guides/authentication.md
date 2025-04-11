# Authentication System

This document explains the authentication system implemented in the Learning Crypto Platform.

## Overview

The platform uses Supabase Authentication combined with custom role-based access control (RBAC) to secure resources and provide different levels of access based on user roles.

## Authentication Flow

1. User signs up or logs in through Supabase Auth
2. On successful authentication, a profile record is created/updated
3. User roles and permissions are determined
4. Access to resources is controlled through Row Level Security (RLS) policies

## User Roles

The platform supports the following user roles:

- **User**: Regular authenticated user with basic permissions
- **Admin**: Administrative user with elevated permissions

## Admin Authentication

### How Admin Authentication Works

Admin authentication in the platform works through a combination of:

1. **Supabase Authentication**: For basic user authentication
2. **Custom Role Flags**: A boolean `is_admin` field in the profiles table
3. **Row Level Security (RLS)**: Database-level access control
4. **Server-side Validation**: Additional checks in API routes

### Setting Up an Admin User

To make a user an admin:

1. Ensure the user has registered through normal authentication
2. Update the user's profile in the database:

```sql
UPDATE profiles
SET is_admin = true
WHERE id = 'user-uuid-here';
```

Or use the provided admin panel if available.

### Admin Permissions

Admins can:

- Manage users
- Access analytics dashboard
- Modify platform content
- Configure system settings
- View and modify all portfolios and watchlists
- Execute admin-only API endpoints

### Implementation Details

#### Database Configuration

The `profiles` table includes the admin flag:

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Row Level Security Policies

RLS policies restrict access based on user role:

```sql
-- Allow admin users to read all profiles
CREATE POLICY "Admins can view all profiles" 
ON profiles FOR SELECT 
TO authenticated 
USING (is_admin = true);

-- Allow users to read only their own profile
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
TO authenticated 
USING (auth.uid() = id);
```

#### Server-Side Verification

Always verify admin status server-side:

```typescript
// Example server-side admin check
async function requireAdmin(req, res, next) {
  const { user } = await supabase.auth.getUser();
  
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();
  
  if (!profile || !profile.is_admin) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  // User is an admin, proceed
  next();
}
```

## Client-Side Authentication

### Authentication Components

The platform includes several React components for authentication:

- `<AuthProvider>`: Context provider for authentication state
- `<LoginForm>`: User login form
- `<SignUpForm>`: New user registration
- `<PasswordReset>`: Password recovery workflow
- `<ProtectedRoute>`: Route guard component

### Example Usage

```tsx
// Protected route example
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute requireAdmin>
            <AdminPanel />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}
```

## Security Considerations

1. **Never Trust Client-Side Validation**: Always verify permissions server-side
2. **Use HTTPS**: Ensure all authentication requests are encrypted
3. **Implement Rate Limiting**: Prevent brute force attacks
4. **Audit Authentication Events**: Log signup, login, and permission changes
5. **Secure Admin Endpoints**: Extra protection for admin functionality

## Troubleshooting

Common issues and solutions:

1. **User Can't Access Admin Features**: Check `is_admin` flag in the profiles table
2. **Permissions Not Applied**: Verify RLS policies are active and correct
3. **Session Issues**: Check for token expiration and refresh flows

## Future Enhancements

Planned improvements to the authentication system:

1. **Multi-factor Authentication**: Additional security layer
2. **Social Login Integration**: OAuth providers like Google, Twitter
3. **Fine-grained Permission System**: More specific controls beyond user/admin
4. **Team-based Permissions**: Access controls for team resources 