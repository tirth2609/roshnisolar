import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Test database connection
    const { data: users, error: usersError } = await supabase
      .from('app_users')
      .select('count')
      .limit(1)

    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('count')
      .limit(1)

    const { data: tickets, error: ticketsError } = await supabase
      .from('support_tickets')
      .select('count')
      .limit(1)

    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('count')
      .limit(1)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Database connection successful',
        data: {
          users: usersError ? 'Error' : 'Connected',
          leads: leadsError ? 'Error' : 'Connected',
          tickets: ticketsError ? 'Error' : 'Connected',
          customers: customersError ? 'Error' : 'Connected',
          errors: {
            users: usersError?.message,
            leads: leadsError?.message,
            tickets: ticketsError?.message,
            customers: customersError?.message,
          }
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Database connection failed',
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
}) 