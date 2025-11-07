// app/units/new/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Location = {
    id: string;
    name?: string | null;
    address?: string | null;
};

export default function NewUnitPage() {
    const router = useRouter();
    const [locations, setLocations] = useState<Location[]>([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState({
        location_id: '',
        name: '',
        occupant_name: '',
        occupant_phone: '',
    });

    // load properties (locations)
    useEffect(() => {
        async function loadLocations() {
            try {
                const res = await fetch('/api/properties'); // this points to your locations
                const json = await res.json();
                setLocations(Array.isArray(json.data) ? json.data : []);
            } catch (e) {
                // ignore
            }
        }
        loadLocations();
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            const res = await fetch('/api/units', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const json = await res.json();
            if (!res.ok) {
                throw new Error(json.error || 'Failed to create unit');
            }
            // go back or to appointments
            router.push('/appointments');
            router.refresh();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div style={{ maxWidth: 700, padding: 20 }}>
            <h1 style={{ fontSize: 22, marginBottom: 16 }}>New Unit</h1>
            {error ? <p style={{ color: 'red' }}>{error}</p> : null}
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
                <label>
                    Property
                    <select
                        value={form.location_id}
                        onChange={(e) => setForm((f) => ({ ...f, location_id: e.target.value }))}
                        style={{ width: '100%', padding: 6, marginTop: 4 }}
                        required
                    >
                        <option value="">-- select property --</option>
                        {locations.map((l) => (
                            <option key={l.id} value={l.id}>
                                {l.name || l.address || l.id}
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    Unit #
                    <input
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        style={{ width: '100%', padding: 6, marginTop: 4 }}
                        placeholder="e.g. Unit 1, Apt B, Suite 202"
                    />
                </label>

                <label>
                    Occupant name
                    <input
                        value={form.occupant_name}
                        onChange={(e) => setForm((f) => ({ ...f, occupant_name: e.target.value }))}
                        style={{ width: '100%', padding: 6, marginTop: 4 }}
                        placeholder="e.g. John Smith"
                    />
                </label>

                <label>
                    Occupant phone
                    <input
                        value={form.occupant_phone}
                        onChange={(e) => setForm((f) => ({ ...f, occupant_phone: e.target.value }))}
                        style={{ width: '100%', padding: 6, marginTop: 4 }}
                        placeholder="e.g. 412-555-1234"
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
                        cursor: 'pointer',
                        marginTop: 8,
                    }}
                >
                    {saving ? 'Saving…' : 'Create unit'}
                </button>
            </form>
        </div>
    );
}
