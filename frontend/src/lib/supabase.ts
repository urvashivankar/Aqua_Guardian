import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    '[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Client will be undefined.'
  );
} else {
  console.log('[Supabase] Initializing with URL:', supabaseUrl);
  console.log('[Supabase] Anon Key length:', supabaseAnonKey.length);
  console.log('[Supabase] Anon Key starts with:', supabaseAnonKey.substring(0, 10));
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '');

