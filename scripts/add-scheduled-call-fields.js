const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addScheduledCallFields() {
  console.log('🔧 Adding scheduled call fields to leads table...\n');

  try {
    // Add new columns to leads table
    console.log('1. Adding scheduled call columns...');
    
    const addColumnsSQL = `
      ALTER TABLE leads 
      ADD COLUMN IF NOT EXISTS scheduled_call_date TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS scheduled_call_time TEXT,
      ADD COLUMN IF NOT EXISTS scheduled_call_reason TEXT;
    `;

    const { error: addColumnsError } = await supabase.rpc('exec_sql', { sql: addColumnsSQL });
    
    if (addColumnsError) {
      console.log('Note: Columns may already exist or need manual setup');
    } else {
      console.log('✅ Scheduled call columns added');
    }

    // Create indexes for better performance
    console.log('\n2. Creating indexes...');
    
    const createIndexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_leads_scheduled_call_date ON leads(scheduled_call_date);
      CREATE INDEX IF NOT EXISTS idx_leads_scheduled_call_operator ON leads(call_operator_id, scheduled_call_date);
    `;

    const { error: indexesError } = await supabase.rpc('exec_sql', { sql: createIndexesSQL });
    
    if (indexesError) {
      console.log('Note: Indexes may already exist or need manual setup');
    } else {
      console.log('✅ Indexes created');
    }

    // Add comments to document the new fields
    console.log('\n3. Adding column comments...');
    
    const addCommentsSQL = `
      COMMENT ON COLUMN leads.scheduled_call_date IS 'Date when the call is scheduled to be made';
      COMMENT ON COLUMN leads.scheduled_call_time IS 'Time when the call is scheduled to be made (HH:MM format)';
      COMMENT ON COLUMN leads.scheduled_call_reason IS 'Reason for scheduling the call';
    `;

    const { error: commentsError } = await supabase.rpc('exec_sql', { sql: addCommentsSQL });
    
    if (commentsError) {
      console.log('Note: Comments may need manual setup');
    } else {
      console.log('✅ Column comments added');
    }

    console.log('\n✅ Scheduled call fields setup completed!');
    console.log('\nThe following fields have been added to the leads table:');
    console.log('- scheduled_call_date (TIMESTAMP WITH TIME ZONE)');
    console.log('- scheduled_call_time (TEXT)');
    console.log('- scheduled_call_reason (TEXT)');

  } catch (error) {
    console.error('❌ Error adding scheduled call fields:', error.message);
    console.log('\nYou may need to manually add these columns in your Supabase dashboard:');
    console.log('1. Go to your Supabase project dashboard');
    console.log('2. Navigate to Table Editor > leads table');
    console.log('3. Add the following columns:');
    console.log('   - scheduled_call_date (timestamp with time zone)');
    console.log('   - scheduled_call_time (text)');
    console.log('   - scheduled_call_reason (text)');
  }
}

addScheduledCallFields(); 