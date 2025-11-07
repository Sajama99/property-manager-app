// app/lib/supabaseServer.ts
import { createClient } from '@supabase/supabase-js';

export function getSupabaseServer() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl) {
        throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
    }
    if (!supabaseKey) {
        throw new Error('Missing SUPABASE key');
    }

    return createClient(supabaseUrl, supabaseKey);
}
