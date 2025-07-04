-- Fix RLS policies for predefined_messages table
-- Drop existing policies first
DROP POLICY IF EXISTS "Super admin and team lead can manage all predefined messages" ON predefined_messages;
DROP POLICY IF EXISTS "Call operators can read active predefined messages" ON predefined_messages;
DROP POLICY IF EXISTS "Users can read their own messages" ON predefined_messages;

-- Create corrected RLS policies
-- Allow super_admin and team_lead to create, read, update, delete all messages
-- This policy checks if the authenticated user exists in app_users with the correct role
CREATE POLICY "Super admin and team lead can manage all predefined messages" ON predefined_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM app_users 
      WHERE app_users.email = (
        SELECT email FROM auth.users WHERE id = auth.uid()
      )
      AND app_users.role IN ('super_admin', 'team_lead')
    )
  );

-- Allow call_operator to read all active messages
CREATE POLICY "Call operators can read active predefined messages" ON predefined_messages
  FOR SELECT USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM app_users 
      WHERE app_users.email = (
        SELECT email FROM auth.users WHERE id = auth.uid()
      )
      AND app_users.role = 'call_operator'
    )
  );

-- Allow users to read their own messages
CREATE POLICY "Users can read their own messages" ON predefined_messages
  FOR SELECT USING (created_by = auth.uid());

-- Alternative: If the above doesn't work, try this simpler approach
-- Allow all authenticated users to manage predefined messages (for testing)
-- Uncomment the lines below if you want to temporarily disable RLS restrictions

/*
DROP POLICY IF EXISTS "Allow all authenticated users to manage predefined messages" ON predefined_messages;
CREATE POLICY "Allow all authenticated users to manage predefined messages" ON predefined_messages
  FOR ALL USING (auth.uid() IS NOT NULL);
*/ 