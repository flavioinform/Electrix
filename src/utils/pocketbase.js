import PocketBase from 'pocketbase';

// Initialize PocketBase client
// Change this URL to your PocketBase server URL
const PB_URL = import.meta.env.VITE_PB_URL || 'http://127.0.0.1:8090';

export const pb = new PocketBase(PB_URL);

// Enable auto cancellation for duplicate requests
pb.autoCancellation(false);

/**
 * Subscribe to real-time changes in a collection
 * @param {string} collection - Collection name
 * @param {function} callback - Callback function for changes
 * @returns {function} Unsubscribe function
 */
export function subscribeToCollection(collection, callback) {
    pb.collection(collection).subscribe('*', callback);

    return () => {
        pb.collection(collection).unsubscribe('*');
    };
}

/**
 * Get current authenticated user
 * @returns {object|null} User object or null
 */
export function getCurrentUser() {
    return pb.authStore.model;
}

/**
 * Check if user is authenticated
 * @returns {boolean} True if authenticated
 */
export function isAuthenticated() {
    return pb.authStore.isValid;
}

/**
 * Login with RUT and password
 * @param {string} rut - User's RUT (will be used as username)
 * @param {string} password - User's password
 * @returns {Promise<object>} Auth data
 */
export async function login(rut, password) {
    try {
        const authData = await pb.collection('users').authWithPassword(rut, password);
        return authData;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

/**
 * Logout current user
 */
export function logout() {
    pb.authStore.clear();
}

/**
 * Refresh authentication token
 * @returns {Promise<boolean>} True if refresh successful
 */
export async function refreshAuth() {
    try {
        if (!pb.authStore.isValid) return false;
        await pb.collection('users').authRefresh();
        return true;
    } catch (error) {
        console.error('Auth refresh error:', error);
        return false;
    }
}

export default pb;
