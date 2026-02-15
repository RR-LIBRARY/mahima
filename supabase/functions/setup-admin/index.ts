import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // Require authentication - only existing admins can call this
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const token = authHeader.replace('Bearer ', '')
    const { data: claims, error: claimsError } = await callerClient.auth.getClaims(token)
    if (claimsError || !claims?.claims?.sub) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const callerId = claims.claims.sub as string

    // Verify caller is an admin
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const { data: callerRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', callerId)
      .eq('role', 'admin')
      .maybeSingle()

    if (!callerRole) {
      return new Response(
        JSON.stringify({ success: false, error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Read credentials from secrets, not hardcoded
    const adminEmail = Deno.env.get('ADMIN_EMAIL')
    const adminPassword = Deno.env.get('ADMIN_PASSWORD')

    if (!adminEmail || !adminPassword) {
      return new Response(
        JSON.stringify({ success: false, error: 'Admin credentials not configured in secrets. Set ADMIN_EMAIL and ADMIN_PASSWORD secrets.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === adminEmail)

    if (existingUser) {
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        { password: adminPassword }
      )
      
      if (updateError) throw updateError

      await supabaseAdmin.from('user_roles').upsert({
        user_id: existingUser.id,
        role: 'admin'
      }, { onConflict: 'user_id,role' })

      await supabaseAdmin.from('profiles').upsert({
        id: existingUser.id,
        email: adminEmail,
        full_name: 'Admin',
        role: 'admin'
      }, { onConflict: 'id' })

      return new Response(
        JSON.stringify({ success: true, message: 'Admin password updated', userId: existingUser.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true
    })

    if (createError) throw createError

    await supabaseAdmin.from('user_roles').insert({
      user_id: newUser.user.id,
      role: 'admin'
    })

    await supabaseAdmin.from('profiles').upsert({
      id: newUser.user.id,
      email: adminEmail,
      full_name: 'Admin',
      role: 'admin'
    }, { onConflict: 'id' })

    return new Response(
      JSON.stringify({ success: true, message: 'Admin user created', userId: newUser.user.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    console.error('Error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ success: false, error: 'An internal error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
