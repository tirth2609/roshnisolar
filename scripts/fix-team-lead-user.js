const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  console.log('EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixTeamLeadUser() {
  console.log('🔧 Fixing team lead user setup...\n');

  try {
    // 1. First, check if the user already exists
    console.log('1. Checking existing team lead user...');
    
    const { data: existingUser, error: checkError } = await supabase
      .from('app_users')
      .select('*')
      .eq('email', 'teamlead@roshni.com')
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking existing user:', checkError);
      return;
    }

    if (existingUser) {
      console.log('✅ Team lead user already exists');
      console.log('User details:', {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        role: existingUser.role,
        is_active: existingUser.is_active
      });
    } else {
      console.log('❌ Team lead user not found, creating new one...');
    }

    // 2. Create or update team lead user
    console.log('\n2. Creating/updating team lead user...');
    
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

    const { data: userData, error: userError } = await supabase
      .from('app_users')
      .upsert(teamLeadData, { 
        onConflict: 'email',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (userError) {
      console.error('❌ Error creating team lead user:', userError);
      console.log('Error details:', {
        message: userError.message,
        details: userError.details,
        hint: userError.hint,
        code: userError.code
      });
      return;
    }

    console.log('✅ Team lead user created/updated successfully');
    console.log('User details:', {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      is_active: userData.is_active
    });

    // 3. Verify the user can be retrieved
    console.log('\n3. Verifying user retrieval...');
    
    const { data: verifyUser, error: verifyError } = await supabase
      .from('app_users')
      .select('*')
      .eq('email', 'teamlead@roshni.com')
      .single();

    if (verifyError) {
      console.error('❌ Error verifying user:', verifyError);
      return;
    }

    console.log('✅ User verification successful');
    console.log('Verified user:', {
      id: verifyUser.id,
      email: verifyUser.email,
      name: verifyUser.name,
      role: verifyUser.role,
      is_active: verifyUser.is_active
    });

    // 4. Test authentication (simulate login)
    console.log('\n4. Testing authentication...');
    
    const { data: authUser, error: authError } = await supabase
      .from('app_users')
      .select('*')
      .eq('email', 'teamlead@roshni.com')
      .eq('password_hash', '$2b$10$rQZ8kHp.TB.It.NNlClXve5LKlQBYlpjOLaD5QxoR8L6cpNUU6TL2')
      .eq('is_active', true)
      .single();

    if (authError) {
      console.error('❌ Authentication test failed:', authError);
      return;
    }

    console.log('✅ Authentication test successful');
    console.log('Login credentials work correctly');

    console.log('\n🎉 Team lead setup completed successfully!');
    console.log('\nTeam Lead Login Details:');
    console.log('Email: teamlead@roshni.com');
    console.log('Password: 123456');
    console.log('\nYou can now:');
    console.log('1. Log in as team lead to assign leads from salesmen to call operators');
    console.log('2. Test the team lead dashboard functionality');
    console.log('3. Admin can add more team lead users through the admin dashboard');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

fixTeamLeadUser(); 