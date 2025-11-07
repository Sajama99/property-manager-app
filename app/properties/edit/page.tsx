// app/properties/edit/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type Property = {
    id: string;
    name?: string | null;
    address?: string | null;
    notes?: string | null;
};

type Unit = {
    id: string;
    property_id: string;
    name?: string | null;
    unit_label?: string | null;
    occupant_name?: string | null;
    occupant_phone?: string | null;
};

export default function EditPropertyPage() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [property, setProperty] = useState<Property | null>(null);

    const [units, setUnits] = useState<Unit[]>([]);
    const [unitError, setUnitError] = useState<string | null>(null);
    const [addingUnit, setAddingUnit] = useState(false);

    const [newUnit, setNewUnit] = useState({
        name: '',
        occupant_name: '',
        occupant_phone: '',
    });

    useEffect(() => {
        if (!id) {
            setError('No property id provided.');
            setLoading(false);
            return;
        }

        async function load() {
            try {
                // property
                const res = await fetch(`/api/properties/by-id?id=${id}`);
                const json = await res.json();
                if (!res.ok) throw new Error(json.error || 'Failed to load property');

                // units
                const ures = await fetch(`/api/units?property_id=${id}`);
                const ujson = await ures.json();
                const ulist = Array.isArray(ujson.data) ? ujson.data : [];

                setProperty(json.data);
                setUnits(ulist);
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
        if (!id || !property) return;
        setSaving(true);
        setError(null);
        try {
            const res = await fetch(`/api/properties/by-id?id=${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(property),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed to save property');
            setProperty(json.data);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    }

    async function handleAddUnit(e: React.FormEvent) {
        e.preventDefault();
        if (!id) return;
        setAddingUnit(true);
        setUnitError(null);
        try {
            const res = await fetch('/api/units', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    property_id: id,
                    name: newUnit.name,
                    unit_label: newUnit.name,
                    occupant_name: newUnit.occupant_name,
                    occupant_phone: newUnit.occupant_phone,
                }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed to add unit');

            // reload units
            const ures = await fetch(`/api/units?property_id=${id}`);
            const ujson = await ures.json();
            setUnits(Array.isArray(ujson.data) ? ujson.data : []);

            setNewUnit({ name: '', occupant_name: '', occupant_phone: '' });
        } catch (e: any) {
            setUnitError(e.message);
        } finally {
            setAddingUnit(false);
        }
    }

    if (!id) return <div style={{ padding: 20 }}>No id in URL.</div>;
    if (loading) return <div style={{ padding: 20 }}>Loading…</div>;
    if (error) return <div style={{ padding: 20, color: 'red' }}>{error}</div>;
    if (!property) return <div style={{ padding: 20 }}>No property found.</div>;

    return (
        <div style={{ maxWidth: 900, padding: 20 }}>
            <h1 style={{ fontSize: 22, marginBottom: 16 }}>Edit property</h1>
            <form onSubmit={handleSave} style={{ display: 'grid', gap: 10, marginBottom: 30 }}>
                <label>
                    Name
                    <input
                        value={property.name ?? ''}
                        onChange={(e) => setProperty({ ...property, name: e.target.value })}
                        style={{ width: '100%', padding: 6, marginTop: 4 }}
                    />
                </label>
                <label>
                    Address
                    <input
                        value={property.address ?? ''}
                        onChange={(e) => setProperty({ ...property, address: e.target.value })}
                        style={{ width: '100%', padding: 6, marginTop: 4 }}
                    />
                </label>
                <label>
                    Notes
                    <textarea
                        value={property.notes ?? ''}
                        onChange={(e) => setProperty({ ...property, notes: e.target.value })}
                        rows={3}
                        style={{ width: '100%', padding: 6, marginTop: 4 }}
                    />
                </label>

                <button
                    type="submit"
                    disabled={saving}
                    style={{
                        background: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: 4,
                        padding: '8px 14px',
                        width: 140,
                    }}
                >
                    {saving ? 'Saving…' : 'Save property'}
                </button>
            </form>

            <h2 style={{ fontSize: 18, marginBottom: 10 }}>Units for this property</h2>
            {units.length === 0 ? (
                <p>No units yet.</p>
            ) : (
                <ul style={{ listStyle: 'none', padding: 0, marginBottom: 20 }}>
                    {units.map((u) => (
                        <li
                            key={u.id}
                            style={{
                                border: '1px solid #ddd',
                                borderRadius: 6,
                                padding: 10,
                                marginBottom: 8,
                            }}
                        >
                            <div style={{ fontWeight: 600 }}>
                                {u.unit_label || u.name || '(no unit name)'}
                            </div>
                            <div style={{ fontSize: 12, color: '#555' }}>
                                Occupant: {u.occupant_name || '—'}
                                {u.occupant_phone ? ` • ${u.occupant_phone}` : ''}
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            <h3 style={{ fontSize: 16, marginBottom: 8 }}>Add a unit</h3>
            {unitError ? <p style={{ color: 'red' }}>{unitError}</p> : null}
            <form onSubmit={handleAddUnit} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <input
                    placeholder="Unit # / label"
                    value={newUnit.name}
                    onChange={(e) => setNewUnit({ ...newUnit, name: e.target.value })}
                    style={{ padding: 6, minWidth: 140 }}
                />
                <input
                    placeholder="Occupant name"
                    value={newUnit.occupant_name}
                    onChange={(e) => setNewUnit({ ...newUnit, occupant_name: e.target.value })}
                    style={{ padding: 6, minWidth: 160 }}
                />
                <input
                    placeholder="Occupant phone"
                    value={newUnit.occupant_phone}
                    onChange={(e) => setNewUnit({ ...newUnit, occupant_phone: e.target.value })}
                    style={{ padding: 6, minWidth: 140 }}
                />
                <button
                    type="submit"
                    disabled={addingUnit}
                    style={{
                        background: '#16a34a',
                        color: 'white',
                        border: 'none',
                        borderRadius: 4,
                        padding: '6px 12px',
                        height: 34,
                    }}
                >
                    {addingUnit ? 'Adding…' : 'Add unit'}
                </button>
            </form>
        </div>
    );
}
