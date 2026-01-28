import supabase from '../utils/supabase';
import { createClient } from '@supabase/supabase-js';

/**
 * Get all clients
 * @param {object} options - Query options (filter, sort, etc.)
 * @returns {Promise<Array>} List of clients
 */
export async function getClientes(options = {}) {
    try {
        let query = supabase
            .from('clientes')
            .select('*')
            .order('created_at', { ascending: false });

        const { data, error } = await query;

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching clientes:', error);
        throw error;
    }
}

/**
 * Get client by ID
 * @param {string} id - Client ID
 * @returns {Promise<object>} Client record
 */
export async function getCliente(id) {
    try {
        const { data, error } = await supabase
            .from('clientes')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching cliente:', error);
        throw error;
    }
}

/**
 * Create new client
 * @param {object} data - Client data
 * @returns {Promise<object>} Created client record
 */
export async function createCliente(data) {
    try {
        const { data: record, error } = await supabase
            .from('clientes')
            .insert([data])
            .select()
            .single();

        if (error) throw error;
        return record;
    } catch (error) {
        console.error('Error creating cliente:', error);
        throw error;
    }
}

/**
 * Update client
 * @param {string} id - Client ID
 * @param {object} data - Updated data
 * @returns {Promise<object>} Updated client record
 */
export async function updateCliente(id, data) {
    try {
        const { data: record, error } = await supabase
            .from('clientes')
            .update(data)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return record;
    } catch (error) {
        console.error('Error updating cliente:', error);
        throw error;
    }
}

/**
 * Delete client
 * @param {string} id - Client ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteCliente(id) {
    try {
        const { error } = await supabase
            .from('clientes')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting cliente:', error);
        throw error;
    }
}

/**
 * Search clients by name or type
 * @param {string} query - Search query
 * @returns {Promise<Array>} Matching clients
 */
export async function searchClientes(query) {
    try {
        const { data, error } = await supabase
            .from('clientes')
            .select('*')
            .or(`nombre.ilike.%${query}%,tipo.ilike.%${query}%`)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error searching clientes:', error);
        throw error;
    }
}

/**
 * Subscribe to client changes
 * @param {function} callback - Callback for changes
 * @returns {function} Unsubscribe function
 */
export function subscribeToClientes(callback) {
    const subscription = supabase
        .channel('clientes-changes')
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'clientes' },
            callback
        )
        .subscribe();

    return () => {
        subscription.unsubscribe();
    };
}

/**
 * Create client user account
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} clienteId - Client ID to link
 * @returns {Promise<object>} Created user
 */
export async function createClientUser(email, password, clienteId) {
    try {
        // Create a temporary client with memory storage to avoid affecting main session
        const tempSupabase = createClient(
            import.meta.env.VITE_SUPABASE_URL,
            import.meta.env.VITE_SUPABASE_ANON_KEY,
            {
                auth: {
                    persistSession: false, // Essential: don't save session to localStorage
                    autoRefreshToken: false,
                    detectSessionInUrl: false
                }
            }
        );

        // Sign up the user
        const { data: { user }, error: signUpError } = await tempSupabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    rol: 'cliente',
                    cliente_id: clienteId
                }
            }
        });

        if (signUpError) throw signUpError;

        if (user) {
            // CRITICAL: We must create a "trabajador" record (which acts as the public user profile)
            // BEFORE linking it to the cliente, due to FK constraints.
            // valid fields depend on table definition, assuming 'rut' is unique string.
            // If it's a generated email (RUT login), strip the domain for the profile
            const cleanRut = email.endsWith('@electrix.cl') ? email.split('@')[0] : email;

            const { error: profileError } = await supabase
                .from('trabajadores')
                .insert([{
                    id: user.id,
                    nombre: cleanRut, // Use RUT/ID as name initially
                    rut: cleanRut,    // Save CLEAN ID (e.g. "2121") not "2121@electrix.cl"
                    rol: 'cliente',
                    activo: true,
                    especialidad: 'Cliente'
                }]);

            if (profileError) {
                // If profile creation fails, we should probably cleanup the auth user, 
                // but for now let's just throw to alert the user.
                console.error('Error creating public profile for client:', profileError);
                throw new Error('Error al crear perfil público: ' + profileError.message);
            }

            // Update the cliente record with the new user_id and enable photo access
            await updateCliente(clienteId, { usuario_id: user.id, puede_ver_fotos: true });
        }

        return user;
    } catch (error) {
        console.error('Error creating client user:', error);
        throw error;
    }
}
