-- Fix foreign key constraint for predefined_messages table
-- The created_by field should reference app_users table, not auth.users table

-- First, drop the existing foreign key constraint
ALTER TABLE predefined_messages DROP CONSTRAINT IF EXISTS predefined_messages_created_by_fkey;

-- Add the correct foreign key constraint to reference app_users table
ALTER TABLE predefined_messages 
ADD CONSTRAINT predefined_messages_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES app_users(id);

-- Alternative: If you want to make created_by nullable (optional)
-- ALTER TABLE predefined_messages ALTER COLUMN created_by DROP NOT NULL;

-- Alternative: If you want to remove the foreign key constraint entirely (for testing)
-- ALTER TABLE predefined_messages DROP CONSTRAINT IF EXISTS predefined_messages_created_by_fkey; 