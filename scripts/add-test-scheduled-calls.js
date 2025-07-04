const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addTestScheduledCalls() {
  console.log('🔧 Adding test scheduled calls...\n');

  try {
    // Get existing leads to update with scheduled calls
    const { data: leads, error: fetchError } = await supabase
      .from('leads')
      .select('id, customer_name, call_operator_id')
      .limit(5);

    if (fetchError) {
      console.error('Error fetching leads:', fetchError);
      return;
    }

    if (!leads || leads.length === 0) {
      console.log('No leads found to update');
      return;
    }

    console.log(`Found ${leads.length} leads to update with scheduled calls`);

    // Create test scheduled calls
    const updates = [
      {
        id: leads[0].id,
        scheduled_call_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        scheduled_call_time: '10:00',
        scheduled_call_reason: 'Customer requested morning call',
        status: 'hold'
      },
      {
        id: leads[1].id,
        scheduled_call_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
        scheduled_call_time: '14:30',
        scheduled_call_reason: 'Customer busy, will call later',
        status: 'hold'
      },
      {
        id: leads[2].id,
        scheduled_call_date: new Date().toISOString(), // Today
        scheduled_call_time: '16:00',
        scheduled_call_reason: 'Customer available in evening',
        status: 'hold'
      }
    ];

    for (const update of updates) {
      const { error } = await supabase
        .from('leads')
        .update({
          scheduled_call_date: update.scheduled_call_date,
          scheduled_call_time: update.scheduled_call_time,
          scheduled_call_reason: update.scheduled_call_reason,
          status: update.status
        })
        .eq('id', update.id);

      if (error) {
        console.error(`Error updating lead ${update.id}:`, error);
      } else {
        console.log(`✅ Added scheduled call for: ${leads.find(l => l.id === update.id)?.customer_name} - Scheduled for ${update.scheduled_call_date.split('T')[0]} at ${update.scheduled_call_time}`);
      }
    }

    console.log('\n✅ Test scheduled calls added successfully!');
    console.log('\nYou can now test the "Today" tab in the call operator dashboard.');

  } catch (error) {
    console.error('❌ Error adding test scheduled calls:', error.message);
  }
}

addTestScheduledCalls(); 