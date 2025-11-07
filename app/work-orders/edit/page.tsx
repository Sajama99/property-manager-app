// app/work-orders/edit/page.tsx
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type WorkOrder = {
    id: string;
    title: string | null;
    description: string | null;
    location_id: string | null;
    unit_id: string | null;
    priority: string | null;
    status: string | null;
    due_date: string | null;
    notes: string | null;
};

type Property = {
    id: string;
    name?: string | null;
};

type Unit = {
    id: string;
    property_id: string;
    unit_label?: string | null;
};

export default function EditWorkOrderPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const id = searchParams.get('id');

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
    const [properties, setProperties] = useState<Property[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);

    useEffect(() => {
        if (!id) {
            setError('No id provided');
            setLoading(false);
            return;
        }

        async function load() {
            try {
                // work order
                const res = await fetch(`/api/work-orders/by-id?id=${id}`);
                const json = await res.json();
                if (!res.ok) throw new Error(json.error || 'Failed to load work order');
                setWorkOrder(json.data);

                // properties
                const pres = await fetch('/api/properties');
                const pjson = await pres.json();
                setProperties(Array.isArray(pjson.data) ? pjson.data : []);

                // units
                const ures = await fetch('/api/units');
                const ujson = await ures.json();
                setUnits(Array.isArray(ujson.data) ? ujson.data : []);
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        }

        load();
    }, [id]);

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        if (!id || !workOrder) return;
        setSaving(true);
        setError(null);
        try {
            const res = await fetch(`/api/work-orders/by-id?id=${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(workOrder),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed to save work order');
            router.push('/work-orders');
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    }

    if (!id) return <div style={{ padding: 20 }}>No id.</div>;
    if (loading) return <div style={{ padding: 20 }}>Loading…</div>;
    if (error) return <div style={{ padding: 20, color: 'red' }}>{error}</div>;
    if (!workOrder) return <div style={{ padding: 20 }}>Not found.</div>;

    const unitsForProperty = units.filter(
        (u) => u.property_id === (workOrder.location_id || '')
    );

    return (
        <div style={{ padding: 20, maxWidth: 700 }}>
            <h1 style={{ fontSize: 22, marginBottom: 12 }}>Edit work order</h1>
            <form onSubmit={handleSave} style={{ display: 'grid', gap: 12 }}>
                <label>
                    Title
                    <input
                        value={workOrder.title ?? ''}
                        onChange={(e) => setWorkOrder({ ...workOrder, title: e.target.value })}
                        style={{ width: '100%', padding: 6, marginTop: 4 }}
                    />
                </label>
                <label>
                    Description
                    <textarea
                        value={workOrder.description ?? ''}
                        onChange={(e) =>
                            setWorkOrder({ ...workOrder, description: e.target.value })
                        }
                        rows={3}
                        style={{ width: '100%', padding: 6, marginTop: 4 }}
                    />
                </label>
                <label>
                    Property
                    <select
                        value={workOrder.location_id ?? ''}
                        onChange={(e) =>
                            setWorkOrder({ ...workOrder, location_id: e.target.value, unit_id: null })
                        }
                        style={{ width: '100%', padding: 6, marginTop: 4 }}
                    >
                        <option value="">(none)</option>
                        {properties.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name || p.id}
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    Unit
                    <select
                        value={workOrder.unit_id ?? ''}
                        onChange={(e) => setWorkOrder({ ...workOrder, unit_id: e.target.value })}
                        style={{ width: '100%', padding: 6, marginTop: 4 }}
                    >
                        <option value="">(none)</option>
                        {unitsForProperty.map((u) => (
                            <option key={u.id} value={u.id}>
                                {u.unit_label || u.name || u.id}
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    Priority
                    <select
                        value={workOrder.priority ?? 'medium'}
                        onChange={(e) => setWorkOrder({ ...workOrder, priority: e.target.value })}
                        style={{ width: '100%', padding: 6, marginTop: 4 }}
                    >
                        <option value="low">low</option>
                        <option value="medium">medium</option>
                        <option value="high">high</option>
                    </select>
                </label>
                <label>
                    Status
                    <select
                        value={workOrder.status ?? 'open'}
                        onChange={(e) => setWorkOrder({ ...workOrder, status: e.target.value })}
                        style={{ width: '100%', padding: 6, marginTop: 4 }}
                    >
                        <option value="open">open</option>
                        <option value="in_progress">in_progress</option>
                        <option value="completed">completed</option>
                    </select>
                </label>
                <label>
                    Due date
                    <input
                        type="date"
                        value={workOrder.due_date ?? ''}
                        onChange={(e) => setWorkOrder({ ...workOrder, due_date: e.target.value })}
                        style={{ width: '100%', padding: 6, marginTop: 4 }}
                    />
                </label>
                <label>
                    Notes
                    <textarea
                        value={workOrder.notes ?? ''}
                        onChange={(e) => setWorkOrder({ ...workOrder, notes: e.target.value })}
                        rows={2}
                        style={{ width: '100%', padding: 6, marginTop: 4 }}
                    />
                </label>
                <button
                    type="submit"
                    disabled={saving}
                    style={{
                        background: '#2563eb',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        padding: '8px 14px',
                        width: 150,
                    }}
                >
                    {saving ? 'Saving…' : 'Save'}
                </button>
            </form>
        </div>
    );
}
