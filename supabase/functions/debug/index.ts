import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
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
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    const debugInfo = {
      environment: {
        supabaseUrl: supabaseUrl ? 'Set' : 'NOT SET',
        serviceRoleKey: serviceRoleKey ? 'Set' : 'NOT SET',
        supabaseUrlValue: supabaseUrl || 'undefined',
        serviceRoleKeyValue: serviceRoleKey ? '***' + serviceRoleKey.slice(-10) : 'undefined'
      }
    }

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Environment variables missing',
          debug: debugInfo
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Test database connection
    const supabaseClient = createClient(supabaseUrl, serviceRoleKey)
    
    try {
      const { data, error } = await supabaseClient
        .from('app_users')
        .select('count')
        .limit(1)

      if (error) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Database connection failed',
            error: error.message,
            debug: debugInfo
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Environment and database working!',
          debug: debugInfo,
          databaseTest: 'Connected successfully'
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )

    } catch (dbError) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Database error',
          error: dbError.message,
          debug: debugInfo
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'General error',
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
}) 