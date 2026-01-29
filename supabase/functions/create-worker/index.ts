import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Get request body
        const { nombre, rut, email, password, telefono, especialidad, rol } = await req.json()

        // Create Supabase Admin client with SERVICE_ROLE_KEY
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        // Determine email
        const registerEmail = email && email.includes('@')
            ? email
            : `${rut}@electrix.cl`

        // Create user in Auth using ADMIN API (doesn't affect current session)
        const { data: { user }, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
            email: registerEmail,
            password: password,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
                rol: rol || 'trabajador',
                nombre: nombre,
                rut: rut
            }
        })

        if (signUpError) {
            throw signUpError
        }

        // Create profile in trabajadores table
        const { error: profileError } = await supabaseAdmin
            .from('trabajadores')
            .insert([{
                id: user.id,
                nombre: nombre,
                rut: rut,
                rol: rol || 'trabajador',
                especialidad: especialidad,
                telefono: telefono,
                activo: true
            }])

        if (profileError) {
            // Try to delete the auth user if profile creation failed
            await supabaseAdmin.auth.admin.deleteUser(user.id)
            throw new Error('Error creating profile: ' + profileError.message)
        }

        return new Response(
            JSON.stringify({ success: true, user }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            }
        )
    }
})
