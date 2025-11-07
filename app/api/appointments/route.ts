// app/api/appointments/route.ts
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

// GET /api/appointments
// GET /api/appointments?status=completed
export async function GET(req: Request) {
    const supabase = getSupabase();
    if (!supabase) {
        return NextResponse.json(
            {
                data: [],
                error: 'Supabase env vars missing',
            },
            { status: 200 }
        );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    let query = supabase.from('appointments').select('*').order('scheduled_date', {
        ascending: true,
    });

    if (status) {
        query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ data: [], error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data }, { status: 200 });
}

// POST /api/appointments  → create
export async function POST(req: Request) {
    const supabase = getSupabase();
    if (!supabase) {
        return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const body = await req.json();

    const allowed = [
        'title',
        'description',
        'scheduled_date',
        'scheduled_time',
        'is_time_specific',
        'estimated_duration_minutes',
        'status',
        'priority',
        'location_id',
        'unit_id',
        'assigned_to',
        'purpose',
        'notes',
        'next_destination',
    ];

    const insertPayload: Record<string, any> = {};
    for (const key of allowed) {
        if (key in body) {
            insertPayload[key] = body[key] === '' ? null : body[key];
        }
    }

    // default status
    if (!insertPayload.status) {
        insertPayload.status = 'scheduled';
    }

    const now = new Date().toISOString();
    insertPayload.created_at = now;
    insertPayload.updated_at = now;

    const { data, error } = await supabase
        .from('appointments')
        .insert(insertPayload)
        .select()
        .maybeSingle();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, data }, { status: 201 });
}
