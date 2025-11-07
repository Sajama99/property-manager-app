'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase/supabaseClient';

type Inspection = {
    id: string;
    inspection_number?: number | null;
    inspector_name: string | null;
    inspection_type: 'first' | 'reinspect' | null;
    property_id?: string | null;
    property_name?: string | null;
    scheduled_at?: string | null;
    unit_number?: string | null;
    tenant_name?: string | null;
    tenant_phone?: string | null;
    notes?: string | null;
};

type InspectionItem = {
    id: string;
    inspection_id: string;
    item_text: string;
    room: string | null;
    materials: string | null;
    is_complete: boolean | null;
};

type LocationRow = {
    [key: string]: any;
    id: string;
    name: string | null;
};

export default function InspectionDetailPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const inspectionId = params.id;

    const [inspection, setInspection] = useState<Inspection | null>(null);
    const [items, setItems] = useState<InspectionItem[]>([]);
    const [locationRow, setLocationRow] = useState<LocationRow | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        if (!inspectionId) return;

        const load = async () => {
            setLoading(true);

            // Get the inspection
            const { data: insp, error: inspErr } = await supabase
                .from('inspections')
                .select('*')
                .eq('id', inspectionId)
                .maybeSingle();

            if (inspErr || !insp) {
                setErr(inspErr?.message || 'Inspection not found');
                setLoading(false);
                return;
            }

            setInspection(insp as Inspection);

            // Get the inspection items
            const { data: itemData } = await supabase
                .from('inspection_items')
                .select('*')
                .eq('inspection_id', inspectionId)
                .order('created_at', { ascending: true });

            setItems((itemData || []) as InspectionItem[]);

            // Try to fetch property details
            if (insp.property_id) {
                const { data: locById } = await supabase
                    .from('locations')
                    .select('*')
                    .eq('id', insp.property_id)
                    .maybeSingle();
                if (locById) setLocationRow(locById as LocationRow);
            } else if (insp.property_name) {
                const { data: locByName } = await supabase
                    .from('locations')
                    .select('*')
                    .eq('name', insp.property_name)
                    .maybeSingle();
                if (locByName) setLocationRow(locByName as LocationRow);
            }

            setLoading(false);
        };

        load();
    }, [inspectionId]);

    const refreshItems = async () => {
        const { data } = await supabase
            .from('inspection_items')
            .select('*')
            .eq('inspection_id', inspectionId)
            .order('created_at', { ascending: true });
        setItems((data || []) as InspectionItem[]);
    };

    const toggleComplete = async (item: InspectionItem) => {
        const { error } = await supabase
            .from('inspection_items')
            .update({ is_complete: !item.is_complete })
            .eq('id', item.id);

        if (error) {
            alert(error.message);
            return;
        }

        await refreshItems();
    };

    const makeAddress = (loc: LocationRow | null, insp: Inspection | null) => {
        if (!loc && insp?.property_name) return insp.property_name;
        if (!loc) return '';
        const parts: string[] = [];
        if (loc.address) parts.push(loc.address);
        if (loc.city) parts.push(loc.city);
        if (loc.state) parts.push(loc.state);
        if (loc.zip) parts.push(loc.zip);
        if (loc.country) parts.push(loc.country);
        if (parts.length === 0 && loc.name) parts.push(loc.name);
        return parts.join(', ');
    };

    if (loading) {
        return <div style={{ padding: 20 }}>Loading inspection…</div>;
    }

    if (err || !inspection) {
        return (
            <div style={{ padding: 20 }}>
                <p style={{ color: '#dc2626' }}>{err || 'Not found'}</p>
                <button
                    onClick={() => router.back()}
                    style={{
                        marginTop: 8,
                        background: '#0f172a',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        padding: '6px 10px',
                        cursor: 'pointer',
                    }}
                >
                    Back
                </button>
            </div>
        );
    }

    const address = makeAddress(locationRow, inspection);
    const isReinspect = inspection.inspection_type === 'reinspect';
    const dateLabel = isReinspect ? 'Reinspection date' : 'Inspection date';
    const dateText = inspection.scheduled_at
        ? new Date(inspection.scheduled_at).toLocaleString()
        : '—';
    const displayNumber =
        typeof inspection.inspection_number === 'number' && inspection.inspection_number > 0
            ? inspection.inspection_number
            : inspection.id.slice(0, 8);

    return (
        <div style={{ padding: 20, maxWidth: 960, margin: '0 auto', display: 'grid', gap: 16 }}>
            {/* HEADER */}
            <div>
                <h1 style={{ fontSize: 28, marginBottom: 4 }}>Inspection #{displayNumber}</h1>
                {address && <div style={{ color: '#475569' }}>{address}</div>}
                {inspection.unit_number && (
                    <div style={{ color: '#475569' }}>Unit: {inspection.unit_number}</div>
                )}
                {inspection.tenant_name && (
                    <div style={{ color: '#475569' }}>
                        Tenant: {inspection.tenant_name}
                        {inspection.tenant_phone ? ` (${inspection.tenant_phone})` : ''}
                    </div>
                )}
                {inspection.inspector_name && (
                    <div style={{ color: '#475569' }}>Inspector: {inspection.inspector_name}</div>
                )}
                <div style={{ color: '#94a3b8', marginTop: 4 }}>
                    {dateLabel}: {dateText}
                </div>
            </div>

            {/* ITEMS */}
            <div
                style={{
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    padding: 14,
                }}
            >
                <h2 style={{ fontSize: 18, marginBottom: 10 }}>Inspection Items</h2>
                {items.length === 0 ? (
                    <p style={{ color: '#94a3b8' }}>No items for this inspection.</p>
                ) : (
                    <div style={{ display: 'grid', gap: 10 }}>
                        {items.map((item) => (
                            <div
                                key={item.id}
                                style={{
                                    background: '#fff',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: 8,
                                    padding: 10,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: 14,
                                }}
                            >
                                <div>
                                    <div style={{ fontWeight: 600 }}>{item.item_text}</div>
                                    {item.room && (
                                        <div style={{ fontSize: 12, color: '#64748b' }}>Room: {item.room}</div>
                                    )}
                                    {item.materials && (
                                        <div style={{ marginTop: 4 }}>
                                            <div style={{ fontSize: 12, fontWeight: 500 }}>Materials:</div>
                                            <ol
                                                style={{
                                                    margin: '4px 0 0 16px',
                                                    padding: 0,
                                                    fontSize: 12,
                                                    color: '#475569',
                                                }}
                                            >
                                                {item.materials
                                                    .split(/\r?\n|,| and /i)
                                                    .map((m) => m.trim())
                                                    .filter(Boolean)
                                                    .map((m, i) => (
                                                        <li key={i}>{m}</li>
                                                    ))}
                                            </ol>
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => toggleComplete(item)}
                                    style={{
                                        background: item.is_complete ? '#22c55e' : '#ef4444',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: 9999,
                                        padding: '6px 16px',
                                        fontSize: 13,
                                        cursor: 'pointer',
                                        minWidth: 90,
                                    }}
                                >
                                    {item.is_complete ? 'Done' : 'Not Done'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
