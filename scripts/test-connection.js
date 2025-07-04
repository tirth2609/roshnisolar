// Test script to verify Supabase connection and database setup
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  console.log('Please check your .env file contains:');
  console.log('EXPO_PUBLIC_SUPABASE_URL=your_supabase_url');
  console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔍 Testing Supabase connection...\n');

  try {
    // Test 1: Check if we can connect to Supabase
    console.log('1. Testing basic connection...');
    const { data, error } = await supabase.from('app_users').select('count').limit(1);
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      return;
    }
    console.log('✅ Basic connection successful\n');

    // Test 2: Check if tables exist and have data
    console.log('2. Checking database tables...');
    
    const tables = ['app_users', 'leads', 'support_tickets', 'customers', 'notifications'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          console.log(`❌ Table ${table}: ${error.message}`);
        } else {
          console.log(`✅ Table ${table}: ${data.length > 0 ? 'Has data' : 'Empty'}`);
        }
      } catch (err) {
        console.log(`❌ Table ${table}: ${err.message}`);
      }
    }
    console.log('');

    // Test 3: Check demo users
    console.log('3. Checking demo users...');
    const { data: users, error: usersError } = await supabase
      .from('app_users')
      .select('email, name, role, is_active')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('❌ Error fetching users:', usersError.message);
    } else {
      console.log(`✅ Found ${users.length} users:`);
      users.forEach(user => {
        console.log(`   - ${user.email} (${user.role}) - ${user.is_active ? 'Active' : 'Inactive'}`);
      });
    }
    console.log('');

    // Test 4: Check leads
    console.log('4. Checking leads...');
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('customer_name, status, salesman_name')
      .order('created_at', { ascending: false })
      .limit(5);

    if (leadsError) {
      console.error('❌ Error fetching leads:', leadsError.message);
    } else {
      console.log(`✅ Found ${leads.length} leads (showing first 5):`);
      leads.forEach(lead => {
        console.log(`   - ${lead.customer_name} (${lead.status}) - ${lead.salesman_name || 'Unassigned'}`);
      });
    }
    console.log('');

    // Test 5: Check support tickets
    console.log('5. Checking support tickets...');
    const { data: tickets, error: ticketsError } = await supabase
      .from('support_tickets')
      .select('title, status, operator_name')
      .order('created_at', { ascending: false })
      .limit(5);

    if (ticketsError) {
      console.error('❌ Error fetching tickets:', ticketsError.message);
    } else {
      console.log(`✅ Found ${tickets.length} tickets (showing first 5):`);
      tickets.forEach(ticket => {
        console.log(`   - ${ticket.title} (${ticket.status}) - ${ticket.operator_name || 'Unassigned'}`);
      });
    }
    console.log('');

    console.log('🎉 All tests completed!');
    console.log('\n📱 To connect your Android device:');
    console.log('1. Make sure your phone and computer are on the same WiFi');
    console.log('2. Run: npm run dev');
    console.log('3. Scan the QR code with Expo Go app');
    console.log('4. If QR doesn\'t work, try: npx expo start --tunnel');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testConnection(); 