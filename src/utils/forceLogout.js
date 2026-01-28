export async function forceLogout() {
    localStorage.removeItem('sb-gpfukaxwnooifwzurnjj-auth-token');
    // ^ This is the pattern for supabase tokens: sb-<project-ref>-auth-token
    window.location.reload();
}
