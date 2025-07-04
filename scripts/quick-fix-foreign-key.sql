-- Quick fix for foreign key constraint issue
-- Option 1: Drop the foreign key constraint entirely (simplest fix)
ALTER TABLE predefined_messages DROP CONSTRAINT IF EXISTS predefined_messages_created_by_fkey;

-- Option 2: Make created_by nullable (if you want to keep the field but make it optional)
-- ALTER TABLE predefined_messages ALTER COLUMN created_by DROP NOT NULL;

-- Option 3: Add correct foreign key to app_users table (if you want proper referential integrity)
-- ALTER TABLE predefined_messages ADD CONSTRAINT predefined_messages_created_by_fkey FOREIGN KEY (created_by) REFERENCES app_users(id); 