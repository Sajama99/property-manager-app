// app/api/units/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key =
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    return createClient(url, key);
}

// GET /api/units?property_id=...  (or ?location_id=...)
export async function GET(req: Request) {
    const supabase = getSupabase();
    if (!supabase) {
        return NextResponse.json({ error: 'Missing Supabase env vars' }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const property_id = searchParams.get('property_id') || searchParams.get('location_id');

    let query = supabase.from('units').select('*').order('name', { ascending: true });

    if (property_id) {
        query = query.eq('property_id', property_id);
    }

    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message, data: [] }, { status: 400 });
    }

    return NextResponse.json({ data }, { status: 200 });
}

// POST /api/units  → create new unit
export async function POST(req: Request) {
    const supabase = getSupabase();
    if (!supabase) {
        return NextResponse.json({ error: 'Missing Supabase env vars' }, { status: 500 });
    }

    const body = await req.json();

    // your table requires property_id
    const property_id = body.property_id || body.location_id;
    if (!property_id) {
        return NextResponse.json(
            { error: 'property_id is required to create a unit' },
            { status: 400 }
        );
    }

    // your table also requires unit_label (NOT NULL)
    // we’ll map: unit_label = body.unit_label || body.name
    const unit_label = body.unit_label || body.name;
    if (!unit_label) {
        return NextResponse.json(
            { error: 'unit_label (or name) is required to create a unit' },
            { status: 400 }
        );
    }

    const insertPayload = {
        property_id,
        name: body.name ?? unit_label, // keep name in sync
        unit_label,                    // 👈 the column your table wants
        occupant_name: body.occupant_name ?? null,
        occupant_phone: body.occupant_phone ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
        .from('units')
        .insert(insertPayload)
        .select()
        .maybeSingle();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, data }, { status: 201 });
}
