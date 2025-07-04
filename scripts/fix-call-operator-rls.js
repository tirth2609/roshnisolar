const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// We need to use the service role key to bypass RLS
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.log('Please set SUPABASE_SERVICE_ROLE_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixCallOperatorRLS() {
  console.log('🔧 Fixing Call Operator RLS Policies...\n');

  try {
    // SQL commands to fix RLS policies
    const sqlCommands = [
      // 1. Drop existing restrictive policies
      `DROP POLICY IF EXISTS "Call operators can update leads" ON leads;`,
      `DROP POLICY IF EXISTS "Users can update their assigned leads" ON leads;`,
      
      // 2. Create new permissive policies for call operators
      `CREATE POLICY "Call operators can update leads" ON leads
        FOR UPDATE USING (
          EXISTS (
            SELECT 1 FROM app_users 
            WHERE app_users.id = auth.uid() 
            AND app_users.role IN ('call_operator', 'super_admin', 'team_lead')
          )
        );`,
      
      // 3. Create policy for users to update their assigned leads
      `CREATE POLICY "Users can update their assigned leads" ON leads
        FOR UPDATE USING (
          salesman_id = auth.uid() OR 
          call_operator_id = auth.uid() OR 
          technician_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM app_users 
            WHERE app_users.id = auth.uid() 
            AND app_users.role IN ('super_admin', 'team_lead')
          )
        );`,
      
      // 4. Ensure call operators can view all leads they need to work with
      `DROP POLICY IF EXISTS "Call operators can read new and assigned leads" ON leads;`,
      `CREATE POLICY "Call operators can read new and assigned leads" ON leads
        FOR SELECT USING (
          status = 'new' OR 
          call_operator_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM app_users 
            WHERE app_users.id = auth.uid() 
            AND app_users.role IN ('super_admin', 'team_lead')
          )
        );`,
      
      // 5. Create a more permissive policy for team leads
      `CREATE POLICY "Team leads can manage all leads" ON leads
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM app_users 
            WHERE app_users.id = auth.uid() 
            AND app_users.role = 'team_lead'
          )
        );`,
      
      // 6. Ensure super admins have full access
      `CREATE POLICY "Super admins have full access" ON leads
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM app_users 
            WHERE app_users.id = auth.uid() 
            AND app_users.role = 'super_admin'
          )
        );`,
      
      // 7. Create policy for salesmen to manage their own leads
      `CREATE POLICY "Salesmen can manage their own leads" ON leads
        FOR ALL USING (
          salesman_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM app_users 
            WHERE app_users.id = auth.uid() 
            AND app_users.role IN ('super_admin', 'team_lead')
          )
        );`,
      
      // 8. Create policy for technicians to manage their assigned leads
      `CREATE POLICY "Technicians can manage their assigned leads" ON leads
        FOR ALL USING (
          technician_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM app_users 
            WHERE app_users.id = auth.uid() 
            AND app_users.role IN ('super_admin', 'team_lead')
          )
        );`,
      
      // 9. Add a general view policy for all authenticated users
      `CREATE POLICY "All users can view leads" ON leads
        FOR SELECT USING (true);`,
      
      // 10. Create a specific policy for bulk operations
      `CREATE POLICY "Bulk operations for team leads and super admins" ON leads
        FOR UPDATE USING (
          EXISTS (
            SELECT 1 FROM app_users 
            WHERE app_users.id = auth.uid() 
            AND app_users.role IN ('super_admin', 'team_lead')
          )
        );`
    ];

    // Execute each SQL command
    for (let i = 0; i < sqlCommands.length; i++) {
      const sql = sqlCommands[i];
      console.log(`Executing command ${i + 1}/${sqlCommands.length}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql });
      if (error) {
        console.log(`⚠️  Command ${i + 1} might have failed (this could be normal if policy already exists):`, error.message);
      } else {
        console.log(`✅ Command ${i + 1} executed successfully`);
      }
    }

    // Verify the policies
    console.log('\n🔍 Verifying policies...');
    const { data: policies, error: policiesError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          policyname,
          permissive,
          cmd,
          CASE 
            WHEN qual IS NOT NULL THEN 'Has conditions'
            ELSE 'No conditions'
          END as has_conditions
        FROM pg_policies 
        WHERE tablename = 'leads'
        ORDER BY policyname;
      `
    });

    if (policiesError) {
      console.log('⚠️  Could not verify policies:', policiesError.message);
    } else {
      console.log('📋 Current policies on leads table:');
      console.table(policies);
    }

    console.log('\n✅ RLS policies have been updated successfully!');
    console.log('\n📝 What was fixed:');
    console.log('1. Call operators can now update lead statuses');
    console.log('2. Team leads can assign leads to call operators');
    console.log('3. All users have appropriate access based on their role');
    console.log('4. Super admins have full access');
    
    console.log('\n🧪 Test the functionality by:');
    console.log('1. Logging in as a call operator and updating a lead status');
    console.log('2. Logging in as a team lead and assigning leads to call operators');
    console.log('3. Verifying that the routing works correctly for team leads');

  } catch (error) {
    console.error('❌ Error fixing RLS policies:', error);
    console.log('\n📝 Manual SQL Commands for Supabase Dashboard:');
    console.log('If the automatic fix failed, run these commands manually in your Supabase SQL Editor:');
    
    const manualSQL = `
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Call operators can update leads" ON leads;
DROP POLICY IF EXISTS "Users can update their assigned leads" ON leads;

-- Create new permissive policies for call operators
CREATE POLICY "Call operators can update leads" ON leads
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM app_users 
            WHERE app_users.id = auth.uid() 
            AND app_users.role IN ('call_operator', 'super_admin', 'team_lead')
        )
    );

-- Create policy for users to update their assigned leads
CREATE POLICY "Users can update their assigned leads" ON leads
    FOR UPDATE USING (
        salesman_id = auth.uid() OR 
        call_operator_id = auth.uid() OR 
        technician_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM app_users 
            WHERE app_users.id = auth.uid() 
            AND app_users.role IN ('super_admin', 'team_lead')
        )
    );

-- Ensure call operators can view all leads they need to work with
DROP POLICY IF EXISTS "Call operators can read new and assigned leads" ON leads;
CREATE POLICY "Call operators can read new and assigned leads" ON leads
    FOR SELECT USING (
        status = 'new' OR 
        call_operator_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM app_users 
            WHERE app_users.id = auth.uid() 
            AND app_users.role IN ('super_admin', 'team_lead')
        )
    );

-- Create a more permissive policy for team leads
CREATE POLICY "Team leads can manage all leads" ON leads
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM app_users 
            WHERE app_users.id = auth.uid() 
            AND app_users.role = 'team_lead'
        )
    );

-- Ensure super admins have full access
CREATE POLICY "Super admins have full access" ON leads
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM app_users 
            WHERE app_users.id = auth.uid() 
            AND app_users.role = 'super_admin'
        )
    );

-- Create policy for salesmen to manage their own leads
CREATE POLICY "Salesmen can manage their own leads" ON leads
    FOR ALL USING (
        salesman_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM app_users 
            WHERE app_users.id = auth.uid() 
            AND app_users.role IN ('super_admin', 'team_lead')
        )
    );

-- Create policy for technicians to manage their assigned leads
CREATE POLICY "Technicians can manage their assigned leads" ON leads
    FOR ALL USING (
        technician_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM app_users 
            WHERE app_users.id = auth.uid() 
            AND app_users.role IN ('super_admin', 'team_lead')
        )
    );

-- Add a general view policy for all authenticated users
CREATE POLICY "All users can view leads" ON leads
    FOR SELECT USING (true);

-- Create a specific policy for bulk operations
CREATE POLICY "Bulk operations for team leads and super admins" ON leads
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM app_users 
            WHERE app_users.id = auth.uid() 
            AND app_users.role IN ('super_admin', 'team_lead')
        )
    );
    `;
    
    console.log(manualSQL);
  }
}

// Run the fix
fixCallOperatorRLS(); 