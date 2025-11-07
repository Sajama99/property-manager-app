'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';

type WorkOrder = {
    id: string;
    title: string;
    description: string | null;
    status: string;
    property_id: string | null;
    created_at: string;
};

type LocationRow = {
    id: string;
    name: string | null;
    address: string | null;
};

export default function CompletedWorkOrdersPage() {
    const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
    const [locations, setLocations] = useState<LocationRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const { data: woData } = await supabase
                .from('work_orders')
                .select('*')
                .eq('status', 'completed')
                .order('created_at', { ascending: false });

            const { data: locData } = await supabase
                .from('locations')
                .select('id, name, address')
                .order('name');

            setWorkOrders(woData ?? []);
            setLocations(locData ?? []);
            setLoading(false);
        };

        load();
    }, []);

    if (loading) {
        return <div style={{ padding: 20 }}>Loading…</div>;
    }

    return (
        <div style={{ padding: 20 }}>
            <h1 style={{ fontSize: 22, marginBottom: 12 }}>Completed work orders</h1>
            <a href="/work-orders" style={{ color: '#2563eb' }}>
                ← Back to work orders
            </a>
            <div style={{ marginTop: 16 }}>
                {workOrders.length === 0 ? (
                    <p>No completed work orders.</p>
                ) : (
                    <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 10 }}>
                        {workOrders.map((wo) => {
                            const loc = locations.find((l) => l.id === wo.property_id);
                            return (
                                <li
                                    key={wo.id}
                                    style={{
                                        border: '1px solid #e5e7eb',
                                        borderRadius: 6,
                                        padding: 12,
                                    }}
                                >
                                    <div style={{ fontWeight: 600 }}>{wo.title}</div>
                                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                                        {loc ? (loc.name || loc.address) : 'No location'}
                                    </div>
                                    {wo.description ? (
                                        <div style={{ fontSize: 13, marginTop: 4 }}>{wo.description}</div>
                                    ) : null}
                                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                                        Completed {new Date(wo.created_at).toLocaleString()}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}
