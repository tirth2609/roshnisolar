// Script to fix database issues
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDatabase() {
  console.log('🔧 Fixing database issues...\n');

  try {
    // 1. Create missing tables
    console.log('1. Creating missing tables...');
    
    const createTablesSQL = `
      -- Create customers table
      CREATE TABLE IF NOT EXISTS customers (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        customer_name TEXT NOT NULL,
        phone_number TEXT NOT NULL,
        email TEXT,
        address TEXT NOT NULL,
        property_type TEXT NOT NULL CHECK (property_type IN ('residential', 'commercial', 'industrial')),
        lead_id UUID REFERENCES leads(id),
        converted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create notifications table
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('reschedule', 'lead_assigned', 'lead_completed', 'general')),
        data JSONB,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    const { error: createError } = await supabase.rpc('exec_sql', { sql: createTablesSQL });
    if (createError) {
      console.log('Note: Tables may already exist or need manual creation');
    } else {
      console.log('✅ Tables created');
    }

    // 2. Insert missing demo users
    console.log('\n2. Adding missing demo users...');
    
    const demoUsers = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        email: 'john@roshni.com',
        name: 'John Smith',
        phone: '+91-9876543210',
        role: 'salesman',
        password_hash: '$2b$10$rQZ8kHp.TB.It.NNlClXve5LKlQBYlpjOLaD5QxoR8L6cpNUU6TL2',
        is_active: true
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        email: 'sarah@roshni.com',
        name: 'Sarah Johnson',
        phone: '+91-9876543211',
        role: 'call_operator',
        password_hash: '$2b$10$rQZ8kHp.TB.It.NNlClXve5LKlQBYlpjOLaD5QxoR8L6cpNUU6TL2',
        is_active: true
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        email: 'mike@roshni.com',
        name: 'Mike Wilson',
        phone: '+91-9876543212',
        role: 'technician',
        password_hash: '$2b$10$rQZ8kHp.TB.It.NNlClXve5LKlQBYlpjOLaD5QxoR8L6cpNUU6TL2',
        is_active: true
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440005',
        email: 'raj@roshni.com',
        name: 'Raj Patel',
        phone: '+91-9876543214',
        role: 'salesman',
        password_hash: '$2b$10$rQZ8kHp.TB.It.NNlClXve5LKlQBYlpjOLaD5QxoR8L6cpNUU6TL2',
        is_active: true
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440006',
        email: 'priya@roshni.com',
        name: 'Priya Sharma',
        phone: '+91-9876543215',
        role: 'call_operator',
        password_hash: '$2b$10$rQZ8kHp.TB.It.NNlClXve5LKlQBYlpjOLaD5QxoR8L6cpNUU6TL2',
        is_active: true
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440007',
        email: 'amit@roshni.com',
        name: 'Amit Kumar',
        phone: '+91-9876543216',
        role: 'technician',
        password_hash: '$2b$10$rQZ8kHp.TB.It.NNlClXve5LKlQBYlpjOLaD5QxoR8L6cpNUU6TL2',
        is_active: true
      }
    ];

    for (const user of demoUsers) {
      const { error } = await supabase
        .from('app_users')
        .upsert(user, { onConflict: 'email' });
      
      if (error) {
        console.log(`⚠️  User ${user.email}: ${error.message}`);
      } else {
        console.log(`✅ User ${user.email} added/updated`);
      }
    }

    // 3. Insert test leads
    console.log('\n3. Adding test leads...');
    
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

    // 4. Insert test support tickets
    console.log('\n4. Adding test support tickets...');
    
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

    console.log('\n🎉 Database fix completed!');
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

fixDatabase(); 