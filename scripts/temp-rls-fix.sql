-- Temporary RLS fix for predefined_messages table
-- This allows all authenticated users to manage predefined messages
-- Use this for testing, then replace with proper role-based policies later

-- Drop existing policies
DROP POLICY IF EXISTS "Super admin and team lead can manage all predefined messages" ON predefined_messages;
DROP POLICY IF EXISTS "Call operators can read active predefined messages" ON predefined_messages;
DROP POLICY IF EXISTS "Users can read their own messages" ON predefined_messages;

-- Create a simple policy that allows all authenticated users to manage predefined messages
CREATE POLICY "Allow all authenticated users to manage predefined messages" ON predefined_messages
  FOR ALL USING (auth.uid() IS NOT NULL);

-- This policy allows:
-- 1. Any authenticated user to create, read, update, delete predefined messages
-- 2. No role restrictions (for testing purposes)
-- 3. Simple authentication check

-- Once testing is complete, replace this with proper role-based policies 