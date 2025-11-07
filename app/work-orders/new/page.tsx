// app/work-orders/new/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Property = {
    id: string;
    name?: string | null;
};

type Unit = {
    id: string;
    property_id: string;
    unit_label?: string | null;
};

export default function NewWorkOrderPage() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('medium');
    const [status, setStatus] = useState('open');
    const [locationId, setLocationId] = useState('');
    const [unitId, setUnitId] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [notes, setNotes] = useState('');
    const [properties, setProperties] = useState<Property[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);

    useEffect(() => {
        async function loadProps() {
            const res = await fetch('/api/properties');
            const json = await res.json();
            setProperties(Array.isArray(json.data) ? json.data : []);
        }
        async function loadUnits() {
            const res = await fetch('/api/units');
            const json = await res.json();
            setUnits(Array.isArray(json.data) ? json.data : []);
        }
        loadProps();
        loadUnits();
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const res = await fetch('/api/work-orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title,
                description,
                priority,
                status,
                location_id: locationId || null,
                unit_id: unitId || null,
                due_date: dueDate || null,
                notes,
            }),
        });
        if (res.ok) {
            router.push('/work-orders');
        } else {
            const json = await res.json();
            alert(json.error || 'Failed to create work order');
        }
    }

    const unitsForProperty = units.filter((u) => u.property_id === locationId);

    return (
        <div style={{ padding: 20, maxWidth: 700 }}>
            <h1 style={{ fontSize: 22, marginBottom: 12 }}>New work order</h1>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
                <label>
                    Title
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        style={{ width: '100%', padding: 6, marginTop: 4 }}
                        required
                    />
                </label>
                <label>
                    Description
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        style={{ width: '100%', padding: 6, marginTop: 4 }}
                    />
                </label>
                <label>
                    Property
                    <select
                        value={locationId}
                        onChange={(e) => {
                            setLocationId(e.target.value);
                            setUnitId('');
                        }}
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
                        value={unitId}
                        onChange={(e) => setUnitId(e.target.value)}
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
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
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
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
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
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        style={{ width: '100%', padding: 6, marginTop: 4 }}
                    />
                </label>
                <label>
                    Notes
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                        style={{ width: '100%', padding: 6, marginTop: 4 }}
                    />
                </label>
                <button
                    type="submit"
                    style={{
                        background: '#2563eb',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        padding: '8px 14px',
                        width: 150,
                    }}
                >
                    Create
                </button>
            </form>
        </div>
    );
}
