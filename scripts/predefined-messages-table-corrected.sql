-- Create predefined_messages table with correct foreign key
CREATE TABLE IF NOT EXISTS predefined_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  created_by UUID REFERENCES app_users(id), -- Corrected: references app_users, not auth.users
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_predefined_messages_category ON predefined_messages(category);
CREATE INDEX IF NOT EXISTS idx_predefined_messages_created_by ON predefined_messages(created_by);
CREATE INDEX IF NOT EXISTS idx_predefined_messages_is_active ON predefined_messages(is_active);

-- Enable Row Level Security
ALTER TABLE predefined_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow super_admin and team_lead to create, read, update, delete all messages
CREATE POLICY "Super admin and team lead can manage all predefined messages" ON predefined_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM app_users 
      WHERE app_users.id = created_by 
      AND app_users.role IN ('super_admin', 'team_lead')
    )
  );

-- Allow call_operator to read all active messages
CREATE POLICY "Call operators can read active predefined messages" ON predefined_messages
  FOR SELECT USING (
    is_active = true
  );

-- Allow users to read their own messages
CREATE POLICY "Users can read their own messages" ON predefined_messages
  FOR SELECT USING (created_by = (
    SELECT id FROM app_users WHERE email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  ));

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_predefined_messages_updated_at 
  BEFORE UPDATE ON predefined_messages 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column(); 