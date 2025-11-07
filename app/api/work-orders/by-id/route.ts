// app/api/work-orders/by-id/route.ts
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

function safeUUID(value: any) {
    return typeof value === 'string' && value.length === 36 ? value : null;
}

// GET /api/work-orders/by-id?id=...
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
        .from('work_orders')
        .select('*')
        .eq('id', id)
        .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (!data) return NextResponse.json({ error: 'Work order not found' }, { status: 404 });

    return NextResponse.json({ data }, { status: 200 });
}

// PATCH /api/work-orders/by-id?id=...
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

    const editable = [
        'title',
        'description',
        'location_id',
        'unit_id',
        'priority',
        'status',
        'assigned_to',
        'due_date',
        'notes',
    ];

    const updatePayload: Record<string, any> = {};
    for (const field of editable) {
        if (field in body) {
            if (field === 'location_id' || field === 'unit_id') {
                updatePayload[field] = safeUUID(body[field]);
            } else {
                updatePayload[field] = body[field] === '' ? null : body[field];
            }
        }
    }
    updatePayload.updated_at = new Date().toISOString();

    const { data, error } = await supabase
        .from('work_orders')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (!data) return NextResponse.json({ error: 'Work order not found' }, { status: 404 });

    return NextResponse.json({ ok: true, data }, { status: 200 });
}

// DELETE /api/work-orders/by-id?id=...
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

    const { error } = await supabase.from('work_orders').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true }, { status: 200 });
}
