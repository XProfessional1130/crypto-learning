# Admin Authentication System

## Overview
The admin authentication system is built on top of Supabase's authentication system, adding role-based access control through the profiles table. This system enables certain users to be designated as administrators with elevated privileges.

## How It Works

1. **Authentication**: Users first authenticate through Supabase Auth
2. **Role Assignment**: Admin status is stored in the user's profile record
3. **Access Control**: Admin privileges are verified through database functions and RLS policies
4. **UI Integration**: Admin-only features are conditionally displayed based on role

## Database Schema

The admin system is primarily implemented through the `profiles` table:

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Database Functions

### `is_admin()`
Checks if the current user has admin privileges.

```sql
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;
```

**Usage**: `SELECT is_admin();`  
**Description**: Returns true if the current user has the 'admin' role in their profile

### `make_user_admin(user_id UUID)`
Grants admin privileges to a user.

```sql
CREATE OR REPLACE FUNCTION make_user_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_success BOOLEAN;
BEGIN
  -- Only allow existing admins to execute this function
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Permission denied: Only admins can promote users to admin';
  END IF;

  UPDATE profiles
  SET role = 'admin'
  WHERE id = user_id;

  GET DIAGNOSTICS v_success = ROW_COUNT;
  RETURN v_success > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Usage**: `SELECT make_user_admin('user-uuid');`  
**Access**: Only callable by existing admins  
**Description**: Updates a user's role to 'admin' in their profile

### `remove_user_admin(user_id UUID)`
Revokes admin privileges from a user.

```sql
CREATE OR REPLACE FUNCTION remove_user_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_success BOOLEAN;
BEGIN
  -- Only allow existing admins to execute this function
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Permission denied: Only admins can demote other admins';
  END IF;

  UPDATE profiles
  SET role = 'user'
  WHERE id = user_id;

  GET DIAGNOSTICS v_success = ROW_COUNT;
  RETURN v_success > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Usage**: `SELECT remove_user_admin('user-uuid');`  
**Access**: Only callable by existing admins  
**Description**: Updates a user's role back to 'user' in their profile

## TypeScript Integration

Our TypeScript code provides methods to interact with these database functions:

```typescript
// src/lib/services/auth-service.ts

class AuthService {
  /**
   * Check if current user is an admin
   * @returns {Promise<boolean>} True if user is admin
   */
  static async isAdmin(): Promise<boolean> {
    const { data, error } = await supabase.rpc('is_admin');
    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
    return data || false;
  }

  /**
   * Make a user an admin
   * @param {string} userId - The UUID of the user to promote
   * @returns {Promise<{ success: boolean; error?: string }>} Result
   */
  static async makeUserAdmin(userId: string): Promise<{ 
    success: boolean; 
    error?: string 
  }> {
    try {
      const { data, error } = await supabase.rpc('make_user_admin', { user_id: userId });
      if (error) throw error;
      return { success: !!data };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Remove admin status from a user
   * @param {string} userId - The UUID of the user to demote
   * @returns {Promise<{ success: boolean; error?: string }>} Result
   */
  static async removeUserAdmin(userId: string): Promise<{ 
    success: boolean; 
    error?: string 
  }> {
    try {
      const { data, error } = await supabase.rpc('remove_user_admin', { user_id: userId });
      if (error) throw error;
      return { success: !!data };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}
```

## Setting Up First Admin

Since you need an admin to make other admins, a special script is provided to set up the first admin user:

```bash
npm run create-first-admin your.email@example.com
```

**Location**: `src/scripts/create-first-admin.ts`

### Script Details
The script:
1. Uses the Supabase service role key for elevated privileges
2. Finds the user by email in the auth.users table
3. Updates their profile to have the 'admin' role
4. Provides appropriate error handling and feedback

## Usage Examples

### Checking Admin Status
```typescript
// In a React component or server action
import { AuthService } from '@/lib/services/auth-service';

// Conditionally show admin features
if (await AuthService.isAdmin()) {
  // Perform admin-only operations or show admin UI
}
```

### Making a User Admin
```typescript
import { AuthService } from '@/lib/services/auth-service';

const handlePromoteUser = async (userId: string) => {
  const result = await AuthService.makeUserAdmin(userId);
  if (result.success) {
    console.log('User is now an admin');
    // Update UI or notify user
  } else {
    console.error('Failed to make user admin:', result.error);
    // Show error message
  }
};
```

### Removing Admin Status
```typescript
import { AuthService } from '@/lib/services/auth-service';

const handleDemoteUser = async (userId: string) => {
  const result = await AuthService.removeUserAdmin(userId);
  if (result.success) {
    console.log('Admin status removed');
    // Update UI or notify user
  } else {
    console.error('Failed to remove admin status:', result.error);
    // Show error message
  }
};
```

## Security Considerations

1. All admin-related functions are implemented with `SECURITY DEFINER` to ensure they run with appropriate privileges
2. Only existing admins can grant or revoke admin status
3. Admin status is stored in the profiles table, which has Row Level Security enabled
4. The first admin must be created using the provided script with service role access
5. Admin operations are logged and traceable
6. Admin privileges are checked on both the client and server side
7. The service role key is only used in secure server-side contexts

## Best Practices

1. Regularly audit admin users
2. Follow the principle of least privilege
3. Always verify admin status server-side before performing privileged operations
4. Use the TypeScript helper methods instead of direct database calls
5. Log all admin-related actions for accountability
6. Implement rate limiting on admin operations
7. Regular security reviews of admin access patterns

## Troubleshooting

### Common Issues

1. **"Permission denied" when making admin changes**
   - Verify you are an admin using `AuthService.isAdmin()`
   - Check if you're using the correct authentication token

2. **Unable to create first admin**
   - Verify the service role key is correctly set in environment variables
   - Ensure the user exists in the auth.users table
   - Check for any existing database policy conflicts

3. **Admin status not reflecting immediately**
   - Clear local session cache
   - Sign out and sign back in
   - Check for any caching in your application

### Getting Help

1. Check the logs for detailed error messages
2. Verify all environment variables are correctly set
3. Ensure database migrations have been applied
4. Contact the development team for assistance 