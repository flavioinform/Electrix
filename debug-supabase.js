import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gpfukaxwnooifwzurnjj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwZnVrYXh3bm9vaWZ3enVybmpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzOTE4MjIsImV4cCI6MjA4NDk2NzgyMn0.E8XLiCLtH5qIPOSjw-4AptYpnGufjS8JOgeniHWFuXs';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('Testing Supabase connection...');

try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log('Success! User:', data.user ? data.user.email : 'No user logged in (as expected for anon)');
    }
} catch (err) {
    console.error('Exception:', err);
}
console.log('Test complete.');
