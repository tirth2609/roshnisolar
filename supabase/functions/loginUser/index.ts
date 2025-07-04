import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { compare } from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== LOGIN FUNCTION STARTED ===')
    
    // Step 1: Check environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    console.log('Environment check:', {
      supabaseUrl: !!supabaseUrl,
      serviceRoleKey: !!serviceRoleKey
    })

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    }

    // Step 2: Parse request body
    const body = await req.json()
    console.log('Request body:', { email: body.email, password: '***' })

    const { email, password } = body

    if (!email || !password) {
      return new Response(
        JSON.stringify({ success: false, message: 'Email and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 3: Create Supabase client
    const supabase = createClient(supabaseUrl, serviceRoleKey)
    console.log('Supabase client created')

    // Step 4: Find the specific user
    const { data: user, error: userError } = await supabase
      .from('app_users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single()

    if (userError) {
      console.error('Error finding user:', userError)
      if (userError.code === 'PGRST116') {
        return new Response(
          JSON.stringify({ success: false, message: 'User not found or inactive' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      throw userError
    }

    if (!user) {
      return new Response(
        JSON.stringify({ success: false, message: 'User not found or inactive' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Found user:', { id: user.id, email: user.email, role: user.role, isActive: user.is_active })

    // Step 5: Verify password
    try {
      const passwordMatch = await compare(password, user.password_hash)
      console.log('Password verification result:', passwordMatch)
      
      if (!passwordMatch) {
        return new Response(
          JSON.stringify({ success: false, message: 'Invalid password' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } catch (bcryptError) {
      console.error('Password verification error:', bcryptError)
      return new Response(
        JSON.stringify({ success: false, message: 'Password verification failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 6: Return successful response
    console.log('Login successful for user:', user.email)
    
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          phone: user.phone,
          is_active: user.is_active,
          created_at: user.created_at,
          updated_at: user.updated_at
        },
        message: 'Login successful'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Login error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error.message || 'Internal server error',
        error: error.toString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})