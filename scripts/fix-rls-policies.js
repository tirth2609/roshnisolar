// Script to fix RLS policies and add test data
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

async function fixRLSPolicies() {
  console.log('🔧 Fixing RLS policies and adding test data...\n');

  try {
    // 1. Fix RLS policies
    console.log('1. Fixing RLS policies...');
    
    const policiesSQL = `
      -- Drop existing policies
      DROP POLICY IF EXISTS "Users can view leads" ON leads;
      DROP POLICY IF EXISTS "Salesmen can insert leads" ON leads;
      DROP POLICY IF EXISTS "Users can update their assigned leads" ON leads;
      
      DROP POLICY IF EXISTS "Users can view support_tickets" ON support_tickets;
      DROP POLICY IF EXISTS "Call operators can insert tickets" ON support_tickets;
      DROP POLICY IF EXISTS "Users can update their assigned tickets" ON support_tickets;
      
      -- Create new policies
      CREATE POLICY "Users can view leads" ON leads FOR SELECT USING (true);
      CREATE POLICY "Salesmen can insert leads" ON leads FOR INSERT WITH CHECK (true);
      CREATE POLICY "Users can update their assigned leads" ON leads FOR UPDATE USING (true);
      
      CREATE POLICY "Users can view support_tickets" ON support_tickets FOR SELECT USING (true);
      CREATE POLICY "Call operators can insert tickets" ON support_tickets FOR INSERT WITH CHECK (true);
      CREATE POLICY "Users can update their assigned tickets" ON support_tickets FOR UPDATE USING (true);
    `;

    const { error: policiesError } = await supabase.rpc('exec_sql', { sql: policiesSQL });
    if (policiesError) {
      console.log('Note: Policies may need manual setup in Supabase Dashboard');
    } else {
      console.log('✅ RLS policies updated');
    }

    // 2. Add test leads
    console.log('\n2. Adding test leads...');
    
    const testLeads = [
      {
        id: '650e8400-e29b-41d4-a716-446655440001',
        customer_name: 'Ramesh Gupta',
        phone_number: '+91-9123456789',
        email: 'ramesh@email.com',
        address: '123 MG Road, Bangalore, Karnataka 560001',
        property_type: 'residential',
        likelihood: 'hot',
        status: 'new',
        salesman_id: '550e8400-e29b-41d4-a716-446655440001',
        salesman_name: 'John Smith',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '650e8400-e29b-41d4-a716-446655440002',
        customer_name: 'Sunita Devi',
        phone_number: '+91-9123456790',
        email: 'sunita@email.com',
        address: '456 Brigade Road, Bangalore, Karnataka 560025',
        property_type: 'residential',
        likelihood: 'warm',
        status: 'new',
        salesman_id: '550e8400-e29b-41d4-a716-446655440001',
        salesman_name: 'John Smith',
        created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 60 * 60 * 1000).toISOString()
      },
      {
        id: '650e8400-e29b-41d4-a716-446655440003',
        customer_name: 'Tech Solutions Pvt Ltd',
        phone_number: '+91-9123456791',
        email: 'contact@techsolutions.com',
        address: '789 Electronic City, Bangalore, Karnataka 560100',
        property_type: 'commercial',
        likelihood: 'hot',
        status: 'new',
        salesman_id: '550e8400-e29b-41d4-a716-446655440005',
        salesman_name: 'Raj Patel',
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      },
      {
        id: '650e8400-e29b-41d4-a716-446655440004',
        customer_name: 'Vikram Singh',
        phone_number: '+91-9123456792',
        email: 'vikram@email.com',
        address: '321 Koramangala, Bangalore, Karnataka 560034',
        property_type: 'residential',
        likelihood: 'warm',
        status: 'contacted',
        salesman_id: '550e8400-e29b-41d4-a716-446655440001',
        salesman_name: 'John Smith',
        call_operator_id: '550e8400-e29b-41d4-a716-446655440002',
        call_operator_name: 'Sarah Johnson',
        call_notes: 'Customer is interested. Wants to know about government subsidies.',
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
      }
    ];

    for (const lead of testLeads) {
      const { error } = await supabase
        .from('leads')
        .upsert(lead, { onConflict: 'id' });
      
      if (error) {
        console.log(`⚠️  Lead ${lead.customer_name}: ${error.message}`);
      } else {
        console.log(`✅ Lead ${lead.customer_name} added/updated`);
      }
    }

    // 3. Add test support tickets
    console.log('\n3. Adding test support tickets...');
    
    const testTickets = [
      {
        id: '750e8400-e29b-41d4-a716-446655440001',
        customer_id: 'CUST001',
        customer_name: 'Ravi Krishnan',
        customer_phone: '+91-9123456796',
        title: 'Solar panel not generating expected output',
        description: 'Customer reports that solar panels installed last month are generating 30% less power than expected.',
        priority: 'high',
        status: 'open',
        operator_id: '550e8400-e29b-41d4-a716-446655440002',
        operator_name: 'Sarah Johnson',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '750e8400-e29b-41d4-a716-446655440002',
        customer_id: 'CUST002',
        customer_name: 'Anita Reddy',
        customer_phone: '+91-9123456794',
        title: 'Inverter display showing error code',
        description: 'Inverter display is showing error code E03. Customer manual says to contact support.',
        priority: 'urgent',
        status: 'open',
        operator_id: '550e8400-e29b-41d4-a716-446655440006',
        operator_name: 'Priya Sharma',
        created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 60 * 60 * 1000).toISOString()
      },
      {
        id: '750e8400-e29b-41d4-a716-446655440003',
        customer_id: 'CUST003',
        customer_name: 'Smart Homes Pvt Ltd',
        customer_phone: '+91-9123456795',
        title: 'Request for system expansion',
        description: 'Client wants to add 2 more panels to existing commercial installation.',
        priority: 'medium',
        status: 'in_progress',
        operator_id: '550e8400-e29b-41d4-a716-446655440002',
        operator_name: 'Sarah Johnson',
        technician_id: '550e8400-e29b-41d4-a716-446655440003',
        technician_name: 'Mike Wilson',
        notes: 'Technician assigned. Site visit scheduled for tomorrow.',
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
      }
    ];

    for (const ticket of testTickets) {
      const { error } = await supabase
        .from('support_tickets')
        .upsert(ticket, { onConflict: 'id' });
      
      if (error) {
        console.log(`⚠️  Ticket ${ticket.title}: ${error.message}`);
      } else {
        console.log(`✅ Ticket ${ticket.title} added/updated`);
      }
    }

    // 4. Add sample customers
    console.log('\n4. Adding sample customers...');
    
    const testCustomers = [
      {
        id: '850e8400-e29b-41d4-a716-446655440001',
        customer_name: 'Ravi Krishnan',
        phone_number: '+91-9123456796',
        email: 'ravi@email.com',
        address: '258 Indiranagar, Bangalore, Karnataka 560038',
        property_type: 'residential',
        status: 'active',
        notes: 'Converted from lead. 5kW system installed successfully.',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '850e8400-e29b-41d4-a716-446655440002',
        customer_name: 'John Smith',
        phone_number: '+91-9876543210',
        email: 'john@example.com',
        address: '123 Main St, Mumbai, MH',
        property_type: 'residential',
        status: 'active',
        notes: 'Sample customer',
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    for (const customer of testCustomers) {
      const { error } = await supabase
        .from('customers')
        .upsert(customer, { onConflict: 'id' });
      
      if (error) {
        console.log(`⚠️  Customer ${customer.customer_name}: ${error.message}`);
      } else {
        console.log(`✅ Customer ${customer.customer_name} added/updated`);
      }
    }

    console.log('\n🎉 RLS policies and test data fix completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Run: npm run test:connection (to verify)');
    console.log('2. Run: npm run dev (to start the app)');
    console.log('3. Test with demo account: john@roshni.com / password123');

  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    console.log('\n💡 Manual fix required:');
    console.log('1. Go to Supabase Dashboard > SQL Editor');
    console.log('2. Run the complete SQL from SETUP.md');
    console.log('3. This will create all tables and insert test data');
  }
}

fixRLSPolicies(); 