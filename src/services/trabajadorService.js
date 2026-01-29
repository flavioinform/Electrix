import supabase from '../utils/supabase';
import { createClient } from '@supabase/supabase-js';

/**
 * Get all workers
 * @param {boolean} soloActivos - Filter only active workers
 * @returns {Promise<Array>} List of workers
 */
export async function getTrabajadores(soloActivos = false) {
    try {
        let query = supabase
            .from('trabajadores')
            .select('*')
            .order('nombre', { ascending: true });

        if (soloActivos) {
            query = query.eq('activo', true);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching trabajadores:', error);
        throw error;
    }
}

/**
 * Get worker by ID
 * @param {string} id - Worker ID
 * @returns {Promise<object>} Worker record
 */
export async function getTrabajador(id) {
    try {
        const { data, error } = await supabase
            .from('trabajadores')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching trabajador:', error);
        throw error;
    }
}

/**
 * Create new worker
 * @param {object} data - Worker data
 * @returns {Promise<object>} Created worker record
 */
export async function createTrabajador(data) {
    try {
        const { data: record, error } = await supabase
            .from('trabajadores')
            .insert([data])
            .select()
            .single();

        if (error) throw error;
        return record;
    } catch (error) {
        console.error('Error creating trabajador:', error);
        throw error;
    }
}

/**
 * Update worker
 * @param {string} id - Worker ID
 * @param {object} data - Updated data
 * @returns {Promise<object>} Updated worker record
 */
export async function updateTrabajador(id, data) {
    try {
        const { data: record, error } = await supabase
            .from('trabajadores')
            .update(data)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return record;
    } catch (error) {
        console.error('Error updating trabajador:', error);
        throw error;
    }
}

/**
 * Delete worker
 * @param {string} id - Worker ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteTrabajador(id) {
    try {
        const { error } = await supabase
            .from('trabajadores')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting trabajador:', error);
        throw error;
    }
}

/**
 * Get workers assigned to a vivienda
 * @param {string} viviendaId - Vivienda ID
 * @returns {Promise<Array>} List of assigned workers
 */
export async function getTrabajadoresByVivienda(viviendaId) {
    try {
        const { data, error } = await supabase
            .from('vivienda_trabajadores')
            .select(`
        *,
        trabajador:trabajadores(*)
      `)
            .eq('vivienda_id', viviendaId);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching trabajadores by vivienda:', error);
        throw error;
    }
}

/**
 * Assign worker to vivienda
 * @param {object} data - Assignment data {vivienda_id, trabajador_id, notas}
 * @returns {Promise<object>} Created assignment record
 */
export async function asignarTrabajador(data) {
    try {
        const { data: record, error } = await supabase
            .from('vivienda_trabajadores')
            .insert([data])
            .select()
            .single();

        if (error) throw error;
        return record;
    } catch (error) {
        console.error('Error asignando trabajador:', error);
        throw error;
    }
}

/**
 * Remove worker from vivienda
 * @param {string} viviendaId - Vivienda ID
 * @param {string} trabajadorId - Worker ID
 * @returns {Promise<boolean>} Success status
 */
export async function removerTrabajador(viviendaId, trabajadorId) {
    try {
        const { error } = await supabase
            .from('vivienda_trabajadores')
            .delete()
            .eq('vivienda_id', viviendaId)
            .eq('trabajador_id', trabajadorId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error removiendo trabajador:', error);
        throw error;
    }
}

/**
 * Subscribe to worker changes
 * @param {function} callback - Callback for changes
 * @returns {function} Unsubscribe function
 */
export function subscribeToTrabajadores(callback) {
    const subscription = supabase
        .channel('trabajadores-changes')
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'trabajadores' },
            callback
        )
        .subscribe();

    return () => {
        subscription.unsubscribe();
    };
}

/**
 * Create a new Worker User (Auth + Profile)
 * @param {object} data - Worker data including email/password/role
 * @returns {Promise<object>} Created user object
 */
export async function createTrabajadorUser(workerData) {
    try {
        const { nombre, rut, email, password, telefono, especialidad, rol } = workerData;

        // 1. Create temporary Supabase client to create user without logging out current admin
        // CRITICAL: Must use a custom storage implementation (memory only) to prevent conflicting 
        // with the main client's local storage session.
        const memoryStorage = {
            getItem: (key) => null,
            setItem: (key, value) => { },
            removeItem: (key) => { }
        };

        const tempSupabase = createClient(
            import.meta.env.VITE_SUPABASE_URL,
            import.meta.env.VITE_SUPABASE_ANON_KEY,
            {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false,
                    detectSessionInUrl: false,
                    storageKey: 'temp-worker-create-session', // CRITICAL: Unique key to avoid collisions
                    storage: memoryStorage // Force memory storage
                }
            }
        );

        // 2. Determine email to register
        // If email is provided, use it. If not, generate one from RUT (username logic)
        const registerEmail = email && email.includes('@')
            ? email
            : `${rut}@electrix.cl`;

        // 3. Register User in Auth
        const { data: { user }, error: signUpError } = await tempSupabase.auth.signUp({
            email: registerEmail,
            password: password,
            options: {
                data: {
                    rol: rol || 'trabajador',
                    nombre: nombre,
                    rut: rut
                }
            }
        });

        if (signUpError) throw signUpError;

        if (user) {
            // 4. Create Public Profile in 'trabajadores'
            const { error: profileError } = await supabase
                .from('trabajadores')
                .insert([{
                    id: user.id,
                    nombre: nombre,
                    rut: rut,
                    rol: rol || 'trabajador',
                    especialidad: especialidad,
                    telefono: telefono,
                    activo: true
                }]);

            if (profileError) {
                // Determine if we should delete the auth user or just warn
                console.error('Error creating public profile for worker:', profileError);
                throw new Error('Usuario creado pero falló el perfil: ' + profileError.message);
            }
        }

        return user;
    } catch (error) {
        console.error('Error creating worker user:', error);
        throw error;
    }
}
