import supabase from '../utils/supabase';

/**
 * Get all transactions
 * @param {object} options - Query options
 * @returns {Promise<Array>} List of transactions
 */
export async function getTransacciones(options = {}) {
    try {
        const { data, error } = await supabase
            .from('transacciones')
            .select(`
        *,
        cliente:clientes(*),
        proyecto:proyectos(*)
      `)
            .order('fecha', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching transacciones:', error);
        throw error;
    }
}

/**
 * Get transactions by month
 * @param {string} year - Year (YYYY)
 * @param {string} month - Month (MM)
 * @returns {Promise<Array>} Transactions for the month
 */
export async function getTransaccionesByMonth(year, month) {
    try {
        const startDate = `${year}-${month}-01`;
        const endDate = `${year}-${month}-31`;

        const { data, error } = await supabase
            .from('transacciones')
            .select(`
        *,
        cliente:clientes(*),
        proyecto:proyectos(*)
      `)
            .gte('fecha', startDate)
            .lte('fecha', endDate)
            .order('fecha', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching transacciones by month:', error);
        throw error;
    }
}

/**
 * Get transaction by ID
 * @param {string} id - Transaction ID
 * @returns {Promise<object>} Transaction record
 */
export async function getTransaccion(id) {
    try {
        const { data, error } = await supabase
            .from('transacciones')
            .select(`
        *,
        cliente:clientes(*),
        proyecto:proyectos(*)
      `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching transaccion:', error);
        throw error;
    }
}

/**
 * Create new transaction
 * @param {object} data - Transaction data
 * @returns {Promise<object>} Created transaction record
 */
export async function createTransaccion(data) {
    try {
        const { data: record, error } = await supabase
            .from('transacciones')
            .insert([data])
            .select()
            .single();

        if (error) throw error;
        return record;
    } catch (error) {
        console.error('Error creating transaccion:', error);
        throw error;
    }
}

/**
 * Update transaction
 * @param {string} id - Transaction ID
 * @param {object} data - Updated data
 * @returns {Promise<object>} Updated transaction record
 */
export async function updateTransaccion(id, data) {
    try {
        const { data: record, error } = await supabase
            .from('transacciones')
            .update(data)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return record;
    } catch (error) {
        console.error('Error updating transaccion:', error);
        throw error;
    }
}

/**
 * Delete transaction
 * @param {string} id - Transaction ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteTransaccion(id) {
    try {
        const { error } = await supabase
            .from('transacciones')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting transaccion:', error);
        throw error;
    }
}

/**
 * Calculate monthly balance
 * @param {string} year - Year (YYYY)
 * @param {string} month - Month (MM)
 * @returns {Promise<object>} Balance data {ingresos, gastos, balance}
 */
export async function getMonthlyBalance(year, month) {
    try {
        const transactions = await getTransaccionesByMonth(year, month);

        const ingresos = transactions
            .filter(t => t.tipo === 'ingreso')
            .reduce((sum, t) => sum + (t.monto || 0), 0);

        const gastos = transactions
            .filter(t => t.tipo === 'gasto')
            .reduce((sum, t) => sum + (t.monto || 0), 0);

        return {
            ingresos,
            gastos,
            balance: ingresos - gastos
        };
    } catch (error) {
        console.error('Error calculating monthly balance:', error);
        throw error;
    }
}

/**
 * Search transactions
 * @param {string} query - Search query
 * @param {object} filters - Additional filters (tipo, cliente, proyecto)
 * @returns {Promise<Array>} Matching transactions
 */
export async function searchTransacciones(query, filters = {}) {
    try {
        let queryBuilder = supabase
            .from('transacciones')
            .select(`
        *,
        cliente:clientes(*),
        proyecto:proyectos(*)
      `);

        if (query) {
            queryBuilder = queryBuilder.ilike('descripcion', `%${query}%`);
        }

        if (filters.tipo && filters.tipo !== 'todas') {
            queryBuilder = queryBuilder.eq('tipo', filters.tipo);
        }

        if (filters.cliente && filters.cliente !== 'todos') {
            queryBuilder = queryBuilder.eq('cliente_id', filters.cliente);
        }

        if (filters.proyecto && filters.proyecto !== 'todos') {
            queryBuilder = queryBuilder.eq('proyecto_id', filters.proyecto);
        }

        const { data, error } = await queryBuilder.order('fecha', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error searching transacciones:', error);
        throw error;
    }
}

/**
 * Subscribe to transaction changes
 * @param {function} callback - Callback for changes
 * @returns {function} Unsubscribe function
 */
export function subscribeToTransacciones(callback) {
    const subscription = supabase
        .channel('transacciones-changes')
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'transacciones' },
            callback
        )
        .subscribe();

    return () => {
        subscription.unsubscribe();
    };
}

/**
 * Upload image for a transaction
 * @param {string} transaccionId - Transaction ID
 * @param {File} file - Image file
 * @returns {Promise<object>} Created image record
 */
export async function uploadTransaccionImagen(transaccionId, file) {
    try {
        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${transaccionId}/${Date.now()}.${fileExt}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('transacciones')
            .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('transacciones')
            .getPublicUrl(fileName);

        // Save record in database
        const { data: record, error: dbError } = await supabase
            .from('transaccion_imagenes')
            .insert([{
                transaccion_id: transaccionId,
                imagen_url: publicUrl
            }])
            .select()
            .single();

        if (dbError) throw dbError;

        return record;
    } catch (error) {
        console.error('Error uploading transaction image:', error);
        throw error;
    }
}

/**
 * Get images for a transaction
 * @param {string} transaccionId - Transaction ID
 * @returns {Promise<Array>} List of image records
 */
export async function getTransaccionImagenes(transaccionId) {
    try {
        const { data, error } = await supabase
            .from('transaccion_imagenes')
            .select('*')
            .eq('transaccion_id', transaccionId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching transaction images:', error);
        throw error;
    }
}

/**
 * Delete transaction image
 * @param {string} imageId - Image record ID
 * @param {string} imageUrl - Image URL to delete from storage
 * @returns {Promise<boolean>} Success status
 */
export async function deleteTransaccionImagen(imageId, imageUrl) {
    try {
        // Extract file path from URL
        const urlParts = imageUrl.split('/transacciones/');
        const filePath = urlParts[1];

        // Delete from storage
        const { error: storageError } = await supabase.storage
            .from('transacciones')
            .remove([filePath]);

        if (storageError) throw storageError;

        // Delete from database
        const { error: dbError } = await supabase
            .from('transaccion_imagenes')
            .delete()
            .eq('id', imageId);

        if (dbError) throw dbError;

        return true;
    } catch (error) {
        console.error('Error deleting transaction image:', error);
        throw error;
    }
}
