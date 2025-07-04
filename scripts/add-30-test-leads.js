const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function add30TestLeads() {
  console.log('🔧 Adding 30 test leads for comprehensive testing...\n');

  try {
    // First, get existing salesmen
    console.log('1. Fetching existing salesmen...');
    const { data: salesmen, error: salesmenError } = await supabase
      .from('app_users')
      .select('id, name')
      .eq('role', 'salesman')
      .eq('is_active', true);

    if (salesmenError) {
      console.error('❌ Error fetching salesmen:', salesmenError);
      return;
    }

    if (!salesmen || salesmen.length === 0) {
      console.error('❌ No salesmen found. Please create salesmen first.');
      return;
    }

    console.log(`✅ Found ${salesmen.length} salesmen:`, salesmen.map(s => s.name));

    // Generate 30 test leads
    const testLeads = [];
    const propertyTypes = ['residential', 'commercial', 'industrial'];
    const likelihoods = ['hot', 'warm', 'cold'];
    const cities = ['Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata'];
    const areas = ['Downtown', 'Suburban', 'Industrial Zone', 'Residential Area', 'Business District'];

    for (let i = 1; i <= 30; i++) {
      const salesman = salesmen[Math.floor(Math.random() * salesmen.length)];
      const propertyType = propertyTypes[Math.floor(Math.random() * propertyTypes.length)];
      const likelihood = likelihoods[Math.floor(Math.random() * likelihoods.length)];
      const city = cities[Math.floor(Math.random() * cities.length)];
      const area = areas[Math.floor(Math.random() * areas.length)];

      const lead = {
        id: `650e8400-e29b-41d4-a716-44665544${(1000 + i).toString().padStart(4, '0')}`,
        customer_name: `Test Customer ${i}`,
        phone_number: `+91-9123456${(700 + i).toString().padStart(3, '0')}`,
        email: `test${i}@email.com`,
        address: `${area}, ${city}, India`,
        property_type: propertyType,
        likelihood: likelihood,
        status: 'new',
        salesman_id: salesman.id,
        salesman_name: salesman.name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      testLeads.push(lead);
    }

    console.log(`\n2. Adding ${testLeads.length} test leads...`);

    let successCount = 0;
    let errorCount = 0;

    for (const lead of testLeads) {
      const { error } = await supabase
        .from('leads')
        .upsert(lead, { onConflict: 'id' });

      if (error) {
        console.log(`❌ Error adding lead ${lead.customer_name}:`, error.message);
        errorCount++;
      } else {
        console.log(`✅ Added lead: ${lead.customer_name} (${lead.salesman_name})`);
        successCount++;
      }
    }

    console.log(`\n🎉 Test leads addition completed!`);
    console.log(`✅ Successfully added: ${successCount} leads`);
    console.log(`❌ Errors: ${errorCount} leads`);

    // Show distribution by salesman
    console.log('\n📊 Lead distribution by salesman:');
    const distribution = {};
    testLeads.forEach(lead => {
      if (!distribution[lead.salesman_name]) {
        distribution[lead.salesman_name] = 0;
      }
      distribution[lead.salesman_name]++;
    });

    Object.entries(distribution).forEach(([name, count]) => {
      console.log(`  ${name}: ${count} leads`);
    });

    console.log('\n🧪 Testing Instructions:');
    console.log('1. Login as team lead: teamlead@roshni.com / 123456');
    console.log('2. Select different salesmen to see their unassigned leads');
    console.log('3. Select multiple leads and assign them to call operators');
    console.log('4. Check operator workload after assignment');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

add30TestLeads(); 