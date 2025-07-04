const { createClient } = require('@supabase/supabase-js');

// Use the same environment variables as the app
const supabaseUrl = 'https://your-project.supabase.co'; // Replace with your actual URL
const supabaseServiceKey = 'your-service-role-key'; // Replace with your actual service role key

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Please update the script with your Supabase credentials');
  console.error('❌ Replace the placeholder values in the script with your actual Supabase URL and service role key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createPredefinedMessagesTable() {
  try {
    console.log('🔧 Creating predefined_messages table...');

    // Create the table using direct SQL
    const { error: createTableError } = await supabase
      .from('predefined_messages')
      .select('*')
      .limit(1);

    if (createTableError && createTableError.code === '42P01') {
      // Table doesn't exist, create it
      console.log('📋 Table does not exist, creating it...');
      
      // Note: You'll need to create the table manually in your Supabase dashboard
      // or use the SQL editor with the following SQL:
      console.log(`
        Please run this SQL in your Supabase SQL Editor:

        CREATE TABLE IF NOT EXISTS predefined_messages (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          category TEXT NOT NULL DEFAULT 'general',
          created_by UUID REFERENCES auth.users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          is_active BOOLEAN DEFAULT true
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_predefined_messages_category ON predefined_messages(category);
        CREATE INDEX IF NOT EXISTS idx_predefined_messages_created_by ON predefined_messages(created_by);
        CREATE INDEX IF NOT EXISTS idx_predefined_messages_is_active ON predefined_messages(is_active);

        -- Enable RLS
        ALTER TABLE predefined_messages ENABLE ROW LEVEL SECURITY;

        -- Create RLS policies
        CREATE POLICY "Super admin and team lead can manage all predefined messages" ON predefined_messages
          FOR ALL USING (
            EXISTS (
              SELECT 1 FROM app_users 
              WHERE app_users.id = auth.uid() 
              AND app_users.role IN ('super_admin', 'team_lead')
            )
          );

        CREATE POLICY "Call operators can read active predefined messages" ON predefined_messages
          FOR SELECT USING (
            is_active = true AND
            EXISTS (
              SELECT 1 FROM app_users 
              WHERE app_users.id = auth.uid() 
              AND app_users.role = 'call_operator'
            )
          );

        CREATE POLICY "Users can read their own messages" ON predefined_messages
          FOR SELECT USING (created_by = auth.uid());

        -- Create trigger function
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql';

        -- Create trigger
        CREATE TRIGGER update_predefined_messages_updated_at 
          BEFORE UPDATE ON predefined_messages 
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column();
      `);
    } else if (createTableError) {
      console.error('❌ Error checking table:', createTableError);
      return;
    } else {
      console.log('✅ predefined_messages table already exists!');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createPredefinedMessagesTable(); 