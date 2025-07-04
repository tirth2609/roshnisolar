const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addTeamLeadUser() {
  console.log('🔧 Adding team lead user and test data...\n');

  try {
    // 1. Add team lead user
    console.log('1. Adding team lead user...');
    
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

    // 2. Add more test leads for team lead to assign
    console.log('\n2. Adding test leads for assignment...');
    
    const testLeads = [
      {
        id: '650e8400-e29b-41d4-a716-446655440011',
        customer_name: 'Test Customer 1',
        phone_number: '+91-9123456799',
        email: 'test1@email.com',
        address: 'Test Address 1, Bangalore, Karnataka',
        property_type: 'residential',
        likelihood: 'hot',
        status: 'new',
        salesman_id: '550e8400-e29b-41d4-a716-446655440001',
        salesman_name: 'John Smith',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '650e8400-e29b-41d4-a716-446655440012',
        customer_name: 'Test Customer 2',
        phone_number: '+91-9123456800',
        email: 'test2@email.com',
        address: 'Test Address 2, Bangalore, Karnataka',
        property_type: 'commercial',
        likelihood: 'warm',
        status: 'new',
        salesman_id: '550e8400-e29b-41d4-a716-446655440005',
        salesman_name: 'Raj Patel',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '650e8400-e29b-41d4-a716-446655440013',
        customer_name: 'Test Customer 3',
        phone_number: '+91-9123456801',
        email: 'test3@email.com',
        address: 'Test Address 3, Bangalore, Karnataka',
        property_type: 'industrial',
        likelihood: 'hot',
        status: 'new',
        salesman_id: '550e8400-e29b-41d4-a716-446655440001',
        salesman_name: 'John Smith',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    for (const lead of testLeads) {
      const { error } = await supabase
        .from('leads')
        .upsert(lead, { onConflict: 'id' });

      if (error) {
        console.log(`Note: Lead ${lead.customer_name} may already exist`);
      } else {
        console.log(`✅ Added test lead: ${lead.customer_name}`);
      }
    }

    console.log('\n✅ Team lead setup completed!');
    console.log('\nTeam Lead Login Details:');
    console.log('Email: teamlead@roshni.com');
    console.log('Password: 123456');
    console.log('\nYou can now:');
    console.log('1. Log in as team lead to assign leads from salesmen to call operators');
    console.log('2. Test the team lead dashboard functionality');
    console.log('3. Admin can add more team lead users through the admin dashboard');

  } catch (error) {
    console.error('❌ Error setting up team lead:', error.message);
  }
}

addTeamLeadUser(); 