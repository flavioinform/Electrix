import supabase from '../utils/supabase';

/**
 * Upload image for a vivienda
 * @param {string} viviendaId - Vivienda ID
 * @param {File} file - Image file
 * @param {string} descripcion - Optional description
 * @returns {Promise<object>} Created image record
 */
export async function uploadViviendaImagen(viviendaId, file, descripcion = '') {
    try {
        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${viviendaId}/${Date.now()}.${fileExt}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('viviendas')
            .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('viviendas')
            .getPublicUrl(fileName);

        // Save record in database
        const { data: record, error: dbError } = await supabase
            .from('vivienda_imagenes')
            .insert([{
                vivienda_id: viviendaId,
                imagen_url: publicUrl,
                descripcion: descripcion || null
            }])
            .select()
            .single();

        if (dbError) throw dbError;

        return record;
    } catch (error) {
        console.error('Error uploading vivienda image:', error);
        throw error;
    }
}

/**
 * Get images for a vivienda
 * @param {string} viviendaId - Vivienda ID
 * @returns {Promise<Array>} List of image records
 */
export async function getViviendaImagenes(viviendaId) {
    try {
        const { data, error } = await supabase
            .from('vivienda_imagenes')
            .select('*')
            .eq('vivienda_id', viviendaId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching vivienda images:', error);
        return [];
    }
}

/**
 * Delete vivienda image
 * @param {string} imageId - Image record ID
 * @param {string} imageUrl - Image URL to delete from storage
 * @returns {Promise<boolean>} Success status
 */
export async function deleteViviendaImagen(imageId, imageUrl) {
    try {
        // Extract file path from URL
        const urlParts = imageUrl.split('/viviendas/');
        const filePath = urlParts[1];

        // Delete from storage
        const { error: storageError } = await supabase.storage
            .from('viviendas')
            .remove([filePath]);

        if (storageError) throw storageError;

        // Delete from database
        const { error: dbError } = await supabase
            .from('vivienda_imagenes')
            .delete()
            .eq('id', imageId);

        if (dbError) throw dbError;

        return true;
    } catch (error) {
        console.error('Error deleting vivienda image:', error);
        throw error;
    }
}
