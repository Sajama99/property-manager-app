// app/api/properties/by-id/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// your properties live in "locations"
const TABLE_NAME = 'locations';

function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key =
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    return createClient(url, key);
}

// GET /api/properties/by-id?id=...
export async function GET(req: Request) {
    const supabase = getSupabase();
    if (!supabase) {
        return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
        return NextResponse.json({ error: 'id query param is required' }, { status: 400 });
    }

    const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('id', id)
        .maybeSingle();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (!data) {
        return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    return NextResponse.json({ data }, { status: 200 });
}

// PATCH /api/properties/by-id?id=...
export async function PATCH(req: Request) {
    const supabase = getSupabase();
    if (!supabase) {
        return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
        return NextResponse.json({ error: 'id query param is required' }, { status: 400 });
    }

    const body = await req.json();

    // only update columns we know you have
    const allowed = ['name', 'address', 'notes'];
    const updatePayload: Record<string, any> = {};

    for (const key of allowed) {
        if (key in body) {
            updatePayload[key] = body[key] === '' ? null : body[key];
        }
    }

    // NOTE: we are NOT setting updated_at here,
    // because your locations table doesn't have that column.

    const { data, error } = await supabase
        .from(TABLE_NAME)
        .update(updatePayload)
        .eq('id', id)
        .select()
        .maybeSingle();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (!data) {
        return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data }, { status: 200 });
}
