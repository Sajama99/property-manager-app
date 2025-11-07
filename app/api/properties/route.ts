// app/api/properties/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// we now point at your real table
const TABLE_NAME = 'locations';

function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    // use service role first so we can see ALL rows even if RLS is on
    const key =
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    return createClient(url, key);
}

export async function GET() {
    const supabase = getSupabase();
    if (!supabase) {
        return NextResponse.json(
            { data: [], error: 'Supabase env vars missing' },
            { status: 500 }
        );
    }

    // pull everything from locations
    const { data, error } = await supabase.from(TABLE_NAME).select('*');

    if (error) {
        return NextResponse.json({ data: [], error: error.message }, { status: 400 });
    }

    // sort by name if it exists, otherwise just return
    const sorted =
        Array.isArray(data) && data.length > 0
            ? [...data].sort((a: any, b: any) => {
                const an = (a.name || '').toString().toLowerCase();
                const bn = (b.name || '').toString().toLowerCase();
                return an.localeCompare(bn);
            })
            : data;

    return NextResponse.json({ data: sorted }, { status: 200 });
}
