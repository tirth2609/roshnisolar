const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyTeamLead() {
  console.log('🔍 Verifying team lead user...\n');

  try {
    const { data: user, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('email', 'teamlead@roshni.com')
      .single();

    if (error) {
      console.error('❌ Error fetching user:', error);
      return;
    }

    console.log('✅ Team lead user found:');
    console.log('ID:', user.id);
    console.log('Email:', user.email);
    console.log('Name:', user.name);
    console.log('Role:', user.role);
    console.log('Active:', user.is_active);
    console.log('Created:', user.created_at);
    console.log('Updated:', user.updated_at);

    if (user.role === 'team_lead') {
      console.log('\n🎉 SUCCESS! Team lead user is properly configured.');
      console.log('\nLogin Details:');
      console.log('Email: teamlead@roshni.com');
      console.log('Password: 123456');
      console.log('\nYou can now log in as team lead!');
    } else {
      console.log('\n❌ User exists but has wrong role:', user.role);
      console.log('Expected: team_lead');
      console.log('\nPlease run the SQL script in Supabase to update the role.');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

verifyTeamLead(); 