import { createContext, useContext, useState, useEffect } from 'react';
import { supabase, login as supabaseLogin, logout as supabaseLogout, getCurrentUser, onAuthStateChange } from '../utils/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch user profile from trabajadores table OR clientes table
    const fetchUserProfile = async (userData) => {
        if (!userData) return null;

        try {
            const email = userData.email || userData;

            // Check if it's a client user (identified by having a 'rol' in metadata or just being in clients table)
            // But first, try to find as worker by RUT
            const rut = email.split('@')[0];

            // 1. Try to find as Worker
            const { data: trabajador, error: trabajadorError } = await supabase
                .from('trabajadores')
                .select('*')
                .eq('rut', rut)
                .maybeSingle();

            if (trabajador) {
                return trabajador;
            }

            // 2. Try to find as Client (using the Auth User ID)
            // If userData is a string (email), we might not have the ID easily, 
            // but usually this is called with the User object from Supabase.
            const userId = userData.id;
            if (userId) {
                const { data: cliente, error: clienteError } = await supabase
                    .from('clientes')
                    .select('*')
                    .eq('usuario_id', userId)
                    .maybeSingle();

                if (cliente) {
                    // Normalize structure to match expected profile shape
                    return { ...cliente, rol: 'cliente' };
                }
            }

            return null;
        } catch (error) {
            console.error('Error in fetchUserProfile:', error);
            return null;
        }
    };

    useEffect(() => {
        // Check initial auth state
        console.log('[AuthContext] Checking initial auth state...');
        getCurrentUser().then(async (result) => {
            // result can be User object, null (error), or { timeout: true }

            // result can be User object, { error: ... }, or { timeout: true }

            if (result?.timeout || result?.error) {
                console.warn('[AuthContext] Server check failed/timed out. Attempting to use local session as fallback...');

                // Fallback: Check local session (faster, no network verification)
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    console.log('[AuthContext] Local session found during timeout fallback:', session.user.email);
                    const user = session.user;
                    setUser(user);
                    const profile = await fetchUserProfile(user);
                    setUserProfile(profile);
                } else {
                    console.warn('[AuthContext] No local session found either. Clearing local state.');
                    await supabaseLogout();
                    setUser(null);
                    setUserProfile(null);
                }
            } else if (!result) {
                // Explicit null means "No Session" (success but empty)
                console.warn('[AuthContext] No active session found. Clearing local state.');
                await supabaseLogout();
                setUser(null);
                setUserProfile(null);
            } else {
                // Valid user found (result is the user object)
                const user = result;
                console.log('[AuthContext] Current user verified:', user.email);
                setUser(user);
                const profile = await fetchUserProfile(user);
                setUserProfile(profile);
            }

            console.log('[AuthContext] Setting loading to false');
            setLoading(false);
        });

        // Listen for auth state changes
        const { data: { subscription } } = onAuthStateChange(async (event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);

            if (currentUser) {
                const profile = await fetchUserProfile(currentUser);
                setUserProfile(profile);
            } else {
                setUserProfile(null);
            }

            setLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const login = async (rut, password) => {
        try {
            const authData = await supabaseLogin(rut, password);
            setUser(authData.user);

            // Fetch user profile
            const profile = await fetchUserProfile(authData.user);
            setUserProfile(profile);

            return { success: true, user: authData.user, profile };
        } catch (error) {
            console.error('Login failed:', error);
            return {
                success: false,
                error: error.message || 'Error al iniciar sesión. Verifica tu RUT y contraseña.'
            };
        }
    };

    const logout = async () => {
        try {
            await supabaseLogout();
        } catch (error) {
            console.error('Logout error (clearing local session anyway):', error);
        } finally {
            setUser(null);
            setUserProfile(null);
        }
    };

    const value = {
        user,
        userProfile,
        rol: userProfile?.rol || 'trabajador',
        isAdmin: userProfile?.rol === 'admin',
        isTrabajador: userProfile?.rol === 'trabajador',
        isCliente: userProfile?.rol === 'cliente',
        isSupervisor: userProfile?.rol === 'supervisor' || userProfile?.rol === 'admin' || userProfile?.especialidad === 'Supervisor',
        login,
        logout,
        isAuthenticated: !!user,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
