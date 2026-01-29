import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Initialize Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Get current authenticated user
 * @returns {Promise<object|null>} User object or null
 */
/**
 * Get current authenticated user
 * @returns {Promise<object|null>} User object or null
 */
export async function getCurrentUser() {
    try {
        console.log('[supabase] Getting current user (checking session)...');

        // Timeout promise after 15 seconds to prevent hanging (increased from 5s)
        const timeoutPromise = new Promise((resolve) => {
            setTimeout(() => {
                console.warn('[supabase] getCurrentUser timed out after 15s - assuming no session');
                resolve({ data: { user: null }, error: { message: 'Timeout' } });
            }, 15000);
        });

        // Race between actual fetch and timeout
        const { data: { user }, error } = await Promise.race([
            supabase.auth.getUser(),
            timeoutPromise
        ]);

        if (error) {
            if (error.message === 'Timeout') {
                console.warn('[supabase] getCurrentUser timed out - returning timeout flag');
                return { timeout: true };
            }
            console.error('[supabase] getCurrentUser error:', error);
            return null;
        }

        if (user) {
            console.log('[supabase] Session found for:', user.email);
        } else {
            console.log('[supabase] No active session found');
        }

        return user;
    } catch (error) {
        console.error('[supabase] getCurrentUser exception:', error);
        return null;
    }
}

/**
 * Check if user is authenticated
 * @returns {Promise<boolean>} True if authenticated
 */
export async function isAuthenticated() {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
}

export async function login(identifier, password) {
    try {
        let email;

        // Check if identifier is already an email
        if (identifier.includes('@')) {
            email = identifier;
        } else {
            // Use RUT as email (format: rut@electrix.cl)
            email = `${identifier}@electrix.cl`;
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        return data;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

/**
 * Logout current user
 */
export async function logout() {
    await supabase.auth.signOut();
}

/**
 * Subscribe to auth state changes
 * @param {function} callback - Callback function for auth changes
 * @returns {object} Subscription object
 */
export function onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
}

export default supabase;
