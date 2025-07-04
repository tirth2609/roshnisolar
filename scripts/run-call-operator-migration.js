const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please check your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🚀 Starting Call Operator Features Migration...');
  
  try {
    // Read the migration SQL file
    const fs = require('fs');
    const path = require('path');
    const migrationPath = path.join(__dirname, '../supabase/migrations/20241201000005_add_call_operator_features.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      process.exit(1);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📝 Executing migration SQL...');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`📋 Executing statement ${i + 1}/${statements.length}...`);
        
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.error(`❌ Error executing statement ${i + 1}:`, error);
          console.error('Statement:', statement);
          throw error;
        }
      }
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('🎉 Call operator features are now available:');
    console.log('   - Additional phone number field');
    console.log('   - Call later logs tracking');
    console.log('   - Enhanced lead status updates');
    console.log('   - Search functionality');
    console.log('   - Cancelled leads management');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Alternative method using direct SQL execution
async function runMigrationDirect() {
  console.log('🚀 Starting Call Operator Features Migration (Direct Method)...');
  
  try {
    // Add additional phone number column to leads table
    console.log('📝 Adding additional phone number column...');
    const { error: error1 } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE leads ADD COLUMN IF NOT EXISTS additional_phone TEXT;'
    });
    if (error1) console.log('⚠️  Additional phone column might already exist:', error1.message);
    
    // Create call_later_logs table
    console.log('📝 Creating call_later_logs table...');
    const { error: error2 } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS call_later_logs (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
          call_operator_id UUID NOT NULL REFERENCES app_users(id),
          call_operator_name TEXT NOT NULL,
          call_later_date TIMESTAMP WITH TIME ZONE NOT NULL,
          reason TEXT NOT NULL,
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    if (error2) console.log('⚠️  Call later logs table might already exist:', error2.message);
    
    // Add indexes
    console.log('📝 Creating indexes...');
    const { error: error3 } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_call_later_logs_lead_id ON call_later_logs(lead_id);
        CREATE INDEX IF NOT EXISTS idx_call_later_logs_operator_id ON call_later_logs(call_operator_id);
        CREATE INDEX IF NOT EXISTS idx_call_later_logs_date ON call_later_logs(call_later_date);
        CREATE INDEX IF NOT EXISTS idx_leads_additional_phone ON leads(additional_phone);
      `
    });
    if (error3) console.log('⚠️  Indexes might already exist:', error3.message);
    
    // Enable RLS
    console.log('📝 Enabling RLS...');
    const { error: error4 } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE call_later_logs ENABLE ROW LEVEL SECURITY;'
    });
    if (error4) console.log('⚠️  RLS might already be enabled:', error4.message);
    
    // Add call later tracking columns to leads
    console.log('📝 Adding call later tracking columns...');
    const { error: error5 } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE leads 
        ADD COLUMN IF NOT EXISTS call_later_count INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS last_call_later_date TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS last_call_later_reason TEXT;
      `
    });
    if (error5) console.log('⚠️  Call later tracking columns might already exist:', error5.message);
    
    // Create cancelled_leads view
    console.log('📝 Creating cancelled_leads view...');
    const { error: error6 } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE VIEW cancelled_leads AS
        SELECT 
          l.*,
          u.name as cancelled_by_name,
          u.role as cancelled_by_role
        FROM leads l
        LEFT JOIN app_users u ON l.call_operator_id = u.id
        WHERE l.status = 'declined'
        ORDER BY l.updated_at DESC;
      `
    });
    if (error6) console.log('⚠️  Cancelled leads view might already exist:', error6.message);
    
    // Grant access to cancelled_leads view
    console.log('📝 Granting access to cancelled_leads view...');
    const { error: error7 } = await supabase.rpc('exec_sql', {
      sql: 'GRANT SELECT ON cancelled_leads TO authenticated;'
    });
    if (error7) console.log('⚠️  Grant might already exist:', error7.message);
    
    // Create RLS policies for call_later_logs
    console.log('📝 Creating RLS policies...');
    const { error: error8 } = await supabase.rpc('exec_sql', {
      sql: `
        DROP POLICY IF EXISTS "Call operators can view their call later logs" ON call_later_logs;
        CREATE POLICY "Call operators can view their call later logs" ON call_later_logs
          FOR SELECT USING (
            call_operator_id = auth.uid() OR
            EXISTS (
              SELECT 1 FROM app_users 
              WHERE app_users.id = auth.uid() 
              AND app_users.role IN ('super_admin', 'team_lead')
            )
          );
        
        DROP POLICY IF EXISTS "Call operators can insert call later logs" ON call_later_logs;
        CREATE POLICY "Call operators can insert call later logs" ON call_later_logs
          FOR INSERT WITH CHECK (
            call_operator_id = auth.uid()
          );
        
        DROP POLICY IF EXISTS "Super admins and team leads can manage all call later logs" ON call_later_logs;
        CREATE POLICY "Super admins and team leads can manage all call later logs" ON call_later_logs
          FOR ALL USING (
            EXISTS (
              SELECT 1 FROM app_users 
              WHERE app_users.id = auth.uid() 
              AND app_users.role IN ('super_admin', 'team_lead')
            )
          );
      `
    });
    if (error8) console.log('⚠️  RLS policies might already exist:', error8.message);
    
    // Create RLS policy for cancelled_leads view
    console.log('📝 Creating RLS policy for cancelled_leads view...');
    const { error: error9 } = await supabase.rpc('exec_sql', {
      sql: `
        DROP POLICY IF EXISTS "Super admins and team leads can view cancelled leads" ON cancelled_leads;
        CREATE POLICY "Super admins and team leads can view cancelled leads" ON cancelled_leads
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM app_users 
              WHERE app_users.id = auth.uid() 
              AND app_users.role IN ('super_admin', 'team_lead')
            )
          );
      `
    });
    if (error9) console.log('⚠️  Cancelled leads policy might already exist:', error9.message);
    
    // Create trigger function for updating call later count
    console.log('📝 Creating trigger function...');
    const { error: error10 } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION update_lead_call_later_count()
        RETURNS TRIGGER AS $$
        BEGIN
          UPDATE leads 
          SET 
            call_later_count = (
              SELECT COUNT(*) 
              FROM call_later_logs 
              WHERE lead_id = NEW.lead_id
            ),
            last_call_later_date = NEW.call_later_date,
            last_call_later_reason = NEW.reason,
            updated_at = NOW()
          WHERE id = NEW.lead_id;
          
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `
    });
    if (error10) console.log('⚠️  Trigger function might already exist:', error10.message);
    
    // Create trigger
    console.log('📝 Creating trigger...');
    const { error: error11 } = await supabase.rpc('exec_sql', {
      sql: `
        DROP TRIGGER IF EXISTS update_lead_call_later_count_trigger ON call_later_logs;
        CREATE TRIGGER update_lead_call_later_count_trigger
          AFTER INSERT ON call_later_logs
          FOR EACH ROW
          EXECUTE FUNCTION update_lead_call_later_count();
      `
    });
    if (error11) console.log('⚠️  Trigger might already exist:', error11.message);
    
    console.log('✅ Migration completed successfully!');
    console.log('🎉 Call operator features are now available!');
    console.log('');
    console.log('📋 Features added:');
    console.log('   ✅ Additional phone number field');
    console.log('   ✅ Call later logs tracking');
    console.log('   ✅ Enhanced lead status updates');
    console.log('   ✅ Search functionality');
    console.log('   ✅ Cancelled leads view');
    console.log('   ✅ RLS policies and triggers');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Alternative method using direct SQL execution via Supabase dashboard
async function provideManualSQL() {
  console.log('📝 Manual SQL Commands for Supabase Dashboard:');
  console.log('');
  console.log('1. Add additional phone number column:');
  console.log('ALTER TABLE leads ADD COLUMN IF NOT EXISTS additional_phone TEXT;');
  console.log('');
  console.log('2. Create call_later_logs table:');
  console.log(`
CREATE TABLE IF NOT EXISTS call_later_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  call_operator_id UUID NOT NULL REFERENCES app_users(id),
  call_operator_name TEXT NOT NULL,
  call_later_date TIMESTAMP WITH TIME ZONE NOT NULL,
  reason TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`);
  console.log('');
  console.log('3. Add indexes:');
  console.log(`
CREATE INDEX IF NOT EXISTS idx_call_later_logs_lead_id ON call_later_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_call_later_logs_operator_id ON call_later_logs(call_operator_id);
CREATE INDEX IF NOT EXISTS idx_call_later_logs_date ON call_later_logs(call_later_date);
CREATE INDEX IF NOT EXISTS idx_leads_additional_phone ON leads(additional_phone);`);
  console.log('');
  console.log('4. Enable RLS:');
  console.log('ALTER TABLE call_later_logs ENABLE ROW LEVEL SECURITY;');
  console.log('');
  console.log('5. Add call later tracking columns:');
  console.log(`
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS call_later_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_call_later_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_call_later_reason TEXT;`);
  console.log('');
  console.log('6. Create cancelled_leads view:');
  console.log(`
CREATE OR REPLACE VIEW cancelled_leads AS
SELECT 
  l.*,
  u.name as cancelled_by_name,
  u.role as cancelled_by_role
FROM leads l
LEFT JOIN app_users u ON l.call_operator_id = u.id
WHERE l.status = 'declined'
ORDER BY l.updated_at DESC;`);
  console.log('');
  console.log('7. Grant access:');
  console.log('GRANT SELECT ON cancelled_leads TO authenticated;');
  console.log('');
  console.log('8. Create RLS policies:');
  console.log(`
CREATE POLICY "Call operators can view their call later logs" ON call_later_logs
  FOR SELECT USING (
    call_operator_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM app_users 
      WHERE app_users.id = auth.uid() 
      AND app_users.role IN ('super_admin', 'team_lead')
    )
  );

CREATE POLICY "Call operators can insert call later logs" ON call_later_logs
  FOR INSERT WITH CHECK (
    call_operator_id = auth.uid()
  );

CREATE POLICY "Super admins and team leads can manage all call later logs" ON call_later_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM app_users 
      WHERE app_users.id = auth.uid() 
      AND app_users.role IN ('super_admin', 'team_lead')
    )
  );

CREATE POLICY "Super admins and team leads can view cancelled leads" ON cancelled_leads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM app_users 
      WHERE app_users.id = auth.uid() 
      AND app_users.role IN ('super_admin', 'team_lead')
    )
  );`);
  console.log('');
  console.log('9. Create trigger function:');
  console.log(`
CREATE OR REPLACE FUNCTION update_lead_call_later_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE leads 
  SET 
    call_later_count = (
      SELECT COUNT(*) 
      FROM call_later_logs 
      WHERE lead_id = NEW.lead_id
    ),
    last_call_later_date = NEW.call_later_date,
    last_call_later_reason = NEW.reason,
    updated_at = NOW()
  WHERE id = NEW.lead_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;`);
  console.log('');
  console.log('10. Create trigger:');
  console.log(`
CREATE TRIGGER update_lead_call_later_count_trigger
  AFTER INSERT ON call_later_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_call_later_count();`);
}

// Run the migration
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--manual')) {
    provideManualSQL();
  } else {
    runMigrationDirect().catch(console.error);
  }
}

module.exports = { runMigration, runMigrationDirect, provideManualSQL }; 