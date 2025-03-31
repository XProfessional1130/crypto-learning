-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add role column to profiles if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' 
CHECK (role IN ('user', 'admin'));

-- Create admin_access policy function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the user has admin role in profiles table
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admins can view all profiles"
  ON profiles
  FOR SELECT
  USING (is_admin() OR auth.uid() = id);

CREATE POLICY "Admins can update all profiles"
  ON profiles
  FOR UPDATE
  USING (is_admin() OR auth.uid() = id)
  WITH CHECK (is_admin() OR auth.uid() = id);

-- Create function to make a user an admin
CREATE OR REPLACE FUNCTION public.make_user_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the calling user is an admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can make other users admin';
  END IF;

  -- Update the user's role to admin
  UPDATE profiles
  SET role = 'admin'
  WHERE id = user_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to remove admin status
CREATE OR REPLACE FUNCTION public.remove_user_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the calling user is an admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can remove admin status';
  END IF;

  -- Update the user's role back to user
  UPDATE profiles
  SET role = 'user'
  WHERE id = user_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to set up initial admin user
CREATE OR REPLACE FUNCTION setup_initial_admin()
RETURNS VOID AS $$
BEGIN
  -- Update or insert the admin user
  INSERT INTO profiles (id, email, role)
  SELECT id, email, 'admin'
  FROM auth.users
  WHERE email = 'admin@learningcrypto.com'
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the function to set up initial admin
SELECT setup_initial_admin(); 