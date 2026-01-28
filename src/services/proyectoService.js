import supabase from '../utils/supabase';

/**
 * Get all projects
 * @param {object} options - Query options
 * @returns {Promise<Array>} List of projects
 */
export async function getProyectos(options = {}) {
    try {
        const { data, error } = await supabase
            .from('proyectos')
            .select(`
        *,
        cliente:clientes(*)
      `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching proyectos:', error);
        throw error;
    }
}

/**
 * Get projects by client ID
 * @param {string} clienteId - Client ID
 * @returns {Promise<Array>} Client's projects
 */
export async function getProyectosByCliente(clienteId) {
    try {
        const { data, error } = await supabase
            .from('proyectos')
            .select('*')
            .eq('cliente_id', clienteId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching proyectos by cliente:', error);
        throw error;
    }
}

/**
 * Get project by ID
 * @param {string} id - Project ID
 * @returns {Promise<object>} Project record
 */
export async function getProyecto(id) {
    try {
        const { data, error } = await supabase
            .from('proyectos')
            .select(`
        *,
        cliente:clientes(*)
      `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching proyecto:', error);
        throw error;
    }
}

/**
 * Create new project
 * @param {object} data - Project data
 * @returns {Promise<object>} Created project record
 */
export async function createProyecto(data) {
    try {
        const { data: record, error } = await supabase
            .from('proyectos')
            .insert([data])
            .select()
            .single();

        if (error) throw error;
        return record;
    } catch (error) {
        console.error('Error creating proyecto:', error);
        throw error;
    }
}

/**
 * Update project
 * @param {string} id - Project ID
 * @param {object} data - Updated data
 * @returns {Promise<object>} Updated project record
 */
export async function updateProyecto(id, data) {
    try {
        const { data: record, error } = await supabase
            .from('proyectos')
            .update(data)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return record;
    } catch (error) {
        console.error('Error updating proyecto:', error);
        throw error;
    }
}

/**
 * Delete project
 * @param {string} id - Project ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteProyecto(id) {
    try {
        const { error } = await supabase
            .from('proyectos')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting proyecto:', error);
        throw error;
    }
}

// Viviendas (Housing Units) Operations

/**
 * Get all viviendas for a project
 * @param {string} proyectoId - Project ID
 * @returns {Promise<Array>} List of viviendas
 */
export async function getViviendas(proyectoId) {
    try {
        const { data, error } = await supabase
            .from('viviendas')
            .select('*')
            .eq('proyecto_id', proyectoId)
            .order('nombre', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching viviendas:', error);
        throw error;
    }
}

/**
 * Create new vivienda
 * @param {object} data - Vivienda data
 * @returns {Promise<object>} Created vivienda record
 */
export async function createVivienda(data) {
    try {
        const { data: record, error } = await supabase
            .from('viviendas')
            .insert([data])
            .select()
            .single();

        if (error) throw error;
        return record;
    } catch (error) {
        console.error('Error creating vivienda:', error);
        throw error;
    }
}

/**
 * Update vivienda
 * @param {string} id - Vivienda ID
 * @param {object} data - Updated data
 * @returns {Promise<object>} Updated vivienda record
 */
export async function updateVivienda(id, data) {
    try {
        const { data: record, error } = await supabase
            .from('viviendas')
            .update(data)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return record;
    } catch (error) {
        console.error('Error updating vivienda:', error);
        throw error;
    }
}

/**
 * Delete vivienda
 * @param {string} id - Vivienda ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteVivienda(id) {
    try {
        const { error } = await supabase
            .from('viviendas')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting vivienda:', error);
        throw error;
    }
}

/**
 * Subscribe to project changes
 * @param {function} callback - Callback for changes
 * @returns {function} Unsubscribe function
 */
export function subscribeToProyectos(callback) {
    const subscription = supabase
        .channel('proyectos-changes')
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'proyectos' },
            callback
        )
        .subscribe();

    return () => {
        subscription.unsubscribe();
    };
}

/**
 * Subscribe to vivienda changes
 * @param {function} callback - Callback for changes
 * @returns {function} Unsubscribe function
 */
export function subscribeToViviendas(callback) {
    const subscription = supabase
        .channel('viviendas-changes')
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'viviendas' },
            callback
        )
        .subscribe();

    return () => {
        subscription.unsubscribe();
    };
}
