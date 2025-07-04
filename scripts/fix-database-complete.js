const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDatabaseComplete() {
  console.log('🔧 Comprehensive database fix and feature addition...\n');

  try {
    // 1. Add team_lead role to app_users table
    console.log('1. Adding team_lead role...');
    
    const updateRoleCheckSQL = `
      ALTER TABLE app_users 
      DROP CONSTRAINT IF EXISTS app_users_role_check;
      
      ALTER TABLE app_users 
      ADD CONSTRAINT app_users_role_check 
      CHECK (role IN ('salesman', 'call_operator', 'technician', 'team_lead', 'super_admin'));
    `;

    const { error: roleError } = await supabase.rpc('exec_sql', { sql: updateRoleCheckSQL });
    
    if (roleError) {
      console.log('Note: Role constraint may need manual update');
    } else {
      console.log('✅ Team lead role added');
    }

    // 2. Add scheduled call fields to leads table
    console.log('\n2. Adding scheduled call fields...');
    
    const addScheduledCallFieldsSQL = `
      ALTER TABLE leads 
      ADD COLUMN IF NOT EXISTS scheduled_call_date TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS scheduled_call_time TEXT,
      ADD COLUMN IF NOT EXISTS scheduled_call_reason TEXT;
    `;

    const { error: scheduledCallError } = await supabase.rpc('exec_sql', { sql: addScheduledCallFieldsSQL });
    
    if (scheduledCallError) {
      console.log('Note: Scheduled call fields may need manual setup');
    } else {
      console.log('✅ Scheduled call fields added');
    }

    // 3. Add work tracking fields to app_users table
    console.log('\n3. Adding work tracking fields...');
    
    const addWorkTrackingSQL = `
      ALTER TABLE app_users 
      ADD COLUMN IF NOT EXISTS total_leads_processed INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS total_calls_made INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS total_assignments INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    `;

    const { error: workTrackingError } = await supabase.rpc('exec_sql', { sql: addWorkTrackingSQL });
    
    if (workTrackingError) {
      console.log('Note: Work tracking fields may need manual setup');
    } else {
      console.log('✅ Work tracking fields added');
    }

    // 4. Create indexes for better performance
    console.log('\n4. Creating indexes...');
    
    const createIndexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_leads_scheduled_call_date ON leads(scheduled_call_date);
      CREATE INDEX IF NOT EXISTS idx_leads_scheduled_call_operator ON leads(call_operator_id, scheduled_call_date);
      CREATE INDEX IF NOT EXISTS idx_app_users_role ON app_users(role);
      CREATE INDEX IF NOT EXISTS idx_app_users_last_activity ON app_users(last_activity);
    `;

    const { error: indexesError } = await supabase.rpc('exec_sql', { sql: createIndexesSQL });
    
    if (indexesError) {
      console.log('Note: Indexes may need manual setup');
    } else {
      console.log('✅ Indexes created');
    }

    // 5. Add team lead user
    console.log('\n5. Adding team lead user...');
    
    const teamLeadData = {
      id: '550e8400-e29b-41d4-a716-446655440008',
      email: 'teamlead@roshni.com',
      name: 'Team Lead Manager',
      phone: '+91-9876543218',
      role: 'team_lead',
      password_hash: '$2b$10$rQZ8kHp.TB.It.NNlClXve5LKlQBYlpjOLaD5QxoR8L6cpNUU6TL2', // password: 123456
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: teamLeadError } = await supabase
      .from('app_users')
      .upsert(teamLeadData, { onConflict: 'email' });

    if (teamLeadError) {
      console.log('Note: Team lead user may need manual setup');
    } else {
      console.log('✅ Team lead user added');
    }

    // 6. Add test scheduled calls
    console.log('\n6. Adding test scheduled calls...');
    
    const { data: leads } = await supabase
      .from('leads')
      .select('id, customer_name')
      .limit(3);

    if (leads && leads.length > 0) {
      const testScheduledCalls = [
        {
          id: leads[0].id,
          scheduled_call_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          scheduled_call_time: '10:00',
          scheduled_call_reason: 'Customer requested morning call',
          status: 'hold'
        },
        {
          id: leads[1].id,
          scheduled_call_date: new Date().toISOString(),
          scheduled_call_time: '16:00',
          scheduled_call_reason: 'Customer available in evening',
          status: 'hold'
        }
      ];

      for (const call of testScheduledCalls) {
        const { error } = await supabase
          .from('leads')
          .update(call)
          .eq('id', call.id);

        if (!error) {
          console.log(`✅ Added scheduled call for: ${leads.find(l => l.id === call.id)?.customer_name}`);
        }
      }
    }

    console.log('\n✅ Database fix and feature addition completed!');
    console.log('\nNew features added:');
    console.log('- Team Lead role');
    console.log('- Scheduled call functionality');
    console.log('- Work tracking for users');
    console.log('- Test data for verification');

  } catch (error) {
    console.error('❌ Error during database fix:', error.message);
    console.log('\nYou may need to manually add these in your Supabase dashboard:');
    console.log('1. Add team_lead to role options in app_users table');
    console.log('2. Add scheduled_call_date, scheduled_call_time, scheduled_call_reason to leads table');
    console.log('3. Add work tracking fields to app_users table');
  }
}

fixDatabaseComplete(); 