-- Manual SQL script to add team_lead role support
-- Run this in your Supabase SQL editor

-- 1. Drop the existing check constraint
ALTER TABLE app_users 
DROP CONSTRAINT IF EXISTS app_users_role_check;

-- 2. Add new check constraint with team_lead role
ALTER TABLE app_users 
ADD CONSTRAINT app_users_role_check 
CHECK (role IN ('salesman', 'call_operator', 'technician', 'team_lead', 'super_admin'));

-- 3. Insert the team lead user
INSERT INTO app_users (
  id, 
  email, 
  name, 
  phone, 
  role, 
  password_hash, 
  is_active, 
  created_at, 
  updated_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440008',
  'teamlead@roshni.com',
  'Team Lead Manager',
  '+91-9876543218',
  'team_lead',
  '$2b$10$rQZ8kHp.TB.It.NNlClXve5LKlQBYlpjOLaD5QxoR8L6cpNUU6TL2',
  true,
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  role = EXCLUDED.role,
  password_hash = EXCLUDED.password_hash,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- 4. Verify the user was created
SELECT id, email, name, role, is_active FROM app_users WHERE email = 'teamlead@roshni.com'; 