import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { hash } from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== CREATE USER FUNCTION STARTED ===')
    
    // Step 1: Check environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    }

    // Step 2: Parse request body
    const body = await req.json()
    console.log('Request body:', { email: body.email, name: body.name, role: body.role })

    const { name, email, phone, password, role } = body

    if (!name || !email || !phone || !password || !role) {
      return new Response(
        JSON.stringify({ success: false, message: 'All fields are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 3: Create Supabase client
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Step 4: Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('app_users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return new Response(
        JSON.stringify({ success: false, message: 'User with this email already exists' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 5: Hash password
    const passwordHash = await hash(password, 10)

    // Step 6: Create user
    const { data: newUser, error: createError } = await supabase
      .from('app_users')
      .insert({
        name,
        email,
        phone,
        password_hash: passwordHash,
        role,
        is_active: true
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating user:', createError)
      throw createError
    }

    console.log('User created successfully:', newUser.email)
    
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          phone: newUser.phone,
          is_active: newUser.is_active,
          created_at: newUser.created_at,
          updated_at: newUser.updated_at
        },
        message: 'User created successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Create user error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error.message || 'Internal server error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})