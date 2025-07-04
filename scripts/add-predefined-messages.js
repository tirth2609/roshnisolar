const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addPredefinedMessages() {
  console.log('🔧 Adding predefined messages table and sample data...\n');

  try {
    // 1. Create predefined_messages table
    console.log('1. Creating predefined_messages table...');
    
    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS predefined_messages (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          category VARCHAR(100) DEFAULT 'general',
          created_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          is_active BOOLEAN DEFAULT true
        );

        -- Add RLS policies
        ALTER TABLE predefined_messages ENABLE ROW LEVEL SECURITY;

        -- Allow super_admin and team_lead to manage messages
        CREATE POLICY "super_admin_team_lead_manage_messages" ON predefined_messages
          FOR ALL USING (
            EXISTS (
              SELECT 1 FROM app_users 
              WHERE app_users.id = auth.uid() 
              AND app_users.role IN ('super_admin', 'team_lead')
            )
          );

        -- Allow call_operator to view active messages
        CREATE POLICY "call_operator_view_messages" ON predefined_messages
          FOR SELECT USING (
            is_active = true AND (
              EXISTS (
                SELECT 1 FROM app_users 
                WHERE app_users.id = auth.uid() 
                AND app_users.role = 'call_operator'
              )
            )
          );

        -- Create index for better performance
        CREATE INDEX IF NOT EXISTS idx_predefined_messages_category ON predefined_messages(category);
        CREATE INDEX IF NOT EXISTS idx_predefined_messages_active ON predefined_messages(is_active);
      `
    });

    if (tableError) {
      console.log('Note: Table creation may need manual setup');
      console.log('Error:', tableError.message);
    } else {
      console.log('✅ Predefined messages table created');
    }

    // 2. Add sample predefined messages
    console.log('\n2. Adding sample predefined messages...');
    
    const sampleMessages = [
      {
        title: 'Initial Contact',
        message: 'Hi! I\'m calling from Roshni Solar regarding your solar panel inquiry. Is this a good time to discuss your energy needs?',
        category: 'initial_contact',
        is_active: true
      },
      {
        title: 'Follow Up',
        message: 'Hello! I wanted to follow up on our previous conversation about solar panels. Do you have any questions or would you like to schedule a consultation?',
        category: 'follow_up',
        is_active: true
      },
      {
        title: 'Appointment Reminder',
        message: 'Hi! This is a reminder about your scheduled solar consultation tomorrow. We\'ll be calling you at the agreed time. Please let us know if you need to reschedule.',
        category: 'appointment',
        is_active: true
      },
      {
        title: 'Quote Follow Up',
        message: 'Hello! I hope you received the solar quote we sent. I\'d be happy to discuss any questions you might have about the proposal or schedule a site visit.',
        category: 'quote',
        is_active: true
      },
      {
        title: 'Installation Update',
        message: 'Hi! I wanted to update you on your solar installation progress. Our team is working efficiently to complete your project on schedule. We\'ll keep you informed of any updates.',
        category: 'installation',
        is_active: true
      },
      {
        title: 'Customer Support',
        message: 'Hello! I understand you have some questions about your solar system. I\'m here to help and ensure you\'re completely satisfied with your installation.',
        category: 'support',
        is_active: true
      },
      {
        title: 'Referral Request',
        message: 'Hi! Thank you for choosing Roshni Solar. If you\'re satisfied with our service, we\'d greatly appreciate if you could refer us to friends or family who might be interested in solar energy.',
        category: 'referral',
        is_active: true
      },
      {
        title: 'Seasonal Promotion',
        message: 'Hello! We\'re currently running a special promotion on solar installations. Would you be interested in learning about our limited-time offers and how they could benefit you?',
        category: 'promotion',
        is_active: true
      }
    ];

    for (const message of sampleMessages) {
      const { error: insertError } = await supabase
        .from('predefined_messages')
        .upsert(message, { onConflict: 'title' });

      if (insertError) {
        console.log(`Note: Message "${message.title}" may need manual setup`);
      } else {
        console.log(`✅ Added: ${message.title}`);
      }
    }

    console.log('\n✅ Predefined messages setup completed!');
    console.log('\nYou can now:');
    console.log('1. Super admins and team leads can manage messages through their dashboards');
    console.log('2. Call operators can use these messages via WhatsApp integration');
    console.log('3. Messages are categorized for better organization');

  } catch (error) {
    console.error('❌ Error setting up predefined messages:', error.message);
  }
}

addPredefinedMessages(); 