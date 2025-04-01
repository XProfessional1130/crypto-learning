-- First, drop existing policies
DROP POLICY IF EXISTS "Public can view published public content" ON content;
DROP POLICY IF EXISTS "Members can view member content" ON content;
DROP POLICY IF EXISTS "Content authors can manage their own content" ON content;
DROP POLICY IF EXISTS "Admins can manage all content" ON content;

-- Create simplified policies that don't cause recursion
-- 1. Allow anyone to read published public content
CREATE POLICY "Public can view published public content"
ON content
FOR SELECT
USING (
  status = 'published' 
  AND visibility = 'public'
);

-- 2. Allow authenticated users to view member content
CREATE POLICY "Members can view member content"
ON content
FOR SELECT
USING (
  status = 'published' 
  AND visibility = 'public'
);

-- 3. Allow content authors to manage their own content
CREATE POLICY "Content authors can manage their own content"
ON content
FOR ALL
USING (author_id = auth.uid());

-- 4. Allow admins to manage all content (using JWT only)
CREATE POLICY "Admins can manage all content"
ON content
FOR ALL
USING (auth.jwt()->>'role' = 'service_role'); 