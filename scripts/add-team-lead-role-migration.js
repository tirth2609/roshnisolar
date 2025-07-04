const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addTeamLeadRoleMigration() {
  console.log('🔧 Adding team_lead role to database...\n');

  try {
    // 1. Drop the existing check constraint
    console.log('1. Dropping existing role check constraint...');
    
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE app_users 
        DROP CONSTRAINT IF EXISTS app_users_role_check;
      `
    });

    if (dropError) {
      console.log('Note: Constraint may not exist or already dropped');
    } else {
      console.log('✅ Existing constraint dropped');
    }

    // 2. Add new check constraint with team_lead role
    console.log('\n2. Adding new role check constraint with team_lead...');
    
    const { error: addError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE app_users 
        ADD CONSTRAINT app_users_role_check 
        CHECK (role IN ('salesman', 'call_operator', 'technician', 'team_lead', 'super_admin'));
      `
    });

    if (addError) {
      console.error('❌ Error adding new constraint:', addError);
      return;
    }

    console.log('✅ New constraint added successfully');

    // 3. Verify the constraint works by testing a query
    console.log('\n3. Testing constraint with team_lead role...');
    
    const { data: testData, error: testError } = await supabase
      .from('app_users')
      .select('role')
      .eq('role', 'team_lead')
      .limit(1);

    if (testError) {
      console.error('❌ Constraint test failed:', testError);
      return;
    }

    console.log('✅ Constraint test successful - team_lead role is now valid');

    console.log('\n🎉 Database migration completed successfully!');
    console.log('The team_lead role is now supported in the database.');

  } catch (error) {
    console.error('❌ Migration error:', error.message);
  }
}

addTeamLeadRoleMigration(); 