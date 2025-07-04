const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTeamLeadBypass() {
  console.log('🔧 Creating team lead user with bypass approach...\n');

  try {
    // 1. First, let's try to create the user with a valid role first, then update
    console.log('1. Creating user with temporary role...');
    
    const tempUserData = {
      id: '550e8400-e29b-41d4-a716-446655440008',
      email: 'teamlead@roshni.com',
      name: 'Team Lead Manager',
      phone: '+91-9876543218',
      role: 'call_operator', // Start with a valid role
      password_hash: '$2b$10$rQZ8kHp.TB.It.NNlClXve5LKlQBYlpjOLaD5QxoR8L6cpNUU6TL2', // password: 123456
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: userData, error: userError } = await supabase
      .from('app_users')
      .upsert(tempUserData, { 
        onConflict: 'email',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (userError) {
      console.error('❌ Error creating user with temporary role:', userError);
      return;
    }

    console.log('✅ User created with temporary role:', userData.role);

    // 2. Now try to update the role to team_lead
    console.log('\n2. Attempting to update role to team_lead...');
    
    const { data: updateData, error: updateError } = await supabase
      .from('app_users')
      .update({ 
        role: 'team_lead',
        updated_at: new Date().toISOString()
      })
      .eq('email', 'teamlead@roshni.com')
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating to team_lead role:', updateError);
      console.log('This means the database constraint needs to be updated manually.');
      console.log('\n📋 Manual Steps Required:');
      console.log('1. Go to your Supabase dashboard');
      console.log('2. Open the SQL editor');
      console.log('3. Run the SQL script from: scripts/manual-team-lead-setup.sql');
      console.log('4. Then run this script again to verify the user');
      return;
    }

    console.log('✅ Role updated successfully to:', updateData.role);

    // 3. Verify the final user
    console.log('\n3. Verifying final user...');
    
    const { data: finalUser, error: finalError } = await supabase
      .from('app_users')
      .select('*')
      .eq('email', 'teamlead@roshni.com')
      .single();

    if (finalError) {
      console.error('❌ Error verifying final user:', finalError);
      return;
    }

    console.log('✅ Final user verification successful');
    console.log('User details:', {
      id: finalUser.id,
      email: finalUser.email,
      name: finalUser.name,
      role: finalUser.role,
      is_active: finalUser.is_active
    });

    console.log('\n🎉 Team lead user created successfully!');
    console.log('\nTeam Lead Login Details:');
    console.log('Email: teamlead@roshni.com');
    console.log('Password: 123456');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

createTeamLeadBypass(); 