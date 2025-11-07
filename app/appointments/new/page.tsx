// app/appointments/new/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Location = {
    id: string;
    name?: string | null;
    address?: string | null;
};

type Unit = {
    id: string;
    location_id: string;
    name?: string | null;
};

export default function NewAppointmentPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [locations, setLocations] = useState<Location[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);

    const [form, setForm] = useState({
        title: '',
        description: '',
        scheduled_date: '',
        scheduled_time: '',
        is_time_specific: false,
        estimated_duration_minutes: 30,
        status: 'scheduled',
        priority: 0,
        location_id: '',
        unit_id: '',
        assigned_to: '',
        purpose: '',
        notes: '',
        next_destination: '',
    });

    // load properties (locations)
    useEffect(() => {
        async function loadLocations() {
            try {
                const res = await fetch('/api/properties'); // this hits your locations table now
                const json = await res.json();
                setLocations(Array.isArray(json.data) ? json.data : []);
            } catch (e) {
                // ignore for now
            }
        }
        loadLocations();
    }, []);

    // when a location is chosen, load its units
    async function loadUnitsForLocation(location_id: string) {
        if (!location_id) {
            setUnits([]);
            return;
        }
        const res = await fetch(`/api/units?location_id=${location_id}`);
        const json = await res.json();
        setUnits(Array.isArray(json.data) ? json.data : []);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            const res = await fetch('/api/appointments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const json = await res.json();
            if (!res.ok) {
                throw new Error(json.error || 'Failed to create appointment');
            }
            router.push('/appointments');
            router.refresh();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div style={{ maxWidth: 800, padding: 20 }}>
            <h1 style={{ fontSize: 22, marginBottom: 16 }}>New appointment</h1>
            {error ? <p style={{ color: 'red' }}>{error}</p> : null}

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
                <label>
                    Title
                    <input
                        value={form.title}
                        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                        style={{ width: '100%', padding: 6, marginTop: 4 }}
                        required
                    />
                </label>

                {/* Property */}
                <label>
                    Property
                    <select
                        value={form.location_id}
                        onChange={(e) => {
                            const location_id = e.target.value;
                            setForm((f) => ({ ...f, location_id, unit_id: '' }));
                            loadUnitsForLocation(location_id);
                        }}
                        style={{ width: '100%', padding: 6, marginTop: 4 }}
                    >
                        <option value="">-- select property --</option>
                        {locations.map((l) => (
                            <option key={l.id} value={l.id}>
                                {l.name || l.address || l.id}
                            </option>
                        ))}
                    </select>
                </label>

                {/* Unit (depends on property) */}
                <label>
                    Unit
                    <select
                        value={form.unit_id}
                        onChange={(e) => setForm((f) => ({ ...f, unit_id: e.target.value }))}
                        style={{ width: '100%', padding: 6, marginTop: 4 }}
                        disabled={!form.location_id}
                    >
                        <option value="">-- select unit --</option>
                        {units.map((u) => (
                            <option key={u.id} value={u.id}>
                                {u.name || u.id}
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    Description
                    <textarea
                        value={form.description}
                        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                        rows={3}
                        style={{ width: '100%', padding: 6, marginTop: 4 }}
                    />
                </label>

                <label>
                    Scheduled date
                    <input
                        type="date"
                        value={form.scheduled_date}
                        onChange={(e) =>
                            setForm((f) => ({ ...f, scheduled_date: e.target.value }))
                        }
                        style={{ width: '100%', padding: 6, marginTop: 4 }}
                    />
                </label>

                <label>
                    Scheduled time
                    <input
                        type="time"
                        value={form.scheduled_time}
                        onChange={(e) =>
                            setForm((f) => ({ ...f, scheduled_time: e.target.value }))
                        }
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
                        cursor: 'pointer',
                        marginTop: 8,
                    }}
                >
                    {saving ? 'Saving…' : 'Create'}
                </button>
            </form>
        </div>
    );
}
