// app/api/work-orders/route.ts
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

// small helper: return a real UUID or null
function safeUUID(value: any) {
    return typeof value === 'string' && value.length === 36 ? value : null;
}

// GET /api/work-orders  → list all
export async function GET() {
    const supabase = getSupabase();
    if (!supabase) {
        return NextResponse.json(
            { data: [], error: 'Supabase not configured' },
            { status: 200 }
        );
    }

    const { data, error } = await supabase
        .from('work_orders')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        return NextResponse.json({ data: [], error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data }, { status: 200 });
}

// POST /api/work-orders  → create
export async function POST(req: Request) {
    const supabase = getSupabase();
    if (!supabase) {
        return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const body = await req.json();

    const insertPayload: Record<string, any> = {
        title: body.title ?? null,
        description: body.description ?? null,
        location_id: safeUUID(body.location_id), // ← important
        unit_id: safeUUID(body.unit_id), // ← important
        priority: body.priority ?? 'medium',
        status: body.status ?? 'open',
        assigned_to: body.assigned_to ?? null,
        due_date: body.due_date ?? null,
        notes: body.notes ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
        .from('work_orders')
        .insert(insertPayload)
        .select()
        .maybeSingle();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, data }, { status: 201 });
}
