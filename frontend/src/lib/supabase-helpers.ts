import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Simple registration function that WORKS
export async function registerUser(email: string, password: string, name: string, role: string) {
    try {
        // 1. Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { name, role: role.toLowerCase() }
            }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('No user returned');

        // 2. Create/update profile with role
        const { error: profileError } = await supabase
            .from('users')
            .upsert({
                id: authData.user.id,
                email: authData.user.email,
                full_name: name,
                role: role.toLowerCase()
            }, { onConflict: 'id' });

        if (profileError) {
            console.error('Profile creation error:', profileError);
            // Don't fail - the auth user is created
        }

        return { success: true, user: authData.user, session: authData.session };
    } catch (error: any) {
        console.error('Registration error:', error);
        return { success: false, error: error.message };
    }
}

// Get user profile with role
export async function getUserProfile(userId: string) {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Profile fetch error:', error);
        return null;
    }

    return data;
}
