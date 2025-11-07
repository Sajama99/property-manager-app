// app/api/appointments/by-id/route.ts
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

// GET /api/appointments/by-id?id=...
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
        .from('appointments')
        .select('*')
        .eq('id', id)
        .maybeSingle();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (!data) {
        return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    return NextResponse.json({ data }, { status: 200 });
}

// PATCH /api/appointments/by-id?id=...
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

    // add visit_* and next_destination so we can update from Start/End buttons
    const editableFields = [
        'title',
        'description',
        'scheduled_date',
        'scheduled_time',
        'is_time_specific',
        'estimated_duration_minutes',
        'status',
        'priority',
        'location_id',
        'assigned_to',
        'purpose',
        'notes',
        'next_destination',
        'property_id',
        // new ones for start/end
        'visit_start_time',
        'visit_end_time',
        'visit_notes',
    ];

    const updatePayload: Record<string, any> = {};
    for (const field of editableFields) {
        if (field in body) {
            updatePayload[field] = body[field];
        }
    }

    // empty string → null
    for (const key in updatePayload) {
        if (updatePayload[key] === '') {
            updatePayload[key] = null;
        }
    }

    updatePayload.updated_at = new Date().toISOString();

    const { data, error } = await supabase
        .from('appointments')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .maybeSingle();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (!data) {
        return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data }, { status: 200 });
}

// DELETE /api/appointments/by-id?id=...
export async function DELETE(req: Request) {
    const supabase = getSupabase();
    if (!supabase) {
        return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'id query param is required' }, { status: 400 });
    }

    const { error } = await supabase.from('appointments').delete().eq('id', id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
}
