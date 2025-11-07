// app/api/appointments/[id]/route.ts
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

// GET one appointment by id
export async function GET(
    _req: Request,
    { params }: { params: { id: string } }
) {
    const supabase = getSupabase();
    if (!supabase) {
        return NextResponse.json({ error: 'Supabase env vars missing' }, { status: 500 });
    }

    // params.id is coming from /api/appointments/<id>
    const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', params.id)
        .maybeSingle();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data) {
        return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    return NextResponse.json({ data }, { status: 200 });
}

// PATCH (update) one appointment
export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    const supabase = getSupabase();
    if (!supabase) {
        return NextResponse.json({ error: 'Supabase env vars missing' }, { status: 500 });
    }

    const body = await req.json();

    // only update fields we expect from the form
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
    ];

    const updatePayload: Record<string, any> = {};
    for (const field of editableFields) {
        if (field in body) {
            updatePayload[field] = body[field];
        }
    }

    updatePayload.updated_at = new Date().toISOString();

    const { data, error } = await supabase
        .from('appointments')
        .update(updatePayload)
        .eq('id', params.id)
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
