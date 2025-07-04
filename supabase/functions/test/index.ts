import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Edge Function is working!',
      timestamp: new Date().toISOString(),
      environment: {
        supabaseUrl: Deno.env.get('SUPABASE_URL') ? 'Set' : 'NOT SET',
        serviceRoleKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ? 'Set' : 'NOT SET'
      }
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
}) 